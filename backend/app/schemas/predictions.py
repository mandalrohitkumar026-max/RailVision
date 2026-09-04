"""
Pydantic schemas for ML Delay and Risk Prediction.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DelayPredictionRequest(BaseModel):
    train_number: str
    current_station_code: str
    target_station_code: str
    prev_station_delay_min: float = 0.0
    route_congestion_index: Optional[float] = None
    weather_severity_index: Optional[float] = 0.1
    station_dwell_delta: Optional[float] = 0.0
    day_of_week: Optional[int] = None
    rainfall_mm: Optional[float] = 0.0

class DelayPredictionResponse(BaseModel):
    train_number: str
    prediction_time: str
    expected_delay_minutes: int
    severe_delay_probability: float
    cancellation_probability: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence_interval_lower: int
    confidence_interval_upper: int
    model_version: str
    factors: List[Dict[str, Any]]
