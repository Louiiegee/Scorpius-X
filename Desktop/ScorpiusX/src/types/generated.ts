/**
 * Generated TypeScript types for Scorpius API
 * This file should be generated from OpenAPI spec in production
 */

// ====================================
// Common Types
// ====================================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  traceId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ====================================
// Authentication Types
// ====================================

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  permissions: string[];
  preferences: UserPreferences;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: "dark" | "light";
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
  telegram: boolean;
  criticalThreats: boolean;
  mevOpportunities: boolean;
  systemAlerts: boolean;
}

export interface DashboardSettings {
  refreshInterval: number;
  defaultCharts: string[];
  layout: "compact" | "expanded";
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ====================================
// Dashboard Types
// ====================================

export interface DashboardStats {
  threatsDetected: number;
  activeScans: number;
  activeBots: number;
  systemUptime: number;
  lastScanTime: string;
  totalTransactions: number;
  mevOpportunities: number;
  securityScore: number;
}

export interface ThreatAlert {
  id: string;
  type: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  contractAddress?: string;
  transactionHash?: string;
  severity: number;
  status: "active" | "resolved" | "investigating";
  detectedAt: string;
  resolvedAt?: string;
  metadata: Record<string, any>;
}

export interface MetricData {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface ChartData {
  threatDetection: MetricData[];
  networkActivity: NetworkActivityData[];
  performanceMetrics: PerformanceData[];
  securityPosture: SecurityMetric[];
}

export interface NetworkActivityData {
  network: "ethereum" | "polygon" | "bsc" | "arbitrum" | "avalanche";
  percentage: number;
  transactionsPerSecond: number;
  color: string;
}

export interface PerformanceData {
  metric: string;
  value: number;
  unit: string;
}

export interface SecurityMetric {
  category:
    | "firewall"
    | "encryption"
    | "monitoring"
    | "compliance"
    | "vulnerability"
    | "authentication";
  score: number;
  maxScore: number;
}

// ====================================
// Scanner Types
// ====================================

export interface ContractScanRequest {
  contractAddress: string;
  scanType: "quick" | "full" | "deep";
  options?: ScanOptions;
}

export interface ScanOptions {
  includeBytecodeSimilarity?: boolean;
  includeHoneypotDetection?: boolean;
  includeVulnerabilityAssessment?: boolean;
  customRules?: string[];
}

export interface ContractScanResult {
  id: string;
  contractAddress: string;
  scanType: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  results: ScanResults;
  metadata: Record<string, any>;
}

export interface ScanResults {
  securityScore: number;
  vulnerabilities: Vulnerability[];
  honeypotAnalysis: HoneypotAnalysis;
  bytecodeSimilarity: BytecodeSimilarity[];
  gasOptimization: GasOptimization[];
  complianceChecks: ComplianceCheck[];
}

export interface Vulnerability {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  description: string;
  recommendation: string;
  codeLocation?: CodeLocation;
  evidence: string[];
  cvssScore?: number;
}

export interface CodeLocation {
  function: string;
  line: number;
  column: number;
  snippet: string;
}

export interface HoneypotAnalysis {
  isHoneypot: boolean;
  confidence: number;
  honeypotType?: string;
  indicators: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface BytecodeSimilarity {
  contractAddress: string;
  similarity: number;
  matchedFunctions: string[];
  riskAssessment: string;
}

export interface GasOptimization {
  function: string;
  currentGas: number;
  optimizedGas: number;
  savings: number;
  suggestion: string;
}

export interface ComplianceCheck {
  standard: string;
  compliant: boolean;
  details: string;
  requirements: string[];
}

// ====================================
// MEV Types
// ====================================

export interface MevStrategy {
  id: string;
  name: string;
  type: "arbitrage" | "flashloan" | "liquidation" | "frontrun" | "sandwich";
  status: "active" | "paused" | "stopped";
  profitability: number;
  successRate: number;
  totalProfit: number;
  lastExecuted?: string;
  parameters: MevParameters;
  metrics: MevMetrics;
}

export interface MevParameters {
  minProfitThreshold: number;
  maxGasPrice: number;
  slippageTolerance: number;
  targetTokens: string[];
  exchanges: string[];
  customLogic?: string;
}

export interface MevMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalGasUsed: number;
  averageProfit: number;
  maxProfit: number;
  recentPerformance: MetricData[];
}

export interface MevOpportunity {
  id: string;
  type: string;
  profitEstimate: number;
  gasEstimate: number;
  deadline: string;
  status: "pending" | "executing" | "completed" | "failed";
  details: Record<string, any>;
}

// ====================================
// Mempool Types
// ====================================

export interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data: string;
  timestamp: string;
  riskScore: number;
  flags: string[];
}

export interface MempoolAlert {
  id: string;
  type:
    | "high_value"
    | "suspicious_pattern"
    | "mev_opportunity"
    | "potential_attack";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  transactionHash: string;
  detectedAt: string;
  metadata: Record<string, any>;
}

export interface MempoolStats {
  totalTransactions: number;
  averageGasPrice: number;
  pendingTransactions: number;
  suspiciousTransactions: number;
  mevOpportunities: number;
  networkCongestion: number;
}

// ====================================
// System Types
// ====================================

export interface SystemHealth {
  status: "healthy" | "degraded" | "down";
  uptime: number;
  services: ServiceStatus[];
  metrics: SystemMetrics;
  lastChecked: string;
}

export interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  responseTime: number;
  errorRate: number;
  lastChecked: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  queueDepth: number;
}

// ====================================
// Scheduler Types
// ====================================

export interface ScheduledJob {
  id: string;
  name: string;
  type: "scan" | "report" | "cleanup" | "backup" | "alert";
  schedule: string; // cron expression
  status: "active" | "paused" | "disabled";
  lastRun?: string;
  nextRun: string;
  parameters: Record<string, any>;
  metrics: JobMetrics;
}

export interface JobMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  lastDuration?: number;
  recentRuns: JobRun[];
}

export interface JobRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  duration?: number;
  logs: string[];
  error?: string;
}

// ====================================
// WebSocket Types
// ====================================

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  id?: string;
}

export interface LiveUpdate {
  type: "threat" | "mev" | "mempool" | "system";
  data: any;
  timestamp: string;
}

// ====================================
// Settings Types
// ====================================

export interface AppSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

export interface GeneralSettings {
  theme: "dark" | "light" | "auto";
  language: string;
  timezone: string;
  refreshInterval: number;
  autoSave: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  apiKeyRotation: boolean;
}

export interface IntegrationSettings {
  slack?: SlackIntegration;
  telegram?: TelegramIntegration;
  email?: EmailIntegration;
  webhook?: WebhookIntegration;
}

export interface SlackIntegration {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  alertTypes: string[];
}

export interface TelegramIntegration {
  enabled: boolean;
  botToken: string;
  chatId: string;
  alertTypes: string[];
}

export interface EmailIntegration {
  enabled: boolean;
  smtpServer: string;
  port: number;
  username: string;
  from: string;
  recipients: string[];
}

export interface WebhookIntegration {
  enabled: boolean;
  url: string;
  headers: Record<string, string>;
  alertTypes: string[];
}
