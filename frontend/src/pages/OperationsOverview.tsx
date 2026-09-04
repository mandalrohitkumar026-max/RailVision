import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  Users,
  Train,
  ShieldAlert,
  ChevronRight,
  Radio
} from "lucide-react";
import { DashboardKPIs, LiveOperationRow } from "../types";
import { StatusBadge } from "../components/StatusBadge";

interface OperationsOverviewProps {
  kpis: DashboardKPIs | null;
  liveOperations: LiveOperationRow[];
  onSelectTrain: (trainNumber: string) => void;
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({
  kpis,
  liveOperations,
  onSelectTrain
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SEVERE" | "HIGH_RISK" | "OVERCAPACITY">("ALL");
  const [sortField, setSortField] = useState<keyof LiveOperationRow>("delay_minutes");
  const [sortAsc, setSortAsc] = useState(false);

  // Filter & Search
  const filteredRows = useMemo(() => {
    return liveOperations.filter((row) => {
      const matchSearch =
        row.train_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.train_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.current_station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.next_station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.route_name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterType === "SEVERE") {
        return row.delay_minutes >= 30;
      }
      if (filterType === "HIGH_RISK") {
        return row.risk_level === "HIGH" || row.risk_level === "CRITICAL";
      }
      if (filterType === "OVERCAPACITY") {
        return row.passenger_load_pct > 105;
      }
      return true;
    });
  }, [liveOperations, searchTerm, filterType]);

  // Sort
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredRows, sortField, sortAsc]);

  const handleSort = (field: keyof LiveOperationRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Total Trains
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {kpis ? kpis.total_trains_today : "--"}
            </span>
            <Train className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Trunk timetables</p>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Running Now
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-emerald-600">
              {kpis ? kpis.trains_currently_running : "--"}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Active block telemetry</p>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            On-Time %
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {kpis ? `${kpis.ontime_percentage}%` : "--%"}
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">&le; 5 min deviation</p>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Avg Delay
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-600">
              {kpis ? `+${kpis.average_delay_minutes}m` : "--"}
            </span>
            <span className="text-[10px] font-mono text-amber-500 font-bold">AVG</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across active lines</p>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Severe Delays
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-rose-600">
              {kpis ? kpis.severe_delay_trains : "--"}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">&ge; 30 min threshold</p>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Cancel Risk
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-orange-600">
              {kpis ? kpis.cancellation_risk_count : "--"}
            </span>
            <ShieldAlert className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Prob &gt; 10%</p>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Passenger Load
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono text-slate-900">
              {kpis ? kpis.passenger_demand_today.toLocaleString() : "--"}
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Projected passengers</p>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Congestion
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              {kpis ? `${kpis.network_congestion_pct}%` : "--%"}
            </span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {kpis?.network_congestion_level || "NORMAL"}
          </p>
        </div>
      </div>

      {/* Control Ribbon: Search & Quick Filters */}
      <div className="bg-white p-3 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full md:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search train no., name, station, route..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-500 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterType === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Trains ({liveOperations.length})
          </button>
          <button
            onClick={() => setFilterType("SEVERE")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterType === "SEVERE"
                ? "bg-rose-700 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            Severe Delays (&ge;30m)
          </button>
          <button
            onClick={() => setFilterType("HIGH_RISK")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterType === "HIGH_RISK"
                ? "bg-orange-600 text-white"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            }`}
          >
            High Risk Trains
          </button>
          <button
            onClick={() => setFilterType("OVERCAPACITY")}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterType === "OVERCAPACITY"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            Overcapacity (&gt;105%)
          </button>
        </div>
      </div>

      {/* Live Operations Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800 font-mono uppercase tracking-wider">
            Live Network Operations Feed ({sortedRows.length} active trains)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Click any train row to open Train Intelligence
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort("train_number")}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Train No.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("train_name")}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center space-x-1">
                    <span>Train Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2 px-3">Route Corridor</th>
                <th className="py-2 px-3">Current Station</th>
                <th className="py-2 px-3">Next Station</th>
                <th className="py-2 px-3 text-center">Sched Arr</th>
                <th className="py-2 px-3 text-center">Exp Arr</th>
                <th
                  onClick={() => handleSort("delay_minutes")}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Delay</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("delay_risk_pct")}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Delay Risk</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("passenger_load_pct")}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Load</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2 px-3 text-center">Operational Status</th>
                <th className="py-2 px-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    No trains matched the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => {
                  const isSevere = row.delay_minutes >= 30;
                  const isHighRisk = row.risk_level === "HIGH" || row.risk_level === "CRITICAL";

                  return (
                    <tr
                      key={row.train_number}
                      onClick={() => onSelectTrain(row.train_number)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition ${
                        isSevere ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {row.train_number}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{row.train_name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {row.train_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                        {row.route_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">
                          {row.current_station_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 ml-1">
                          ({row.current_station_code})
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-700">{row.next_station_name}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-1">
                          ({row.next_station_code})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center text-slate-600">
                        {row.scheduled_arrival}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center font-semibold text-slate-800">
                        {row.expected_arrival}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center font-bold">
                        <span
                          className={
                            row.delay_minutes >= 30
                              ? "text-rose-600 font-bold"
                              : row.delay_minutes > 5
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }
                        >
                          {row.delay_formatted}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            row.delay_risk_pct >= 70
                              ? "bg-rose-100 text-rose-800"
                              : row.delay_risk_pct >= 35
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {Math.round(row.delay_risk_pct)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-center">
                        <span
                          className={`font-semibold ${
                            row.passenger_load_pct > 110
                              ? "text-rose-600 font-bold"
                              : row.passenger_load_pct > 100
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {row.passenger_load_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge type="status" value={row.status} />
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
