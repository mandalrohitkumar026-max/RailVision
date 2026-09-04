"""
Anomaly Service for RailOps Intelligence.
Surfaces detected railway operational anomalies and provides operator workflow actions.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.database.models import Anomaly, AuditLog
from backend.app.schemas.anomalies import AnomalyItem, AnomalyActionRequest

def list_anomalies(
    db: Session,
    severity: Optional[str] = None,
    status: Optional[str] = None
) -> List[AnomalyItem]:
    query = db.query(Anomaly)
    if severity and severity.upper() != "ALL":
        query = query.filter(Anomaly.severity == severity.upper())
    if status and status.upper() != "ALL":
        query = query.filter(Anomaly.status == status.upper())

    records = query.order_by(Anomaly.created_at.desc()).all()
    
    # Priority rank: CRITICAL -> HIGH -> MEDIUM -> LOW
    rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    records.sort(key=lambda x: rank.get(x.severity, 4))

    return [
        AnomalyItem(
            id=r.id,
            severity=r.severity,
            detected_time=r.detected_time,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            entity_name=r.entity_name,
            metric=r.metric,
            expected_value=r.expected_value,
            observed_value=r.observed_value,
            deviation_pct=r.deviation_pct,
            status=r.status,
            details=r.details,
            operator_note=r.operator_note
        )
        for r in records
    ]

def perform_anomaly_action(anomaly_id: str, action_req: AnomalyActionRequest, db: Session) -> AnomalyItem:
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail=f"Anomaly {anomaly_id} not found.")

    act = action_req.action.upper()
    if act == "ACKNOWLEDGE":
        anomaly.status = "ACKNOWLEDGED"
    elif act == "RESOLVE":
        anomaly.status = "RESOLVED"
    elif act == "ADD_NOTE":
        pass  # Just update note
    else:
        raise HTTPException(status_code=400, detail=f"Invalid anomaly action '{act}'.")

    if action_req.operator_note:
        anomaly.operator_note = action_req.operator_note

    db.add(AuditLog(
        action=f"ANOMALY_{act}",
        entity_type="ANOMALY",
        entity_id=anomaly_id,
        user=action_req.operator_id or "Operator Desk",
        details=f"Anomaly action: {act}. Note: {action_req.operator_note or 'None'}"
    ))
    db.commit()
    db.refresh(anomaly)

    return AnomalyItem(
        id=anomaly.id,
        severity=anomaly.severity,
        detected_time=anomaly.detected_time,
        entity_type=anomaly.entity_type,
        entity_id=anomaly.entity_id,
        entity_name=anomaly.entity_name,
        metric=anomaly.metric,
        expected_value=anomaly.expected_value,
        observed_value=anomaly.observed_value,
        deviation_pct=anomaly.deviation_pct,
        status=anomaly.status,
        details=anomaly.details,
        operator_note=anomaly.operator_note
    )
