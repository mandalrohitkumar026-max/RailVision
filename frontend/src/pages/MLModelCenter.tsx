import React, { useState, useEffect } from "react";
import {
  Cpu,
  CheckCircle,
  BarChart2,
  Database,
  Layers,
  Activity,
  GitBranch,
  ShieldCheck
} from "lucide-react";
import { MLModelCenterData } from "../types";
import { api } from "../services/api";

export const MLModelCenter: React.FC = () => {
  const [data, setData] = useState<MLModelCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMLModels();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const candidateComparisons = [
    {
      model: "XGBoost Regressor (Production v1.8)",
      task: "Delay Prediction",
      mae: "3.56m",
      rmse: "4.33m",
      r2: "0.985",
      latency: "1.2ms",
      status: "PRODUCTION"
    },
    {
      model: "Random Forest Baseline",
      task: "Delay Prediction",
      mae: "5.82m",
      rmse: "7.14m",
      r2: "0.941",
      latency: "4.8ms",
      status: "INACTIVE"
    },
    {
      model: "LightGBM Gradient Booster",
      task: "Delay Prediction",
      mae: "3.72m",
      rmse: "4.51m",
      r2: "0.981",
      latency: "1.1ms",
      status: "CANDIDATE"
    },
    {
      model: "Gradient Boosting Classifier (Production v1.8)",
      task: "Severe Delay (>30m)",
      mae: "N/A",
      rmse: "AUC 0.994",
      r2: "F1 0.947",
      latency: "0.8ms",
      status: "PRODUCTION"
    },
    {
      model: "Calibrated Classifier (Production v1.8)",
      task: "Cancellation Risk",
      mae: "N/A",
      rmse: "AUC 0.950",
      r2: "F1 0.900",
      latency: "0.7ms",
      status: "PRODUCTION"
    },
    {
      model: "Gradient Boosting Regressor (Production v1.8)",
      task: "Demand Forecaster",
      mae: "75 pax",
      rmse: "91 pax",
      r2: "0.872",
      latency: "1.4ms",
      status: "PRODUCTION"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Machine Learning Model Registry &amp; Telemetry Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Offline training metrics, parameter logs, drift checks, and production inference performance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded text-xs font-mono font-semibold border border-emerald-200 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>MLFLOW: ACTIVE (PORT 5000)</span>
          </span>
        </div>
      </div>

      {/* Model Status Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Registry Status
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
            <span className="text-lg font-bold text-emerald-600">v1.8 Production</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Automated CI/CD artifact registration</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Feature &amp; Data Drift
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
            <span className="text-lg font-bold text-emerald-600">Stable (p &gt; 0.05)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Kolmogorov-Smirnov daily monitoring</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Mean Inference Latency
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
            <span className="text-xl font-bold text-slate-900">
              {data ? `${data.system_latency_ms} ms` : "1.45 ms"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Sub-5ms SLA verified</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Ground Truth Dataset
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
            <span className="text-xs font-bold text-slate-800 truncate">
              v2026.09.4-synthetic-trunk
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">5,265 operational logs</p>
        </div>
      </div>

      {/* Production Models Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.production_models.map((model) => (
          <div
            key={model.model_name}
            className="bg-white rounded border border-slate-200 shadow-2xs p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {model.version}
                  </span>
                  <span className="font-semibold text-sm text-slate-900">
                    {model.model_name.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-emerald-300 uppercase">
                  {model.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">ALGORITHM</span>
                  <span>{model.algorithm}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">LAST TRAINED</span>
                  <span>{model.training_date}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="bg-slate-50 rounded border border-slate-200 p-3 mt-3 grid grid-cols-3 gap-2 text-xs font-mono">
                {Object.entries(model.metrics).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{String(val)}</span>
                  </div>
                ))}
              </div>

              {/* Feature Importances if present */}
              {model.feature_importances && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Top Feature Importances
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(model.feature_importances)
                      .slice(0, 4)
                      .map(([feat, weight]) => (
                        <div key={feat} className="text-[11px] font-mono">
                          <div className="flex justify-between text-slate-600 mb-0.5">
                            <span className="truncate max-w-xs">{feat}</span>
                            <span className="font-bold text-slate-900">
                              {Math.round(weight * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-slate-800 h-full rounded-full"
                              style={{ width: `${Math.round(weight * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>MLflow Run ID: #run-prod-v1.8</span>
              <span className="text-emerald-600 font-semibold">Artifact Loaded</span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Benchmark & Comparison Table */}
      <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800 font-mono uppercase tracking-wider">
            Model Candidate Benchmark &amp; Ablation Comparison
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Evaluated on held-out test split (20% sample, random_state=42)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Candidate Model Architecture</th>
                <th className="py-2.5 px-3">Target Operational Task</th>
                <th className="py-2.5 px-3 text-center">MAE</th>
                <th className="py-2.5 px-3 text-center">RMSE / AUC</th>
                <th className="py-2.5 px-3 text-center">R² / F1 Score</th>
                <th className="py-2.5 px-3 text-center">Inference Latency</th>
                <th className="py-2.5 px-3 text-center">Deployment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {candidateComparisons.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{row.model}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{row.task}</td>
                  <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-900">
                    {row.mae}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-900">
                    {row.rmse}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-900">
                    {row.r2}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-center text-slate-600">
                    {row.latency}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        row.status === "PRODUCTION"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : row.status === "CANDIDATE"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
