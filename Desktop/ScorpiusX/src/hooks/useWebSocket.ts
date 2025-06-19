import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: string;
  type: "message" | "system" | "file";
  reactions?: { emoji: string; users: string[] }[];
}

export interface LiveMetrics {
  activeScans: number;
  vulnerabilities: number;
  mevOpportunities: number;
  systemHealth: number;
  networkLatency: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface GraphData {
  timestamp: number;
  gasPrice: number;
  blockTime: number;
  pendingTxs: number;
  mevVolume: number;
}

const WEBSOCKET_URL = "ws://localhost:8081";
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = () => {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    activeScans: 0,
    vulnerabilities: 0,
    mevOpportunities: 0,
    systemHealth: 100,
    networkLatency: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  });
  const [graphData, setGraphData] = useState<GraphData[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const connect = useCallback(() => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🌐 WebSocket connected");
        setIsConnected(true);
        reconnectCountRef.current = 0;

        // Send authentication
        ws.send(
          JSON.stringify({
            type: "auth",
            user: {
              username: user.name || user.username || "Anonymous",
              avatar: user.avatar || "👤",
              role: user.role || "User",
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectCountRef.current++;
          console.log(
            `🔄 Reconnecting... (${reconnectCountRef.current}/${MAX_RECONNECT_ATTEMPTS})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      };

      ws.onerror = (error) => {
        console.warn(
          "WebSocket connection failed - backend server not available",
        );
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [user]);

  const handleMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case "chat_history":
        setMessages(data.messages || []);
        break;

      case "chat_message":
        setMessages((prev) => [...prev, data.message]);
        break;

      case "user_list":
        setOnlineUsers(data.users || []);
        break;

      case "user_join":
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "info",
            message: `${data.user.username} joined the chat`,
            timestamp: new Date(),
          },
        ]);
        break;

      case "user_leave":
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "info",
            message: `${data.user.username} left the chat`,
            timestamp: new Date(),
          },
        ]);
        break;

      case "live_data":
        if (data.dataType === "metrics") {
          setLiveMetrics(data.data);
        } else if (data.dataType === "graphs") {
          setGraphData((prev) => {
            const newData = [...prev, data.data];
            // Keep only last 50 data points
            return newData.slice(-50);
          });
        }
        break;

      case "scan_progress":
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "scan",
            message: `Scan ${data.scanId}: ${data.status} (${data.progress}%)`,
            timestamp: new Date(),
            data: data,
          },
        ]);
        break;

      case "mev_opportunity":
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "mev",
            message: "New MEV opportunity detected",
            timestamp: new Date(),
            data: data.opportunity,
          },
        ]);
        break;

      case "schedule_update":
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "schedule",
            message: `Task ${data.taskId}: ${data.status}`,
            timestamp: new Date(),
            data: data.data,
          },
        ]);
        break;

      case "vulnerability_alert":
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "alert",
            message: "Critical vulnerability detected!",
            timestamp: new Date(),
            data: data,
          },
        ]);
        break;

      case "notification":
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: data.level || "info",
            message: data.message,
            timestamp: new Date(),
          },
        ]);
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat_message",
          message,
        }),
      );
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          isTyping,
        }),
      );
    }
  }, []);

  const sendCustomMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type,
          ...data,
        }),
      );
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, connect]);

  return {
    isConnected,
    messages,
    onlineUsers,
    liveMetrics,
    graphData,
    notifications,
    sendMessage,
    sendTyping,
    sendCustomMessage,
    clearNotifications,
    removeNotification,
    websocket: wsRef.current,
  };
};
