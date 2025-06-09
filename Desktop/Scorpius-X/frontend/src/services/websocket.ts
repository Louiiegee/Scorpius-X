// Scorpius WebSocket Service for Real-time Data

type SubscriptionCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;

  constructor(private url: string = "ws://localhost:8000/ws") {}

  connect(): Promise<void> {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem("scorpius_token");
        const wsUrl = token ? `${this.url}?token=${token}` : this.url;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("🔗 WebSocket connected to Scorpius backend");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = () => {
          console.log("🔌 WebSocket disconnected");
          this.isConnecting = false;
          this.ws = null;
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(data: any) {
    const { type, payload } = data;

    if (this.subscriptions.has(type)) {
      this.subscriptions.get(type)?.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in WebSocket callback for ${type}:`, error);
        }
      });
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `⏳ Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error);
        });
      }, this.reconnectInterval);
    } else {
      console.error("❌ Max reconnection attempts reached");
    }
  }

  subscribe(eventType: string, callback: SubscriptionCallback): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    this.subscriptions.get(eventType)!.add(callback);

    // Send subscription request to backend
    this.send({ type: "subscribe", channel: eventType });

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(eventType)?.delete(callback);
      if (this.subscriptions.get(eventType)?.size === 0) {
        this.subscriptions.delete(eventType);
        this.send({ type: "unsubscribe", channel: eventType });
      }
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected. Message not sent:", data);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const wsService = new WebSocketService();

// Real-time data hooks for different types of data
export const useRealtimeData = {
  // Dashboard stats
  dashboardStats: (callback: SubscriptionCallback) => {
    return wsService.subscribe("dashboard_stats", callback);
  },

  // MEV opportunities
  mevOpportunities: (callback: SubscriptionCallback) => {
    return wsService.subscribe("mev_opportunities", callback);
  },

  // Mempool data
  mempoolData: (callback: SubscriptionCallback) => {
    return wsService.subscribe("mempool_data", callback);
  },

  // Security alerts
  securityAlerts: (callback: SubscriptionCallback) => {
    return wsService.subscribe("security_alerts", callback);
  },

  // Threat notifications
  threatAlerts: (callback: SubscriptionCallback) => {
    return wsService.subscribe("threat_alerts", callback);
  },

  // System health
  systemHealth: (callback: SubscriptionCallback) => {
    return wsService.subscribe("system_health", callback);
  },

  // Contract scan results
  scanResults: (callback: SubscriptionCallback) => {
    return wsService.subscribe("scan_results", callback);
  },

  // Network analysis
  networkData: (callback: SubscriptionCallback) => {
    return wsService.subscribe("network_data", callback);
  },
};

// Initialize WebSocket connection
export const initializeWebSocket = async () => {
  try {
    await wsService.connect();
    return true;
  } catch (error) {
    console.error("Failed to initialize WebSocket:", error);
    return false;
  }
};
