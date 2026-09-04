"""
Pydantic schemas for Capacity Planning workflows and requests.
"""

from typing import Optional, List
from pydantic import BaseModel

class CapacityRequestCreate(BaseModel):
    train_number: str
    travel_date: str
    recommended_coaches: int
    coach_type: str = "3A (AC 3-Tier)"
    reason: str
    priority: str = "HIGH"  # NORMAL, HIGH, URGENT
    operator_name: Optional[str] = "Chief Dispatcher"

class CapacityRequestUpdate(BaseModel):
    status: str  # PENDING_APPROVAL, UNDER_REVIEW, APPROVED, REJECTED
    approver_notes: Optional[str] = None
    approver_name: Optional[str] = "Zonal Operations General Manager"

class CapacityRequestItem(BaseModel):
    id: str
    train_number: str
    train_name: str
    route_name: str
    travel_date: str
    current_capacity: int
    predicted_demand: int
    projected_occupancy_pct: float
    recommended_coaches: int
    coach_type: str
    reason: str
    priority: str
    status: str
    created_by: str
    created_at: str
    approver_notes: Optional[str]

class CapacityPlanningSummary(BaseModel):
    total_critical_trains: int
    total_capacity_shortfall_pax: int
    pending_approvals_count: int
    approved_coach_augmentations: int
    requests: List[CapacityRequestItem]
