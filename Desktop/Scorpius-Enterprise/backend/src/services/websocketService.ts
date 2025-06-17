// src/services/websocketService.ts
import { SIMULATED_API_DELAY } from '@/config/api';
import type { WebSocketStatus, WebSocketMessageBase, ScanProgressMessage, SimulationUpdateMessage, AIAnalysisProgressMessage } from '@/types/apiSpec';

interface SimulatedWebSocket {
  url: string;
  onMessage: (event: MessageEvent) => void;
  onOpen?: () => void;
  onError?: (event: Event) => void;
  onClose?: () => void;
  intervalId?: NodeJS.Timeout;
  status: WebSocketStatus;
  wsInstance?: object; // To simulate a WS instance for isConnected check
  mockProgressCounter?: number; // Added to fix TypeScript error
}

const activeConnections = new Map<string, SimulatedWebSocket>();

function generateMockProgress(url: string, id: string): WebSocketMessageBase {
    const connection = activeConnections.get(url);
    let currentProgressCounter = 0;
    if (connection && typeof connection.mockProgressCounter === 'number') {
        currentProgressCounter = connection.mockProgressCounter;
    }

    const progress = Math.min(100, currentProgressCounter * 10 + Math.floor(Math.random() * 10));
    
    if (connection) {
        connection.mockProgressCounter = currentProgressCounter + 1;
    }


    if (url.includes("ws/scanner/progress")) {
        const statusMessages = ["Initializing...", "Loading plugins...", "Analyzing bytecode...", "Checking for reentrancy...", "Finalizing results..."];
        const currentPlugin = progress < 50 ? "BasicChecks" : "AdvancedHeuristics";
        return { 
            type: "scan_progress", 
            id, 
            progress, 
            statusMessage: statusMessages[Math.floor(progress / 20)] || "Scanning...",
            currentPlugin 
        } as ScanProgressMessage;
    } else if (url.includes("ws/simulation/live")) {
        const statusMessages = ["Queued", "Preparing environment...", "Executing transaction 1...", "Executing transaction 2...", "Gathering results..."];
        return { 
            type: "simulation_update", 
            id, 
            progress, 
            status: progress < 100 ? "running" : "completed",
            statusMessage: statusMessages[Math.floor(progress / 20)] || "Running simulation..."
        } as SimulationUpdateMessage;
    } else if (url.includes("ws/simulation/ai-exploit/progress")) {
         const phases = ["Initializing Sandbox", "Deploying AI Agents", "Static Code Analysis", "Dynamic Fuzzing", "Symbolic Execution", "Exploit Vector Generation", "Reporting"];
         const currentPhase = phases[Math.floor(progress / (100 / phases.length))] || "Processing...";
         return {
            type: "ai_analysis_progress",
            id,
            progress,
            phase: currentPhase,
            statusMessage: `${currentPhase}: ${Math.floor(Math.random() * 100)}% complete`,
            status: progress < 100 ? "running" : "completed",
         } as AIAnalysisProgressMessage;
    } else if (url.includes("ws/mempool/")) {
        let dataType: 'TRANSACTIONS' | 'MEV' | 'GAS_PRICES' = 'TRANSACTIONS';
        if (url.includes("mev")) dataType = 'MEV';
        if (url.includes("gas")) dataType = 'GAS_PRICES';
        return { type: "mempool_update", id, dataType, payload: { message: `New ${dataType.toLowerCase()} data available.` } };
    }
    return { type: "unknown_progress", id, progress, statusMessage: "Updating..." };
}


export function connectWebSocket(
  url: string,
  onMessage: (event: MessageEvent) => void,
  onOpen?: () => void,
  onError?: (event: Event) => void,
  onClose?: () => void
): void {
  if (activeConnections.has(url)) {
    console.warn(`[WS SIM] WebSocket connection to ${url} already exists or is being established.`);
    // Optionally, update callbacks if needed or just return
    // const existingConn = activeConnections.get(url)!;
    // existingConn.onMessage = onMessage; // etc.
    return;
  }

  console.log(`[WS SIM] Attempting to connect to WebSocket: ${url}`);
  
  const connectionId = url.substring(url.lastIndexOf('/') + 1) || `default-${Date.now()}`;

  const simSocket: SimulatedWebSocket = {
    url,
    onMessage,
    onOpen,
    onError,
    onClose,
    status: 'connecting',
    wsInstance: {}, // Simulate instance
    mockProgressCounter: 0, // Initialize mock progress counter
  };
  activeConnections.set(url, simSocket);

  setTimeout(() => {
    if (!activeConnections.has(url)) return; // Connection might have been closed before opening

    simSocket.status = 'connected';
    console.log(`[WS SIM] WebSocket connected to ${url}`);
    simSocket.onOpen?.();

    // Start simulating messages
    simSocket.intervalId = setInterval(() => {
      if (!activeConnections.has(url) || simSocket.status !== 'connected') {
        clearInterval(simSocket.intervalId);
        return;
      }
      
      const mockMessageData = generateMockProgress(url, connectionId);
      const mockEvent = { data: JSON.stringify(mockMessageData) } as MessageEvent;
      console.log(`[WS SIM] Sending message on ${url}:`, mockMessageData);
      simSocket.onMessage(mockEvent);

      // Simulate completion for progress-based streams
      if ((mockMessageData as any).progress >= 100) {
        console.log(`[WS SIM] Mock progress reached 100% for ${url}. Simulating stream end.`);
        clearInterval(simSocket.intervalId);
        // Do not automatically disconnect here; let the component decide based on completion message
        // disconnectWebSocket(url); 
      }
    }, SIMULATED_API_DELAY * 0.75 + Math.random() * 500); // Simulate messages faster than full API delay

    // Simulate occasional errors
    if (Math.random() < 0.05) { // 5% chance of error
        setTimeout(() => {
            if (!activeConnections.has(url)) return;
            console.error(`[WS SIM] Simulating WebSocket error for ${url}`);
            simSocket.status = 'error';
            simSocket.onError?.(new Event('Simulated WebSocket Error'));
            clearInterval(simSocket.intervalId);
            activeConnections.delete(url); // Remove on error
        }, SIMULATED_API_DELAY * 2);
    }

  }, SIMULATED_API_DELAY / 3); // Simulate connection delay
}

export function disconnectWebSocket(url: string): void {
  const simSocket = activeConnections.get(url);
  if (simSocket) {
    console.log(`[WS SIM] Disconnecting WebSocket from ${url}`);
    clearInterval(simSocket.intervalId);
    simSocket.status = 'disconnected';
    simSocket.onClose?.();
    activeConnections.delete(url);
  } else {
    console.warn(`[WS SIM] No active WebSocket connection found for URL: ${url} to disconnect.`);
  }
}

export function getWebSocketStatus(url: string): WebSocketStatus | undefined {
  return activeConnections.get(url)?.status;
}

export function isWebSocketConnected(url: string): boolean {
    const conn = activeConnections.get(url);
    return !!(conn && conn.status === 'connected' && conn.wsInstance);
}

// Global cleanup (e.g., for storybook HMR or app shutdown)
export function cleanupAllWebSockets(): void {
    console.log("[WS SIM] Cleaning up all simulated WebSocket connections.");
    activeConnections.forEach(socket => {
        clearInterval(socket.intervalId);
        socket.status = 'disconnected';
        socket.onClose?.();
    });
    activeConnections.clear();
}