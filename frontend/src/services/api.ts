import {
  DashboardSummaryResponse,
  TrainDetail,
  DemandForecast,
  CapacityPlanningSummary,
  CapacityRequestItem,
  AnomalyItem,
  StationDetail,
  RouteDetail,
  MLModelCenterData,
  AuditLogItem
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[RailOps API] Fetch failed for ${url}, using simulated cache fallback:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardSummary: () => fetchJson<DashboardSummaryResponse>("/dashboard/summary"),

  // Trains
  getTrainsList: () => fetchJson<any[]>("/trains"),
  getTrainDetail: (trainNumber: string) => fetchJson<TrainDetail>(`/trains/${trainNumber}`),

  // Demand
  getDemandForecast: (
    trainNumber: string,
    travelDate: string,
    travelClass: string = "ALL",
    horizonDays: number = 7
  ) =>
    fetchJson<DemandForecast>(
      `/predictions/demand?train_number=${trainNumber}&travel_date=${travelDate}&travel_class=${travelClass}&horizon_days=${horizonDays}`
    ),

  // Capacity Planning
  getCapacitySummary: () => fetchJson<CapacityPlanningSummary>("/capacity/summary"),
  createCapacityRequest: (data: {
    train_number: string;
    travel_date: string;
    recommended_coaches: number;
    coach_type: string;
    reason: string;
    priority: string;
    operator_name?: string;
  }) =>
    fetchJson<CapacityRequestItem>("/capacity/requests", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  updateCapacityRequestStatus: (
    requestId: string,
    status: string,
    approverNotes?: string
  ) =>
    fetchJson<CapacityRequestItem>(`/capacity/requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, approver_notes: approverNotes })
    }),

  // Anomalies
  getAnomalies: (severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (severity && severity !== "ALL") params.append("severity", severity);
    if (status && status !== "ALL") params.append("status", status);
    const q = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<AnomalyItem[]>(`/anomalies${q}`);
  },
  takeAnomalyAction: (
    anomalyId: string,
    action: "ACKNOWLEDGE" | "RESOLVE" | "ADD_NOTE",
    operatorNote?: string
  ) =>
    fetchJson<AnomalyItem>(`/anomalies/${anomalyId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, operator_note: operatorNote })
    }),

  // Stations
  getStationsList: () => fetchJson<any[]>("/stations"),
  getStationDetail: (stationCode: string) => fetchJson<StationDetail>(`/stations/${stationCode}`),

  // Routes
  getRoutesList: () => fetchJson<any[]>("/routes"),
  getRouteDetail: (routeId: string) => fetchJson<RouteDetail>(`/routes/${routeId}`),

  // ML Models
  getMLModels: () => fetchJson<MLModelCenterData>("/models"),

  // Audit Logs
  getAuditLogs: (limit: number = 25) => fetchJson<AuditLogItem[]>(`/audit/logs?limit=${limit}`)
};
