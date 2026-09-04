import React, { useState, useEffect } from "react";
import {
  GitFork,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { RouteDetail } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

export const RouteCorridors: React.FC = () => {
  const [routeId, setRouteId] = useState("R-WR-01");
  const [routesList, setRoutesList] = useState<any[]>([]);
  const [detail, setDetail] = useState<RouteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (routeId) {
      loadRouteDetails(routeId);
    }
  }, [routeId]);

  const loadRoutes = async () => {
    try {
      const list = await api.getRoutesList();
      setRoutesList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRouteDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.getRouteDetail(id);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Route Corridor Selector */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full md:w-96">
          <GitFork className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Corridor:</span>
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold text-slate-800 focus:outline-hidden focus:border-slate-500"
          >
            {routesList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.distance_km} KM)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
          {routesList.map((r) => (
            <button
              key={r.id}
              onClick={() => setRouteId(r.id)}
              className={`px-2.5 py-1 rounded text-xs border transition ${
                routeId === r.id
                  ? "bg-slate-900 text-white border-slate-900 font-semibold"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      {detail && (
        <>
          {/* Corridor Overview Banner */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {detail.id}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{detail.name}</h2>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Trunk corridor connecting <span className="font-semibold">{detail.source_name}</span> &rarr;{" "}
                  <span className="font-semibold">{detail.destination_name}</span> &middot; {detail.distance_km} KM
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-mono block">Forecasted Risk</span>
                  <StatusBadge type="risk" value={detail.forecasted_risk} size="md" />
                </div>
              </div>
            </div>
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Corridor Congestion
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span
                  className={`text-2xl font-bold ${
                    detail.corridor_congestion > 75 ? "text-rose-600" : "text-slate-900"
                  }`}
                >
                  {detail.corridor_congestion}%
                </span>
                <Radio className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Active block density per 100km</p>
            </div>

            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Average Corridor Delay
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-bold text-amber-600">
                  +{detail.average_delay_minutes}m
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Weighted across all corridor trains</p>
            </div>

            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Active Corridor Trains
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-bold text-slate-900">
                  {detail.active_trains_count}
                </span>
                <span className="text-xs text-slate-500 font-sans">express &amp; superfast</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Occupying current block sections</p>
            </div>

            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Reliability Rating
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                <span className="text-2xl font-bold text-emerald-600">
                  {detail.reliability_index_pct}%
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Historical punctuality index</p>
            </div>
          </div>

          {/* Corridor Schematic Visualization */}
          <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
            <span className="font-semibold text-xs text-slate-800 font-mono uppercase tracking-wider block pb-2 border-b border-slate-200">
              Trunk Corridor Node Sequence ({detail.station_sequence.length} Stations)
            </span>

            <div className="flex items-center justify-between overflow-x-auto py-6 px-2 space-x-4">
              {detail.station_sequence.map((stCode, idx) => {
                const isTerm = idx === 0 || idx === detail.station_sequence.length - 1;
                const isHotspot = detail.hotspots.some((h) => h.station_code === stCode);

                return (
                  <React.Fragment key={stCode}>
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 ${
                          isHotspot
                            ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200"
                            : isTerm
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-400 text-slate-800"
                        }`}
                      >
                        {stCode}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 mt-1">
                        Node #{idx + 1}
                      </span>
                    </div>

                    {idx < detail.station_sequence.length - 1 && (
                      <div className="flex-1 min-w-10 h-0.5 bg-slate-300 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Delay Hotspots & Bottlenecks Table */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 font-mono uppercase tracking-wider">
                Corridor Bottlenecks &amp; High Delay Hotspots ({detail.hotspots.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Identified by automated congestion &amp; clearance lag analysis
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-3">Station Code</th>
                    <th className="py-2.5 px-3">Station Name</th>
                    <th className="py-2.5 px-3 text-center">Avg Delay</th>
                    <th className="py-2.5 px-3 text-center">Congestion Score</th>
                    <th className="py-2.5 px-3">Primary Operational Bottleneck Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {detail.hotspots.map((spot) => (
                    <tr key={spot.station_code} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {spot.station_code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {spot.station_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-center text-amber-600">
                        +{spot.average_delay_minutes}m
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-center text-rose-600">
                        {spot.congestion_score}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-mono text-[11px]">
                          {spot.risk_factor}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
