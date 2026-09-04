import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Layers,
  Calendar,
  AlertCircle,
  PlusCircle,
  Users,
  BarChart3,
  Percent
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DemandForecast } from "../types";
import { api } from "../services/api";

interface DemandForecastingProps {
  onOpenCapacityModal: (trainNum: string, date: string, coaches: number, reason: string) => void;
  allTrains: any[];
}

export const DemandForecasting: React.FC<DemandForecastingProps> = ({
  onOpenCapacityModal,
  allTrains
}) => {
  const [selectedTrain, setSelectedTrain] = useState("12951");
  const [selectedDate, setSelectedDate] = useState("2026-09-05");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [horizon, setHorizon] = useState(7);
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadForecast();
  }, [selectedTrain, selectedDate, selectedClass, horizon]);

  const loadForecast = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDemandForecast(selectedTrain, selectedDate, selectedClass, horizon);
      setForecast(data);
    } catch (err) {
      console.error("Failed to load demand forecast:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const pieColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

  const classPieData = forecast
    ? Object.entries(forecast.class_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-4">
      {/* Selector Controls Bar */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Select Train</label>
            <select
              value={selectedTrain}
              onChange={(e) => setSelectedTrain(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden focus:border-slate-500"
            >
              {allTrains.map((t) => (
                <option key={t.number} value={t.number}>
                  {t.number} - {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Travel Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Travel Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-hidden focus:border-slate-500"
            >
              <option value="ALL">All Classes (Whole Rake)</option>
              <option value="1A">1A (First AC)</option>
              <option value="2A">2A (2-Tier AC)</option>
              <option value="3A">3A (3-Tier AC)</option>
              <option value="SL">SL (Sleeper Class)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Forecast Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-hidden focus:border-slate-500"
            >
              <option value={3}>3 Days Horizon</option>
              <option value={7}>7 Days Horizon (Standard)</option>
              <option value={14}>14 Days Horizon (Extended)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadForecast}
              disabled={isLoading}
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition"
            >
              {isLoading ? "Forecasting..." : "Run Forecast"}
            </button>
          </div>
        </div>
      </div>

      {forecast && (
        <>
          {/* Capacity Recommendation Banner */}
          <div
            className={`p-4 rounded border flex flex-wrap items-center justify-between gap-4 ${
              forecast.recommendation_code === "ADD_COACHES"
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : forecast.recommendation_code === "REMOVE_COACHES"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-emerald-50 border-emerald-300 text-emerald-900"
            }`}
          >
            <div className="flex items-start space-x-3">
              <Layers className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm tracking-wider uppercase">
                    ML RECOMMENDATION: {forecast.recommendation}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/70 font-semibold border border-slate-200">
                    OPERATIONAL APPROVAL REQUIRED
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-700 leading-relaxed max-w-3xl">
                  {forecast.reason}
                </p>
              </div>
            </div>

            {forecast.recommendation_code === "ADD_COACHES" && (
              <button
                onClick={() =>
                  onOpenCapacityModal(
                    forecast.train_number,
                    forecast.target_date,
                    forecast.recommended_coach_count,
                    forecast.reason
                  )
                }
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs transition shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Create Capacity Request</span>
              </button>
            )}
          </div>

          {/* Forecast Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Predicted Demand
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {forecast.predicted_demand.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-semibold">passengers</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                95% CI: [{forecast.ci_lower} &ndash; {forecast.ci_upper}]
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Available Capacity
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {forecast.available_capacity.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-semibold">berths</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Current rake configuration baseline
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Projected Occupancy
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span
                  className={`text-3xl font-bold font-mono ${
                    forecast.expected_occupancy_pct > 110
                      ? "text-rose-600"
                      : forecast.expected_occupancy_pct > 100
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {forecast.expected_occupancy_pct}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Threshold: &gt;105% triggers coach alert
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Demand Delta
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span
                  className={`text-3xl font-bold font-mono ${
                    forecast.demand_growth_pct > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {forecast.demand_growth_pct > 0 ? `+${forecast.demand_growth_pct}%` : `${forecast.demand_growth_pct}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Weekend/holiday surge impact: +{forecast.holiday_impact_pct}%
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Historical vs Predicted Bookings Timeline (2 cols) */}
            <div className="lg:col-span-2 bg-white p-4 rounded border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800 font-mono uppercase tracking-wider">
                    Booking Trajectory &amp; 95% Confidence Interval Band
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Shaded: Upper &amp; Lower Confidence Bounds
                </span>
              </div>

              <div className="h-72 mt-4 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast.forecast_timeline}>
                    <defs>
                      <linearGradient id="ciBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        color: "#fff",
                        fontSize: 11
                      }}
                    />
                    <Legend />
                    {/* Capacity Line */}
                    <Area
                      type="monotone"
                      dataKey="capacity"
                      name="Rake Capacity"
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      fill="none"
                      strokeWidth={2}
                    />
                    {/* Confidence Interval Upper */}
                    <Area
                      type="monotone"
                      dataKey="upper_ci_95"
                      name="95% CI Upper"
                      stroke="#10b981"
                      strokeOpacity={0.4}
                      fill="url(#ciBand)"
                    />
                    {/* Predicted Demand */}
                    <Area
                      type="monotone"
                      dataKey="predicted_demand"
                      name="Forecast Demand"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      fill="none"
                    />
                    {/* Confidence Interval Lower */}
                    <Area
                      type="monotone"
                      dataKey="lower_ci_95"
                      name="95% CI Lower"
                      stroke="#10b981"
                      strokeOpacity={0.4}
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Class Breakdown & Seasonality (1 col) */}
            <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs space-y-4">
              <div>
                <span className="font-semibold text-xs text-slate-800 font-mono uppercase tracking-wider block pb-2 border-b border-slate-200">
                  Class-Wise Demand Distribution
                </span>
                <div className="h-44 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={classPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {classPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                  {classPieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-xs"
                        style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                      />
                      <span className="text-slate-600 truncate">{item.name}:</span>
                      <span className="font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Pattern */}
              <div className="pt-3 border-t border-slate-200">
                <span className="font-semibold text-xs text-slate-800 font-mono uppercase tracking-wider block pb-2">
                  Day-of-Week Demand Pattern
                </span>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast.weekly_pattern}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 9 }} hide />
                      <Tooltip />
                      <Bar dataKey="avg_demand" name="Avg Demand" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
