// COMPLETE WEBSOCKET MANAGER - ALL REAL-TIME DATA CHANNELS

import { wsService, useRealtimeData } from "./websocket";

export class WebSocketManager {
  private static instance: WebSocketManager;
  private subscriptions: Map<string, Function> = new Map();

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // ================================
  // DASHBOARD REAL-TIME DATA
  // ================================
  subscribeToDashboard(callbacks: {
    onStatsUpdate?: (data: any) => void;
    onNetworkUpdate?: (data: any) => void;
    onAlertsUpdate?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onStatsUpdate) {
      const unsub = useRealtimeData.dashboardStats(callbacks.onStatsUpdate);
      unsubscribers.push(unsub);
    }

    if (callbacks.onNetworkUpdate) {
      const unsub = useRealtimeData.networkData(callbacks.onNetworkUpdate);
      unsubscribers.push(unsub);
    }

    if (callbacks.onAlertsUpdate) {
      const unsub = useRealtimeData.securityAlerts(callbacks.onAlertsUpdate);
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // MEV OPERATIONS REAL-TIME
  // ================================
  subscribeToMEV(callbacks: {
    onOpportunities?: (data: any) => void;
    onStrategyUpdate?: (data: any) => void;
    onProfitUpdate?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onOpportunities) {
      const unsub = useRealtimeData.mevOpportunities(callbacks.onOpportunities);
      unsubscribers.push(unsub);
    }

    if (callbacks.onStrategyUpdate) {
      const unsub = wsService.subscribe(
        "mev_strategy_updates",
        callbacks.onStrategyUpdate,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onProfitUpdate) {
      const unsub = wsService.subscribe(
        "mev_profit_updates",
        callbacks.onProfitUpdate,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // MEMPOOL REAL-TIME MONITORING
  // ================================
  subscribeToMempool(callbacks: {
    onMempoolData?: (data: any) => void;
    onTransactionAlerts?: (data: any) => void;
    onGasPriceUpdates?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onMempoolData) {
      const unsub = useRealtimeData.mempoolData(callbacks.onMempoolData);
      unsubscribers.push(unsub);
    }

    if (callbacks.onTransactionAlerts) {
      const unsub = wsService.subscribe(
        "transaction_alerts",
        callbacks.onTransactionAlerts,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onGasPriceUpdates) {
      const unsub = wsService.subscribe(
        "gas_price_updates",
        callbacks.onGasPriceUpdates,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // SMART CONTRACT SCANNER REAL-TIME
  // ================================
  subscribeToScanner(callbacks: {
    onScanResults?: (data: any) => void;
    onVulnerabilityAlerts?: (data: any) => void;
    onScanProgress?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onScanResults) {
      const unsub = useRealtimeData.scanResults(callbacks.onScanResults);
      unsubscribers.push(unsub);
    }

    if (callbacks.onVulnerabilityAlerts) {
      const unsub = wsService.subscribe(
        "vulnerability_alerts",
        callbacks.onVulnerabilityAlerts,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onScanProgress) {
      const unsub = wsService.subscribe(
        "scan_progress",
        callbacks.onScanProgress,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // THREAT DETECTION REAL-TIME
  // ================================
  subscribeToThreats(callbacks: {
    onThreatAlerts?: (data: any) => void;
    onZeroDayUpdates?: (data: any) => void;
    onRiskScoreUpdates?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onThreatAlerts) {
      const unsub = useRealtimeData.threatAlerts(callbacks.onThreatAlerts);
      unsubscribers.push(unsub);
    }

    if (callbacks.onZeroDayUpdates) {
      const unsub = wsService.subscribe(
        "zero_day_updates",
        callbacks.onZeroDayUpdates,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onRiskScoreUpdates) {
      const unsub = wsService.subscribe(
        "risk_score_updates",
        callbacks.onRiskScoreUpdates,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // SYSTEM MONITORING REAL-TIME
  // ================================
  subscribeToSystemHealth(callbacks: {
    onHealthUpdates?: (data: any) => void;
    onPerformanceMetrics?: (data: any) => void;
    onSystemAlerts?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onHealthUpdates) {
      const unsub = useRealtimeData.systemHealth(callbacks.onHealthUpdates);
      unsubscribers.push(unsub);
    }

    if (callbacks.onPerformanceMetrics) {
      const unsub = wsService.subscribe(
        "performance_metrics",
        callbacks.onPerformanceMetrics,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onSystemAlerts) {
      const unsub = wsService.subscribe(
        "system_alerts",
        callbacks.onSystemAlerts,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // SCHEDULER REAL-TIME UPDATES
  // ================================
  subscribeToScheduler(callbacks: {
    onJobUpdates?: (data: any) => void;
    onJobResults?: (data: any) => void;
    onScheduleChanges?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onJobUpdates) {
      const unsub = wsService.subscribe("job_updates", callbacks.onJobUpdates);
      unsubscribers.push(unsub);
    }

    if (callbacks.onJobResults) {
      const unsub = wsService.subscribe("job_results", callbacks.onJobResults);
      unsubscribers.push(unsub);
    }

    if (callbacks.onScheduleChanges) {
      const unsub = wsService.subscribe(
        "schedule_changes",
        callbacks.onScheduleChanges,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // TRAINING SYSTEM REAL-TIME
  // ================================
  subscribeToTraining(callbacks: {
    onProgressUpdates?: (data: any) => void;
    onSimulationUpdates?: (data: any) => void;
    onAchievementUnlocked?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onProgressUpdates) {
      const unsub = wsService.subscribe(
        "training_progress",
        callbacks.onProgressUpdates,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onSimulationUpdates) {
      const unsub = wsService.subscribe(
        "simulation_updates",
        callbacks.onSimulationUpdates,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onAchievementUnlocked) {
      const unsub = wsService.subscribe(
        "achievement_unlocked",
        callbacks.onAchievementUnlocked,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // BUG BOUNTY REAL-TIME
  // ================================
  subscribeToBounty(callbacks: {
    onNewSubmissions?: (data: any) => void;
    onStatusUpdates?: (data: any) => void;
    onLeaderboardUpdates?: (data: any) => void;
  }) {
    const unsubscribers: Function[] = [];

    if (callbacks.onNewSubmissions) {
      const unsub = wsService.subscribe(
        "bounty_submissions",
        callbacks.onNewSubmissions,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onStatusUpdates) {
      const unsub = wsService.subscribe(
        "bounty_status_updates",
        callbacks.onStatusUpdates,
      );
      unsubscribers.push(unsub);
    }

    if (callbacks.onLeaderboardUpdates) {
      const unsub = wsService.subscribe(
        "bounty_leaderboard",
        callbacks.onLeaderboardUpdates,
      );
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  // ================================
  // UNIVERSAL SUBSCRIPTION MANAGER
  // ================================
  subscribeToModule(moduleName: string, callbacks: Record<string, Function>) {
    const moduleSubscriptions: Record<string, Function> = {
      dashboard: () => this.subscribeToDashboard(callbacks),
      scanner: () => this.subscribeToScanner(callbacks),
      mev: () => this.subscribeToMEV(callbacks),
      mempool: () => this.subscribeToMempool(callbacks),
      threats: () => this.subscribeToThreats(callbacks),
      monitoring: () => this.subscribeToSystemHealth(callbacks),
      scheduler: () => this.subscribeToScheduler(callbacks),
      training: () => this.subscribeToTraining(callbacks),
      bounty: () => this.subscribeToBounty(callbacks),
    };

    const subscribe = moduleSubscriptions[moduleName];
    if (subscribe) {
      return subscribe();
    } else {
      console.warn(
        `No WebSocket subscription available for module: ${moduleName}`,
      );
      return () => {};
    }
  }

  // ================================
  // CONNECTION MANAGEMENT
  // ================================
  async initialize() {
    try {
      await wsService.connect();
      console.log("🔗 WebSocket Manager initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket Manager:", error);
      return false;
    }
  }

  disconnect() {
    wsService.disconnect();
    this.subscriptions.clear();
  }

  isConnected() {
    return wsService.isConnected();
  }
}

// Export singleton instance
export const wsManager = WebSocketManager.getInstance();
