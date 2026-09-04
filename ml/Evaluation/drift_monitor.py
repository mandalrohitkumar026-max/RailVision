"""
Production Drift Monitoring Engine for RailOps Intelligence.
Detects:
1. Feature Drift using Kolmogorov-Smirnov (KS) two-sample statistical test.
2. Population Stability Index (PSI) for continuous telemetry features.
3. Target / Prediction Drift comparing baseline distribution to live operational batches.
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Tuple
from scipy import stats

from ml.data.synthetic_generator import generate_full_synthetic_data
from ml.features.feature_pipeline import (
    prepare_delay_training_dataset,
    FEATURE_COLUMNS_DELAY
)

OUTPUT_DRIFT_REPORT = os.path.join(os.path.dirname(__file__), "drift_report.json")

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
    """Calculates Population Stability Index (PSI) between two distributions."""
    if len(expected) == 0 or len(actual) == 0:
        return 0.0

    percentiles = np.linspace(0, 100, num_buckets + 1)
    bucket_bounds = np.percentile(expected, percentiles)
    bucket_bounds[0] = -np.inf
    bucket_bounds[-1] = np.inf

    expected_counts, _ = np.histogram(expected, bins=bucket_bounds)
    actual_counts, _ = np.histogram(actual, bins=bucket_bounds)

    # Normalize to probabilities with smoothing
    expected_pct = (expected_counts + 1e-4) / (len(expected) + 1e-4 * num_buckets)
    actual_pct = (actual_counts + 1e-4) / (len(actual) + 1e-4 * num_buckets)

    psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(psi_val)

def run_drift_analysis() -> Dict[str, Any]:
    """Runs statistical drift detection across all operational telemetry features."""
    print("=" * 65)
    print("RAILOPS INTELLIGENCE: EXECUTING FEATURE & TARGET DRIFT MONITOR")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 65)

    data = generate_full_synthetic_data()
    X_all, y_delay, _, _ = prepare_delay_training_dataset(data["training_delays"])

    # Baseline reference partition (first 70%) vs Live monitoring partition (last 30%)
    split_idx = int(len(X_all) * 0.70)
    ref_df = X_all.iloc[:split_idx]
    live_df = X_all.iloc[split_idx:]

    drift_results = {}
    any_drift_detected = False

    for col in FEATURE_COLUMNS_DELAY:
        ref_vals = ref_df[col].to_numpy(dtype=float)
        live_vals = live_df[col].to_numpy(dtype=float)

        # Kolmogorov-Smirnov test (p < 0.01 indicates significant distribution shift)
        ks_stat, p_val = stats.ks_2samp(ref_vals, live_vals)
        psi_score = calculate_psi(ref_vals, live_vals)

        # Classify drift status
        if p_val < 0.01 or psi_score > 0.25:
            status = "DRIFT_DETECTED"
            any_drift_detected = True
        elif p_val < 0.05 or psi_score > 0.10:
            status = "MODERATE_SHIFT"
        else:
            status = "STABLE"

        drift_results[col] = {
            "ks_statistic": round(float(ks_stat), 4),
            "p_value": round(float(p_val), 4),
            "psi_score": round(float(psi_score), 4),
            "baseline_mean": round(float(np.mean(ref_vals)), 3),
            "current_mean": round(float(np.mean(live_vals)), 3),
            "status": status
        }

    # Target delay drift
    ref_target = y_delay.iloc[:split_idx].to_numpy(dtype=float)
    live_target = y_delay.iloc[split_idx:].to_numpy(dtype=float)
    t_stat, t_pval = stats.ks_2samp(ref_target, live_target)
    target_psi = calculate_psi(ref_target, live_target)

    target_status = "STABLE" if t_pval >= 0.01 and target_psi <= 0.25 else "DRIFT_DETECTED"

    report = {
        "timestamp": datetime.now().isoformat(),
        "baseline_samples": len(ref_df),
        "monitoring_samples": len(live_df),
        "overall_drift_status": "STABLE" if not any_drift_detected else "ATTENTION_REQUIRED",
        "target_delay_drift": {
            "ks_statistic": round(float(t_stat), 4),
            "p_value": round(float(t_pval), 4),
            "psi_score": round(float(target_psi), 4),
            "baseline_mean_delay": round(float(np.mean(ref_target)), 2),
            "current_mean_delay": round(float(np.mean(live_target)), 2),
            "status": target_status
        },
        "features": drift_results
    }

    # Print summary table
    print(f"\nOverall Drift Status: {report['overall_drift_status']}")
    print("-" * 65)
    print(f"{'Feature Name':<28} | {'KS Stat':<8} | {'p-val':<8} | {'PSI':<7} | {'Status'}")
    print("-" * 65)
    for feat, met in drift_results.items():
        print(f"{feat:<28} | {met['ks_statistic']:<8} | {met['p_value']:<8} | {met['psi_score']:<7} | {met['status']}")
    print("-" * 65)

    with open(OUTPUT_DRIFT_REPORT, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Drift report stored at: {OUTPUT_DRIFT_REPORT}")
    print("=" * 65)

    return report

if __name__ == "__main__":
    run_drift_analysis()
