"""
Unit and Integration Tests for RailOps Intelligence API.
Verifies dashboard KPIs, train intelligence, delay predictions, demand forecasts,
capacity requests, anomalies, and Prometheus metrics.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "RailOps Intelligence"
    assert data["command_center"] == "ACTIVE"

def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "railops_api_requests_total" in response.text
    assert "railops_ml_inferences_total" in response.text

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "live_operations" in data
    assert data["kpis"]["total_trains_today"] >= 10
    assert len(data["live_operations"]) > 0
    # Check first row structure
    first = data["live_operations"][0]
    assert "train_number" in first
    assert "delay_formatted" in first
    assert "risk_level" in first

def test_train_intelligence():
    # Test Mumbai Rajdhani 12951
    response = client.get("/api/v1/trains/12951")
    assert response.status_code == 200
    data = response.json()
    assert data["train_number"] == "12951"
    assert "Mumbai Rajdhani" in data["train_name"]
    assert len(data["timeline"]) >= 5
    assert len(data["prediction_factors"]) >= 3
    assert data["expected_delay_minutes"] >= 0
    assert "model_confidence_pct" in data

def test_delay_prediction_endpoint():
    payload = {
        "train_number": "12951",
        "current_station_code": "BRC",
        "target_station_code": "KOTA",
        "prev_station_delay_min": 25.0,
        "route_congestion_index": 0.85,
        "weather_severity_index": 0.40,
        "station_dwell_delta": 4.0
    }
    response = client.post("/api/v1/predictions/delay", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["expected_delay_minutes"] > 0
    assert 0 <= data["severe_delay_probability"] <= 100
    assert "factors" in data

def test_demand_forecast():
    response = client.get("/api/v1/predictions/demand?train_number=12951&travel_date=2026-09-05&travel_class=ALL&horizon_days=7")
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_demand"] > 0
    assert data["available_capacity"] > 0
    assert "recommendation" in data
    assert len(data["forecast_timeline"]) > 5
    assert len(data["weekly_pattern"]) == 7

def test_capacity_requests_workflow():
    # 1. Summary
    response = client.get("/api/v1/capacity/summary")
    assert response.status_code == 200
    data = response.json()
    assert "requests" in data

    # 2. Create Request
    payload = {
        "train_number": "12951",
        "travel_date": "2026-09-08",
        "recommended_coaches": 2,
        "coach_type": "3A (AC 3-Tier)",
        "reason": "Test high demand surge verification",
        "priority": "HIGH"
    }
    create_res = client.post("/api/v1/capacity/requests", json=payload)
    assert create_res.status_code == 200
    req_data = create_res.json()
    assert req_data["train_number"] == "12951"
    req_id = req_data["id"]

    # 3. Update Request Status to APPROVED
    update_res = client.patch(f"/api/v1/capacity/requests/{req_id}", json={
        "status": "APPROVED",
        "approver_notes": "Approved for testing."
    })
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "APPROVED"

def test_anomalies_workflow():
    # 1. List anomalies
    response = client.get("/api/v1/anomalies")
    assert response.status_code == 200
    anomalies = response.json()
    assert len(anomalies) > 0
    first_id = anomalies[0]["id"]

    # 2. Acknowledge anomaly
    action_res = client.post(f"/api/v1/anomalies/{first_id}/action", json={
        "action": "ACKNOWLEDGE",
        "operator_note": "Investigating signal clearance backlog"
    })
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "ACKNOWLEDGED"

def test_stations_and_routes():
    # Station test
    st_res = client.get("/api/v1/stations/NDLS")
    assert st_res.status_code == 200
    assert st_res.json()["code"] == "NDLS"

    # Route test
    rt_res = client.get("/api/v1/routes/R-WR-01")
    assert rt_res.status_code == 200
    assert rt_res.json()["id"] == "R-WR-01"

def test_model_center():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    data = res.json()
    assert len(data["production_models"]) >= 4
    # Verify delay model metrics
    delay_m = next((m for m in data["production_models"] if "Delay" in m["model_name"]), None)
    assert delay_m is not None
    assert "mae_minutes" in delay_m["metrics"]
