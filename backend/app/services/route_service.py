"""
Route Corridor Intelligence Service for RailOps Intelligence.
Monitors trunk line corridors, bottleneck junctions, delay hotspots, and reliability scores.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.database.models import Route, Station, Train, TrainRun
from backend.app.schemas.anomalies import RouteDetailResponse, RouteHotspot

def get_route_details(route_id: str, db: Session) -> RouteDetailResponse:
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail=f"Route corridor {route_id} not found.")

    stations_map = {s.code: s for s in db.query(Station).all()}
    trains = db.query(Train).filter(Train.route_id == route.id).all()
    train_nums = [t.number for t in trains]
    runs = db.query(TrainRun).filter(TrainRun.train_number.in_(train_nums)).all()

    total_delay = sum(r.delay_minutes for r in runs)
    avg_delay = round(total_delay / max(1, len(runs)), 1)
    
    # Corridor reliability index: inversely proportional to delay & congestion
    reliability = max(55.0, min(99.0, round(100.0 - (avg_delay * 0.8) - (route.corridor_congestion * 15), 1)))

    if route.corridor_congestion > 0.8 or avg_delay > 35:
        forecast_risk = "HIGH"
    elif route.corridor_congestion > 0.65 or avg_delay > 18:
        forecast_risk = "MEDIUM"
    else:
        forecast_risk = "LOW"

    # Identify delay hotspots
    hotspots: List[RouteHotspot] = []
    # Identify stations with congestion > 0.7
    for st_code in route.station_sequence:
        st = stations_map.get(st_code)
        if st and st.congestion_base >= 0.70:
            hotspots.append(RouteHotspot(
                station_code=st.code,
                station_name=st.name,
                average_delay_minutes=round(avg_delay * (st.congestion_base / 0.75), 1),
                congestion_score=round(st.congestion_base * 100, 1),
                risk_factor="Platform Clearance & Junction Bunching" if st.platforms <= 8 else "Suburban Commuter Interlocking"
            ))

    src_name = stations_map[route.source].name if route.source in stations_map else route.source
    dst_name = stations_map[route.destination].name if route.destination in stations_map else route.destination

    return RouteDetailResponse(
        id=route.id,
        name=route.name,
        source_name=src_name,
        destination_name=dst_name,
        distance_km=route.distance_km,
        corridor_congestion=round(route.corridor_congestion * 100, 1),
        average_delay_minutes=avg_delay,
        active_trains_count=len(runs),
        reliability_index_pct=reliability,
        forecasted_risk=forecast_risk,
        station_sequence=route.station_sequence,
        hotspots=hotspots
    )

def list_all_routes(db: Session) -> List[Dict[str, Any]]:
    routes = db.query(Route).all()
    stations_map = {s.code: s.name for s in db.query(Station).all()}
    return [
        {
            "id": r.id,
            "name": r.name,
            "source": stations_map.get(r.source, r.source),
            "destination": stations_map.get(r.destination, r.destination),
            "distance_km": r.distance_km,
            "corridor_congestion_pct": round(r.corridor_congestion * 100, 1)
        }
        for r in routes
    ]
