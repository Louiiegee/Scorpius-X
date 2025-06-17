// src/services/mevGuardiansService.ts
import { API_BASE_URL, SIMULATED_API_DELAY } from '@/config/api';
import type { Guardian, ProtectionStrategy, GuardianAlert } from '@/types/apiSpec';

// --- Guardian Management ---
export async function fetchGuardians(): Promise<Guardian[]> {
  console.log(`[API SIM] Fetching guardians from GET ${API_BASE_URL}/guardians`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  // if (Math.random() < 0.1) throw new Error("Simulated: Failed to fetch guardians.");
  return []; // No mock data
}

// Placeholder for future create/update/delete guardian functions
// export async function createGuardian(guardianData: Omit<Guardian, 'id'>): Promise<Guardian> { ... }
// export async function updateGuardian(guardianId: string, guardianData: Partial<Guardian>): Promise<Guardian> { ... }
// export async function deleteGuardian(guardianId: string): Promise<{ success: boolean }> { ... }

// --- Protection Strategies ---
export async function fetchProtectionStrategies(): Promise<ProtectionStrategy[]> {
  console.log(`[API SIM] Fetching protection strategies from GET ${API_BASE_URL}/guardians/strategies`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  // if (Math.random() < 0.1) throw new Error("Simulated: Failed to fetch protection strategies.");
  return []; // No mock data
}

// Placeholder for future create/update/delete strategy functions

// --- Monitoring & Alerts ---
export async function fetchGuardianMonitoringStatus(): Promise<Array<{ guardianId: string, status: Guardian['status'], lastCheckIn: string }>> {
    console.log(`[API SIM] Fetching guardian monitoring status from GET ${API_BASE_URL}/guardians/monitoring/status`);
    await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 3));
    return []; // No mock status data
}

export async function fetchGuardianAlerts(): Promise<GuardianAlert[]> {
  console.log(`[API SIM] Fetching guardian alerts from GET ${API_BASE_URL}/guardians/alerts`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  // if (Math.random() < 0.1) throw new Error("Simulated: Failed to fetch guardian alerts.");
  return []; // No mock data
}

export async function acknowledgeGuardianAlert(alertId: string): Promise<GuardianAlert> {
  console.log(`[API SIM] Acknowledging guardian alert ${alertId} via POST ${API_BASE_URL}/guardians/alerts/${alertId}/acknowledge`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 3));
  if (alertId.includes("error_ack")) {
    throw new Error(`Simulated: Failed to acknowledge alert ${alertId}.`);
  }
  // Return a structure indicating the alert is acknowledged
  return {
    id: alertId,
    guardianId: `guardian-${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity: 'warning', // Placeholder
    message: `Alert ${alertId} acknowledged.`,
    status: 'acknowledged',
  };
}
