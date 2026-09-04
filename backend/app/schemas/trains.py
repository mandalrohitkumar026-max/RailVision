"""
Pydantic schemas for Train Intelligence, timetable timeline, and factor explanations.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class TimelineStop(BaseModel):
    station_code: str
    station_name: str
    sequence: int
    distance_km: int
    scheduled_arrival: Optional[str]
    scheduled_departure: Optional[str]
    expected_arrival: Optional[str]
    expected_departure: Optional[str]
    scheduled_dwell_min: int
    observed_dwell_min: int
    delay_delta_min: int
    platform: int
    status: str  # PASSED, CURRENT, UPCOMING

class PredictionFactor(BaseModel):
    factor: str
    category: str
    impact_minutes: str
    value: str
    importance_weight: float
    description: str

class TrainDetailResponse(BaseModel):
    train_number: str
    train_name: str
    train_type: str
    route_id: str
    route_name: str
    priority: int
    capacity: int
    coaches: int
    dep_station: str
    arr_station: str
    operating_status: str
    current_location: str
    current_delay_minutes: int
    expected_delay_minutes: int
    severe_delay_probability: float
    cancellation_probability: float
    risk_level: str
    model_confidence_pct: float
    model_version: str
    prediction_time: str
    timeline: List[TimelineStop]
    prediction_factors: List[PredictionFactor]
