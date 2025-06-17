// src/types/apiSpec.ts

// Based on API_SPECIFICATION.md

// --- GENERAL ---
export interface APIError {
  error: string;
  message: string;
  code: number;
  details?: any;
  timestamp: string;
}

// --- 1. Scanner Module ---
export interface ScanResult {
  id: string;
  contract: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  plugin: string;
  title: string;
  description: string;
  timestamp: string;
  status: "Active" | "Resolved" | "Investigating";
  location?: {
    file: string;
    line: number;
    column: number;
  };
  recommendation?: string;
  cve?: string;
}

export interface ScannerConfig {
  // Define based on GET /api/scanner/config
  someConfigValue: boolean;
  anotherConfigValue: string;
}

export interface ScanPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: "security" | "performance" | "compliance" | "custom";
  tier: string; // UserTier once defined
  enabled: boolean;
  configurable: boolean;
  config?: Record<string, any>;
  // Add other fields from API_SPECIFICATION.md
}


// --- 2. Mempool Monitor Module ---
export interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  gasPrice: number;
  gasLimit: number;
  timestamp: string;
  mevOpportunity?: MEVOpportunity;
}

export interface MEVOpportunity {
  type: "arbitrage" | "sandwich" | "liquidation" | "frontrun";
  profit: number;
  probability: number;
  gasRequired: number;
  id?: string; // Added for unique key in lists
  involvedTransactions?: string[]; // Added from potential usage
}

export interface MempoolConfig {
  // Define based on GET /api/mempool/config
  monitoringEnabled: boolean;
  someMempoolSetting: string;
}

export interface GasPrice {
    type: 'fast' | 'standard' | 'slow';
    price: number; // in Gwei or Wei
}


// --- 3. Bytecode Analysis Module ---
export interface BytecodeAnalysis {
  id: string;
  contract: string;
  functions: FunctionAnalysis[];
  vulnerabilities?: VulnerabilityReport[];
  summary?: {
    overallComplexity: number;
    functionsIdentified: number;
  };
}

export interface FunctionAnalysis {
  name: string;
  selector: string;
  complexity: number;
  gasUsage: number;
  vulnerabilities: number;
  calls: number;
}

export interface VulnerabilityReport { 
    id: string;
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Info";
    description: string;
    recommendation?: string;
    confidence?: number;
}


// --- 4. Time Machine Module ---
export interface TimelineEvent {
  timestamp: string;
  blockNumber: number;
  transactionHash?: string; 
  event: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, any>; 
}

export interface ForkConfig {
  id: string;
  name?: string; 
  blockNumber: number;
  network?: string; 
  status: "active" | "inactive" | "error";
  createdAt?: string; 
}

export interface HistoricalData {
    type: 'block' | 'transaction' | 'contract_history';
    query: string;
    details: Record<string, any>; 
}


// --- 5. Simulation Engine Module ---
export type SimulationRunStatus = "queued" | "running" | "completed" | "failed" | "stopped";
export interface SimulationRun {
  id: string;
  name: string;
  type?: "Standard Simulation" | "AI Exploit Analysis"; // Added to differentiate
  status: SimulationRunStatus;
  startTime: string;
  endTime?: string;
  environmentId?: string; 
  mockResultsSummary?: string; 
  progress?: number; // Added for progress display
  statusMessage?: string; // Added for status text
}

export interface SimulationEnvironment {
  id: string;
  name: string;
  type: string; 
  blockNumber?: number;
  createdAt: string;
}

export interface AIAnalysisConfig {
  targetContractAddress: string;
  aiAnalysisProfile: string; // "Quick Vulnerability Scan", "Deep Exploit Search", etc.
  advancedConfig?: {
    aiModel?: string;
    maxAnalysisDuration?: number; // in minutes
    exploitCategories?: string[];
    resourceAllocation?: number; // e.g., 0-100
  };
}

export interface AIAnalysisRun extends SimulationRun { // Inherits from SimulationRun
  config: AIAnalysisConfig;
  findingsCount?: number;
  criticalVulnerabilities?: number;
}

export interface AIExploitFinding {
  id: string;
  vulnerabilityType: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  aiConfidence: number; // Percentage
  description: string;
  // PoC might be a string, object, or link depending on backend
  proofOfConcept?: AIExploitPoC; 
}

export interface AIExploitPoC {
  type: "code" | "steps" | "transaction_data";
  content: string | string[] | Record<string, any>;
  notes?: string;
}

export type WebSocketConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketMessageBase {
  type: string;
  id: string; // e.g., scanId, runId, analysisId
  url?: string; // to help identify which ws connection it's for
}
export interface ScanProgressMessage extends WebSocketMessageBase {
  type: "scan_progress";
  progress: number; // 0-100
  statusMessage: string;
  currentPlugin?: string;
}

export interface SimulationUpdateMessage extends WebSocketMessageBase {
  type: "simulation_update";
  status: SimulationRunStatus;
  progress?: number; // 0-100
  statusMessage?: string;
}

export interface AIAnalysisProgressMessage extends WebSocketMessageBase {
  type: "ai_analysis_progress";
  progress: number; // Overall progress 0-100
  phase: string; // e.g., "Static Analysis", "Dynamic Fuzzing"
  statusMessage: string; // Detailed current activity
  status: SimulationRunStatus; // To align with SimulationRun
}


// --- 6. Reports Module ---
export interface SecurityReport {
  id: string;
  title: string;
  templateUsed?: string; 
  generatedAt: string;
  status: "Queued" | "Generating" | "Completed" | "Failed"; 
  period?: {
    start: string;
    end: string;
  };
  downloadUrl?: string; 
  details?: Record<string, any>; 
}

export interface ReportTemplate {
    id: string;
    name: string;
    description?: string;
}


// --- 7. MEV Operations Module ---
export interface MEVStrategy {
  id: string;
  name: string;
  type: "arbitrage" | "sandwich" | "liquidation" | "frontrun";
  enabled: boolean;
  parameters: Record<string, any>; // JSON for parameters
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MEVExecution {
  id: string;
  strategyId: string;
  strategyName?: string;
  opportunityId: string;
  status: "pending" | "executed" | "failed" | "cancelled";
  profit?: number; // Can be null if pending or failed
  gasUsed?: number;
  timestamp: string;
  transactionHashes?: string[];
}

export interface MEVConfig {
  autoExecutionEnabled: boolean;
  minProfitThreshold: number; // e.g., in ETH or USD
  maxGasPrice: number; // e.g., in Gwei
}

export interface MEVWallet {
  id: string;
  address: string;
  name: string;
  balance?: number; // ETH or native currency
  isActive: boolean;
}

export interface MEVPerformanceMetrics {
    strategyId: string;
    totalProfit: number;
    successRate: number;
    totalExecutions: number;
}

// --- 8. Honeypot Detector ---
export interface HoneypotRisk {
  address: string;
  overall: number; // Score 0-100
  metrics: {
    contractComplexity?: number; // Score 0-100
    liquidityRisk?: number;     // Score 0-100
    ownerPrivileges?: number;   // Score 0-100
    codeVerification?: number;  // Score 0-100 (e.g. Etherscan verified)
    tradingPatterns?: number;   // Score 0-100
    externalCalls?: number;     // Score 0-100 (risk of malicious external calls)
    [key: string]: number | undefined; // Allow for additional metrics
  };
  status: "safe" | "suspicious" | "honeypot" | "unknown";
  summary?: string;
  timestamp?: string;
  warnings?: string[];
}

export interface RiskFactor { // Could be used within HoneypotRisk.metrics or as a separate structure
  category: string;
  score: number;
  description: string;
}


// --- 9. MEV Guardians Module ---
export interface Guardian {
  id: string;
  name: string;
  type: "transaction_protection" | "sandwich_defense" | "flashbot_submission";
  status: "active" | "inactive" | "error";
  protectedContracts: string[]; // Addresses
  config: Record<string, any>;
  createdAt?: string;
}

export interface ProtectionStrategy {
  id: string;
  name: string;
  description: string;
  type: "gas_price_adjustment" | "private_relay" | "counter_strategy";
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface GuardianAlert {
  id: string;
  guardianId: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
  message: string;
  details?: Record<string, any>;
  status: "new" | "acknowledged" | "resolved";
  transactionHash?: string;
}


// --- 10. Settings Module ---
export interface GeneralSettings {
  theme: 'light' | 'dark' | 'system';
  desktopNotifications: boolean;
  autoRefreshInterval: number; // seconds
}

export interface NetworkSetting {
  id: string;
  name: string;
  rpcUrl: string;
}

export interface ApiKeySetting {
  id: string;
  name: string;
  key: string; 
  placeholder?: string; 
  serviceUrl?: string; 
}

// WebSocket types
export interface WebSocketUpdateMessage extends WebSocketMessageBase {
  dataType: 
    | 'TRANSACTIONS' 
    | 'MEMPOOL_MEV' // Differentiate from MEV_Ops MEV
    | 'GAS_PRICES' 
    | 'SCAN_PROGRESS' 
    | 'SIMULATION_UPDATE'
    | 'AI_ANALYSIS_PROGRESS'
    | 'MEV_OPS_OPPORTUNITIES'
    | 'MEV_OPS_EXECUTIONS'
    | 'MEV_OPS_STRATEGY_PERFORMANCE'
    | 'GUARDIAN_STATUS'
    | 'GUARDIAN_ALERTS'
    | string; // Allow other specific types
  payload?: any; 
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
