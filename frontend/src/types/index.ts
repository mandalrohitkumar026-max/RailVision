export type OperationalStatus = "ON TIME" | "RUNNING LATE" | "SEVERE DELAY" | "CANCELLED" | "DIVERTED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnomalySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type AnomalyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type CapacityStatus = "PENDING_APPROVAL" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface DashboardKPIs {
  total_trains_today: number;
  trains_currently_running: number;
  ontime_percentage: number;
  average_delay_minutes: number;
  severe_delay_trains: number;
  cancellation_risk_count: number;
  passenger_demand_today: number;
  network_congestion_level: string;
  network_congestion_pct: number;
  timestamp: string;
}

export interface LiveOperationRow {
  train_number: string;
  train_name: string;
  train_type: string;
  route_name: string;
  current_station_code: string;
  current_station_name: string;
  next_station_code: string;
  next_station_name: string;
  scheduled_arrival: string;
  expected_arrival: string;
  delay_minutes: number;
  delay_formatted: string;
  delay_risk_pct: number;
  passenger_load_pct: number;
  risk_level: RiskLevel;
  status: OperationalStatus;
}

export interface DashboardSummaryResponse {
  kpis: DashboardKPIs;
  live_operations: LiveOperationRow[];
}

export interface TimelineStop {
  station_code: string;
  station_name: string;
  sequence: number;
  distance_km: number;
  scheduled_arrival: string | null;
  scheduled_departure: string | null;
  expected_arrival: string | null;
  expected_departure: string | null;
  scheduled_dwell_min: number;
  observed_dwell_min: number;
  delay_delta_min: number;
  platform: number;
  status: "PASSED" | "CURRENT" | "UPCOMING";
}

export interface PredictionFactor {
  factor: string;
  category: string;
  impact_minutes: string;
  value: string;
  importance_weight: number;
  description: string;
}

export interface TrainDetail {
  train_number: string;
  train_name: string;
  train_type: string;
  route_id: string;
  route_name: string;
  priority: number;
  capacity: number;
  coaches: number;
  dep_station: string;
  arr_station: string;
  operating_status: string;
  current_location: string;
  current_delay_minutes: number;
  expected_delay_minutes: number;
  severe_delay_probability: number;
  cancellation_probability: number;
  risk_level: RiskLevel;
  model_confidence_pct: number;
  model_version: string;
  prediction_time: string;
  timeline: TimelineStop[];
  prediction_factors: PredictionFactor[];
}

export interface BookingDataPoint {
  date: string;
  historical_actual: number | null;
  predicted_demand: number;
  lower_ci_95: number;
  upper_ci_95: number;
  capacity: number;
}

export interface DemandForecast {
  train_number: string;
  train_name: string;
  route_name: string;
  target_date: string;
  travel_class: string;
  predicted_demand: number;
  available_capacity: number;
  expected_occupancy_pct: number;
  demand_growth_pct: number;
  ci_lower: number;
  ci_upper: number;
  recommendation: string;
  recommendation_code: "ADD_COACHES" | "REMOVE_COACHES" | "OPTIMAL";
  recommended_coach_count: number;
  recommended_coach_type: string;
  operational_approval_required: boolean;
  reason: string;
  forecast_timeline: BookingDataPoint[];
  class_breakdown: Record<string, number>;
  weekly_pattern: { day: string; avg_demand: number }[];
  holiday_impact_pct: number;
}

export interface CapacityRequestItem {
  id: string;
  train_number: string;
  train_name: string;
  route_name: string;
  travel_date: string;
  current_capacity: number;
  predicted_demand: number;
  projected_occupancy_pct: number;
  recommended_coaches: number;
  coach_type: string;
  reason: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: CapacityStatus;
  created_by: string;
  created_at: string;
  approver_notes?: string | null;
}

export interface CapacityPlanningSummary {
  total_critical_trains: number;
  total_capacity_shortfall_pax: number;
  pending_approvals_count: number;
  approved_coach_augmentations: number;
  requests: CapacityRequestItem[];
}

export interface AnomalyItem {
  id: string;
  severity: AnomalySeverity;
  detected_time: string;
  entity_type: "STATION" | "ROUTE" | "TRAIN" | "DEMAND";
  entity_id: string;
  entity_name: string;
  metric: string;
  expected_value: string;
  observed_value: string;
  deviation_pct: string;
  status: AnomalyStatus;
  details?: string | null;
  operator_note?: string | null;
}

export interface StationBoardRow {
  train_number: string;
  train_name: string;
  scheduled_time: string;
  expected_time: string;
  platform: number;
  delay_minutes: number;
  status: string;
  direction: "ARRIVAL" | "DEPARTURE";
}

export interface StationDetail {
  code: string;
  name: string;
  zone: string;
  division: string;
  platforms: number;
  lat: number;
  lon: number;
  congestion_index: number;
  average_delay_minutes: number;
  average_dwell_time_minutes: number;
  scheduled_dwell_time_minutes: number;
  passenger_volume_today: number;
  current_arrivals: StationBoardRow[];
  current_departures: StationBoardRow[];
  hourly_congestion_forecast: { hour: string; congestion_pct: number; platform_occupancy: number }[];
  active_anomalies: AnomalyItem[];
}

export interface RouteHotspot {
  station_code: string;
  station_name: string;
  average_delay_minutes: number;
  congestion_score: number;
  risk_factor: string;
}

export interface RouteDetail {
  id: string;
  name: string;
  source_name: string;
  destination_name: string;
  distance_km: number;
  corridor_congestion: number;
  average_delay_minutes: number;
  active_trains_count: number;
  reliability_index_pct: number;
  forecasted_risk: "LOW" | "MEDIUM" | "HIGH";
  station_sequence: string[];
  hotspots: RouteHotspot[];
}

export interface ModelMetricCard {
  model_name: string;
  version: string;
  status: "Production" | "Staged" | "Inactive";
  algorithm: string;
  training_date: string;
  dataset_version: string;
  metrics: Record<string, any>;
  feature_importances?: Record<string, number>;
}

export interface MLModelCenterData {
  production_models: ModelMetricCard[];
  experiment_tracking_status: string;
  last_retrained: string;
  data_drift_status: string;
  system_latency_ms: number;
}

export interface AuditLogItem {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  user: string;
  details: string;
  timestamp: string;
}
