// src/services/mempoolService.ts
import { API_BASE_URL, SIMULATED_API_DELAY } from '@/config/api';
import type { MempoolTransaction, MEVOpportunity, GasPrice, MempoolConfig } from '@/types/apiSpec';

// Simulate fetching Mempool Config
export async function fetchMempoolConfig(): Promise<MempoolConfig> {
  console.log(`[API SIM] Fetching mempool config from GET ${API_BASE_URL}/mempool/config`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  // Simulate an error
  // if (Math.random() < 0.2) {
  //   throw new Error("Simulated error fetching mempool config.");
  // }
  return { monitoringEnabled: false, someMempoolSetting: "default" }; // Default state, not "mock data" of activity
}

// Simulate starting mempool monitoring
export async function startMempoolMonitoring(): Promise<{ success: boolean; message: string }> {
  console.log(`[API SIM] Starting mempool monitoring via POST ${API_BASE_URL}/mempool/start`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  return { success: true, message: "Mempool monitoring started successfully (simulated)." };
}

// Simulate stopping mempool monitoring
export async function stopMempoolMonitoring(): Promise<{ success: boolean; message: string }> {
  console.log(`[API SIM] Stopping mempool monitoring via POST ${API_BASE_URL}/mempool/stop`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  return { success: true, message: "Mempool monitoring stopped successfully (simulated)." };
}

// Simulate fetching live transactions
export async function fetchLiveTransactions(): Promise<MempoolTransaction[]> {
  console.log(`[API SIM] Fetching live transactions from GET ${API_BASE_URL}/mempool/transactions (or WebSocket)`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
  //   if (Math.random() < 0.1) {
  //    throw new Error("Simulated error fetching transactions.");
  //   }
  return []; // No mock data, backend returns empty if no new transactions
}

// Simulate fetching MEV opportunities
export async function fetchMevOpportunities(): Promise<MEVOpportunity[]> {
  console.log(`[API SIM] Fetching MEV opportunities from GET ${API_BASE_URL}/mempool/mev/opportunities (or WebSocket)`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
  //   if (Math.random() < 0.1) {
  //     throw new Error("Simulated error fetching MEV opportunities.");
  //   }
  return []; // No mock data
}

// Simulate fetching gas prices
export async function fetchGasPrices(): Promise<GasPrice[]> {
  console.log(`[API SIM] Fetching gas prices from GET ${API_BASE_URL}/mempool/gas-analysis (or WebSocket)`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));
  // if (Math.random() < 0.1) {
  //   throw new Error("Simulated error fetching gas prices.");
  // }
  // Return empty, or a structure that indicates no data yet from backend
  return [
    // These are placeholders for structure, not active data.
    // { type: 'fast', price: 0 },
    // { type: 'standard', price: 0 },
    // { type: 'slow', price: 0 },
  ]; // Or just empty array if backend has no data.
}
