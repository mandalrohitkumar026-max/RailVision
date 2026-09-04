import React, { useState, useEffect } from "react";
import {
  Building2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Radio,
  Users
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { StationDetail } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

export const StationIntelligence: React.FC = () => {
  const [stationCode, setStationCode] = useState("NDLS");
  const [stationList, setStationList] = useState<any[]>([]);
  const [detail, setDetail] = useState<StationDetail | null>(null);
  const [boardType, setBoardType] = useState<"ARRIVALS" | "DEPARTURES">("ARRIVALS");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (stationCode) {
      loadStationDetails(stationCode);
    }
  }, [stationCode]);

  const loadStations = async () => {
    try {
      const list = await api.getStationsList();
      setStationList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStationDetails = async (code: string) => {
    setIsLoading(true);
    try {
      const data = await api.getStationDetail(code);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Station Selector Strip */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full md:w-80">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Station:</span>
          <select
            value={stationCode}
            onChange={(e) => setStationCode(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden focus:border-slate-500 font-semibold"
          >
            {stationList.map((st) => (
              <option key={st.code} value={st.code}>
                {st.code} &ndash; {st.name} ({st.zone})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          {["NDLS", "MMCT", "BRC", "KOTA", "CNB", "HWH", "MAS"].map((code) => (
            <button
              key={code}
              onClick={() => setStationCode(code)}
              className={`px-2.5 py-1 rounded font-mono text-xs border transition ${
                stationCode === code
                  ? "bg-slate-900 text-white border-slate-900 font-bold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {detail && (
        <>
          {/* Station Overview Banner */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                    {detail.code}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{detail.name}</h2>
                  <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Zone: {detail.zone} &middot; Division: {detail.division}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Platforms: {detail.platforms} &middot; Coordinates: [{detail.lat}, {detail.lon}]
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">PLATFORM CONGESTION</span>
                  <span
                    className={`font-bold text-sm ${
                      detail.congestion_index > 75 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {detail.congestion_index}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">DAILY PASSENGER VOLUME</span>
                  <span className="font-bold text-sm text-slate-900">
                    {detail.passenger_volume_today.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Average Train Delay
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-bold text-amber-600">
                  +{detail.average_delay_minutes}m
                </span>
                <span className="text-xs text-slate-400">avg arrival lag</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Observed Dwell Time
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-bold text-slate-900">
                  {detail.average_dwell_time_minutes}m
                </span>
                <span className="text-xs text-slate-400">(Sched: {detail.scheduled_dwell_time_minutes}m)</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Turnaround Variance
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span
                  className={`text-2xl font-bold ${
                    detail.average_dwell_time_minutes > detail.scheduled_dwell_time_minutes
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  +{roundDec(detail.average_dwell_time_minutes - detail.scheduled_dwell_time_minutes, 1)}m
                </span>
                <span className="text-xs text-slate-400">dwell delay</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Active Anomalies
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span
                  className={`text-2xl font-bold ${
                    detail.active_anomalies.length > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {detail.active_anomalies.length}
                </span>
                <span className="text-xs text-slate-400">station flags</span>
              </div>
            </div>
          </div>

          {/* Arrivals / Departures Schedule & Congestion Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Live Station Board (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800 font-mono uppercase tracking-wider">
                    Platform Schedule Board
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setBoardType("ARRIVALS")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      boardType === "ARRIVALS"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    Arrivals ({detail.current_arrivals.length})
                  </button>
                  <button
                    onClick={() => setBoardType("DEPARTURES")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      boardType === "DEPARTURES"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    Departures ({detail.current_departures.length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                      <th className="py-2 px-3">Train</th>
                      <th className="py-2 px-3">Scheduled</th>
                      <th className="py-2 px-3">Expected</th>
                      <th className="py-2 px-3 text-center">Platform</th>
                      <th className="py-2 px-3 text-center">Delay</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(boardType === "ARRIVALS" ? detail.current_arrivals : detail.current_departures).map(
                      (row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-slate-900">
                              {row.train_number}
                            </span>
                            <span className="text-slate-600 ml-2">{row.train_name}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {row.scheduled_time}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                            {row.expected_time}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-800">
                            P{row.platform}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold">
                            <span
                              className={
                                row.delay_minutes >= 30
                                  ? "text-rose-600"
                                  : row.delay_minutes > 5
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }
                            >
                              {row.delay_minutes > 0 ? `+${row.delay_minutes}m` : "On Time"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <StatusBadge type="status" value={row.status} />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hourly Congestion Forecast Chart (1 col) */}
            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <span className="font-semibold text-xs text-slate-800 font-mono uppercase tracking-wider block pb-2 border-b border-slate-200">
                Hourly Platform Congestion Forecast
              </span>
              <div className="h-72 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detail.hourly_congestion_forecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} unit="%" />
                    <Tooltip />
                    <Bar
                      dataKey="congestion_pct"
                      name="Congestion %"
                      fill="#0f172a"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function roundDec(val: number, dec: number): number {
  const p = Math.pow(10, dec);
  return Math.round(val * p) / p;
}
