"""
SQLAlchemy ORM models for RailOps Intelligence.
Defines normalized tables for trains, routes, stations, timetables, active runs,
anomalies, capacity planning requests, and audit logs.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Station(Base):
    __tablename__ = "stations"

    code = Column(String(10), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    zone = Column(String(10), nullable=False)
    division = Column(String(50), nullable=False)
    platforms = Column(Integer, default=4)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    congestion_base = Column(Float, default=0.5)

    schedules = relationship("TrainSchedule", back_populates="station")

class Route(Base):
    __tablename__ = "routes"

    id = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    source = Column(String(10), ForeignKey("stations.code"), nullable=False)
    destination = Column(String(10), ForeignKey("stations.code"), nullable=False)
    distance_km = Column(Integer, nullable=False)
    corridor_congestion = Column(Float, default=0.6)
    station_sequence = Column(JSON, nullable=False)  # List of station codes

    trains = relationship("Train", back_populates="route")

class Train(Base):
    __tablename__ = "trains"

    number = Column(String(10), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    train_type = Column(String(50), nullable=False)  # Rajdhani, Shatabdi, Superfast, etc.
    route_id = Column(String(20), ForeignKey("routes.id"), nullable=False)
    priority = Column(Integer, default=2)  # 1 (high), 2 (mid), 3 (low)
    capacity = Column(Integer, default=1200)
    coaches = Column(Integer, default=20)
    dep_station = Column(String(10), ForeignKey("stations.code"), nullable=False)
    arr_station = Column(String(10), ForeignKey("stations.code"), nullable=False)
    base_dep = Column(String(10), nullable=False)

    route = relationship("Route", back_populates="trains")
    schedules = relationship("TrainSchedule", back_populates="train", order_by="TrainSchedule.sequence")
    runs = relationship("TrainRun", back_populates="train")

class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(10), ForeignKey("trains.number"), nullable=False, index=True)
    station_code = Column(String(10), ForeignKey("stations.code"), nullable=False, index=True)
    sequence = Column(Integer, nullable=False)
    distance_km = Column(Integer, default=0)
    scheduled_arrival = Column(String(10), nullable=True)
    scheduled_departure = Column(String(10), nullable=True)
    scheduled_dwell_min = Column(Integer, default=2)
    platform = Column(Integer, default=1)

    train = relationship("Train", back_populates="schedules")
    station = relationship("Station", back_populates="schedules")

class TrainRun(Base):
    __tablename__ = "train_runs"

    run_id = Column(String(50), primary_key=True, index=True)
    train_number = Column(String(10), ForeignKey("trains.number"), nullable=False, index=True)
    run_date = Column(String(12), nullable=False, index=True)
    current_station_code = Column(String(10), nullable=False)
    next_station_code = Column(String(10), nullable=False)
    scheduled_arrival = Column(String(10), nullable=False)
    expected_arrival = Column(String(10), nullable=False)
    delay_minutes = Column(Integer, default=0)
    severe_delay_probability = Column(Float, default=0.0)
    cancellation_probability = Column(Float, default=0.0)
    passenger_load_pct = Column(Float, default=90.0)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="ON TIME")   # ON TIME, RUNNING LATE, SEVERE DELAY, CANCELLED
    last_updated = Column(DateTime, default=datetime.utcnow)

    train = relationship("Train", back_populates="runs")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(30), primary_key=True, index=True)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    detected_time = Column(String(30), nullable=False)
    entity_type = Column(String(30), nullable=False)  # STATION, ROUTE, TRAIN, DEMAND
    entity_id = Column(String(50), nullable=False)
    entity_name = Column(String(100), nullable=False)
    metric = Column(String(100), nullable=False)
    expected_value = Column(String(50), nullable=False)
    observed_value = Column(String(50), nullable=False)
    deviation_pct = Column(String(20), nullable=False)
    status = Column(String(20), default="OPEN")  # OPEN, ACKNOWLEDGED, RESOLVED
    details = Column(Text, nullable=True)
    operator_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CapacityRequest(Base):
    __tablename__ = "capacity_requests"

    id = Column(String(30), primary_key=True, index=True)
    train_number = Column(String(10), nullable=False, index=True)
    train_name = Column(String(100), nullable=False)
    route_name = Column(String(100), nullable=False)
    travel_date = Column(String(12), nullable=False)
    current_capacity = Column(Integer, nullable=False)
    predicted_demand = Column(Integer, nullable=False)
    projected_occupancy_pct = Column(Float, nullable=False)
    recommended_coaches = Column(Integer, nullable=False)
    coach_type = Column(String(50), default="3A (AC 3-Tier)")
    reason = Column(Text, nullable=False)
    priority = Column(String(20), default="HIGH")  # NORMAL, HIGH, URGENT
    status = Column(String(30), default="PENDING_APPROVAL")  # PENDING_APPROVAL, UNDER_REVIEW, APPROVED, REJECTED
    created_by = Column(String(100), default="Operations Controller")
    created_at = Column(String(30), nullable=False)
    approver_notes = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False)
    user = Column(String(100), default="Dispatcher Desk #1")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
