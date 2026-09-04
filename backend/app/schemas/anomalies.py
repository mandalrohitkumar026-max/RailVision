"""
Pydantic schemas for Anomaly Center, Station Intelligence, Route Corridors, and ML Models.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# --- Anomalies ---
class AnomalyItem(BaseModel):
    id: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    detected_time: str
    entity_type: str  # STATION, ROUTE, TRAIN, DEMAND
    entity_id: str
    entity_name: str
    metric: str
    expected_value: str
    observed_value: str
    deviation_pct: str
    status: str  # OPEN, ACKNOWLEDGED, RESOLVED
    details: Optional[str]
    operator_note: Optional[str]

class AnomalyActionRequest(BaseModel):
    action: str  # ACKNOWLEDGE, RESOLVE, ADD_NOTE
    operator_note: Optional[str] = None
    operator_id: Optional[str] = "Dispatcher #4"

# --- Station Intelligence ---
class StationBoardRow(BaseModel):
    train_number: str
    train_name: str
    scheduled_time: str
    expected_time: str
    platform: int
    delay_minutes: int
    status: str
    direction: str  # ARRIVAL, DEPARTURE

class StationDetailResponse(BaseModel):
    code: str
    name: str
    zone: str
    division: str
    platforms: int
    lat: float
    lon: float
    congestion_index: float
    average_delay_minutes: float
    average_dwell_time_minutes: float
    scheduled_dwell_time_minutes: float
    passenger_volume_today: int
    current_arrivals: List[StationBoardRow]
    current_departures: List[StationBoardRow]
    hourly_congestion_forecast: List[Dict[str, Any]]
    active_anomalies: List[AnomalyItem]

# --- Route Intelligence ---
class RouteHotspot(BaseModel):
    station_code: str
    station_name: str
    average_delay_minutes: float
    congestion_score: float
    risk_factor: str

class RouteDetailResponse(BaseModel):
    id: str
    name: str
    source_name: str
    destination_name: str
    distance_km: int
    corridor_congestion: float
    average_delay_minutes: float
    active_trains_count: int
    reliability_index_pct: float
    forecasted_risk: str
    station_sequence: List[str]
    hotspots: List[RouteHotspot]

# --- ML Model Center ---
class ModelMetricCard(BaseModel):
    model_name: str
    version: str
    status: str  # Production, Staged, Inactive
    algorithm: str
    training_date: str
    dataset_version: str
    metrics: Dict[str, Any]
    feature_importances: Optional[Dict[str, float]] = None

class MLModelCenterResponse(BaseModel):
    production_models: List[ModelMetricCard]
    experiment_tracking_status: str
    last_retrained: str
    data_drift_status: str
    system_latency_ms: float
