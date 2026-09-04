"""
Capacity Planning Service for RailOps Intelligence.
Manages coach recommendation approvals, operator capacity requests,
and maintenance of the operational audit trail.
"""

from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.database.models import CapacityRequest, Train, Route, AuditLog
from backend.app.schemas.capacity import (
    CapacityRequestCreate,
    CapacityRequestUpdate,
    CapacityRequestItem,
    CapacityPlanningSummary
)

def list_capacity_requests(db: Session) -> CapacityPlanningSummary:
    requests = db.query(CapacityRequest).order_by(CapacityRequest.created_at.desc()).all()
    
    total_shortfall = 0
    critical_count = 0
    pending_count = 0
    approved_count = 0

    items: List[CapacityRequestItem] = []
    for req in requests:
        diff = req.predicted_demand - req.current_capacity
        if diff > 0:
            total_shortfall += diff
        if req.projected_occupancy_pct >= 115.0:
            critical_count += 1
        if req.status == "PENDING_APPROVAL":
            pending_count += 1
        elif req.status == "APPROVED":
            approved_count += req.recommended_coaches

        items.append(CapacityRequestItem(
            id=req.id,
            train_number=req.train_number,
            train_name=req.train_name,
            route_name=req.route_name,
            travel_date=req.travel_date,
            current_capacity=req.current_capacity,
            predicted_demand=req.predicted_demand,
            projected_occupancy_pct=req.projected_occupancy_pct,
            recommended_coaches=req.recommended_coaches,
            coach_type=req.coach_type,
            reason=req.reason,
            priority=req.priority,
            status=req.status,
            created_by=req.created_by,
            created_at=req.created_at,
            approver_notes=req.approver_notes
        ))

    return CapacityPlanningSummary(
        total_critical_trains=critical_count,
        total_capacity_shortfall_pax=total_shortfall,
        pending_approvals_count=pending_count,
        approved_coach_augmentations=approved_count,
        requests=items
    )

def create_capacity_request(payload: CapacityRequestCreate, db: Session) -> CapacityRequestItem:
    train = db.query(Train).filter(Train.number == payload.train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {payload.train_number} not found.")

    route = db.query(Route).filter(Route.id == train.route_id).first()
    cur_cap = train.capacity
    # Estimate demand
    pred_dem = cur_cap + (payload.recommended_coaches * 72)
    occ_pct = round((pred_dem / cur_cap) * 100, 1)

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    req_id = f"CR-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    new_req = CapacityRequest(
        id=req_id,
        train_number=train.number,
        train_name=train.name,
        route_name=route.name if route else "Trunk Line",
        travel_date=payload.travel_date,
        current_capacity=cur_cap,
        predicted_demand=pred_dem,
        projected_occupancy_pct=occ_pct,
        recommended_coaches=payload.recommended_coaches,
        coach_type=payload.coach_type,
        reason=payload.reason,
        priority=payload.priority,
        status="PENDING_APPROVAL",
        created_by=payload.operator_name or "Dispatcher",
        created_at=now_str
    )

    db.add(new_req)

    # Log to audit trail
    db.add(AuditLog(
        action="CREATE_CAPACITY_REQUEST",
        entity_type="CAPACITY_REQUEST",
        entity_id=req_id,
        user=payload.operator_name or "Dispatcher",
        details=f"Created capacity augmentation request for {payload.recommended_coaches}x {payload.coach_type} on Train {train.number} ({payload.travel_date})."
    ))
    db.commit()
    db.refresh(new_req)

    return CapacityRequestItem(
        id=new_req.id,
        train_number=new_req.train_number,
        train_name=new_req.train_name,
        route_name=new_req.route_name,
        travel_date=new_req.travel_date,
        current_capacity=new_req.current_capacity,
        predicted_demand=new_req.predicted_demand,
        projected_occupancy_pct=new_req.projected_occupancy_pct,
        recommended_coaches=new_req.recommended_coaches,
        coach_type=new_req.coach_type,
        reason=new_req.reason,
        priority=new_req.priority,
        status=new_req.status,
        created_by=new_req.created_by,
        created_at=new_req.created_at,
        approver_notes=new_req.approver_notes
    )

def update_capacity_request_status(req_id: str, update: CapacityRequestUpdate, db: Session) -> CapacityRequestItem:
    req = db.query(CapacityRequest).filter(CapacityRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail=f"Request {req_id} not found.")

    req.status = update.status
    if update.approver_notes:
        req.approver_notes = update.approver_notes

    db.add(AuditLog(
        action=f"UPDATE_STATUS_{update.status}",
        entity_type="CAPACITY_REQUEST",
        entity_id=req_id,
        user=update.approver_name or "Zonal Approver",
        details=f"Status set to {update.status}. Notes: {update.approver_notes}"
    ))
    db.commit()
    db.refresh(req)

    return CapacityRequestItem(
        id=req.id,
        train_number=req.train_number,
        train_name=req.train_name,
        route_name=req.route_name,
        travel_date=req.travel_date,
        current_capacity=req.current_capacity,
        predicted_demand=req.predicted_demand,
        projected_occupancy_pct=req.projected_occupancy_pct,
        recommended_coaches=req.recommended_coaches,
        coach_type=req.coach_type,
        reason=req.reason,
        priority=req.priority,
        status=req.status,
        created_by=req.created_by,
        created_at=req.created_at,
        approver_notes=req.approver_notes
    )
