/**
 * WebSocket service for real-time data
 * Singleton that manages connections and dispatches events
 */

import { config, logger } from "@/config/env";
import { authService } from "./auth";
import type { WebSocketMessage, LiveUpdate } from "@/types/generated";

export type WebSocketEventType =
  | "threat_detected"
  | "mev_opportunity"
  | "mempool_alert"
  | "system_update"
  | "scan_complete"
  | "strategy_update";

export interface WebSocketEventHandler<T = any> {
  (data: T): void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers = new Map<
    WebSocketEventType,
    Set<WebSocketEventHandler>
  >();
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    if (config.features.websockets) {
      this.connect();
    }
  }

  private buildWebSocketUrl(): string {
    const token = authService.getToken();
    const url = new URL(config.websocket.baseUrl);

    if (token) {
      url.searchParams.set("token", token);
    }

    return url.toString();
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      return this.connectionPromise!;
    }

    this.isConnecting = true;
    this.connectionPromise = this._connect();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildWebSocketUrl();
        logger.debug("Connecting to WebSocket:", url);

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          logger.info("WebSocket connected");
          this.reconnectAttempts = 0;
          this.clearReconnectTimer();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          logger.warn("WebSocket disconnected:", event.code, event.reason);
          this.ws = null;

          if (!event.wasClean && this.shouldReconnect()) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error("WebSocket error:", error);
          reject(new Error("WebSocket connection failed"));
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000);
      } catch (error) {
        logger.error("Failed to create WebSocket connection:", error);
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    logger.debug("Received WebSocket message:", message.type);

    // Handle different message types
    switch (message.type) {
      case "live_update":
        this.handleLiveUpdate(message.payload);
        break;
      case "auth_required":
        this.handleAuthRequired();
        break;
      case "error":
        this.handleError(message.payload);
        break;
      default:
        // Forward to event handlers
        this.emitEvent(message.type as WebSocketEventType, message.payload);
    }
  }

  private handleLiveUpdate(update: LiveUpdate): void {
    // Emit specific event based on update type
    this.emitEvent(update.type as WebSocketEventType, update.data);

    // Also emit general live_update event
    this.emitEvent("live_update" as WebSocketEventType, update);
  }

  private handleAuthRequired(): void {
    logger.warn("WebSocket authentication required, reconnecting...");
    this.disconnect();

    // Try to reconnect with fresh token
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  private handleError(error: any): void {
    logger.error("WebSocket server error:", error);
    this.emitEvent("error" as WebSocketEventType, error);
  }

  private shouldReconnect(): boolean {
    return (
      config.features.websockets &&
      this.reconnectAttempts < config.websocket.maxReconnectAttempts
    );
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(
      config.websocket.reconnectInterval *
        Math.pow(2, this.reconnectAttempts - 1),
      30000, // Max 30 seconds
    );

    logger.info(
      `Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        logger.error("WebSocket reconnection failed:", error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emitEvent(type: WebSocketEventType, data: any): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in WebSocket event handler for ${type}:`, error);
        }
      });
    }
  }

  // Public API
  on<T = any>(
    event: WebSocketEventType,
    handler: WebSocketEventHandler<T>,
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }

  off(event: WebSocketEventType, handler?: WebSocketEventHandler): void {
    if (!handler) {
      // Remove all handlers for this event
      this.eventHandlers.delete(event);
      return;
    }

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn("Cannot send message - WebSocket not connected");
    }
  }

  disconnect(): void {
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  getConnectionState(): "connecting" | "open" | "closing" | "closed" {
    if (!this.ws) return "closed";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "closed";
    }
  }

  isConnected(): boolean {
    return this.getConnectionState() === "open";
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// React hook for WebSocket events
export function useWebSocketEvent<T = any>(
  event: WebSocketEventType,
  handler: WebSocketEventHandler<T>,
  deps: React.DependencyList = [],
): void {
  React.useEffect(() => {
    const unsubscribe = websocketService.on(event, handler);
    return unsubscribe;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// React hook for WebSocket connection status
export function useWebSocketStatus() {
  const [status, setStatus] = React.useState(
    websocketService.getConnectionState(),
  );

  React.useEffect(() => {
    const checkStatus = () => {
      setStatus(websocketService.getConnectionState());
    };

    // Check status periodically
    const interval = setInterval(checkStatus, 1000);

    // Also check immediately
    checkStatus();

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isConnected: status === "open",
    isConnecting: status === "connecting",
  };
}

// Export service class for testing
export { WebSocketService };
