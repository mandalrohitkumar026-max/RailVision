import React from "react";
import {
  LayoutDashboard,
  Train,
  TrendingUp,
  Layers,
  AlertOctagon,
  Building2,
  GitFork,
  Cpu,
  Settings,
  ShieldAlert
} from "lucide-react";

export type NavTab =
  | "overview"
  | "trains"
  | "demand"
  | "capacity"
  | "anomalies"
  | "stations"
  | "routes"
  | "models"
  | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openAnomaliesCount: number;
  severeDelaysCount: number;
  pendingCapacityCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openAnomaliesCount,
  severeDelaysCount,
  pendingCapacityCount
}) => {
  const navItems = [
    {
      id: "overview" as NavTab,
      label: "Operations Overview",
      icon: LayoutDashboard,
      badge: severeDelaysCount > 0 ? `${severeDelaysCount}` : undefined,
      badgeColor: "bg-rose-600 text-white"
    },
    {
      id: "trains" as NavTab,
      label: "Train Intelligence",
      icon: Train
    },
    {
      id: "demand" as NavTab,
      label: "Demand Forecasting",
      icon: TrendingUp
    },
    {
      id: "capacity" as NavTab,
      label: "Capacity Planning",
      icon: Layers,
      badge: pendingCapacityCount > 0 ? `${pendingCapacityCount}` : undefined,
      badgeColor: "bg-amber-600 text-white"
    },
    {
      id: "anomalies" as NavTab,
      label: "Anomaly Center",
      icon: AlertOctagon,
      badge: openAnomaliesCount > 0 ? `${openAnomaliesCount}` : undefined,
      badgeColor: "bg-rose-600 text-white"
    },
    {
      id: "stations" as NavTab,
      label: "Station Intelligence",
      icon: Building2
    },
    {
      id: "routes" as NavTab,
      label: "Route Corridors",
      icon: GitFork
    },
    {
      id: "models" as NavTab,
      label: "ML Model Center",
      icon: Cpu
    },
    {
      id: "settings" as NavTab,
      label: "Settings & Audit",
      icon: Settings
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Navigation Section */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Operations Control
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition ${
                isActive
                  ? "bg-slate-800 text-emerald-400 font-semibold border border-slate-700 shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Operator Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="truncate">
            <p className="text-white font-medium truncate">Chief Controller #1</p>
            <p className="text-[10px] text-slate-400 font-mono">ROLE: OPERATOR</p>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 font-mono">
          System Build: v1.8-PROD
        </div>
      </div>
    </aside>
  );
};
