"""
Candidate Model Benchmark & Feature Ablation Suite for RailOps Intelligence.
Quantifies performance across alternative algorithmic architectures
and measures feature group contribution via systematic ablation experiments.
"""

import os
import json
import time
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
import xgboost as xgb

from ml.data.synthetic_generator import generate_full_synthetic_data
from ml.features.feature_pipeline import (
    prepare_delay_training_dataset,
    FEATURE_COLUMNS_DELAY
)

OUTPUT_BENCHMARK_REPORT = os.path.join(os.path.dirname(__file__), "benchmark_report.json")

def evaluate_estimator(model, X_train, y_train, X_test, y_test):
    """Fits and times an estimator, returning regression performance."""
    t0 = time.time()
    model.fit(X_train, y_train)
    fit_time_ms = (time.time() - t0) * 1000

    t1 = time.time()
    y_pred = model.predict(X_test)
    inf_time_per_sample_us = ((time.time() - t1) / len(X_test)) * 1_000_000

    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))

    return {
        "mae_minutes": round(mae, 2),
        "rmse_minutes": round(rmse, 2),
        "r2_score": round(r2, 4),
        "training_time_ms": round(fit_time_ms, 1),
        "latency_us_per_sample": round(inf_time_per_sample_us, 1)
    }

def run_ablation_benchmarks() -> Dict[str, Any]:
    print("=" * 65)
    print("RAILOPS INTELLIGENCE: EXECUTING BENCHMARK & ABLATION STUDY")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 65)

    data = generate_full_synthetic_data()
    X_delays, y_delay, _, _ = prepare_delay_training_dataset(data["training_delays"])

    X_train, X_test, y_train, y_test = train_test_split(
        X_delays, y_delay, test_size=0.2, random_state=42
    )

    # 1. Candidate Architecture Benchmarks
    print("\n--- [1] Evaluating Candidate Architectures ---")
    architectures = {
        "XGBoost_Regressor (Production)": xgb.XGBRegressor(
            n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42
        ),
        "Sklearn_GradientBoosting": GradientBoostingRegressor(
            n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42
        ),
        "RandomForest_Regressor": RandomForestRegressor(
            n_estimators=100, max_depth=8, random_state=42
        ),
        "Ridge_Linear_Regression": Ridge(alpha=1.0)
    }

    arch_results = {}
    for name, model in architectures.items():
        res = evaluate_estimator(model, X_train, y_train, X_test, y_test)
        arch_results[name] = res
        print(f"  {name:<32} -> MAE: {res['mae_minutes']}m | RMSE: {res['rmse_minutes']}m | R²: {res['r2_score']}")

    # Naive Baseline (Just predict previous station delay)
    naive_pred = X_test["prev_station_delay_min"]
    arch_results["Naive_Previous_Delay_Baseline"] = {
        "mae_minutes": round(float(mean_absolute_error(y_test, naive_pred)), 2),
        "rmse_minutes": round(float(np.sqrt(mean_squared_error(y_test, naive_pred))), 2),
        "r2_score": round(float(r2_score(y_test, naive_pred)), 4),
        "training_time_ms": 0.0,
        "latency_us_per_sample": 0.1
    }
    print(f"  {'Naive_Previous_Delay_Baseline':<32} -> MAE: {arch_results['Naive_Previous_Delay_Baseline']['mae_minutes']}m | R²: {arch_results['Naive_Previous_Delay_Baseline']['r2_score']}")

    # 2. Systematic Feature Group Ablation
    print("\n--- [2] Evaluating Systematic Feature Ablation ---")
    baseline_xgb = xgb.XGBRegressor(
        n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42
    )
    baseline_res = evaluate_estimator(baseline_xgb, X_train, y_train, X_test, y_test)

    ablation_experiments = {
        "Without_Weather (No Rain/Fog)": [c for c in FEATURE_COLUMNS_DELAY if c not in ["weather_severity_index", "rainfall_mm"]],
        "Without_Route_Congestion": [c for c in FEATURE_COLUMNS_DELAY if c != "route_congestion_index"],
        "Without_Prev_Station_Delay": [c for c in FEATURE_COLUMNS_DELAY if c != "prev_station_delay_min"],
        "Without_Dwell_Variance": [c for c in FEATURE_COLUMNS_DELAY if c != "station_dwell_delta"],
        "Without_Calendar_Features": [c for c in FEATURE_COLUMNS_DELAY if c not in ["day_of_week", "is_weekend", "is_holiday"]]
    }

    ablation_results = {
        "All_Features_Baseline": baseline_res
    }

    for exp_name, cols in ablation_experiments.items():
        m = xgb.XGBRegressor(n_estimators=120, max_depth=5, learning_rate=0.08, random_state=42)
        res = evaluate_estimator(m, X_train[cols], y_train, X_test[cols], y_test)
        
        # Calculate MAE increase
        delta_mae = round(res["mae_minutes"] - baseline_res["mae_minutes"], 2)
        res["mae_degradation"] = f"+{delta_mae}m" if delta_mae > 0 else f"{delta_mae}m"
        ablation_results[exp_name] = res
        print(f"  {exp_name:<34} -> MAE: {res['mae_minutes']}m (Delta: {res['mae_degradation']})")

    report = {
        "timestamp": datetime.now().isoformat(),
        "architectures": arch_results,
        "ablation_study": ablation_results
    }

    with open(OUTPUT_BENCHMARK_REPORT, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nBenchmark & ablation report stored at: {OUTPUT_BENCHMARK_REPORT}")
    print("=" * 65)

    return report

if __name__ == "__main__":
    run_ablation_benchmarks()
