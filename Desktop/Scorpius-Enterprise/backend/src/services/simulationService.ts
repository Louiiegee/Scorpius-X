// src/services/simulationService.ts
import { API_BASE_URL, SIMULATED_API_DELAY } from '@/config/api';
import type { SimulationRun, SimulationEnvironment, AIAnalysisConfig, AIAnalysisRun, AIExploitFinding } from '@/types/apiSpec';

// Fetch Simulation Environments
export async function fetchSimulationEnvironments(): Promise<SimulationEnvironment[]> {
  console.log(`[API SIM] Fetching simulation environments from GET ${API_BASE_URL}/simulation/environments`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  return []; 
}

// Create Simulation Environment
export async function createSimulationEnvironment(name: string, type: string, blockNumber?: number): Promise<SimulationEnvironment> {
  console.log(`[API SIM] Creating simulation environment "${name}" via POST ${API_BASE_URL}/simulation/environments`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  if (name.toLowerCase().includes("error")) {
    throw new Error("Simulated error: Environment creation failed.");
  }
  return {
    id: `env-${Date.now()}`,
    name,
    type,
    blockNumber,
    createdAt: new Date().toISOString(),
  };
}

// Fetch Simulation Runs (includes standard and AI analysis runs)
export async function fetchSimulationRuns(): Promise<SimulationRun[]> {
  console.log(`[API SIM] Fetching simulation runs from GET ${API_BASE_URL}/simulation/runs`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 2));
  return []; 
}

// Start a new Standard Simulation Run
export async function startSimulationRun(
  name: string,
  environmentId: string,
  targetContract: string,
  functionSignature: string,
  parameters: string
): Promise<SimulationRun> {
  console.log(`[API SIM] Starting standard simulation run "${name}" via POST ${API_BASE_URL}/simulation/run`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));

  if (name.toLowerCase().includes("error")) {
    throw new Error("Simulated error: Failed to start standard simulation run.");
  }
  return {
    id: `run-std-${Date.now()}`,
    name,
    type: "Standard Simulation",
    status: 'queued', 
    startTime: new Date().toISOString(),
    environmentId,
    progress: 0,
    statusMessage: "Simulation queued. Waiting for execution...",
  };
}

// Start a new AI Exploit Analysis Run
export async function startAIExploitAnalysis(config: AIAnalysisConfig): Promise<AIAnalysisRun> {
  console.log(`[API SIM] Starting AI Exploit Analysis for ${config.targetContractAddress} via POST /api/simulation/ai-exploit/start (conceptual)`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));

  if (config.targetContractAddress.toLowerCase().includes("error")) {
    throw new Error("Simulated error: Failed to start AI exploit analysis.");
  }
  
  const newAIAnalysisRun: AIAnalysisRun = {
    id: `run-ai-${Date.now()}`,
    name: `AI Analysis for ${config.targetContractAddress.substring(0,10)}...`,
    type: "AI Exploit Analysis",
    status: 'queued',
    startTime: new Date().toISOString(),
    config: config,
    progress: 0,
    statusMessage: "AI analysis queued. Initializing sandbox...",
    findingsCount: 0,
    criticalVulnerabilities: 0,
  };
  return newAIAnalysisRun;
}

// Fetch Simulation Run Details (can be for standard or AI run)
export async function fetchSimulationRunDetails(runId: string): Promise<SimulationRun> {
    console.log(`[API SIM] Fetching details for run ${runId} via GET ${API_BASE_URL}/simulation/runs/${runId}`);
    await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 3));

    if (runId.includes("error")) {
        throw new Error(`Simulated error fetching details for run ${runId}.`);
    }
    
    // Default to a generic completed state if not an AI run for detailed results
    const isAIRun = runId.startsWith('run-ai-');
    return {
        id: runId,
        name: `Run ${runId.substring(0,10)}...`, 
        type: isAIRun ? "AI Exploit Analysis" : "Standard Simulation",
        status: 'completed', 
        startTime: new Date(Date.now() - 60000).toISOString(), 
        endTime: new Date().toISOString(),
        progress: 100,
        statusMessage: "Operation completed.",
        mockResultsSummary: isAIRun ? "AI Analysis complete. Fetch detailed findings separately." : "Simulation completed. No specific output data from backend simulation."
    };
}

// Fetch AI Exploit Analysis Results
export async function fetchAIExploitAnalysisResults(analysisId: string): Promise<AIExploitFinding[]> {
  console.log(`[API SIM] Fetching AI Exploit Analysis results for ${analysisId} via GET /api/simulation/ai-exploit/${analysisId}/results (conceptual)`);
  await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY));

  if (analysisId.includes("error")) {
    throw new Error(`Simulated error fetching AI results for ${analysisId}.`);
  }
  if (analysisId.includes("empty")) {
    return []; // No findings
  }
  // To adhere to "no mock data", return empty.
  // The UI should handle displaying "No findings" or similar.
  return [];
}


// Stop a simulation run (standard or AI)
export async function stopSimulationRun(runId: string): Promise<{ success: boolean, message: string }> {
    console.log(`[API SIM] Stopping run ${runId} via POST ${API_BASE_URL}/simulation/runs/${runId}/stop (or ai-exploit stop)`);
    await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 4));
    if (runId.includes("error")) {
        throw new Error(`Simulated error stopping run ${runId}.`);
    }
    return { success: true, message: `Run ${runId} stopped successfully (simulated).` };
}

// Delete a simulation run (standard or AI)
export async function deleteSimulationRun(runId: string): Promise<{ success: boolean, message: string }> {
    console.log(`[API SIM] Deleting run ${runId} via DELETE ${API_BASE_URL}/simulation/runs/${runId} (or ai-exploit delete)`);
    await new Promise(resolve => setTimeout(resolve, SIMULATED_API_DELAY / 4));
     if (runId.includes("error")) {
        throw new Error(`Simulated error deleting run ${runId}.`);
    }
    return { success: true, message: `Run ${runId} deleted successfully (simulated).` };
}
