"""
Train Service for RailOps Intelligence.
Provides deep-dive train intelligence:
- Operating telemetry and route information
- Railway timeline visualization with scheduled vs expected arrivals
- ML delay prediction & factor attribution
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.database.models import Train, TrainSchedule, TrainRun, Station, Route
from backend.app.schemas.trains import TrainDetailResponse, TimelineStop, PredictionFactor
from backend.app.ml.inference_engine import inference_engine

def get_train_intelligence(train_number: str, db: Session) -> TrainDetailResponse:
    train = db.query(Train).filter(Train.number == train_number).first()
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {train_number} not found in railway registry.")

    run = db.query(TrainRun).filter(TrainRun.train_number == train_number).first()
    route = db.query(Route).filter(Route.id == train.route_id).first()
    schedules = db.query(TrainSchedule).filter(TrainSchedule.train_number == train_number).order_by(TrainSchedule.sequence).all()
    stations_map = {s.code: s for s in db.query(Station).all()}

    cur_delay = run.delay_minutes if run else 0
    cur_st_code = run.current_station_code if run else (schedules[0].station_code if schedules else "MMCT")
    cur_st_name = stations_map[cur_st_code].name if cur_st_code in stations_map else cur_st_code

    # ML Inference for target expected delay & risk
    ml_out = inference_engine.predict_delay_and_risk(
        prev_station_delay_min=float(cur_delay),
        route_congestion_index=route.corridor_congestion if route else 0.7,
        weather_severity_index=0.25,
        station_dwell_delta=2.0 if cur_delay > 20 else 0.0,
        distance_km=route.distance_km if route else 1200,
        stop_sequence=len(schedules),
        day_of_week=4,  # Friday
        is_weekend=0,
        is_holiday=0,
        priority=train.priority,
        rainfall_mm=12.0
    )

    # Build Railway Timeline Stop sequence
    timeline_stops: List[TimelineStop] = []
    found_current = False
    current_index = 0

    for idx, s in enumerate(schedules):
        st_info = stations_map.get(s.station_code)
        st_name = st_info.name if st_info else s.station_code

        # Determine status
        if s.station_code == cur_st_code:
            stop_status = "CURRENT"
            found_current = True
            current_index = idx
        elif not found_current:
            stop_status = "PASSED"
        else:
            stop_status = "UPCOMING"

        # Scheduled vs Expected calculation
        sched_arr = s.scheduled_arrival
        sched_dep = s.scheduled_departure
        dwell = s.scheduled_dwell_min

        if sched_arr:
            sh, sm = map(int, sched_arr.split(":"))
            # Delay accumulates towards target
            stop_delay = int(cur_delay * (idx / max(1, current_index))) if idx <= current_index else int(cur_delay + (idx - current_index) * 3)
            exp_arr_dt = datetime(2026, 9, 4, sh, sm) + timedelta(minutes=stop_delay)
            exp_arr = exp_arr_dt.strftime("%H:%M")
        else:
            exp_arr = None
            stop_delay = 0

        if sched_dep:
            dh, dm = map(int, sched_dep.split(":"))
            exp_dep_dt = datetime(2026, 9, 4, dh, dm) + timedelta(minutes=stop_delay)
            exp_dep = exp_dep_dt.strftime("%H:%M")
        else:
            exp_dep = None

        obs_dwell = dwell + (2 if stop_status == "CURRENT" and cur_delay > 20 else 0)

        timeline_stops.append(TimelineStop(
            station_code=s.station_code,
            station_name=st_name,
            sequence=s.sequence,
            distance_km=s.distance_km,
            scheduled_arrival=sched_arr,
            scheduled_departure=sched_dep,
            expected_arrival=exp_arr,
            expected_departure=exp_dep,
            scheduled_dwell_min=dwell,
            observed_dwell_min=obs_dwell,
            delay_delta_min=stop_delay,
            platform=s.platform,
            status=stop_status
        ))

    # Prediction Factors
    prediction_factors = [
        PredictionFactor(
            factor=f["factor"],
            category=f["category"],
            impact_minutes=f["impact_minutes"],
            value=f["value"],
            importance_weight=f["importance_weight"],
            description=f["description"]
        )
        for f in ml_out["factors"]
    ]

    return TrainDetailResponse(
        train_number=train.number,
        train_name=train.name,
        train_type=train.train_type,
        route_id=train.route_id,
        route_name=route.name if route else "Main Corridor",
        priority=train.priority,
        capacity=train.capacity,
        coaches=train.coaches,
        dep_station=train.dep_station,
        arr_station=train.arr_station,
        operating_status=run.status if run else "SCHEDULED",
        current_location=f"{cur_st_name} ({cur_st_code})",
        current_delay_minutes=cur_delay,
        expected_delay_minutes=ml_out["expected_delay_minutes"],
        severe_delay_probability=ml_out["severe_delay_probability"],
        cancellation_probability=ml_out["cancellation_probability"],
        risk_level=ml_out["risk_level"],
        model_confidence_pct=ml_out["model_confidence_pct"],
        model_version=ml_out["model_version"],
        prediction_time=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        timeline=timeline_stops,
        prediction_factors=prediction_factors
    )

def list_all_trains(db: Session) -> List[Dict[str, Any]]:
    trains = db.query(Train).all()
    runs_map = {r.train_number: r for r in db.query(TrainRun).all()}
    routes_map = {r.id: r for r in db.query(Route).all()}

    results = []
    for t in trains:
        run = runs_map.get(t.number)
        route = routes_map.get(t.route_id)
        results.append({
            "number": t.number,
            "name": t.name,
            "type": t.train_type,
            "route_id": t.route_id,
            "route_name": route.name if route else "Corridor",
            "source": t.dep_station,
            "destination": t.arr_station,
            "status": run.status if run else "SCHEDULED",
            "delay_minutes": run.delay_minutes if run else 0,
            "risk_level": run.risk_level if run else "LOW",
            "passenger_load_pct": run.passenger_load_pct if run else 90.0
        })
    return results
