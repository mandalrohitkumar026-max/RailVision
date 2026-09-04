"""
Pydantic schemas for Passenger Demand Forecasting and Coach Capacity Recommendations.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel

class DemandForecastRequest(BaseModel):
    train_number: str
    travel_date: str
    travel_class: str = "ALL"  # ALL, 1A, 2A, 3A, SL
    station_code: Optional[str] = None
    horizon_days: int = 7

class BookingDataPoint(BaseModel):
    date: str
    historical_actual: Optional[int]
    predicted_demand: int
    lower_ci_95: int
    upper_ci_95: int
    capacity: int

class DemandForecastResponse(BaseModel):
    train_number: str
    train_name: str
    route_name: str
    target_date: str
    travel_class: str
    predicted_demand: int
    available_capacity: int
    expected_occupancy_pct: float
    demand_growth_pct: float
    ci_lower: int
    ci_upper: int
    recommendation: str  # e.g. "ADD 2 COACHES" or "CAPACITY ADEQUATE"
    recommendation_code: str  # ADD_COACHES, REMOVE_COACHES, OPTIMAL
    recommended_coach_count: int
    recommended_coach_type: str
    operational_approval_required: bool
    reason: str
    forecast_timeline: List[BookingDataPoint]
    class_breakdown: Dict[str, int]
    weekly_pattern: List[Dict[str, Any]]
    holiday_impact_pct: float
