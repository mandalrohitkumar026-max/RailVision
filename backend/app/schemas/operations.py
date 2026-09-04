"""
Pydantic schemas for network-wide operations overview and dashboard KPIs.
"""

from typing import List, Optional
from pydantic import BaseModel

class DashboardSummaryKPIs(BaseModel):
    total_trains_today: int
    trains_currently_running: int
    ontime_percentage: float
    average_delay_minutes: float
    severe_delay_trains: int
    cancellation_risk_count: int
    passenger_demand_today: int
    network_congestion_level: str  # NORMAL, MODERATE, HIGH, CRITICAL
    network_congestion_pct: float
    timestamp: str

class LiveOperationRow(BaseModel):
    train_number: str
    train_name: str
    train_type: str
    route_name: str
    current_station_code: str
    current_station_name: str
    next_station_code: str
    next_station_name: str
    scheduled_arrival: str
    expected_arrival: str
    delay_minutes: int
    delay_formatted: str  # e.g. "+47 min" or "On Time"
    delay_risk_pct: float  # Severe delay probability
    passenger_load_pct: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    status: str  # ON TIME, RUNNING LATE, SEVERE DELAY, CANCELLED

class DashboardSummaryResponse(BaseModel):
    kpis: DashboardSummaryKPIs
    live_operations: List[LiveOperationRow]
