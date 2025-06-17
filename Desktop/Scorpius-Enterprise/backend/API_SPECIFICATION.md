# Scorpius Dashboard - Complete API & WebSocket Specification

## Authentication & Authorization

### REST Endpoints

```typescript
POST / api / auth / login;
POST / api / auth / logout;
POST / api / auth / refresh;
GET / api / auth / profile;
PUT / api / auth / profile;
POST / api / auth / change - password;
```

### WebSocket

```typescript
// Authentication status updates
WS / ws / auth / status;
```

## 1. Scanner Module

### REST Endpoints

```typescript
// Scanner Configuration
GET    /api/scanner/config
PUT    /api/scanner/config
POST   /api/scanner/reset-config

// Plugins Management
GET    /api/scanner/plugins
POST   /api/scanner/plugins/{id}/enable
POST   /api/scanner/plugins/{id}/disable
GET    /api/scanner/plugins/{id}/config
PUT    /api/scanner/plugins/{id}/config

// Scanning Operations
POST   /api/scanner/scan
GET    /api/scanner/scans
GET    /api/scanner/scans/{id}
DELETE /api/scanner/scans/{id}
POST   /api/scanner/scans/{id}/stop
POST   /api/scanner/scans/{id}/resume

// Scan Results
GET    /api/scanner/results
GET    /api/scanner/results/{id}
PUT    /api/scanner/results/{id}/status
DELETE /api/scanner/results/{id}
GET    /api/scanner/results/export
POST   /api/scanner/results/{id}/resolve
POST   /api/scanner/results/{id}/investigate

// Network Topology
GET    /api/scanner/network/topology
GET    /api/scanner/network/nodes
GET    /api/scanner/network/connections
```

### WebSocket Endpoints

```typescript
// Real-time scan progress
WS / ws / scanner / progress;

// Live scan results
WS / ws / scanner / results;

// Network topology updates
WS / ws / scanner / network;

// Plugin status updates
WS / ws / scanner / plugins / status;
```

### Data Models

```typescript
interface ScanResult {
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

interface NetworkNode {
  id: string;
  position: [number, number, number];
  type: "normal" | "vulnerable" | "critical";
  connections: string[];
  contract?: string;
  vulnerabilityCount: number;
}
```

## 2. Mempool Monitor Module

### REST Endpoints

```typescript
// Mempool Configuration
GET / api / mempool / config;
PUT / api / mempool / config;
POST / api / mempool / start;
POST / api / mempool / stop;
POST / api / mempool / pause;
POST / api / mempool / resume;

// MEV Detection
GET / api / mempool / mev / opportunities;
GET / api / mempool / mev / strategies;
POST / api / mempool / mev / strategies;
PUT / api / mempool / mev / strategies / { id };
DELETE / api / mempool / mev / strategies / { id };

// Transaction Analysis
GET / api / mempool / transactions;
GET / api / mempool / transactions / { hash };
GET / api / mempool / analytics;
GET / api / mempool / gas - analysis;
```

### WebSocket Endpoints

```typescript
// Live mempool data
WS / ws / mempool / live;

// MEV opportunities
WS / ws / mempool / mev;

// Gas price updates
WS / ws / mempool / gas;

// Transaction flow
WS / ws / mempool / transactions;
```

### Data Models

```typescript
interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  gasPrice: number;
  gasLimit: number;
  timestamp: string;
  mevOpportunity?: MEVOpportunity;
}

interface MEVOpportunity {
  type: "arbitrage" | "sandwich" | "liquidation" | "frontrun";
  profit: number;
  probability: number;
  gasRequired: number;
}
```

## 3. Bytecode Analysis Module

### REST Endpoints

```typescript
// Bytecode Analysis
POST   /api/bytecode/analyze
GET    /api/bytecode/analysis/{id}
DELETE /api/bytecode/analysis/{id}
GET    /api/bytecode/analysis/{id}/export

// Contract Upload
POST   /api/bytecode/upload
POST   /api/bytecode/from-address

// Decompilation
POST   /api/bytecode/decompile
GET    /api/bytecode/decompile/{id}

// Pattern Analysis
GET    /api/bytecode/patterns
POST   /api/bytecode/patterns/search
GET    /api/bytecode/functions
GET    /api/bytecode/complexity
```

### WebSocket Endpoints

```typescript
// Analysis progress
WS / ws / bytecode / analysis / progress;

// Decompilation updates
WS / ws / bytecode / decompile / status;
```

### Data Models

```typescript
interface BytecodeAnalysis {
  id: string;
  contract: string;
  functions: FunctionAnalysis[];
  patterns: PatternMatch[];
  complexity: ComplexityMetrics;
  vulnerabilities: VulnerabilityReport[];
}

interface FunctionAnalysis {
  name: string;
  selector: string;
  complexity: number;
  gasUsage: number;
  vulnerabilities: number;
  calls: number;
}
```

## 4. Time Machine Module

### REST Endpoints

```typescript
// Historical Data
GET / api / timemachine / blocks;
GET / api / timemachine / blocks / { number };
GET / api / timemachine / transactions / { hash } / history;
GET / api / timemachine / contracts / { address } / history;

// Simulation Setup
POST / api / timemachine / fork;
GET / api / timemachine / forks;
DELETE / api / timemachine / forks / { id };
POST / api / timemachine / forks / { id } / reset;

// Replay Operations
POST / api / timemachine / replay;
GET / api / timemachine / replay / { id };
POST / api / timemachine / replay / { id } / stop;

// Timeline Analysis
GET / api / timemachine / timeline / events;
GET / api / timemachine / timeline / security;
POST / api / timemachine / timeline / analyze;
```

### WebSocket Endpoints

```typescript
// Replay progress
WS / ws / timemachine / replay / progress;

// Timeline updates
WS / ws / timemachine / timeline;

// Fork status
WS / ws / timemachine / forks / status;
```

### Data Models

```typescript
interface TimelineEvent {
  timestamp: string;
  blockNumber: number;
  transactionHash: string;
  event: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata: Record<string, any>;
}

interface ForkConfig {
  id: string;
  blockNumber: number;
  network: string;
  status: "active" | "inactive" | "error";
  createdAt: string;
}
```

## 5. Simulation Engine Module

### REST Endpoints

```typescript
// Simulation Configuration
GET / api / simulation / config;
PUT / api / simulation / config;
POST / api / simulation / reset;

// Simulation Execution
POST / api / simulation / run;
GET / api / simulation / runs;
GET / api / simulation / runs / { id };
POST / api / simulation / runs / { id } / stop;
DELETE / api / simulation / runs / { id };

// Fuzzing Operations
POST / api / simulation / fuzz;
GET / api / simulation / fuzz / { id };
GET / api / simulation / fuzz / { id } / results;

// Environment Management
GET / api / simulation / environments;
POST / api / simulation / environments;
PUT / api / simulation / environments / { id };
DELETE / api / simulation / environments / { id };
```

### WebSocket Endpoints

```typescript
// Live simulation data
WS / ws / simulation / live;

// Fuzzing progress
WS / ws / simulation / fuzz / progress;

// Environment status
WS / ws / simulation / environments / status;
```

### Data Models

```typescript
interface SimulationRun {
  id: string;
  name: string;
  status: "running" | "completed" | "failed" | "stopped";
  startTime: string;
  endTime?: string;
  results: SimulationResult[];
  metrics: SimulationMetrics;
}

interface SimulationTransaction {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  value: number;
  status: "pending" | "success" | "failed" | "simulated";
  progress: number;
}
```

## 6. Reports Module

### REST Endpoints

```typescript
// Report Generation
POST   /api/reports/generate
GET    /api/reports
GET    /api/reports/{id}
DELETE /api/reports/{id}
GET    /api/reports/{id}/download

// Report Templates
GET    /api/reports/templates
POST   /api/reports/templates
PUT    /api/reports/templates/{id}
DELETE /api/reports/templates/{id}

// Analytics Data
GET    /api/reports/analytics/security
GET    /api/reports/analytics/performance
GET    /api/reports/analytics/threats
GET    /api/reports/analytics/activity

// Export Options
POST   /api/reports/{id}/export/pdf
POST   /api/reports/{id}/export/csv
POST   /api/reports/{id}/export/json
```

### WebSocket Endpoints

```typescript
// Report generation progress
WS / ws / reports / generation / progress;

// Live analytics updates
WS / ws / reports / analytics;
```

### Data Models

```typescript
interface SecurityReport {
  id: string;
  title: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: ReportSummary;
  sections: ReportSection[];
}

interface ReportMetrics {
  vulnerabilities: number;
  resolved: number;
  critical: number;
  threats: ThreatDistribution[];
  performance: PerformanceMetrics;
}
```

## 7. MEV Operations Module

### REST Endpoints

```typescript
// MEV Strategy Management
GET / api / mev / strategies;
POST / api / mev / strategies;
PUT / api / mev / strategies / { id };
DELETE / api / mev / strategies / { id };
POST / api / mev / strategies / { id } / enable;
POST / api / mev / strategies / { id } / disable;

// MEV Monitoring
GET / api / mev / opportunities;
GET / api / mev / opportunities / { id };
GET / api / mev / profit / analysis;
GET / api / mev / performance / metrics;

// Execution Management
POST / api / mev / execute;
GET / api / mev / executions;
GET / api / mev / executions / { id };
POST / api / mev / executions / { id } / cancel;

// Configuration
GET / api / mev / config;
PUT / api / mev / config;
GET / api / mev / wallets;
POST / api / mev / wallets;
```

### WebSocket Endpoints

```typescript
// Live MEV opportunities
WS / ws / mev / opportunities;

// Execution status
WS / ws / mev / executions;

// Profit tracking
WS / ws / mev / profit;

// Strategy performance
WS / ws / mev / strategies / performance;
```

### Data Models

```typescript
interface MEVStrategy {
  id: string;
  name: string;
  type: "arbitrage" | "sandwich" | "liquidation" | "frontrun";
  enabled: boolean;
  parameters: Record<string, any>;
  performance: StrategyPerformance;
}

interface MEVExecution {
  id: string;
  strategyId: string;
  opportunity: MEVOpportunity;
  status: "pending" | "executed" | "failed" | "cancelled";
  profit: number;
  gasUsed: number;
  timestamp: string;
}
```

## 8. Honeypot Detector Module

### REST Endpoints

```typescript
// Honeypot Detection
POST / api / honeypot / detect;
GET / api / honeypot / scans;
GET / api / honeypot / scans / { id };
DELETE / api / honeypot / scans / { id };

// Risk Assessment
GET / api / honeypot / risk / { address };
POST / api / honeypot / risk / bulk;
GET / api / honeypot / risk / history / { address };

// Pattern Database
GET / api / honeypot / patterns;
POST / api / honeypot / patterns;
PUT / api / honeypot / patterns / { id };
DELETE / api / honeypot / patterns / { id };

// Behavioral Analysis
POST / api / honeypot / analyze / behavior;
GET / api / honeypot / analyze / results / { id };
```

### WebSocket Endpoints

```typescript
// Risk assessment updates
WS / ws / honeypot / risk;

// Detection progress
WS / ws / honeypot / detection / progress;

// Pattern updates
WS / ws / honeypot / patterns;
```

### Data Models

```typescript
interface HoneypotRisk {
  address: string;
  overall: number;
  metrics: {
    contractComplexity: number;
    liquidityRisk: number;
    ownerPrivileges: number;
    codeVerification: number;
    tradingPatterns: number;
    externalCalls: number;
  };
  status: "safe" | "suspicious" | "honeypot";
}

interface RiskFactor {
  category: string;
  current: number;
  threshold: number;
  historical: number[];
  description: string;
}
```

## 9. MEV Guardians Module

### REST Endpoints

```typescript
// Guardian Management
GET / api / guardians;
POST / api / guardians;
PUT / api / guardians / { id };
DELETE / api / guardians / { id };

// Protection Strategies
GET / api / guardians / strategies;
POST / api / guardians / strategies;
PUT / api / guardians / strategies / { id };

// Monitoring
GET / api / guardians / monitoring / status;
GET / api / guardians / alerts;
POST / api / guardians / alerts / { id } / acknowledge;
```

### WebSocket Endpoints

```typescript
// Guardian status
WS / ws / guardians / status;

// Protection alerts
WS / ws / guardians / alerts;
```

## 10. Settings Module

### REST Endpoints

```typescript
// System Configuration
GET / api / settings / system;
PUT / api / settings / system;
POST / api / settings / system / reset;

// User Preferences
GET / api / settings / user;
PUT / api / settings / user;

// API Keys Management
GET / api / settings / api - keys;
POST / api / settings / api - keys;
DELETE / api / settings / api - keys / { id };

// Integrations
GET / api / settings / integrations;
PUT / api / settings / integrations / { service };
POST / api / settings / integrations / { service } / test;

// Backup & Restore
POST / api / settings / backup;
POST / api / settings / restore;
GET / api / settings / backup / history;

// System Health
GET / api / settings / health;
GET / api / settings / metrics;
GET / api / settings / logs;
```

### WebSocket Endpoints

```typescript
// System metrics
WS / ws / settings / metrics;

// Health monitoring
WS / ws / settings / health;

// Configuration updates
WS / ws / settings / config;
```

### Data Models

```typescript
interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeScans: number;
  responseTime: number;
}

interface SystemHealth {
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  services: ServiceStatus[];
  alerts: HealthAlert[];
}
```

## Global WebSocket Events

### System-wide Events

```typescript
// System notifications
WS / ws / notifications;

// Error reporting
WS / ws / errors;

// User activity
WS / ws / activity;

// Performance monitoring
WS / ws / performance;
```

## File Upload/Download Endpoints

```typescript
// Contract uploads
POST / api / upload / contract;
POST / api / upload / bytecode;
POST / api / upload / abi;

// Report downloads
GET / api / download / report / { id };
GET / api / download / scan - results / { id };
GET / api / download / logs;

// Backup files
GET / api / download / backup / { id };
POST / api / upload / backup;
```

## Rate Limiting & Pagination

All GET endpoints support:

- `?page=1&limit=50` - Pagination
- `?sort=createdAt&order=desc` - Sorting
- `?filter[status]=active` - Filtering
- `?search=keyword` - Search

Rate limits:

- Authentication: 5 requests/minute
- Scanning: 10 requests/minute
- General API: 100 requests/minute
- WebSocket connections: 10 concurrent

## Error Handling

Standard HTTP status codes with consistent error format:

```typescript
interface APIError {
  error: string;
  message: string;
  code: number;
  details?: any;
  timestamp: string;
}
```

## Authentication

- JWT tokens for REST API
- WebSocket authentication via token query parameter
- Token refresh mechanism
- Role-based access control (RBAC)

## Environment Variables

```env
# API Configuration
API_BASE_URL=http://localhost:3001
WS_BASE_URL=ws://localhost:3001
API_TIMEOUT=30000

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Database
DATABASE_URL=postgresql://user:pass@localhost/scorpius

# External Services
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-key
FLASHLOAN_PROVIDER_API=your-api-key

# Redis (for caching and WebSocket)
REDIS_URL=redis://localhost:6379
```

This specification covers every button, configuration, chart, and feature in the Scorpius dashboard. Each module has comprehensive CRUD operations, real-time updates via WebSocket, and proper data models.