import React, { useState, useEffect } from "react";
import {
  Layers,
  PlusCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  Building,
  ArrowRight
} from "lucide-react";
import { CapacityPlanningSummary, CapacityRequestItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

interface CapacityPlanningProps {
  onOpenCreateModal: () => void;
}

export const CapacityPlanning: React.FC<CapacityPlanningProps> = ({
  onOpenCreateModal
}) => {
  const [summary, setSummary] = useState<CapacityPlanningSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCapacitySummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load capacity summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    reqId: string,
    status: string,
    notes: string
  ) => {
    try {
      await api.updateCapacityRequestStatus(reqId, status, notes);
      loadSummary();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredRequests = (summary?.requests || []).filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & New Request Button */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Rake Capacity Augmentation &amp; Marshalling Workflow
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational review board for ML-recommended coach additions before yard marshaling dispatch.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>New Capacity Request</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Overcapacity Trains (&gt;105%)
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {summary ? summary.total_critical_trains : "--"}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Immediate augmentation candidate</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Total Passenger Shortfall
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {summary ? summary.total_capacity_shortfall_pax.toLocaleString() : "--"}
            </span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Waitlisted passengers requiring berths</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Pending Zonal Approvals
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {summary ? summary.pending_approvals_count : "--"}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting dispatch authorization</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Approved Coach Augments
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              +{summary ? summary.approved_coach_augmentations : "--"} coaches
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Authorized for yard yard coupling</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-500 font-semibold uppercase text-[11px] mr-1">Status:</span>
        {["ALL", "PENDING_APPROVAL", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded font-medium transition ${
              statusFilter === st
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Capacity Requests Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">Train</th>
                <th className="py-2.5 px-3">Travel Date</th>
                <th className="py-2.5 px-3 text-center">Capacity vs Demand</th>
                <th className="py-2.5 px-3 text-center">Occupancy</th>
                <th className="py-2.5 px-3">Recommended Augment</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Reason / Justification</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Operator Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No capacity requests found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {req.id}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        by {req.created_by}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 font-mono">
                        {req.train_number}
                      </span>
                      <span className="block text-slate-600">{req.train_name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{req.travel_date}</td>
                    <td className="py-3 px-3 font-mono text-center">
                      <span className="text-slate-500">{req.current_capacity}</span>
                      <span className="mx-1 text-slate-400">&rarr;</span>
                      <span className="font-bold text-slate-900">{req.predicted_demand}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-center font-bold">
                      <span
                        className={
                          req.projected_occupancy_pct > 110
                            ? "text-rose-600"
                            : "text-amber-600"
                        }
                      >
                        {req.projected_occupancy_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-700 font-mono">
                      +{req.recommended_coaches}x {req.coach_type}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge type="severity" value={req.priority} />
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge type="capacity" value={req.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.status === "PENDING_APPROVAL" && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                req.id,
                                "APPROVED",
                                "Approved by Chief Controller. Rake yard notified."
                              )
                            }
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                req.id,
                                "REJECTED",
                                "Rejected due to platform length constraints."
                              )
                            }
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-semibold transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status === "APPROVED" && (
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                          Yard Dispatched
                        </span>
                      )}
                      {req.status === "UNDER_REVIEW" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(req.id, "APPROVED", "Rake inspection passed.")
                          }
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition"
                        >
                          Authorize
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
