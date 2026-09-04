"""
Operations Service for RailOps Intelligence.
Aggregates network KPIs and active running trains for the command center.
Caches dashboard summaries for fast response times.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.app.database.models import TrainRun, Train, Route, Station
from backend.app.schemas.operations import DashboardSummaryResponse, DashboardSummaryKPIs, LiveOperationRow
from backend.app.core.cache import cache

CACHE_KEY_DASHBOARD = "railops:dashboard:summary"

def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
    # 1. Check Cache
    cached_data = cache.get_json(CACHE_KEY_DASHBOARD)
    if cached_data:
        return DashboardSummaryResponse(**cached_data)

    # 2. Query Live Train Runs
    runs = db.query(TrainRun).all()
    stations_map = {s.code: s.name for s in db.query(Station).all()}
    trains_map = {t.number: t for t in db.query(Train).all()}
    routes_map = {r.id: r.name for r in db.query(Route).all()}

    total_trains = len(trains_map)
    active_runs = len(runs)
    
    total_delay = 0
    severe_count = 0
    cancel_risk_count = 0
    ontime_count = 0
    total_demand = 0

    live_rows: List[LiveOperationRow] = []

    for r in runs:
        train = trains_map.get(r.train_number)
        train_name = train.name if train else f"Train {r.train_number}"
        train_type = train.train_type if train else "Express"
        route_name = routes_map.get(train.route_id, "Corridor") if train else "Main Line"

        cur_st_name = stations_map.get(r.current_station_code, r.current_station_code)
        nxt_st_name = stations_map.get(r.next_station_code, r.next_station_code)

        delay = r.delay_minutes
        total_delay += delay
        if delay <= 5:
            ontime_count += 1
        if delay >= 30 or r.severe_delay_probability >= 70:
            severe_count += 1
        if r.cancellation_probability >= 10:
            cancel_risk_count += 1

        load_p = r.passenger_load_pct
        cap = train.capacity if train else 1200
        total_demand += int(cap * (load_p / 100.0))

        delay_fmt = "On Time" if delay == 0 else (f"+{delay} min" if delay > 0 else f"{delay} min")

        live_rows.append(LiveOperationRow(
            train_number=r.train_number,
            train_name=train_name,
            train_type=train_type,
            route_name=route_name,
            current_station_code=r.current_station_code,
            current_station_name=cur_st_name,
            next_station_code=r.next_station_code,
            next_station_name=nxt_st_name,
            scheduled_arrival=r.scheduled_arrival,
            expected_arrival=r.expected_arrival,
            delay_minutes=delay,
            delay_formatted=delay_fmt,
            delay_risk_pct=r.severe_delay_probability,
            passenger_load_pct=round(load_p, 1),
            risk_level=r.risk_level,
            status=r.status
        ))

    # Sort: Critical & Severe delay first
    risk_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    live_rows.sort(key=lambda x: (risk_rank.get(x.risk_level, 4), -x.delay_minutes))

    avg_delay = round(total_delay / max(1, active_runs), 1)
    ontime_pct = round((ontime_count / max(1, active_runs)) * 100, 1)

    # Congestion assessment
    if avg_delay > 25:
        congestion_lvl = "CRITICAL"
        congestion_pct = 86.4
    elif avg_delay > 15:
        congestion_lvl = "HIGH"
        congestion_pct = 74.2
    elif avg_delay > 8:
        congestion_lvl = "MODERATE"
        congestion_pct = 58.5
    else:
        congestion_lvl = "NORMAL"
        congestion_pct = 42.0

    kpis = DashboardSummaryKPIs(
        total_trains_today=total_trains,
        trains_currently_running=active_runs,
        ontime_percentage=ontime_pct,
        average_delay_minutes=avg_delay,
        severe_delay_trains=severe_count,
        cancellation_risk_count=cancel_risk_count,
        passenger_demand_today=total_demand,
        network_congestion_level=congestion_lvl,
        network_congestion_pct=congestion_pct,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

    response = DashboardSummaryResponse(kpis=kpis, live_operations=live_rows)
    # Cache for 15 seconds
    cache.set_json(CACHE_KEY_DASHBOARD, response.model_dump(), ttl_seconds=15)
    return response
