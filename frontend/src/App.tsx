import React, { useState, useEffect } from "react";
import { TopOperationalRibbon } from "./components/TopOperationalRibbon";
import { Sidebar, NavTab } from "./components/Sidebar";
import { OperationsOverview } from "./pages/OperationsOverview";
import { TrainIntelligence } from "./pages/TrainIntelligence";
import { DemandForecasting } from "./pages/DemandForecasting";
import { CapacityPlanning } from "./pages/CapacityPlanning";
import { AnomalyCenter } from "./pages/AnomalyCenter";
import { StationIntelligence } from "./pages/StationIntelligence";
import { RouteCorridors } from "./pages/RouteCorridors";
import { MLModelCenter } from "./pages/MLModelCenter";
import { SettingsAudit } from "./pages/SettingsAudit";
import { CapacityRequestModal } from "./components/CapacityRequestModal";
import { AnomalyActionModal } from "./components/AnomalyActionModal";

import {
  DashboardSummaryResponse,
  DashboardKPIs,
  LiveOperationRow,
  AnomalyItem
} from "./types";
import { api } from "./services/api";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [allTrains, setAllTrains] = useState<any[]>([]);
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string>("12951");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [capacityModalInitData, setCapacityModalInitData] = useState({
    train_number: "12951",
    travel_date: "2026-09-05",
    coaches: 2,
    reason: "Demand forecast exceeds operational capacity threshold (>105%)."
  });

  const [investigatingAnomaly, setInvestigatingAnomaly] = useState<AnomalyItem | null>(null);

  // Initial Data Load
  useEffect(() => {
    loadOperationalData();
    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      loadOperationalData(true);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const loadOperationalData = async (silent: boolean = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [dashRes, trainsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getTrainsList()
      ]);
      setDashboardData(dashRes);
      setAllTrains(trainsRes);
    } catch (err) {
      console.error("Failed to refresh operational dashboard:", err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleSelectTrain = (trainNum: string) => {
    setSelectedTrainNumber(trainNum);
    setCurrentTab("trains");
  };

  const handleOpenCapacityModal = (
    trainNum: string,
    date: string,
    coaches: number,
    reason: string
  ) => {
    setCapacityModalInitData({
      train_number: trainNum,
      travel_date: date,
      coaches: coaches,
      reason: reason
    });
    setIsCapacityModalOpen(true);
  };

  const handleSubmitCapacityRequest = async (data: {
    train_number: string;
    travel_date: string;
    recommended_coaches: number;
    coach_type: string;
    reason: string;
    priority: string;
  }) => {
    await api.createCapacityRequest(data);
    loadOperationalData(true);
  };

  const handleAnomalyAction = async (
    anomalyId: string,
    action: "ACKNOWLEDGE" | "RESOLVE" | "ADD_NOTE",
    note?: string
  ) => {
    await api.takeAnomalyAction(anomalyId, action, note);
    loadOperationalData(true);
  };

  const kpis: DashboardKPIs | null = dashboardData ? dashboardData.kpis : null;
  const liveOps: LiveOperationRow[] = dashboardData ? dashboardData.live_operations : [];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      {/* Top Operational Telemetry Ribbon */}
      <TopOperationalRibbon
        kpis={kpis}
        onRefresh={() => loadOperationalData(false)}
        isRefreshing={isRefreshing}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          openAnomaliesCount={3}
          severeDelaysCount={kpis?.severe_delay_trains || 4}
          pendingCapacityCount={2}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/70">
          <div className="max-w-7xl mx-auto space-y-4">
            {currentTab === "overview" && (
              <OperationsOverview
                kpis={kpis}
                liveOperations={liveOps}
                onSelectTrain={handleSelectTrain}
              />
            )}

            {currentTab === "trains" && (
              <TrainIntelligence
                selectedTrainNumber={selectedTrainNumber}
                onSelectTrain={setSelectedTrainNumber}
                allTrains={allTrains}
              />
            )}

            {currentTab === "demand" && (
              <DemandForecasting
                onOpenCapacityModal={handleOpenCapacityModal}
                allTrains={allTrains}
              />
            )}

            {currentTab === "capacity" && (
              <CapacityPlanning
                onOpenCreateModal={() => setIsCapacityModalOpen(true)}
              />
            )}

            {currentTab === "anomalies" && (
              <AnomalyCenter
                onInvestigate={(anm) => setInvestigatingAnomaly(anm)}
              />
            )}

            {currentTab === "stations" && <StationIntelligence />}

            {currentTab === "routes" && <RouteCorridors />}

            {currentTab === "models" && <MLModelCenter />}

            {currentTab === "settings" && <SettingsAudit />}
          </div>
        </main>
      </div>

      {/* Capacity Request Workflow Modal */}
      <CapacityRequestModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        onSubmit={handleSubmitCapacityRequest}
        initialTrainNumber={capacityModalInitData.train_number}
        initialDate={capacityModalInitData.travel_date}
        defaultCoaches={capacityModalInitData.coaches}
        defaultReason={capacityModalInitData.reason}
      />

      {/* Anomaly Action & Investigation Modal */}
      <AnomalyActionModal
        isOpen={investigatingAnomaly !== null}
        anomaly={investigatingAnomaly}
        onClose={() => setInvestigatingAnomaly(null)}
        onAction={handleAnomalyAction}
      />
    </div>
  );
};

export default App;
