"""
Station Intelligence Service for RailOps Intelligence.
Aggregates station platform capacity, arrivals/departures schedule,
average dwell variances, and hourly congestion forecasts.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.database.models import Station, TrainSchedule, Train, TrainRun, Anomaly
from backend.app.schemas.anomalies import StationDetailResponse, StationBoardRow, AnomalyItem

def get_station_details(station_code: str, db: Session) -> StationDetailResponse:
    station = db.query(Station).filter(Station.code == station_code.upper()).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station code {station_code} not found.")

    schedules = db.query(TrainSchedule).filter(TrainSchedule.station_code == station.code).all()
    train_numbers = [s.train_number for s in schedules]
    trains_map = {t.number: t for t in db.query(Train).filter(Train.number.in_(train_numbers)).all()}
    runs_map = {r.train_number: r for r in db.query(TrainRun).filter(TrainRun.train_number.in_(train_numbers)).all()}

    arrivals: List[StationBoardRow] = []
    departures: List[StationBoardRow] = []
    
    total_dwell_sched = 0
    total_dwell_obs = 0
    total_delay = 0

    for s in schedules:
        train = trains_map.get(s.train_number)
        run = runs_map.get(s.train_number)
        t_name = train.name if train else f"Train {s.train_number}"
        delay = run.delay_minutes if run else 0
        status_str = run.status if run else "ON TIME"
        total_delay += delay

        sched_dwell = s.scheduled_dwell_min
        obs_dwell = sched_dwell + (3 if delay > 20 else 0)
        total_dwell_sched += sched_dwell
        total_dwell_obs += obs_dwell

        if s.scheduled_arrival:
            ah, am = map(int, s.scheduled_arrival.split(":"))
            exp_arr_dt = datetime(2026, 9, 4, ah, am) + timedelta(minutes=delay)
            arrivals.append(StationBoardRow(
                train_number=s.train_number,
                train_name=t_name,
                scheduled_time=s.scheduled_arrival,
                expected_time=exp_arr_dt.strftime("%H:%M"),
                platform=s.platform,
                delay_minutes=delay,
                status=status_str,
                direction="ARRIVAL"
            ))

        if s.scheduled_departure:
            dh, dm = map(int, s.scheduled_departure.split(":"))
            exp_dep_dt = datetime(2026, 9, 4, dh, dm) + timedelta(minutes=delay)
            departures.append(StationBoardRow(
                train_number=s.train_number,
                train_name=t_name,
                scheduled_time=s.scheduled_departure,
                expected_time=exp_dep_dt.strftime("%H:%M"),
                platform=s.platform,
                delay_minutes=delay,
                status=status_str,
                direction="DEPARTURE"
            ))

    n_sched = max(1, len(schedules))
    avg_dwell_sched = round(total_dwell_sched / n_sched, 1)
    avg_dwell_obs = round(total_dwell_obs / n_sched, 1)
    avg_delay = round(total_delay / n_sched, 1)

    # Hourly congestion forecast (06:00 to 22:00)
    hourly_forecast = []
    base_cg = station.congestion_base
    for hour in range(6, 23):
        # Morning & evening peaks
        peak_weight = 1.35 if hour in [8, 9, 10, 17, 18, 19, 20] else 0.85
        val = min(0.98, round(base_cg * peak_weight, 2))
        hourly_forecast.append({
            "hour": f"{hour:02d}:00",
            "congestion_pct": int(val * 100),
            "platform_occupancy": min(station.platforms, max(1, int(station.platforms * val)))
        })

    # Active anomalies for this station
    anms = db.query(Anomaly).filter(Anomaly.entity_id == station.code).all()
    anomaly_items = [
        AnomalyItem(
            id=a.id,
            severity=a.severity,
            detected_time=a.detected_time,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            entity_name=a.entity_name,
            metric=a.metric,
            expected_value=a.expected_value,
            observed_value=a.observed_value,
            deviation_pct=a.deviation_pct,
            status=a.status,
            details=a.details,
            operator_note=a.operator_note
        )
        for a in anms
    ]

    return StationDetailResponse(
        code=station.code,
        name=station.name,
        zone=station.zone,
        division=station.division,
        platforms=station.platforms,
        lat=station.lat,
        lon=station.lon,
        congestion_index=round(station.congestion_base * 100, 1),
        average_delay_minutes=avg_delay,
        average_dwell_time_minutes=avg_dwell_obs,
        scheduled_dwell_time_minutes=avg_dwell_sched,
        passenger_volume_today=int(station.platforms * 12500),
        current_arrivals=arrivals[:10],
        current_departures=departures[:10],
        hourly_congestion_forecast=hourly_forecast,
        active_anomalies=anomaly_items
    )

def list_all_stations(db: Session) -> List[Dict[str, Any]]:
    stations = db.query(Station).all()
    return [
        {
            "code": s.code,
            "name": s.name,
            "zone": s.zone,
            "division": s.division,
            "platforms": s.platforms,
            "congestion_pct": round(s.congestion_base * 100, 1)
        }
        for s in stations
    ]
