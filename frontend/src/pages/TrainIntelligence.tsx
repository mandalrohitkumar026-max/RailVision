import React, { useState, useEffect } from "react";
import {
  Search,
  Train,
  AlertTriangle,
  Clock,
  Navigation,
  ShieldAlert,
  Cpu,
  Info,
  ChevronRight,
  Activity
} from "lucide-react";
import { TrainDetail } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

interface TrainIntelligenceProps {
  selectedTrainNumber: string;
  onSelectTrain: (trainNum: string) => void;
  allTrains: any[];
}

export const TrainIntelligence: React.FC<TrainIntelligenceProps> = ({
  selectedTrainNumber,
  onSelectTrain,
  allTrains
}) => {
  const [trainDetail, setTrainDetail] = useState<TrainDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(selectedTrainNumber || "12951");

  useEffect(() => {
    if (selectedTrainNumber) {
      loadTrainData(selectedTrainNumber);
      setSearchInput(selectedTrainNumber);
    }
  }, [selectedTrainNumber]);

  const loadTrainData = async (trainNum: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTrainDetail(trainNum);
      setTrainDetail(data);
    } catch (err: any) {
      setError(err.message || "Could not retrieve train intelligence.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectTrain(searchInput.trim());
      loadTrainData(searchInput.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Selector Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search train no. (e.g. 12951, 12273, 22436)..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-500 font-mono text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition"
          >
            Investigate
          </button>
        </form>

        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            Active Trunk:
          </span>
          {allTrains.slice(0, 5).map((t) => (
            <button
              key={t.number}
              onClick={() => {
                onSelectTrain(t.number);
                setSearchInput(t.number);
              }}
              className={`px-2 py-0.5 rounded font-mono text-xs border transition ${
                selectedTrainNumber === t.number
                  ? "bg-slate-800 text-white border-slate-800 font-bold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              {t.number} {t.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="bg-white p-12 rounded border border-slate-200 text-center text-slate-500 text-xs flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
          <span>Retrieving train telemetry and executing ML inference pipeline...</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {trainDetail && !isLoading && (
        <>
          {/* Train Header Banner */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {trainDetail.train_number}
                  </span>
                  <h1 className="text-base font-bold text-slate-900">
                    {trainDetail.train_name}
                  </h1>
                  <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {trainDetail.train_type} (Priority #{trainDetail.priority})
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 flex items-center space-x-2">
                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                  <span>Route: {trainDetail.route_name}</span>
                  <span className="text-slate-300">|</span>
                  <span>Origin: {trainDetail.dep_station} &rarr; Destination: {trainDetail.arr_station}</span>
                  <span className="text-slate-300">|</span>
                  <span>Capacity: {trainDetail.capacity} pax ({trainDetail.coaches} Coaches)</span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Current Status</p>
                  <div className="mt-0.5">
                    <StatusBadge type="status" value={trainDetail.operating_status} size="md" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Risk Assessment</p>
                  <div className="mt-0.5">
                    <StatusBadge type="risk" value={trainDetail.risk_level} size="md" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Operational Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500">Current Location: </span>
                <span className="font-semibold text-slate-900">{trainDetail.current_location}</span>
              </div>
              <div>
                <span className="text-slate-500">Recorded Delay: </span>
                <span
                  className={`font-mono font-bold ${
                    trainDetail.current_delay_minutes >= 30
                      ? "text-rose-600"
                      : trainDetail.current_delay_minutes > 5
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  +{trainDetail.current_delay_minutes} min
                </span>
              </div>
              <div>
                <span className="text-slate-500">Model Inference: </span>
                <span className="font-mono text-slate-800">{trainDetail.model_version} ({trainDetail.model_confidence_pct}% conf)</span>
              </div>
              <div>
                <span className="text-slate-500">Telemetry Timestamp: </span>
                <span className="font-mono text-slate-600">{trainDetail.prediction_time}</span>
              </div>
            </div>
          </div>

          {/* ML Delay Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="uppercase tracking-wider font-semibold">Expected Arrival Delay</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {trainDetail.expected_delay_minutes}
                </span>
                <span className="text-sm font-semibold text-slate-500">minutes</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Projected cumulative delay at final destination
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="uppercase tracking-wider font-semibold">Severe Delay Prob (&ge;30m)</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold font-mono text-rose-600">
                  {trainDetail.severe_delay_probability}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    trainDetail.severe_delay_probability > 70
                      ? "bg-rose-600"
                      : trainDetail.severe_delay_probability > 30
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, trainDetail.severe_delay_probability)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="uppercase tracking-wider font-semibold">Cancellation Probability</span>
                <ShieldAlert className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {trainDetail.cancellation_probability}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Weather adversity &amp; rake turn-around risk
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="uppercase tracking-wider font-semibold">Overall Risk Tier</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-1">
                <StatusBadge type="risk" value={trainDetail.risk_level} size="md" />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Model Confidence: <span className="font-semibold font-mono text-slate-800">{trainDetail.model_confidence_pct}%</span>
              </p>
            </div>
          </div>

          {/* Railway Timeline & Prediction Factors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Railway Station Timeline (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded border border-slate-200 shadow-2xs p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 font-mono uppercase tracking-wider">
                  Railway Corridor Timeline &middot; Scheduled &rarr; Predicted / Actual
                </span>
                <span className="text-[11px] text-slate-500">
                  {trainDetail.timeline.length} Scheduled Stations
                </span>
              </div>

              {/* Station sequence */}
              <div className="mt-4 space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {trainDetail.timeline.map((stop) => {
                  const isCurrent = stop.status === "CURRENT";
                  const isPassed = stop.status === "PASSED";

                  return (
                    <div
                      key={stop.station_code}
                      className={`relative flex items-start space-x-3 pl-8 text-xs p-2 rounded transition ${
                        isCurrent
                          ? "bg-emerald-50/70 border border-emerald-300"
                          : isPassed
                          ? "bg-slate-50/50"
                          : ""
                      }`}
                    >
                      {/* Bullet Icon */}
                      <div
                        className={`absolute left-2.5 top-3 w-3 h-3 rounded-full -translate-x-1/2 border-2 ${
                          isCurrent
                            ? "bg-emerald-500 border-emerald-200 ring-4 ring-emerald-100"
                            : isPassed
                            ? "bg-slate-400 border-white"
                            : "bg-white border-slate-400"
                        }`}
                      />

                      {/* Station Info */}
                      <div className="w-48 shrink-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{stop.station_name}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            ({stop.station_code})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          KM {stop.distance_km} &middot; Platform {stop.platform}
                        </div>
                      </div>

                      {/* Scheduled vs Expected */}
                      <div className="grid grid-cols-2 gap-4 flex-1 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Scheduled Arr / Dep</p>
                          <p className="font-mono text-slate-700">
                            {stop.scheduled_arrival || "--"} &rarr; {stop.scheduled_departure || "--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Expected / Actual</p>
                          <p className="font-mono font-semibold text-slate-900">
                            {stop.expected_arrival || "--"} &rarr; {stop.expected_departure || "--"}
                          </p>
                        </div>
                      </div>

                      {/* Delay Delta & Dwell */}
                      <div className="w-28 text-right shrink-0">
                        <span
                          className={`font-mono font-bold text-xs ${
                            stop.delay_delta_min >= 30
                              ? "text-rose-600"
                              : stop.delay_delta_min > 5
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {stop.delay_delta_min > 0 ? `+${stop.delay_delta_min} min` : "On Time"}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Dwell: {stop.observed_dwell_min}m (Sched: {stop.scheduled_dwell_min}m)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prediction Factor Explanations (1 col) */}
            <div className="bg-white rounded border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-200">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-xs text-slate-900 font-mono uppercase tracking-wider">
                    Model Feature Attributions
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px] text-slate-600 my-3 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <p>
                    Feature contributions represent ML model feature weights and SHAP attribution for this operational run, not fabricated causal certainty.
                  </p>
                </div>

                <div className="space-y-2.5 mt-2">
                  {trainDetail.prediction_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{factor.factor}</span>
                        <span className="font-mono font-bold text-rose-600">
                          {factor.impact_minutes}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{factor.description}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                        <span>Tele: {factor.value}</span>
                        <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                          Weight: {Math.round(factor.importance_weight * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
                Model: XGBoost v3.4 &middot; Offline Evaluated MAE: 3.56m
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
