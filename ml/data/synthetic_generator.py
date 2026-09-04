"""
Synthetic Indian Railways Dataset Generator for RailOps Intelligence.
Generates realistic trunk corridors, stations, train schedules, historical runs,
weather telemetry, booking patterns, and operational incidents.
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Ensure reproducible generation
random.seed(42)

STATIONS = [
    # Western Corridor (Mumbai - Delhi)
    {"code": "MMCT", "name": "Mumbai Central", "zone": "WR", "division": "Mumbai", "platforms": 8, "lat": 18.9696, "lon": 72.8193, "congestion_base": 0.72},
    {"code": "BVI", "name": "Borivali", "zone": "WR", "division": "Mumbai", "platforms": 10, "lat": 19.2290, "lon": 72.8573, "congestion_base": 0.85},
    {"code": "ST", "name": "Surat", "zone": "WR", "division": "Vadodara", "platforms": 6, "lat": 21.2050, "lon": 72.8409, "congestion_base": 0.68},
    {"code": "BRC", "name": "Vadodara Junction", "zone": "WR", "division": "Vadodara", "platforms": 7, "lat": 22.3107, "lon": 73.1812, "congestion_base": 0.78},
    {"code": "RTM", "name": "Ratlam Junction", "zone": "WR", "division": "Ratlam", "platforms": 7, "lat": 23.3342, "lon": 75.0375, "congestion_base": 0.55},
    {"code": "KOTA", "name": "Kota Junction", "zone": "WCR", "division": "Kota", "platforms": 6, "lat": 25.2238, "lon": 75.8773, "congestion_base": 0.64},
    {"code": "SWM", "name": "Sawai Madhopur", "zone": "WCR", "division": "Kota", "platforms": 4, "lat": 26.0124, "lon": 76.3533, "congestion_base": 0.48},
    {"code": "MTJ", "name": "Mathura Junction", "zone": "NCR", "division": "Agra", "platforms": 10, "lat": 27.4924, "lon": 77.6737, "congestion_base": 0.76},
    {"code": "NDLS", "name": "New Delhi", "zone": "NR", "division": "Delhi", "platforms": 16, "lat": 28.6429, "lon": 77.2195, "congestion_base": 0.88},
    {"code": "NZM", "name": "Hazrat Nizamuddin", "zone": "NR", "division": "Delhi", "platforms": 9, "lat": 28.5888, "lon": 77.2534, "congestion_base": 0.75},

    # Eastern Trunk (Howrah - Delhi)
    {"code": "HWH", "name": "Howrah Junction", "zone": "ER", "division": "Howrah", "platforms": 23, "lat": 22.5838, "lon": 88.3426, "congestion_base": 0.90},
    {"code": "BWN", "name": "Barddhaman Junction", "zone": "ER", "division": "Howrah", "platforms": 8, "lat": 23.2393, "lon": 87.8634, "congestion_base": 0.58},
    {"code": "ASN", "name": "Asansol Junction", "zone": "ER", "division": "Asansol", "platforms": 7, "lat": 23.6841, "lon": 86.9644, "congestion_base": 0.62},
    {"code": "DHN", "name": "Dhanbad Junction", "zone": "ECR", "division": "Dhanbad", "platforms": 8, "lat": 23.7925, "lon": 86.4294, "congestion_base": 0.65},
    {"code": "GAYA", "name": "Gaya Junction", "zone": "ECR", "division": "Pt Deen Dayal Upadhyaya", "platforms": 9, "lat": 24.7955, "lon": 84.9994, "congestion_base": 0.60},
    {"code": "DDU", "name": "Pt. Deen Dayal Upadhyaya", "zone": "ECR", "division": "Pt Deen Dayal Upadhyaya", "platforms": 8, "lat": 25.2818, "lon": 83.1189, "congestion_base": 0.82},
    {"code": "PRYJ", "name": "Prayagraj Junction", "zone": "NCR", "division": "Prayagraj", "platforms": 10, "lat": 25.4484, "lon": 81.8333, "congestion_base": 0.74},
    {"code": "CNB", "name": "Kanpur Central", "zone": "NCR", "division": "Prayagraj", "platforms": 10, "lat": 26.4547, "lon": 80.3507, "congestion_base": 0.86},

    # Northern & Central Corridors
    {"code": "UMB", "name": "Ambala Cantt", "zone": "NR", "division": "Ambala", "platforms": 8, "lat": 30.3308, "lon": 76.8378, "congestion_base": 0.60},
    {"code": "LDH", "name": "Ludhiana Junction", "zone": "NR", "division": "Firozpur", "platforms": 7, "lat": 30.9080, "lon": 75.8573, "congestion_base": 0.62},
    {"code": "ASR", "name": "Amritsar Junction", "zone": "NR", "division": "Firozpur", "platforms": 8, "lat": 31.6340, "lon": 74.8723, "congestion_base": 0.65},
    {"code": "BSB", "name": "Varanasi Junction", "zone": "NER", "division": "Varanasi", "platforms": 9, "lat": 25.3283, "lon": 82.9866, "congestion_base": 0.76},
    {"code": "LKO", "name": "Lucknow Charbagh", "zone": "NR", "division": "Lucknow", "platforms": 9, "lat": 26.8322, "lon": 80.9221, "congestion_base": 0.80},
    {"code": "CSMT", "name": "Mumbai CSMT", "zone": "CR", "division": "Mumbai", "platforms": 18, "lat": 18.9401, "lon": 72.8354, "congestion_base": 0.89},
    {"code": "KYN", "name": "Kalyan Junction", "zone": "CR", "division": "Mumbai", "platforms": 8, "lat": 19.2354, "lon": 73.1299, "congestion_base": 0.84},
    {"code": "BSL", "name": "Bhusawal Junction", "zone": "CR", "division": "Bhusawal", "platforms": 8, "lat": 21.0455, "lon": 75.7885, "congestion_base": 0.66},
    {"code": "NGP", "name": "Nagpur Junction", "zone": "CR", "division": "Nagpur", "platforms": 8, "lat": 21.1524, "lon": 79.0888, "congestion_base": 0.70},
    {"code": "BPL", "name": "Bhopal Junction", "zone": "WCR", "division": "Bhopal", "platforms": 6, "lat": 23.2662, "lon": 77.4093, "congestion_base": 0.68},
    {"code": "GWL", "name": "Gwalior Junction", "zone": "NCR", "division": "Jhansi", "platforms": 5, "lat": 26.2124, "lon": 78.1772, "congestion_base": 0.58},
    {"code": "AGC", "name": "Agra Cantt", "zone": "NCR", "division": "Agra", "platforms": 6, "lat": 27.1593, "lon": 77.9943, "congestion_base": 0.72},

    # Southern Corridor
    {"code": "MAS", "name": "Chennai Central", "zone": "SR", "division": "Chennai", "platforms": 12, "lat": 13.0827, "lon": 80.2707, "congestion_base": 0.80},
    {"code": "KPD", "name": "Katpadi Junction", "zone": "SR", "division": "Chennai", "platforms": 5, "lat": 12.9716, "lon": 79.1388, "congestion_base": 0.56},
    {"code": "JTJ", "name": "Jolarpettai Junction", "zone": "SR", "division": "Salem", "platforms": 5, "lat": 12.5593, "lon": 78.5833, "congestion_base": 0.50},
    {"code": "SBC", "name": "KSR Bengaluru", "zone": "SWR", "division": "Bengaluru", "platforms": 10, "lat": 12.9784, "lon": 77.5684, "congestion_base": 0.82},
    {"code": "BWT", "name": "Bangarapet Junction", "zone": "SWR", "division": "Bengaluru", "platforms": 5, "lat": 12.9961, "lon": 78.1969, "congestion_base": 0.44},
    {"code": "ADI", "name": "Ahmedabad Junction", "zone": "WR", "division": "Ahmedabad", "platforms": 12, "lat": 23.0276, "lon": 72.6012, "congestion_base": 0.79}
]

ROUTES = [
    {
        "id": "R-WR-01",
        "name": "Western Trunk (Mumbai to Delhi)",
        "source": "MMCT",
        "destination": "NDLS",
        "distance_km": 1386,
        "station_sequence": ["MMCT", "BVI", "ST", "BRC", "RTM", "KOTA", "SWM", "MTJ", "NDLS"],
        "corridor_congestion": 0.74
    },
    {
        "id": "R-WR-02",
        "name": "Western Trunk (Delhi to Mumbai)",
        "source": "NDLS",
        "destination": "MMCT",
        "distance_km": 1386,
        "station_sequence": ["NDLS", "MTJ", "SWM", "KOTA", "RTM", "BRC", "ST", "BVI", "MMCT"],
        "corridor_congestion": 0.72
    },
    {
        "id": "R-ER-01",
        "name": "Eastern Trunk (Howrah to Delhi)",
        "source": "HWH",
        "destination": "NDLS",
        "distance_km": 1451,
        "station_sequence": ["HWH", "BWN", "ASN", "DHN", "GAYA", "DDU", "PRYJ", "CNB", "NDLS"],
        "corridor_congestion": 0.82
    },
    {
        "id": "R-SR-01",
        "name": "Southern Corridor (Chennai to Bengaluru)",
        "source": "MAS",
        "destination": "SBC",
        "distance_km": 362,
        "station_sequence": ["MAS", "KPD", "JTJ", "BWT", "SBC"],
        "corridor_congestion": 0.58
    },
    {
        "id": "R-NR-01",
        "name": "Northern Express Corridor (Delhi to Amritsar)",
        "source": "NDLS",
        "destination": "ASR",
        "distance_km": 448,
        "station_sequence": ["NDLS", "UMB", "LDH", "ASR"],
        "corridor_congestion": 0.63
    },
    {
        "id": "R-CR-01",
        "name": "Central Trunk (Mumbai to Delhi via Bhopal)",
        "source": "CSMT",
        "destination": "NZM",
        "distance_km": 1543,
        "station_sequence": ["CSMT", "KYN", "BSL", "NGP", "BPL", "GWL", "AGC", "NZM"],
        "corridor_congestion": 0.76
    }
]

TRAIN_TEMPLATES = [
    {"number": "12951", "name": "Mumbai Rajdhani Express", "type": "Rajdhani", "route_id": "R-WR-01", "priority": 1, "capacity": 1200, "coaches": 20, "base_dep": "17:00", "dep_station": "MMCT", "arr_station": "NDLS"},
    {"number": "12952", "name": "August Kranti Rajdhani", "type": "Rajdhani", "route_id": "R-WR-02", "priority": 1, "capacity": 1200, "coaches": 20, "base_dep": "16:55", "dep_station": "NDLS", "arr_station": "MMCT"},
    {"number": "12273", "name": "Howrah Duronto Express", "type": "Duronto", "route_id": "R-ER-01", "priority": 1, "capacity": 1150, "coaches": 18, "base_dep": "08:35", "dep_station": "HWH", "arr_station": "NDLS"},
    {"number": "12301", "name": "Kolkata Rajdhani Express", "type": "Rajdhani", "route_id": "R-ER-01", "priority": 1, "capacity": 1220, "coaches": 20, "base_dep": "16:50", "dep_station": "HWH", "arr_station": "NDLS"},
    {"number": "22436", "name": "Vande Bharat Express", "type": "Vande Bharat", "route_id": "R-ER-01", "priority": 1, "capacity": 1128, "coaches": 16, "base_dep": "06:00", "dep_station": "NDLS", "arr_station": "CNB"},
    {"number": "12009", "name": "Mumbai - Ahmedabad Shatabdi", "type": "Shatabdi", "route_id": "R-WR-01", "priority": 1, "capacity": 1100, "coaches": 16, "base_dep": "06:20", "dep_station": "MMCT", "arr_station": "BRC"},
    {"number": "12621", "name": "Tamil Nadu Express", "type": "Superfast", "route_id": "R-CR-01", "priority": 2, "capacity": 1480, "coaches": 24, "base_dep": "22:00", "dep_station": "CSMT", "arr_station": "NZM"},
    {"number": "12627", "name": "Karnataka Express", "type": "Superfast", "route_id": "R-SR-01", "priority": 2, "capacity": 1450, "coaches": 24, "base_dep": "19:20", "dep_station": "MAS", "arr_station": "SBC"},
    {"number": "12925", "name": "Paschim Express", "type": "Superfast", "route_id": "R-WR-01", "priority": 2, "capacity": 1400, "coaches": 24, "base_dep": "11:25", "dep_station": "MMCT", "arr_station": "NDLS"},
    {"number": "12137", "name": "Punjab Mail", "type": "Mail/Express", "route_id": "R-CR-01", "priority": 2, "capacity": 1520, "coaches": 24, "base_dep": "19:35", "dep_station": "CSMT", "arr_station": "NZM"},
    {"number": "12431", "name": "Trivandrum Rajdhani", "type": "Rajdhani", "route_id": "R-WR-01", "priority": 1, "capacity": 1180, "coaches": 20, "base_dep": "19:15", "dep_station": "MMCT", "arr_station": "NDLS"},
    {"number": "12801", "name": "Purushottam Express", "type": "Superfast", "route_id": "R-ER-01", "priority": 2, "capacity": 1420, "coaches": 22, "base_dep": "05:00", "dep_station": "HWH", "arr_station": "NDLS"},
    {"number": "20901", "name": "Vande Bharat Superfast", "type": "Vande Bharat", "route_id": "R-WR-01", "priority": 1, "capacity": 1128, "coaches": 16, "base_dep": "06:10", "dep_station": "MMCT", "arr_station": "ST"},
    {"number": "12555", "name": "Gorakhdham Express", "type": "Superfast", "route_id": "R-ER-01", "priority": 2, "capacity": 1390, "coaches": 22, "base_dep": "21:25", "dep_station": "CNB", "arr_station": "NDLS"},
    {"number": "12004", "name": "Lucknow Swarna Shatabdi", "type": "Shatabdi", "route_id": "R-ER-01", "priority": 1, "capacity": 1050, "coaches": 16, "base_dep": "06:10", "dep_station": "NDLS", "arr_station": "CNB"},
    {"number": "12459", "name": "New Delhi - Amritsar Intercity", "type": "Intercity", "route_id": "R-NR-01", "priority": 2, "capacity": 1250, "coaches": 18, "base_dep": "13:50", "dep_station": "NDLS", "arr_station": "ASR"}
]

def generate_schedule_for_train(train: Dict[str, Any], route: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate realistic station timetable for a train along its route sequence."""
    stations = route["station_sequence"]
    dep_hour, dep_min = map(int, train["base_dep"].split(":"))
    current_time = datetime(2026, 9, 4, dep_hour, dep_min)
    schedule = []
    
    cumulative_dist = 0
    total_km = route["distance_km"]
    step_km = total_km // (len(stations) - 1)

    for idx, st_code in enumerate(stations):
        is_origin = (idx == 0)
        is_term = (idx == len(stations) - 1)
        
        speed_factor = 95 if train["priority"] == 1 else 75
        
        if is_origin:
            arr_time_str = None
            dep_time_str = current_time.strftime("%H:%M")
            dwell_mins = 0
        else:
            travel_mins = int((step_km / speed_factor) * 60) + random.randint(-4, 6)
            travel_mins = max(20, travel_mins)
            arr_time = current_time + timedelta(minutes=travel_mins)
            arr_time_str = arr_time.strftime("%H:%M")
            
            dwell_mins = 0 if is_term else random.choice([2, 5, 8, 10, 15])
            dep_time = arr_time + timedelta(minutes=dwell_mins)
            dep_time_str = None if is_term else dep_time.strftime("%H:%M")
            current_time = dep_time
            cumulative_dist += step_km

        platform_num = random.randint(1, 6)

        schedule.append({
            "station_code": st_code,
            "station_name": next((s["name"] for s in STATIONS if s["code"] == st_code), st_code),
            "sequence": idx + 1,
            "distance_km": cumulative_dist,
            "scheduled_arrival": arr_time_str,
            "scheduled_departure": dep_time_str,
            "scheduled_dwell_min": dwell_mins,
            "platform": platform_num
        })
    return schedule

def generate_full_synthetic_data() -> Dict[str, Any]:
    """Generates the full relational synthetic railway dataset."""
    routes_map = {r["id"]: r for r in ROUTES}
    
    # 1. Enriched Trains with timetable
    trains_data = []
    for t in TRAIN_TEMPLATES:
        route = routes_map[t["route_id"]]
        sched = generate_schedule_for_train(t, route)
        train_entry = dict(t)
        train_entry["route_name"] = route["name"]
        train_entry["schedule"] = sched
        trains_data.append(train_entry)

    # 2. Historical Training Records (for ML pipelines: delay & demand)
    training_delay_records = []
    training_demand_records = []
    
    start_date = datetime(2026, 7, 20)
    for day_offset in range(45):
        run_date = start_date + timedelta(days=day_offset)
        dow = run_date.weekday()
        is_weekend = int(dow in [5, 6])
        month = run_date.month
        is_holiday = int(day_offset in [5, 12, 19, 26, 33, 40] or dow == 6)

        for train in trains_data:
            weather_rain_mm = round(max(0.0, random.gauss(8, 15)), 1)
            weather_fog_visibility_m = int(random.choice([800, 1200, 3000, 5000, 8000]))
            weather_severity = 0.0
            if weather_rain_mm > 25:
                weather_severity += 0.4
            if weather_fog_visibility_m < 1000:
                weather_severity += 0.5
            weather_severity = min(1.0, weather_severity)

            route_obj = routes_map[train["route_id"]]
            corridor_congestion = round(min(0.98, max(0.2, route_obj["corridor_congestion"] + random.gauss(0, 0.1))), 2)

            propagated_delay = 0
            for stop_idx, stop in enumerate(train["schedule"]):
                if stop_idx == 0:
                    propagated_delay = max(0, int(random.gauss(2, 4))) if random.random() > 0.6 else 0
                    continue
                
                station_dwell_delta = random.choice([0, 1, 2, 4, 8, -1]) if random.random() > 0.4 else 0
                congestion_impact = int(corridor_congestion * 15 * (random.random()))
                weather_impact = int(weather_severity * 20)
                
                priority_offset = -4 if train["priority"] == 1 else 3
                
                step_delay_delta = station_dwell_delta + congestion_impact + weather_impact + priority_offset + random.randint(-3, 5)
                propagated_delay = max(0, propagated_delay + step_delay_delta)
                
                is_severe = int(propagated_delay >= 30)
                is_cancelled = int(random.random() < 0.015 and weather_severity > 0.7)

                training_delay_records.append({
                    "train_number": train["number"],
                    "train_type": train["type"],
                    "priority": train["priority"],
                    "station_code": stop["station_code"],
                    "stop_sequence": stop["sequence"],
                    "distance_km": stop["distance_km"],
                    "day_of_week": dow,
                    "is_weekend": is_weekend,
                    "is_holiday": is_holiday,
                    "month": month,
                    "prev_station_delay_min": max(0, propagated_delay - step_delay_delta),
                    "route_congestion_index": corridor_congestion,
                    "weather_severity_index": weather_severity,
                    "rainfall_mm": weather_rain_mm,
                    "station_dwell_delta": station_dwell_delta,
                    "actual_delay_minutes": propagated_delay,
                    "is_severe_delay": is_severe,
                    "is_cancelled": is_cancelled
                })

            base_cap = train["capacity"]
            demand_multiplier = 1.0
            if is_holiday:
                demand_multiplier += 0.22
            if is_weekend:
                demand_multiplier += 0.12
            if train["type"] in ["Rajdhani", "Vande Bharat"]:
                demand_multiplier += 0.15
            
            actual_demand = int(base_cap * (demand_multiplier + random.gauss(0, 0.08)))
            occupancy_pct = round((actual_demand / base_cap) * 100, 1)

            training_demand_records.append({
                "train_number": train["number"],
                "route_id": train["route_id"],
                "date": run_date.strftime("%Y-%m-%d"),
                "day_of_week": dow,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "total_capacity": base_cap,
                "predicted_demand": actual_demand,
                "occupancy_rate": occupancy_pct,
                "class_1a": int(actual_demand * 0.08),
                "class_2a": int(actual_demand * 0.22),
                "class_3a": int(actual_demand * 0.45),
                "class_sl": int(actual_demand * 0.25)
            })

    # 3. Live Active Runs (Today - 2026-09-04)
    live_runs = []
    
    train_status_presets = [
        ("12951", 3, 47, "SEVERE DELAY", "HIGH", 118, 8),     # Vadodara -> Kota, +47m
        ("12952", 2, 8, "RUNNING LATE", "LOW", 92, 1),
        ("12273", 4, 32, "SEVERE DELAY", "HIGH", 112, 12),    # Gaya -> DDU, +32m
        ("12301", 1, 4, "ON TIME", "LOW", 98, 2),
        ("22436", 2, 0, "ON TIME", "LOW", 102, 0),
        ("12009", 2, 3, "ON TIME", "LOW", 88, 1),
        ("12621", 3, 65, "SEVERE DELAY", "CRITICAL", 124, 18),
        ("12627", 2, 15, "RUNNING LATE", "MEDIUM", 105, 4),
        ("12925", 4, 38, "SEVERE DELAY", "HIGH", 115, 9),
        ("12137", 3, 22, "RUNNING LATE", "MEDIUM", 96, 5),
        ("12431", 2, 11, "RUNNING LATE", "LOW", 94, 2),
        ("12801", 5, 54, "SEVERE DELAY", "CRITICAL", 121, 14),
        ("20901", 1, 0, "ON TIME", "LOW", 99, 0),
        ("12555", 2, 28, "RUNNING LATE", "HIGH", 108, 7),
        ("12004", 1, 2, "ON TIME", "LOW", 85, 1),
        ("12459", 1, 19, "RUNNING LATE", "MEDIUM", 97, 3),
    ]

    for preset in train_status_presets:
        t_num, cur_idx, cur_delay, status_str, risk_lvl, load_pct, cancel_p = preset
        tr = next((t for t in trains_data if t["number"] == t_num), None)
        if not tr:
            continue
        
        sched = tr["schedule"]
        cur_idx = min(cur_idx, len(sched) - 2)
        cur_stop = sched[cur_idx]
        next_stop = sched[cur_idx + 1]

        scheduled_arr = next_stop["scheduled_arrival"] or "18:42"
        sh, sm = map(int, scheduled_arr.split(":"))
        exp_dt = datetime(2026, 9, 4, sh, sm) + timedelta(minutes=cur_delay)
        exp_arr = exp_dt.strftime("%H:%M")

        run_id = f"RUN-20260904-{t_num}"
        live_runs.append({
            "run_id": run_id,
            "train_number": t_num,
            "train_name": tr["name"],
            "train_type": tr["type"],
            "route_id": tr["route_id"],
            "route_name": tr["route_name"],
            "origin_code": tr["dep_station"],
            "destination_code": tr["arr_station"],
            "current_station_code": cur_stop["station_code"],
            "current_station_name": cur_stop["station_name"],
            "next_station_code": next_stop["station_code"],
            "next_station_name": next_stop["station_name"],
            "scheduled_arrival": scheduled_arr,
            "expected_arrival": exp_arr,
            "delay_minutes": cur_delay,
            "severe_delay_probability": 82 if cur_delay >= 30 else (45 if cur_delay >= 15 else 12),
            "cancellation_probability": cancel_p,
            "passenger_load_pct": load_pct,
            "risk_level": risk_lvl,
            "status": status_str,
            "last_updated": "2026-09-04T10:45:00Z"
        })

    anomalies_list = [
        {
            "id": "ANM-20260904-01",
            "severity": "HIGH",
            "detected_time": "2026-09-04T10:14:22Z",
            "entity_type": "STATION",
            "entity_id": "KOTA",
            "entity_name": "Kota Junction",
            "metric": "Average Dwell Time",
            "expected_value": "6.2 min",
            "observed_value": "14.8 min",
            "deviation_pct": "+138.7%",
            "status": "OPEN",
            "details": "Platform 2 and 3 experiencing severe clearance lag due to freight crossing switch hold.",
            "operator_note": "Signaling engineer dispatched to investigate interlock."
        },
        {
            "id": "ANM-20260904-02",
            "severity": "CRITICAL",
            "detected_time": "2026-09-04T09:48:10Z",
            "entity_type": "ROUTE",
            "entity_id": "R-ER-01",
            "entity_name": "Eastern Trunk (DDU - PRYJ block)",
            "metric": "Route Congestion Index",
            "expected_value": "0.52",
            "observed_value": "0.94",
            "deviation_pct": "+80.8%",
            "status": "OPEN",
            "details": "Dense freight bunching around Chunar junction causing cascading delays to downstream express trains.",
            "operator_note": None
        },
        {
            "id": "ANM-20260904-03",
            "severity": "MEDIUM",
            "detected_time": "2026-09-04T08:30:00Z",
            "entity_type": "DEMAND",
            "entity_id": "12951",
            "entity_name": "12951 Mumbai Rajdhani",
            "metric": "3AC Waitlist Surge",
            "expected_value": "45 pax",
            "observed_value": "182 pax",
            "deviation_pct": "+304.4%",
            "status": "ACKNOWLEDGED",
            "details": "Sudden booking spike due to regional festival weekend and flight cancellation spillover.",
            "operator_note": "Capacity request CR-20260904-01 initiated."
        },
        {
            "id": "ANM-20260904-04",
            "severity": "HIGH",
            "detected_time": "2026-09-04T07:15:33Z",
            "entity_type": "TRAIN",
            "entity_id": "12621",
            "entity_name": "12621 Tamil Nadu Express",
            "metric": "Segment Delay Jump",
            "expected_value": "+12 min",
            "observed_value": "+65 min",
            "deviation_pct": "+441.7%",
            "status": "RESOLVED",
            "details": "Overhead traction wire fluctuation between Itarsi and Bhopal rectified.",
            "operator_note": "Power restored at 08:05, train moving with caution order."
        },
        {
            "id": "ANM-20260904-05",
            "severity": "LOW",
            "detected_time": "2026-09-04T06:40:11Z",
            "entity_type": "STATION",
            "entity_id": "CNB",
            "entity_name": "Kanpur Central",
            "metric": "Platform Turnaround Dwell",
            "expected_value": "10.0 min",
            "observed_value": "13.4 min",
            "deviation_pct": "+34.0%",
            "status": "OPEN",
            "details": "Catering and water replenishment bottleneck on platform 1.",
            "operator_note": None
        }
    ]

    capacity_requests_list = [
        {
            "id": "CR-20260904-01",
            "train_number": "12951",
            "train_name": "Mumbai Rajdhani Express",
            "route_name": "Mumbai Central → New Delhi",
            "travel_date": "2026-09-05",
            "current_capacity": 1200,
            "predicted_demand": 1420,
            "projected_occupancy_pct": 118.3,
            "recommended_coaches": 2,
            "coach_type": "3A (AC 3-Tier)",
            "reason": "Demand forecast exceeds operational capacity threshold (118.3%). High waitlist accumulation.",
            "priority": "HIGH",
            "status": "PENDING_APPROVAL",
            "created_by": "Chief Operations Controller",
            "created_at": "2026-09-04T09:15:00Z",
            "approver_notes": None
        },
        {
            "id": "CR-20260904-02",
            "train_number": "12273",
            "train_name": "Howrah Duronto Express",
            "route_name": "Howrah → New Delhi",
            "travel_date": "2026-09-05",
            "current_capacity": 1150,
            "predicted_demand": 1288,
            "projected_occupancy_pct": 112.0,
            "recommended_coaches": 2,
            "coach_type": "SL (Sleeper)",
            "reason": "Weekend passenger surge between Asansol and Kanpur. 112% projected load.",
            "priority": "MEDIUM",
            "status": "APPROVED",
            "created_by": "Eastern Zone Dispatch",
            "created_at": "2026-09-04T08:00:00Z",
            "approver_notes": "Approved additional coach augment from Howrah yard reserve."
        },
        {
            "id": "CR-20260904-03",
            "train_number": "12621",
            "train_name": "Tamil Nadu Express",
            "route_name": "Chennai Central → New Delhi",
            "travel_date": "2026-09-06",
            "current_capacity": 1480,
            "predicted_demand": 1835,
            "projected_occupancy_pct": 124.0,
            "recommended_coaches": 3,
            "coach_type": "3A + SL",
            "reason": "Severe overflow on trunk corridor connecting southern capitals to Delhi.",
            "priority": "HIGH",
            "status": "UNDER_REVIEW",
            "created_by": "Southern Command Desk",
            "created_at": "2026-09-04T09:40:00Z",
            "approver_notes": "Evaluating rake length limits (max 24 coaches allowed for platform fit)."
        }
    ]

    return {
        "stations": STATIONS,
        "routes": ROUTES,
        "trains": trains_data,
        "training_delays": training_delay_records,
        "training_demand": training_demand_records,
        "live_runs": live_runs,
        "anomalies": anomalies_list,
        "capacity_requests": capacity_requests_list
    }

if __name__ == "__main__":
    data = generate_full_synthetic_data()
    print(f"Generated {len(data['stations'])} stations, {len(data['routes'])} routes, {len(data['trains'])} trains")
    print(f"Generated {len(data['training_delays'])} delay training records, {len(data['training_demand'])} demand records")
    print(f"Generated {len(data['live_runs'])} active runs, {len(data['anomalies'])} anomalies")
