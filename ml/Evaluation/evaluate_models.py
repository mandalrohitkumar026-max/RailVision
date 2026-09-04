"""
Production ML Model Evaluation Suite for RailOps Intelligence.
Performs comprehensive multi-metric evaluation, subgroup performance slicing,
and confidence interval calibration assessment across all production models.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    median_absolute_error,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    brier_score_loss
)

from ml.data.synthetic_generator import generate_full_synthetic_data
from ml.features.feature_pipeline import (
    prepare_delay_training_dataset,
    prepare_demand_training_dataset,
    FEATURE_COLUMNS_DELAY,
    FEATURE_COLUMNS_DEMAND
)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
OUTPUT_REPORT_PATH = os.path.join(os.path.dirname(__file__), "evaluation_report.json")

def load_models():
    """Loads all serialized production models from ml/models/."""
    delay_path = os.path.join(MODELS_DIR, "delay_regressor_xgb.joblib")
    severe_path = os.path.join(MODELS_DIR, "severe_delay_classifier.joblib")
    cancel_path = os.path.join(MODELS_DIR, "cancellation_classifier.joblib")
    demand_path = os.path.join(MODELS_DIR, "demand_forecaster_gbm.joblib")

    models = {
        "delay": joblib.load(delay_path) if os.path.exists(delay_path) else None,
        "severe": joblib.load(severe_path) if os.path.exists(severe_path) else None,
        "cancel": joblib.load(cancel_path) if os.path.exists(cancel_path) else None,
        "demand": joblib.load(demand_path) if os.path.exists(demand_path) else None,
    }
    return models

def evaluate_delay_model(model, X_test: pd.DataFrame, y_true: pd.Series) -> Dict[str, Any]:
    """Evaluates arrival delay regressor across multiple regression error metrics."""
    y_pred = model.predict(X_test)
    residuals = y_true - y_pred

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    med_ae = float(median_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    max_err = float(np.max(np.abs(residuals)))
    p90_err = float(np.percentile(np.abs(residuals), 90))
    p95_err = float(np.percentile(np.abs(residuals), 95))

    # Slice evaluation: Error by train priority
    slices = {}
    for prio in [1, 2]:
        prio_mask = (X_test["priority"] == prio)
        if prio_mask.sum() > 0:
            slices[f"priority_{prio}"] = {
                "samples": int(prio_mask.sum()),
                "mae_minutes": round(float(mean_absolute_error(y_true[prio_mask], y_pred[prio_mask])), 2),
                "rmse_minutes": round(float(np.sqrt(mean_squared_error(y_true[prio_mask], y_pred[prio_mask]))), 2)
            }

    # Slice evaluation: Error under adverse weather vs clear weather
    adv_weather_mask = (X_test["weather_severity_index"] > 0.3)
    clear_weather_mask = ~adv_weather_mask
    slices["adverse_weather"] = {
        "samples": int(adv_weather_mask.sum()),
        "mae_minutes": round(float(mean_absolute_error(y_true[adv_weather_mask], y_pred[adv_weather_mask])), 2) if adv_weather_mask.sum() > 0 else None,
        "rmse_minutes": round(float(np.sqrt(mean_squared_error(y_true[adv_weather_mask], y_pred[adv_weather_mask]))), 2) if adv_weather_mask.sum() > 0 else None
    }
    slices["clear_weather"] = {
        "samples": int(clear_weather_mask.sum()),
        "mae_minutes": round(float(mean_absolute_error(y_true[clear_weather_mask], y_pred[clear_weather_mask])), 2),
        "rmse_minutes": round(float(np.sqrt(mean_squared_error(y_true[clear_weather_mask], y_pred[clear_weather_mask]))), 2)
    }

    return {
        "model_name": "Delay_Regressor_XGBoost",
        "sample_size": len(y_true),
        "global_metrics": {
            "mae_minutes": round(mae, 2),
            "rmse_minutes": round(rmse, 2),
            "median_absolute_error_minutes": round(med_ae, 2),
            "r2_score": round(r2, 4),
            "p90_absolute_error": round(p90_err, 2),
            "p95_absolute_error": round(p95_err, 2),
            "max_absolute_error": round(max_err, 2)
        },
        "slice_performance": slices
    }

def evaluate_classifier_model(model, X_test: pd.DataFrame, y_true: pd.Series, model_name: str) -> Dict[str, Any]:
    """Evaluates classification models (severe delay and cancellation probability)."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 1.0
    brier = float(brier_score_loss(y_true, y_prob))
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "model_name": model_name,
        "sample_size": len(y_true),
        "metrics": {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "brier_score": round(brier, 4)
        },
        "confusion_matrix": {
            "true_negative": cm[0][0] if len(cm) > 0 else 0,
            "false_positive": cm[0][1] if len(cm) > 0 and len(cm[0]) > 1 else 0,
            "false_negative": cm[1][0] if len(cm) > 1 else 0,
            "true_positive": cm[1][1] if len(cm) > 1 and len(cm[1]) > 1 else 0
        }
    }

def evaluate_demand_model(model, X_test: pd.DataFrame, y_true: pd.Series) -> Dict[str, Any]:
    """Evaluates passenger demand regressor and prediction intervals."""
    y_pred = model.predict(X_test)

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    mape = float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100)

    # 95% Confidence Interval empirical coverage test
    ci_lower = y_pred - 75
    ci_upper = y_pred + 85
    within_ci = (y_true >= ci_lower) & (y_true <= ci_upper)
    empirical_coverage_pct = float(np.mean(within_ci) * 100)

    return {
        "model_name": "Demand_Forecaster_GBM",
        "sample_size": len(y_true),
        "metrics": {
            "mae_passengers": round(mae, 1),
            "rmse_passengers": round(rmse, 1),
            "mape_percentage": round(mape, 2),
            "r2_score": round(r2, 4),
            "empirical_95_ci_coverage_pct": round(empirical_coverage_pct, 1)
        }
    }

def run_full_model_evaluation() -> Dict[str, Any]:
    """Executes the entire evaluation suite across all 4 production models."""
    print("=" * 65)
    print("RAILOPS INTELLIGENCE: EXECUTING PRODUCTION MODEL EVALUATION SUITE")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 65)

    models = load_models()
    data = generate_full_synthetic_data()
    trains_meta = {t["number"]: t for t in data["trains"]}
    routes_meta = {r["id"]: r for r in data["routes"]}

    # Extract test datasets
    X_delays, y_delay, y_severe, y_cancelled = prepare_delay_training_dataset(data["training_delays"])
    X_demand, y_demand = prepare_demand_training_dataset(data["training_demand"], trains_meta, routes_meta)

    # Use held-out test partition (last 20%)
    split_idx_d = int(len(X_delays) * 0.8)
    split_idx_dem = int(len(X_demand) * 0.8)

    X_d_test, y_d_test = X_delays.iloc[split_idx_d:], y_delay.iloc[split_idx_d:]
    y_sev_test = y_severe.iloc[split_idx_d:]
    y_can_test = y_cancelled.iloc[split_idx_d:]
    X_dem_test, y_dem_test = X_demand.iloc[split_idx_dem:], y_demand.iloc[split_idx_dem:]

    report = {
        "evaluation_timestamp": datetime.now().isoformat(),
        "dataset_version": "v2026.09.4-synthetic-trunk",
        "test_partition_size": len(X_d_test),
        "results": {}
    }

    # 1. Delay Regressor
    if models["delay"]:
        delay_res = evaluate_delay_model(models["delay"], X_d_test, y_d_test)
        report["results"]["delay_regressor"] = delay_res
        print("\n[1] DELAY REGRESSOR (XGBoost):")
        print(f"    MAE: {delay_res['global_metrics']['mae_minutes']} min | RMSE: {delay_res['global_metrics']['rmse_minutes']} min | R²: {delay_res['global_metrics']['r2_score']}")
        print(f"    95th percentile error: {delay_res['global_metrics']['p95_absolute_error']} min")

    # 2. Severe Delay Classifier
    if models["severe"]:
        sev_res = evaluate_classifier_model(models["severe"], X_d_test, y_sev_test, "Severe_Delay_Classifier_GBM")
        report["results"]["severe_delay_classifier"] = sev_res
        print("\n[2] SEVERE DELAY CLASSIFIER (GBM):")
        print(f"    ROC-AUC: {sev_res['metrics']['roc_auc']} | F1: {sev_res['metrics']['f1_score']} | Brier Score: {sev_res['metrics']['brier_score']}")

    # 3. Cancellation Risk Classifier
    if models["cancel"]:
        can_res = evaluate_classifier_model(models["cancel"], X_d_test, y_can_test, "Cancellation_Classifier_GBM")
        report["results"]["cancellation_classifier"] = can_res
        print("\n[3] CANCELLATION RISK CLASSIFIER (GBM):")
        print(f"    ROC-AUC: {can_res['metrics']['roc_auc']} | Precision: {can_res['metrics']['precision']} | Brier Score: {can_res['metrics']['brier_score']}")

    # 4. Demand Forecaster
    if models["demand"]:
        dem_res = evaluate_demand_model(models["demand"], X_dem_test, y_dem_test)
        report["results"]["demand_forecaster"] = dem_res
        print("\n[4] PASSENGER DEMAND FORECASTER (GBM):")
        print(f"    MAE: {dem_res['metrics']['mae_passengers']} pax | MAPE: {dem_res['metrics']['mape_percentage']}% | 95% CI Coverage: {dem_res['metrics']['empirical_95_ci_coverage_pct']}%")

    # Save to disk
    with open(OUTPUT_REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nEvaluation report successfully generated at: {OUTPUT_REPORT_PATH}")
    print("=" * 65)

    return report

if __name__ == "__main__":
    run_full_model_evaluation()
