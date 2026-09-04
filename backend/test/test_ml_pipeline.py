"""
Tests for Feature Engineering, Anomaly Detector, and ML Inference.
"""

import pytest
import pandas as pd
from ml.features.feature_pipeline import (
    build_online_delay_features,
    decompose_delay_factors,
    FEATURE_COLUMNS_DELAY
)
from ml.models.anomaly_detector import AnomalyDetector
from backend.app.ml.inference_engine import inference_engine

def test_feature_pipeline_columns():
    features = build_online_delay_features(
        prev_station_delay_min=15.0,
        route_congestion_index=0.75,
        weather_severity_index=0.3,
        station_dwell_delta=2.0,
        distance_km=400.0,
        stop_sequence=3,
        day_of_week=3,
        is_weekend=0,
        is_holiday=0,
        priority=1
    )
    assert isinstance(features, pd.DataFrame)
    assert list(features.columns) == FEATURE_COLUMNS_DELAY
    assert features["prev_station_delay_min"].iloc[0] == 15.0

def test_factor_decomposition():
    factors = decompose_delay_factors(
        feature_row={"prev_station_delay_min": 20.0, "route_congestion_index": 0.8},
        predicted_delay=35.0
    )
    assert len(factors) == 5
    categories = [f["category"] for f in factors]
    assert "DISPATCH" in categories
    assert "INFRASTRUCTURE" in categories

def test_anomaly_detector():
    detector = AnomalyDetector()
    dwell_records = [
        {"station_code": "KOTA", "station_name": "Kota Junction", "scheduled_dwell_min": 5.0, "observed_dwell_min": 14.0},
        {"station_code": "NDLS", "station_name": "New Delhi", "scheduled_dwell_min": 10.0, "observed_dwell_min": 11.0}
    ]
    anomalies = detector.detect_station_anomalies(dwell_records)
    assert len(anomalies) == 1
    assert anomalies[0]["entity_id"] == "KOTA"
    assert anomalies[0]["severity"] in ["HIGH", "CRITICAL"]

def test_ml_inference_engine_outputs():
    result = inference_engine.predict_delay_and_risk(
        prev_station_delay_min=30.0,
        route_congestion_index=0.8,
        weather_severity_index=0.5,
        station_dwell_delta=5.0,
        distance_km=700.0,
        stop_sequence=4,
        day_of_week=4,
        is_weekend=0,
        is_holiday=0,
        priority=1
    )
    assert result["expected_delay_minutes"] > 0
    assert result["severe_delay_probability"] >= 50.0
    assert result["risk_level"] in ["HIGH", "CRITICAL"]
    assert "ci_lower" in result
    assert "ci_upper" in result
