import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  FileText,
  CheckCircle2,
  Database,
  Radio,
  Server,
  ExternalLink,
  Info
} from "lucide-react";
import { AuditLogItem } from "../types";
import { api } from "../services/api";

export const SettingsAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [userRole, setUserRole] = useState<"Operator" | "Analyst" | "Administrator">("Operator");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs(30);
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          System Configuration, RBAC &amp; Dispatcher Audit Trail
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enterprise operational parameters, microservice health, and immutable audit logs.
        </p>
      </div>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">FastAPI REST Core</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-mono text-xs text-emerald-600 font-bold">ONLINE &middot; v1.8.0</p>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1 mt-2"
          >
            <span>Swagger API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Database Engine</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-mono text-xs text-slate-800 font-bold">PostgreSQL / SQLite</p>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">Normalized Relational Tables</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Telemetry Cache</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-mono text-xs text-slate-800 font-bold">Redis / Memory Cache</p>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">TTL: 15-30s auto-refresh</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Observability Metrics</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-mono text-xs text-emerald-600 font-bold">Prometheus Active</p>
          <a
            href="http://localhost:8000/metrics"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1 mt-2"
          >
            <span>/metrics Prometheus Export</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Role-Based Access Control Simulation */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-slate-700" />
            <span className="font-semibold text-slate-800 uppercase font-mono tracking-wider">
              Operator Role Profile (RBAC)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {(["Operator", "Analyst", "Administrator"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setUserRole(r)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  userRole === r
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3 text-slate-600">
          <div className={`p-3 rounded border ${userRole === "Operator" ? "bg-emerald-50/50 border-emerald-300" : "bg-slate-50 border-slate-200"}`}>
            <p className="font-bold text-slate-900 mb-1">Operator Profile</p>
            <p className="text-[11px] leading-relaxed">
              Full access to Live Operations Overview, Train Timelines, Demand Forecasts, and Capacity Request Initiation.
            </p>
          </div>
          <div className={`p-3 rounded border ${userRole === "Analyst" ? "bg-emerald-50/50 border-emerald-300" : "bg-slate-50 border-slate-200"}`}>
            <p className="font-bold text-slate-900 mb-1">Analyst Profile</p>
            <p className="text-[11px] leading-relaxed">
              Access to Historical Route Hotspots, Passenger Seasonality patterns, Station Turnaround Dwell analytics.
            </p>
          </div>
          <div className={`p-3 rounded border ${userRole === "Administrator" ? "bg-emerald-50/50 border-emerald-300" : "bg-slate-50 border-slate-200"}`}>
            <p className="font-bold text-slate-900 mb-1">Administrator Profile</p>
            <p className="text-[11px] leading-relaxed">
              ML Model Registry governance, Production model staging, Retraining trigger authorization, System audit controls.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-800 font-mono uppercase tracking-wider">
              Operational Audit Trail ({logs.length} logged events)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Recorded in PostgreSQL/SQLite audit table
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Entity ID</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Operational Details</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No audit records retrieved yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-700">#{log.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{log.action}</td>
                    <td className="py-2 px-3 text-slate-500">{log.entity_type}</td>
                    <td className="py-2 px-3 text-slate-700 font-bold">{log.entity_id}</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">{log.user}</td>
                    <td className="py-2 px-3 text-slate-700 font-sans max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {log.timestamp.slice(0, 19).replace("T", " ")}
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
