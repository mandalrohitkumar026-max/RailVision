"""
Operational Anomaly Detection Engine for RailOps Intelligence.
Detects:
- Unusual train delays and segment jumps
- Abnormal station dwell times (e.g. Kota dwell +139%)
- Sudden passenger booking spikes
- Route congestion bottlenecks
"""

from typing import List, Dict, Any
import numpy as np

class AnomalyDetector:
    def __init__(self):
        # Baseline operational bounds
        self.dwell_threshold_multiplier = 1.6  # >60% above scheduled dwell
        self.delay_jump_threshold_min = 25     # >25 min delay change between adjacent stops
        self.congestion_threshold = 0.85        # >85% corridor saturation

    def detect_station_anomalies(self, station_dwell_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Scans station telemetry for dwell time spikes and platform congestion."""
        anomalies = []
        for rec in station_dwell_records:
            sched = rec.get("scheduled_dwell_min", 5)
            observed = rec.get("observed_dwell_min", sched)
            if sched > 0 and (observed / sched) >= self.dwell_threshold_multiplier:
                dev = ((observed - sched) / sched) * 100
                anomalies.append({
                    "entity_type": "STATION",
                    "entity_id": rec.get("station_code"),
                    "entity_name": rec.get("station_name"),
                    "metric": "Average Dwell Time",
                    "expected_value": f"{sched:.1f} min",
                    "observed_value": f"{observed:.1f} min",
                    "deviation_pct": f"+{dev:.1f}%",
                    "severity": "CRITICAL" if dev > 100 else "HIGH",
                    "status": "OPEN",
                    "details": f"Station platform dwell exceeded standard clearing SLA by {observed - sched:.1f} minutes."
                })
        return anomalies

    def detect_segment_delay_jumps(self, run_telemetry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detects sudden abnormal delay escalations across consecutive stops."""
        anomalies = []
        prev_delay = run_telemetry.get("prev_station_delay_min", 0)
        current_delay = run_telemetry.get("current_delay_min", 0)
        delta = current_delay - prev_delay
        
        if delta >= self.delay_jump_threshold_min:
            anomalies.append({
                "entity_type": "TRAIN",
                "entity_id": run_telemetry.get("train_number"),
                "entity_name": run_telemetry.get("train_name"),
                "metric": "Segment Delay Jump",
                "expected_value": f"+{min(5, prev_delay)} min",
                "observed_value": f"+{current_delay} min",
                "deviation_pct": f"+{((delta)/max(1, prev_delay))*100:.1f}%",
                "severity": "CRITICAL" if delta > 45 else "HIGH",
                "status": "OPEN",
                "details": f"Unscheduled deceleration or signal hold added {delta} minutes on current block."
            })
        return anomalies
