"""
Database Seeding Script for RailOps Intelligence.
Creates tables and seeds realistic Indian Railways data for stations, routes,
trains, timetables, active operational runs, anomalies, and capacity requests.
"""

from datetime import datetime
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.database.models import (
    Station, Route, Train, TrainSchedule, TrainRun, Anomaly, CapacityRequest, AuditLog
)
from ml.data.synthetic_generator import generate_full_synthetic_data

def seed_database():
    print("[Database Seed] Creating tables if not present...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Train).count() > 0:
            print("[Database Seed] Database already contains records. Clearing for fresh seed...")
            db.query(AuditLog).delete()
            db.query(CapacityRequest).delete()
            db.query(Anomaly).delete()
            db.query(TrainRun).delete()
            db.query(TrainSchedule).delete()
            db.query(Train).delete()
            db.query(Route).delete()
            db.query(Station).delete()
            db.commit()

        print("[Database Seed] Generating synthetic railway records...")
        data = generate_full_synthetic_data()

        # 1. Insert Stations
        for st in data["stations"]:
            db.add(Station(
                code=st["code"],
                name=st["name"],
                zone=st["zone"],
                division=st["division"],
                platforms=st["platforms"],
                lat=st["lat"],
                lon=st["lon"],
                congestion_base=st["congestion_base"]
            ))
        db.commit()
        print(f"[Database Seed] Inserted {len(data['stations'])} stations.")

        # 2. Insert Routes
        for r in data["routes"]:
            db.add(Route(
                id=r["id"],
                name=r["name"],
                source=r["source"],
                destination=r["destination"],
                distance_km=r["distance_km"],
                corridor_congestion=r["corridor_congestion"],
                station_sequence=r["station_sequence"]
            ))
        db.commit()
        print(f"[Database Seed] Inserted {len(data['routes'])} routes.")

        # 3. Insert Trains & Timetable Schedules
        for t in data["trains"]:
            train_record = Train(
                number=t["number"],
                name=t["name"],
                train_type=t["type"],
                route_id=t["route_id"],
                priority=t["priority"],
                capacity=t["capacity"],
                coaches=t["coaches"],
                dep_station=t["dep_station"],
                arr_station=t["arr_station"],
                base_dep=t["base_dep"]
            )
            db.add(train_record)
            
            for stop in t["schedule"]:
                db.add(TrainSchedule(
                    train_number=t["number"],
                    station_code=stop["station_code"],
                    sequence=stop["sequence"],
                    distance_km=stop["distance_km"],
                    scheduled_arrival=stop["scheduled_arrival"],
                    scheduled_departure=stop["scheduled_departure"],
                    scheduled_dwell_min=stop["scheduled_dwell_min"],
                    platform=stop["platform"]
                ))
        db.commit()
        print(f"[Database Seed] Inserted {len(data['trains'])} trains and corresponding timetables.")

        # 4. Insert Live Active Runs
        for run in data["live_runs"]:
            db.add(TrainRun(
                run_id=run["run_id"],
                train_number=run["train_number"],
                run_date="2026-09-04",
                current_station_code=run["current_station_code"],
                next_station_code=run["next_station_code"],
                scheduled_arrival=run["scheduled_arrival"],
                expected_arrival=run["expected_arrival"],
                delay_minutes=run["delay_minutes"],
                severe_delay_probability=run["severe_delay_probability"],
                cancellation_probability=run["cancellation_probability"],
                passenger_load_pct=run["passenger_load_pct"],
                risk_level=run["risk_level"],
                status=run["status"],
                last_updated=datetime.utcnow()
            ))
        db.commit()
        print(f"[Database Seed] Inserted {len(data['live_runs'])} live active train runs.")

        # 5. Insert Anomalies
        for anm in data["anomalies"]:
            db.add(Anomaly(
                id=anm["id"],
                severity=anm["severity"],
                detected_time=anm["detected_time"],
                entity_type=anm["entity_type"],
                entity_id=anm["entity_id"],
                entity_name=anm["entity_name"],
                metric=anm["metric"],
                expected_value=anm["expected_value"],
                observed_value=anm["observed_value"],
                deviation_pct=anm["deviation_pct"],
                status=anm["status"],
                details=anm["details"],
                operator_note=anm["operator_note"],
                created_at=datetime.utcnow()
            ))
        db.commit()
        print(f"[Database Seed] Inserted {len(data['anomalies'])} operational anomalies.")

        # 6. Insert Capacity Requests
        for req in data["capacity_requests"]:
            db.add(CapacityRequest(
                id=req["id"],
                train_number=req["train_number"],
                train_name=req["train_name"],
                route_name=req["route_name"],
                travel_date=req["travel_date"],
                current_capacity=req["current_capacity"],
                predicted_demand=req["predicted_demand"],
                projected_occupancy_pct=req["projected_occupancy_pct"],
                recommended_coaches=req["recommended_coaches"],
                coach_type=req["coach_type"],
                reason=req["reason"],
                priority=req["priority"],
                status=req["status"],
                created_by=req["created_by"],
                created_at=req["created_at"],
                approver_notes=req.get("approver_notes")
            ))
        db.commit()
        print(f"[Database Seed] Inserted {len(data['capacity_requests'])} capacity requests.")

        # Initial Audit Log
        db.add(AuditLog(
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            entity_id="ALL",
            user="System Initializer",
            details="Seeded initial operational database with trunk corridor schedules and live telemetry."
        ))
        db.commit()

        print("[Database Seed] Completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[Database Seed ERROR]: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
