"""
API v1 Router for RailOps Intelligence.
Exposes standard RESTful endpoints for operations, trains, demand, capacity,
anomalies, station/route intelligence, and ML model center.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import AuditLog
from backend.app.schemas.operations import DashboardSummaryResponse
from backend.app.schemas.trains import TrainDetailResponse
from backend.app.schemas.predictions import DelayPredictionRequest, DelayPredictionResponse
from backend.app.schemas.demand import DemandForecastResponse
from backend.app.schemas.capacity import (
    CapacityRequestCreate,
    CapacityRequestUpdate,
    CapacityRequestItem,
    CapacityPlanningSummary
)
from backend.app.schemas.anomalies import (
    AnomalyItem,
    AnomalyActionRequest,
    StationDetailResponse,
    RouteDetailResponse,
    MLModelCenterResponse
)

from backend.app.services.operations_service import get_dashboard_summary
from backend.app.services.train_service import get_train_intelligence, list_all_trains
from backend.app.services.demand_service import forecast_passenger_demand
from backend.app.services.capacity_service import (
    list_capacity_requests,
    create_capacity_request,
    update_capacity_request_status
)
from backend.app.services.anomaly_service import list_anomalies, perform_anomaly_action
from backend.app.services.station_service import get_station_details, list_all_stations
from backend.app.services.route_service import get_route_details, list_all_routes
from backend.app.services.model_registry_service import get_ml_model_center_data
from backend.app.ml.inference_engine import inference_engine

router = APIRouter()

# ----------------------------------------------------
# 1. Operations Overview
# ----------------------------------------------------
@router.get("/dashboard/summary", response_model=DashboardSummaryResponse, summary="Network-wide Command Center KPIs")
def get_dashboard(db: Session = Depends(get_db)):
    return get_dashboard_summary(db)

# ----------------------------------------------------
# 2. Train Intelligence
# ----------------------------------------------------
@router.get("/trains", summary="List All Trains Catalog")
def get_trains(db: Session = Depends(get_db)):
    return list_all_trains(db)

@router.get("/trains/{train_number}", response_model=TrainDetailResponse, summary="Train Deep-Dive & Timeline")
def get_train_by_number(
    train_number: str = Path(..., description="5-digit train number, e.g. 12951"),
    db: Session = Depends(get_db)
):
    return get_train_intelligence(train_number, db)

# ----------------------------------------------------
# 3. Live Delay & Risk Prediction
# ----------------------------------------------------
@router.post("/predictions/delay", response_model=DelayPredictionResponse, summary="Live Delay & Risk Inference")
def predict_delay(req: DelayPredictionRequest):
    out = inference_engine.predict_delay_and_risk(
        prev_station_delay_min=req.prev_station_delay_min,
        route_congestion_index=req.route_congestion_index or 0.70,
        weather_severity_index=req.weather_severity_index or 0.20,
        station_dwell_delta=req.station_dwell_delta or 0.0,
        distance_km=850.0,
        stop_sequence=4,
        day_of_week=req.day_of_week if req.day_of_week is not None else 4,
        is_weekend=0,
        is_holiday=0,
        priority=1,
        rainfall_mm=req.rainfall_mm or 0.0
    )
    return DelayPredictionResponse(
        train_number=req.train_number,
        prediction_time=f"2026-09-04 10:55:00 UTC",
        expected_delay_minutes=out["expected_delay_minutes"],
        severe_delay_probability=out["severe_delay_probability"],
        cancellation_probability=out["cancellation_probability"],
        risk_level=out["risk_level"],
        confidence_interval_lower=out["ci_lower"],
        confidence_interval_upper=out["ci_upper"],
        model_version=out["model_version"],
        factors=out["factors"]
    )

# ----------------------------------------------------
# 4. Passenger Demand Forecasting
# ----------------------------------------------------
@router.get("/predictions/demand", response_model=DemandForecastResponse, summary="Passenger Demand Forecast")
def get_demand_forecast(
    train_number: str = Query("12951", description="Train number"),
    travel_date: str = Query("2026-09-05", description="YYYY-MM-DD"),
    travel_class: str = Query("ALL", description="ALL, 1A, 2A, 3A, SL"),
    horizon_days: int = Query(7, ge=1, le=14),
    db: Session = Depends(get_db)
):
    return forecast_passenger_demand(train_number, travel_date, travel_class, horizon_days, db)

# ----------------------------------------------------
# 5. Capacity Planning Workflow
# ----------------------------------------------------
@router.get("/capacity/summary", response_model=CapacityPlanningSummary, summary="Capacity Planning Summary & Requests")
def get_capacity_summary(db: Session = Depends(get_db)):
    return list_capacity_requests(db)

@router.post("/capacity/requests", response_model=CapacityRequestItem, summary="Create Capacity Augmentation Request")
def create_request(payload: CapacityRequestCreate, db: Session = Depends(get_db)):
    return create_capacity_request(payload, db)

@router.patch("/capacity/requests/{request_id}", response_model=CapacityRequestItem, summary="Approve/Review Capacity Request")
def update_request(
    request_id: str,
    update: CapacityRequestUpdate,
    db: Session = Depends(get_db)
):
    return update_capacity_request_status(request_id, update, db)

# ----------------------------------------------------
# 6. Anomaly Center
# ----------------------------------------------------
@router.get("/anomalies", response_model=List[AnomalyItem], summary="Active Operational Anomalies")
def get_anomalies(
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="OPEN, ACKNOWLEDGED, RESOLVED"),
    db: Session = Depends(get_db)
):
    return list_anomalies(db, severity, status)

@router.post("/anomalies/{anomaly_id}/action", response_model=AnomalyItem, summary="Acknowledge/Resolve Anomaly")
def anomaly_action(
    anomaly_id: str,
    action_req: AnomalyActionRequest,
    db: Session = Depends(get_db)
):
    return perform_anomaly_action(anomaly_id, action_req, db)

# ----------------------------------------------------
# 7. Station Intelligence
# ----------------------------------------------------
@router.get("/stations", summary="List All Network Stations")
def get_stations(db: Session = Depends(get_db)):
    return list_all_stations(db)

@router.get("/stations/{station_code}", response_model=StationDetailResponse, summary="Station Operational Board")
def get_station(station_code: str, db: Session = Depends(get_db)):
    return get_station_details(station_code, db)

# ----------------------------------------------------
# 8. Route Corridors
# ----------------------------------------------------
@router.get("/routes", summary="List All Trunk Corridors")
def get_routes(db: Session = Depends(get_db)):
    return list_all_routes(db)

@router.get("/routes/{route_id}", response_model=RouteDetailResponse, summary="Route Corridor Bottlenecks")
def get_route(route_id: str, db: Session = Depends(get_db)):
    return get_route_details(route_id, db)

# ----------------------------------------------------
# 9. ML Model Center
# ----------------------------------------------------
@router.get("/models", response_model=MLModelCenterResponse, summary="Production ML Model Registry & Metrics")
def get_models():
    return get_ml_model_center_data()

# ----------------------------------------------------
# 10. Audit Logs & System Health
# ----------------------------------------------------
@router.get("/audit/logs", summary="Operational Audit Trail")
def get_audit_logs(limit: int = Query(25, ge=1, le=100), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "user": l.user,
            "details": l.details,
            "timestamp": l.timestamp.isoformat()
        }
        for l in logs
    ]

@router.get("/health", summary="System Health & Connectivity")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "RailOps Intelligence Platform",
        "version": "1.8.0",
        "ml_inference_ready": inference_engine.is_loaded,
        "database": "CONNECTED",
        "timestamp": "2026-09-04T10:55:00Z"
    }
