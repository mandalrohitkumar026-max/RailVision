import React, { useState, useEffect } from "react";
import { Activity, Clock, RefreshCw, Radio, AlertTriangle } from "lucide-react";
import { DashboardKPIs } from "../types";

interface TopRibbonProps {
  kpis?: DashboardKPIs | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const TopOperationalRibbon: React.FC<TopRibbonProps> = ({
  kpis,
  onRefresh,
  isRefreshing
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [istTime, setIstTime] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + " UTC");
      setIstTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false
        }) + " IST"
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ontime = kpis ? `${kpis.ontime_percentage}%` : "--%";
  const running = kpis ? kpis.trains_currently_running : "--";
  const avgDelay = kpis ? `${kpis.average_delay_minutes}m` : "--";
  const severe = kpis ? kpis.severe_delay_trains : 0;
  const congestion = kpis ? `${kpis.network_congestion_pct}%` : "--";

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between text-xs select-none">
      {/* Brand & Network Signal */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-4.5" />
          <span className="font-bold tracking-tight text-white font-mono text-sm">
            RAILOPS <span className="text-emerald-400">INTELLIGENCE</span>
          </span>
          <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider border border-slate-700">
            OCC COMMAND
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Network Status:</span>
          <span className="font-semibold text-emerald-400 font-mono">
            {kpis?.network_congestion_level === "NORMAL" ? "OPTIMAL" : "RESTRICTED FLOW"}
          </span>
        </div>
      </div>

      {/* Operational Telemetry Highlights */}
      <div className="hidden lg:flex items-center space-x-6 font-mono text-xs">
        <div>
          <span className="text-slate-400">RUNNING: </span>
          <span className="text-white font-semibold">{running}</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div>
          <span className="text-slate-400">ON-TIME: </span>
          <span className="text-emerald-400 font-semibold">{ontime}</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div>
          <span className="text-slate-400">AVG DELAY: </span>
          <span className="text-amber-400 font-semibold">{avgDelay}</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div className="flex items-center space-x-1">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-slate-400">SEVERE: </span>
          <span className="text-rose-400 font-semibold">{severe}</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div>
          <span className="text-slate-400">CONGESTION: </span>
          <span className="text-slate-200 font-semibold">{congestion}</span>
        </div>
      </div>

      {/* Synchronized Clocks & Refresh Control */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{istTime || "10:55:00 IST"}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{currentTime || "05:25:00 UTC"}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-2.5 py-1 rounded border border-slate-700 transition"
          title="Manual refresh operational feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
        </button>
      </div>
    </header>
  );
};
