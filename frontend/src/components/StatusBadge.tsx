import React from "react";
import { OperationalStatus, RiskLevel, AnomalySeverity, CapacityStatus } from "../types";

interface StatusBadgeProps {
  type: "status" | "risk" | "severity" | "capacity";
  value: OperationalStatus | RiskLevel | AnomalySeverity | CapacityStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = "sm" }) => {
  const val = (value || "").toUpperCase();

  let bg = "bg-slate-100 text-slate-700 border-slate-200";

  if (type === "status") {
    if (val === "ON TIME") bg = "bg-emerald-50 text-emerald-700 border-emerald-300";
    else if (val === "RUNNING LATE") bg = "bg-amber-50 text-amber-700 border-amber-300";
    else if (val === "SEVERE DELAY") bg = "bg-rose-50 text-rose-700 border-rose-300";
    else if (val === "CANCELLED") bg = "bg-red-100 text-red-800 border-red-400";
  } else if (type === "risk" || type === "severity") {
    if (val === "LOW") bg = "bg-emerald-50 text-emerald-700 border-emerald-300";
    else if (val === "MEDIUM") bg = "bg-amber-50 text-amber-700 border-amber-300";
    else if (val === "HIGH") bg = "bg-orange-50 text-orange-700 border-orange-300";
    else if (val === "CRITICAL") bg = "bg-rose-100 text-rose-800 border-rose-400 font-semibold";
  } else if (type === "capacity") {
    if (val === "APPROVED") bg = "bg-emerald-50 text-emerald-700 border-emerald-300";
    else if (val === "PENDING_APPROVAL") bg = "bg-amber-50 text-amber-700 border-amber-300";
    else if (val === "UNDER_REVIEW") bg = "bg-blue-50 text-blue-700 border-blue-300";
    else if (val === "REJECTED") bg = "bg-rose-50 text-rose-700 border-rose-300";
  }

  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center font-mono uppercase tracking-wider rounded border ${bg} ${px}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          val === "CRITICAL" || val === "SEVERE DELAY"
            ? "bg-rose-600 animate-pulse"
            : val === "HIGH" || val === "RUNNING LATE" || val === "PENDING_APPROVAL"
            ? "bg-amber-500"
            : val === "ON TIME" || val === "LOW" || val === "APPROVED"
            ? "bg-emerald-500"
            : "bg-blue-500"
        }`}
      />
      {value.replace(/_/g, " ")}
    </span>
  );
};
