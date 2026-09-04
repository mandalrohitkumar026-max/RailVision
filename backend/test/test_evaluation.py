"""
Tests for ML Evaluation Suite, Drift Monitor, and Ablation Benchmarks.
"""

import os
import json
import pytest
from ml.evaluation.evaluate_models import run_full_model_evaluation, OUTPUT_REPORT_PATH
from ml.evaluation.drift_monitor import run_drift_analysis, calculate_psi, OUTPUT_DRIFT_REPORT
from ml.evaluation.benchmark_ablation import run_ablation_benchmarks, OUTPUT_BENCHMARK_REPORT

def test_full_model_evaluation():
    report = run_full_model_evaluation()
    assert "results" in report
    assert "delay_regressor" in report["results"]
    assert "global_metrics" in report["results"]["delay_regressor"]
    assert report["results"]["delay_regressor"]["global_metrics"]["mae_minutes"] > 0
    assert os.path.exists(OUTPUT_REPORT_PATH)

def test_drift_monitor_execution():
    report = run_drift_analysis()
    assert "features" in report
    assert "prev_station_delay_min" in report["features"]
    assert "ks_statistic" in report["features"]["prev_station_delay_min"]
    assert os.path.exists(OUTPUT_DRIFT_REPORT)

def test_psi_calculation():
    import numpy as np
    dist1 = np.random.normal(10, 2, 500)
    dist2 = np.random.normal(10, 2, 500)
    psi = calculate_psi(dist1, dist2)
    assert psi >= 0.0
    assert psi < 0.2  # Should be stable for identical distributions

def test_ablation_benchmarks():
    report = run_ablation_benchmarks()
    assert "architectures" in report
    assert "ablation_study" in report
    assert "XGBoost_Regressor (Production)" in report["architectures"]
    assert "Without_Prev_Station_Delay" in report["ablation_study"]
    assert os.path.exists(OUTPUT_BENCHMARK_REPORT)
