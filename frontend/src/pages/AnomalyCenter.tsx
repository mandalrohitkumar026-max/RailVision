import React, { useState, useEffect } from "react";
import {
  AlertOctagon,
  Search,
  CheckCircle,
  Eye,
  MessageSquare,
  Radio,
  Clock,
  Activity
} from "lucide-react";
import { AnomalyItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

interface AnomalyCenterProps {
  onInvestigate: (anomaly: AnomalyItem) => void;
}

export const AnomalyCenter: React.FC<AnomalyCenterProps> = ({ onInvestigate }) => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadAnomalies();
  }, [severityFilter, statusFilter]);

  const loadAnomalies = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnomalies(severityFilter, statusFilter);
      setAnomalies(data);
    } catch (err) {
      console.error("Failed to load anomalies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAcknowledge = async (id: string) => {
    try {
      await api.takeAnomalyAction(id, "ACKNOWLEDGE", "Acknowledged via quick operations feed");
      loadAnomalies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickResolve = async (id: string) => {
    try {
      await api.takeAnomalyAction(id, "RESOLVE", "Resolved by active controller");
      loadAnomalies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Header */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Operational Anomaly &amp; Disruption Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time statistical &amp; isolation forest detection for dwell deviations, congestion bunching, and booking spikes.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-semibold uppercase text-[11px]">Severity:</span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded font-medium transition ${
                severityFilter === sev
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {anomalies.length === 0 ? (
          <div className="bg-white p-12 text-center rounded border border-slate-200 text-slate-500 text-xs">
            No active anomalies matching filter criteria. Operational flow optimal.
          </div>
        ) : (
          anomalies.map((anm) => {
            const isCritical = anm.severity === "CRITICAL";
            const isOpen = anm.status === "OPEN";

            return (
              <div
                key={anm.id}
                className={`bg-white rounded border transition p-4 shadow-2xs ${
                  isCritical ? "border-l-4 border-l-rose-600 border-slate-200" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Entity & Status */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {anm.id}
                      </span>
                      <StatusBadge type="severity" value={anm.severity} />
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {anm.entity_type}: {anm.entity_id}
                      </span>
                      <StatusBadge type="status" value={anm.status} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {anm.entity_name} &middot; <span className="text-slate-600 font-normal">{anm.metric}</span>
                    </h3>
                  </div>

                  {/* Deviation Metrics */}
                  <div className="flex items-center space-x-6 bg-slate-50 px-4 py-2 rounded border border-slate-200 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">EXPECTED</span>
                      <span className="font-semibold text-slate-700">{anm.expected_value}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">OBSERVED</span>
                      <span className="font-bold text-slate-900">{anm.observed_value}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">DEVIATION</span>
                      <span className="font-bold text-rose-600">{anm.deviation_pct}</span>
                    </div>
                  </div>
                </div>

                {/* Details description */}
                <p className="text-xs text-slate-700 mt-3 bg-slate-50/60 p-2.5 rounded border border-slate-100 leading-relaxed">
                  {anm.details}
                </p>

                {/* Operator Note if available */}
                {anm.operator_note && (
                  <div className="mt-2 text-xs flex items-center space-x-2 text-slate-600 bg-amber-50/70 px-3 py-1.5 rounded border border-amber-200 font-mono">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Operator Log: {anm.operator_note}</span>
                  </div>
                )}

                {/* Footer and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Detected: {anm.detected_time}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onInvestigate(anm)}
                      className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Investigate &amp; Note</span>
                    </button>
                    {isOpen && (
                      <button
                        onClick={() => handleQuickAcknowledge(anm.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold transition"
                      >
                        Acknowledge
                      </button>
                    )}
                    {anm.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleQuickResolve(anm.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold transition"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
