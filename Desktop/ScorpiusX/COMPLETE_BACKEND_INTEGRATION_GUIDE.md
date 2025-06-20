# 🔥 SCORPIUS CYBERSECURITY PLATFORM - COMPLETE BACKEND INTEGRATION GUIDE 🔥

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [API Architecture](#api-architecture)
3. [Authentication System](#authentication-system)
4. [Page-by-Page Integration](#page-by-page-integration)
5. [Component Interactions](#component-interactions)
6. [WebSocket Connections](#websocket-connections)
7. [File Upload Systems](#file-upload-systems)
8. [Real-time Data Flows](#real-time-data-flows)
9. [Error Handling](#error-handling)
10. [Backend Route Specifications](#backend-route-specifications)

---

## 🎯 OVERVIEW

This document provides complete integration specifications for **EVERY SINGLE BUTTON, INTERACTION, AND COMPONENT** in the Scorpius Cybersecurity Dashboard. Each frontend action is mapped to specific backend endpoints with exact data flows.

### ⚡ Core Services Architecture

```
Frontend (React/TypeScript) ←→ Python Backend APIs
├── Scanner API Server (Port 8001)     - Smart Contract Analysis
├── Mempool API Server (Port 8002)     - Transaction Monitoring
├── MEV API Server (Port 8003)         - MEV Operations
└── Main API Server (Port 8000)        - Dashboard/Auth/Reports
```

---

## 🔐 AUTHENTICATION SYSTEM

### Frontend Token Management

```typescript
// src/services/api.ts
const getAuthHeaders = () => {
  const token = localStorage.getItem("scorpius_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
```

### Required Backend Endpoints

```python
# backend/routes/auth.py
@router.post("/api/auth/login")
async def login(username: str, password: str):
    # Returns: { "token": "jwt_token", "user": {...} }

@router.get("/api/auth/me")
async def get_current_user():
    # Returns: { "id": "user_id", "username": "...", "permissions": [...] }

@router.post("/api/auth/logout")
async def logout():
    # Returns: { "message": "Logged out successfully" }
```

---

## 📱 PAGE-BY-PAGE INTEGRATION

### 🏠 1. DASHBOARD PAGE (`/dashboard`)

**File**: `src/pages/Dashboard.tsx`

#### Interactive Elements & Backend Mapping:

##### 🔴 Live Monitor Toggle Button

```typescript
// Frontend: Line 209
onClick={() => setIsLive(!isLive)}

// Backend Required:
POST /api/dashboard/live-monitor
{
  "enabled": boolean,
  "user_id": "current_user"
}
```

##### 🔔 Notifications Toggle

```typescript
// Frontend: Line 225
onClick={() => setShowNotifications(!showNotifications)}

// Backend Required:
GET /api/dashboard/notifications
POST /api/dashboard/notifications/toggle
```

##### ✅ Mark Alert as Read

```typescript
// Frontend: Line 373
onClick={() => markAlertRead(alert.id)}

// Backend Required:
POST /api/dashboard/alerts/{alert_id}/read
```

##### ❌ Remove Alert

```typescript
// Frontend: Line 382
onClick={() => removeAlert(alert.id)}

// Backend Required:
DELETE /api/dashboard/alerts/{alert_id}
```

##### 🚀 Navigation Buttons

```typescript
// Scanner Navigation - Line 409
onClick={() => navigate("/scanner")}
// Backend: Redirect to Scanner microservice

// MEV Operations - Line 416
onClick={() => navigate("/mev")}
// Backend: Load MEV dashboard data

// Mempool Monitor - Line 423
onClick={() => navigate("/mempool")}
// Backend: Initialize mempool monitoring

// Trap Grid - Line 430
onClick={() => navigate("/trapgrid")}
// Backend: Load honeypot detection data
```

#### Real-time Data Updates

```typescript
// WebSocket connection for live data - Line 80
useEffect(() => {
  if (websocket && isConnected) {
    websocket.send(
      JSON.stringify({
        type: "subscribe_dashboard",
        user_id: currentUser.id,
      }),
    );
  }
}, [websocket, isConnected]);
```

---

### 🔍 2. SMART CONTRACT SCANNER (`/scanner`)

**File**: `src/pages/CodeMatcher.tsx`

#### All Interactive Elements:

##### 📤 File Upload System

```typescript
// Frontend: Line 1051
onClick={() => fileInputRef.current?.click()}

// Backend Required:
POST /api/scanner/upload
Content-Type: multipart/form-data
{
  "file": File,
  "scan_type": "full" | "quick" | "deep",
  "user_id": "current_user"
}

// Response:
{
  "upload_id": "unique_id",
  "filename": "contract.sol",
  "status": "uploaded",
  "size": 1024
}
```

##### 🎯 Contract Analysis Button

```typescript
// Frontend: Line 515
onClick={analyzeContract}

// Backend Required:
POST /api/scanner/analyze
{
  "contract_address": "0x...",
  "scan_type": "full",
  "chain_id": 1,
  "rpc_url": "https://mainnet.infura.io/..."
}

// Response:
{
  "scan_id": "unique_scan_id",
  "status": "queued",
  "estimated_time": 30
}
```

##### 📋 Select All Contracts

```typescript
// Frontend: Line 1269
onClick = { selectAllContracts };

// Backend Required:
GET / api / scanner / contracts / user / { user_id };
// Returns list of user's uploaded contracts
```

##### 🗑️ Clear Selection

```typescript
// Frontend: Line 1286
onClick = { clearSelection };

// Local state management - no backend call needed
```

##### ▶️ Start Scan

```typescript
// Frontend: Line 1390
onClick={startScan}

// Backend Required:
POST /api/scanner/batch-scan
{
  "contract_ids": ["id1", "id2", ...],
  "scan_options": {
    "include_ai_analysis": true,
    "check_honeypots": true,
    "analyze_gas_optimization": true
  }
}
```

##### ⏹️ Stop Scan

```typescript
// Frontend: Line 1415
onClick = { stopScan };

// Backend Required:
POST / api / scanner / scan / { scan_id } / cancel;
```

##### 📊 Export Results

```typescript
// Frontend: Line 1442
onClick={exportResults}

// Backend Required:
POST /api/scanner/export
{
  "scan_id": "current_scan",
  "format": "pdf" | "json" | "csv",
  "include_details": true
}
```

##### 🗂️ File Management

```typescript
// Remove File - Line 1751
onClick={() => removeFile(file.id)}

// Backend Required:
DELETE /api/scanner/files/{file_id}
```

##### 🔍 Vulnerability Selection

```typescript
// Frontend: Line 1865
onClick={() => setSelectedVulnerability(result)}

// Backend Required:
GET /api/scanner/vulnerability/{vulnerability_id}/details
```

---

### ⚡ 3. MEV OPERATIONS PAGE (`/mev`)

**File**: `src/pages/MEVOperations.tsx`

#### Strategy Management:

##### 🔄 Toggle Strategy

```typescript
// Frontend: Line 1148
onClick={() => toggleStrategy(strategy.id)}

// Backend Required:
POST /api/mev/strategies/{strategy_id}/toggle
{
  "action": "pause" | "resume" | "stop",
  "user_id": "current_user"
}
```

##### 🚀 Deploy New Strategy

```typescript
// Frontend: Multiple deployment functions needed

// Arbitrage Strategy
const deployArbitrageStrategy = async () => {
  // Backend: POST /api/mev/strategies/deploy
  {
    "strategy_type": "arbitrage",
    "parameters": {
      "min_profit_threshold": 0.01,
      "max_gas_price": 50,
      "target_pairs": ["USDC/WETH", "DAI/USDC"],
      "slippage_tolerance": 0.5
    }
  }
};

// Liquidation Strategy
const deployLiquidationStrategy = async () => {
  // Backend: POST /api/mev/strategies/deploy
  {
    "strategy_type": "liquidation",
    "parameters": {
      "health_factor_threshold": 1.05,
      "protocols": ["Compound", "Aave", "MakerDAO"],
      "min_collateral_value": 1000
    }
  }
};

// Sandwich Strategy
const deploySandwichStrategy = async () => {
  // Backend: POST /api/mev/strategies/deploy
  {
    "strategy_type": "sandwich",
    "parameters": {
      "min_profit": 0.005,
      "max_frontrun_gas": 200000,
      "target_pools": ["Uniswap_V3", "SushiSwap"]
    }
  }
};
```

##### 📈 Performance Metrics

```typescript
// Real-time updates - useEffect Line 343
useEffect(() => {
  if (!isLive) return;
  const interval = setInterval(async () => {
    // Backend: GET /api/mev/performance/live
    const metrics = await fetch("/api/mev/performance/live");
    setMevStats(await metrics.json());
  }, 1000);
}, [isLive]);
```

---

### 📊 4. MEMPOOL MONITOR (`/mempool`)

**File**: `src/pages/MempoolMonitor.tsx`

#### Transaction Monitoring:

##### 📝 Add Contract to Track

```typescript
// Frontend: Line 718
onClick={addContractToTrack}

// Backend Required:
POST /api/mempool/track-contract
{
  "contract_address": "0x...",
  "alert_threshold": {
    "min_value": 1000,
    "gas_limit": 500000,
    "suspicious_patterns": true
  }
}
```

##### ❌ Remove Tracked Contract

```typescript
// Frontend: Line 811
onClick={() => removeTrackedContract(contract.id)}

// Backend Required:
DELETE /api/mempool/track/{contract_id}
```

##### 🔍 Transaction Selection

```typescript
// Frontend: Line 1166
onClick={() => setSelectedTx(tx)}

// Backend Required:
GET /api/mempool/transaction/{tx_hash}/details
{
  "hash": "0x...",
  "block_number": 18500000,
  "analysis": {
    "mev_probability": 0.85,
    "threat_level": "medium",
    "gas_optimization": "poor"
  }
}
```

---

### 🕰️ 5. TIME MACHINE (`/time-machine`)

**File**: `src/pages/TimeMachine.tsx`

#### Historical Analysis:

##### ▶️ Play Attack Visualization

```typescript
// Frontend: Line 801
onClick={() => playAttackVisualization(attack)}

// Backend Required:
POST /api/time-machine/replay-attack
{
  "attack_id": "unique_attack_id",
  "block_range": {
    "start": 18000000,
    "end": 18000010
  },
  "visualization_speed": 1.5
}
```

##### 🔍 Analyze Historical Event

```typescript
// Frontend: Line 1095
onClick={() => {
  if (event.attackId) {
    analyzeHistoricalAttack(event.attackId);
  }
}}

// Backend Required:
GET /api/time-machine/attack/{attack_id}/analysis
{
  "attack_vector": "flash_loan",
  "profit_amount": "150.5 ETH",
  "victim_protocols": ["Compound", "Uniswap"],
  "timeline": [...],
  "reproduction_steps": [...]
}
```

---

### 🐛 6. BUG BOUNTY SYSTEM (`/bugbounty`)

**File**: `src/pages/BugBounty.tsx`

#### Bounty Management:

##### 👁️ View Bounty Details

```typescript
// Frontend: Line 495
onClick={() => setSelectedBounty(bounty)}

// Backend Required:
GET /api/bounty/programs/{bounty_id}
{
  "id": "bounty_123",
  "title": "Smart Contract Audit",
  "description": "...",
  "reward": "5000 USDC",
  "deadline": "2024-12-31",
  "requirements": [...],
  "submissions": 5
}
```

##### 📤 Submit Bounty Report

```typescript
// New function needed:
const submitBountyReport = async (bountyId: string, report: any) => {
  // Backend: POST /api/bounty/submit
  {
    "bounty_id": bountyId,
    "title": "Critical Vulnerability Found",
    "description": "Detailed vulnerability report...",
    "severity": "critical",
    "proof_of_concept": "...",
    "attachments": ["file1.pdf", "exploit.js"]
  }
};
```

---

### ⚙️ 7. SETTINGS PAGE (`/settings`)

**File**: `src/pages/Settings.tsx`

#### Configuration Management:

##### 🧪 Test Connection Buttons

```typescript
// RPC Test - Line 433
onClick={() => testConnection(network.toUpperCase(), url)}

// API Key Test - Line 496
onClick={() => testConnection(service.toUpperCase(), key)}

// Notification Tests - Lines 573, 643, 699
onClick={() => testConnection("Telegram", notificationConfig.telegram)}

// Backend Required:
POST /api/settings/test-connection
{
  "service": "ETHEREUM_RPC" | "ETHERSCAN_API" | "TELEGRAM" | "SLACK" | "DISCORD",
  "configuration": {
    "url": "https://...",
    "api_key": "...",
    "webhook_url": "..."
  }
}
```

##### 🗑️ Clear All Data

```typescript
// Frontend: Line 806
onClick={handleClearAllData}

// Backend Required:
POST /api/settings/clear-user-data
{
  "user_id": "current_user",
  "clear_options": {
    "scan_history": true,
    "uploaded_files": true,
    "preferences": false
  }
}
```

##### 💾 Save Settings

```typescript
// Frontend: Line 828
onClick={handleSaveSettings}

// Backend Required:
POST /api/settings/save
{
  "user_id": "current_user",
  "rpc_config": {...},
  "api_config": {...},
  "notification_config": {...},
  "preferences": {...}
}
```

---

### 📅 8. SCHEDULER PAGE (`/scheduler`)

**File**: `src/pages/Scheduler.tsx`

#### Job Management:

##### ➕ Create Scheduled Jobs

```typescript
// Security Scan Job
const createSecurityScanJob = async () => {
  // Backend: POST /api/scheduler/jobs
  {
    "name": "Daily Security Scan",
    "schedule": "0 2 * * *",  // Cron expression
    "job_type": "security_scan",
    "parameters": {
      "scan_depth": "full",
      "notify_on_completion": true,
      "target_contracts": ["all_monitored"]
    }
  }
};

// Report Generation Job
const createReportJob = async () => {
  // Backend: POST /api/scheduler/jobs
  {
    "name": "Weekly Performance Report",
    "schedule": "0 0 * * 1",  // Every Monday
    "job_type": "generate_report",
    "parameters": {
      "report_type": "performance",
      "email_recipients": ["admin@scorpius.com"],
      "include_charts": true
    }
  }
};
```

##### ⏸️ Pause/Resume Jobs

```typescript
// Job control functions needed:
const pauseJob = async (jobId: string) => {
  // Backend: POST /api/scheduler/jobs/{job_id}/pause
};

const resumeJob = async (jobId: string) => {
  // Backend: POST /api/scheduler/jobs/{job_id}/resume
};

const deleteJob = async (jobId: string) => {
  // Backend: DELETE /api/scheduler/jobs/{job_id}
};
```

---

### 🎓 9. TRAINING PAGE (`/training`)

**File**: `src/pages/Training.tsx`

#### Learning Management:

##### 📚 Course Enrollment

```typescript
// Function needed:
const enrollInCourse = async (courseId: string) => {
  // Backend: POST /api/training/enroll
  {
    "course_id": courseId,
    "user_id": "current_user",
    "enrollment_date": "2024-01-15"
  }
};
```

##### 🎮 Start Simulation

```typescript
const startSecuritySimulation = async (simId: string) => {
  // Backend: POST /api/training/simulations/{sim_id}/start
  {
    "simulation_id": simId,
    "user_id": "current_user",
    "difficulty": "intermediate",
    "scenario": "defi_exploit_simulation"
  }
};
```

---

### 📊 10. MONITORING PAGE (`/monitoring`)

**File**: `src/pages/Monitoring.tsx`

#### System Health Monitoring:

##### 🔄 Refresh Metrics

```typescript
// Frontend: Line 500
onClick={() => addNotification("Alert settings updated", "info")}

// Backend Required:
GET /api/monitoring/metrics/refresh
{
  "cpu_usage": 45.2,
  "memory_usage": 67.8,
  "disk_usage": 23.1,
  "network_latency": 12,
  "active_connections": 1247
}
```

##### 🚨 Service Health Check

```typescript
// Frontend: Line 765
onClick={() => setSelectedService(service)}

// Backend Required:
GET /api/monitoring/services/{service_name}/health
{
  "service": "scanner_api",
  "status": "healthy",
  "uptime": "99.97%",
  "last_error": null,
  "performance_metrics": {...}
}
```

---

### 🕷️ 11. TRAP GRID PAGE (`/trapgrid`)

**File**: `src/pages/TrapGrid.tsx`

#### Honeypot Detection:

##### 🎯 Event Selection

```typescript
// Frontend: Line 453
onClick={() => setSelectedEvent(event)}

// Backend Required:
GET /api/honeypot/events/{event_id}
{
  "event_id": "trap_001",
  "threat_type": "malicious_contract",
  "detected_at": "2024-01-15T10:30:00Z",
  "source_ip": "192.168.1.100",
  "contract_address": "0x...",
  "threat_level": "high",
  "details": {...}
}
```

---

### 📝 12. REPORTS PAGE (`/reports`)

**File**: `src/pages/Reports.tsx`

#### Report Generation:

##### 📄 Generate Reports

```typescript
// Functions needed:
const generateSecurityReport = async () => {
  // Backend: POST /api/reports/generate/security
  {
    "report_type": "security_audit",
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "include_sections": ["vulnerabilities", "recommendations", "metrics"],
    "format": "pdf"
  }
};

const generateMEVReport = async () => {
  // Backend: POST /api/reports/generate/mev
  {
    "report_type": "mev_performance",
    "strategy_filter": ["arbitrage", "liquidation"],
    "profit_threshold": 0.01,
    "format": "excel"
  }
};
```

---

## ���� WEBSOCKET CONNECTIONS

### Real-time Data Streams

#### Dashboard Live Updates

```typescript
// src/services/websocket.ts
const websocketConfig = {
  dashboard: {
    url: "ws://localhost:8000/ws/dashboard",
    subscriptions: [
      "threat_alerts",
      "system_metrics",
      "transaction_monitoring",
      "scan_progress",
    ],
  },

  mempool: {
    url: "ws://localhost:8002/ws/mempool",
    subscriptions: [
      "pending_transactions",
      "mev_opportunities",
      "gas_price_updates",
    ],
  },

  mev: {
    url: "ws://localhost:8003/ws/mev",
    subscriptions: [
      "strategy_performance",
      "arbitrage_opportunities",
      "liquidation_alerts",
    ],
  },
};
```

#### Backend WebSocket Handlers Required:

```python
# backend/websocket_handlers.py

@websocket.route("/ws/dashboard")
async def dashboard_websocket(websocket):
    await websocket.accept()
    while True:
        # Send real-time updates
        data = {
            "type": "metrics_update",
            "timestamp": datetime.now().isoformat(),
            "data": get_current_metrics()
        }
        await websocket.send_json(data)
        await asyncio.sleep(1)

@websocket.route("/ws/mempool")
async def mempool_websocket(websocket):
    # Real-time transaction monitoring
    pass

@websocket.route("/ws/mev")
async def mev_websocket(websocket):
    # MEV opportunity alerts
    pass
```

---

## 📁 FILE UPLOAD SYSTEMS

### Scanner File Upload

```typescript
// Frontend: src/pages/CodeMatcher.tsx
const uploadContract = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "scan_options",
    JSON.stringify({
      auto_analyze: true,
      check_dependencies: true,
      ai_analysis: true,
    }),
  );

  // Backend: POST /api/scanner/upload
  const response = await fetch("/api/scanner/upload", {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
};
```

### Backend File Handler Required:

```python
# backend/routes/scanner.py
@router.post("/api/scanner/upload")
async def upload_contract(
    file: UploadFile = File(...),
    scan_options: str = Form(...)
):
    # Validate file type (.sol, .vy, .json)
    # Save to secure storage
    # Queue for analysis
    # Return upload confirmation
    pass
```

---

## ⚡ REAL-TIME DATA FLOWS

### 1. Live Dashboard Updates

```typescript
// Component: Dashboard.tsx - Line 96
useEffect(() => {
  if (!isLive) return;

  const interval = setInterval(() => {
    // Update threat count
    setStats((prev) => ({
      ...prev,
      activeThreats: prev.activeThreats + Math.floor(Math.random() * 3),
    }));
  }, 2000);
}, [isLive]);
```

**Backend Required:**

```python
# Real-time stats endpoint
@router.get("/api/dashboard/live-stats")
async def get_live_stats():
    return {
        "active_threats": get_current_threat_count(),
        "scans_running": get_active_scan_count(),
        "mev_profit": get_current_mev_profit(),
        "system_health": get_system_health_percentage()
    }
```

### 2. MEV Strategy Performance

```typescript
// Component: MEVOperations.tsx - Line 343
useEffect(() => {
  if (!isLive) return;

  const interval = setInterval(async () => {
    // Simulate MEV profit updates
    setMevStats((prev) => ({
      ...prev,
      totalProfit: prev.totalProfit + Math.random() * 0.5,
    }));
  }, 1500);
}, [isLive]);
```

### 3. Mempool Transaction Stream

```typescript
// Component: MempoolMonitor.tsx
// Real-time transaction monitoring needed
const subscribeToMempoolStream = () => {
  const ws = new WebSocket("ws://localhost:8002/ws/mempool");
  ws.onmessage = (event) => {
    const transaction = JSON.parse(event.data);
    setTransactions((prev) => [transaction, ...prev.slice(0, 99)]);
  };
};
```

---

## 🚨 ERROR HANDLING

### Frontend Error Handling

```typescript
// src/services/api.ts
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Handle authentication errors
        localStorage.removeItem("scorpius_token");
        throw new Error("Authentication failed");
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.warn(`🔌 Backend server not available for ${endpoint}`);
      throw new Error(`Backend not available: ${endpoint}`);
    }
    throw error;
  }
};
```

### Backend Error Responses Required:

```python
# Standard error response format
{
  "error": True,
  "message": "Human readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific field that caused error",
    "value": "invalid value"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🛠️ BACKEND ROUTE SPECIFICATIONS

### Authentication Routes (`/api/auth/`)

```python
POST   /api/auth/login           # User login
GET    /api/auth/me              # Current user info
POST   /api/auth/logout          # User logout
POST   /api/auth/refresh         # Refresh JWT token
```

### Dashboard Routes (`/api/dashboard/`)

```python
GET    /api/dashboard/stats              # Dashboard statistics
GET    /api/dashboard/live-stats         # Real-time stats
GET    /api/dashboard/notifications      # User notifications
POST   /api/dashboard/notifications/toggle  # Toggle notifications
POST   /api/dashboard/alerts/{id}/read   # Mark alert as read
DELETE /api/dashboard/alerts/{id}        # Delete alert
```

### Scanner Routes (`/api/scanner/`)

```python
POST   /api/scanner/upload           # Upload contract file
POST   /api/scanner/analyze          # Analyze contract
GET    /api/scanner/scan/{id}        # Get scan result
POST   /api/scanner/scan/{id}/cancel # Cancel scan
POST   /api/scanner/batch-analyze    # Batch analysis
GET    /api/scanner/history          # Scan history
DELETE /api/scanner/files/{id}       # Delete uploaded file
POST   /api/scanner/export           # Export results
```

### MEV Routes (`/api/mev/`)

```python
GET    /api/mev/strategies              # List strategies
POST   /api/mev/strategies/deploy       # Deploy strategy
POST   /api/mev/strategies/{id}/pause   # Pause strategy
POST   /api/mev/strategies/{id}/resume  # Resume strategy
POST   /api/mev/strategies/{id}/stop    # Stop strategy
GET    /api/mev/performance             # Performance metrics
GET    /api/mev/opportunities           # Current opportunities
```

### Mempool Routes (`/api/mempool/`)

```python
GET    /api/mempool/transactions    # Pending transactions
POST   /api/mempool/track-contract  # Track contract
DELETE /api/mempool/track/{id}      # Stop tracking
GET    /api/mempool/alerts          # Mempool alerts
GET    /api/mempool/live             # Live mempool data
```

### Time Machine Routes (`/api/time-machine/`)

```python
GET    /api/time-machine/blocks         # Historical blocks
POST   /api/time-machine/replay-attack  # Replay attack
GET    /api/time-machine/attack/{id}    # Attack details
POST   /api/time-machine/analyze        # Analyze transaction
```

### Bug Bounty Routes (`/api/bounty/`)

```python
GET    /api/bounty/programs         # Active bounties
GET    /api/bounty/programs/{id}    # Bounty details
POST   /api/bounty/submit           # Submit report
GET    /api/bounty/submissions      # User submissions
GET    /api/bounty/leaderboard      # Bounty leaderboard
```

### Training Routes (`/api/training/`)

```python
GET    /api/training/courses            # Available courses
POST   /api/training/enroll             # Enroll in course
GET    /api/training/progress/{user}    # User progress
GET    /api/training/simulations        # Available simulations
POST   /api/training/simulations/{id}/start  # Start simulation
```

### Scheduler Routes (`/api/scheduler/`)

```python
GET    /api/scheduler/jobs          # List scheduled jobs
POST   /api/scheduler/jobs          # Create job
POST   /api/scheduler/jobs/{id}/pause   # Pause job
POST   /api/scheduler/jobs/{id}/resume  # Resume job
DELETE /api/scheduler/jobs/{id}     # Delete job
```

### Monitoring Routes (`/api/monitoring/`)

```python
GET    /api/monitoring/health       # System health
GET    /api/monitoring/metrics      # System metrics
GET    /api/monitoring/services     # Service status
GET    /api/monitoring/alerts       # System alerts
```

### Reports Routes (`/api/reports/`)

```python
POST   /api/reports/generate/{type}    # Generate report
GET    /api/reports/history            # Report history
GET    /api/reports/download/{id}      # Download report
```

### Settings Routes (`/api/settings/`)

```python
GET    /api/settings/config             # User configuration
POST   /api/settings/config             # Save configuration
POST   /api/settings/test-connection    # Test service connection
POST   /api/settings/clear-user-data    # Clear user data
POST   /api/settings/export             # Export config
POST   /api/settings/import             # Import config
```

---

## 🎯 INTEGRATION CHECKLIST

### ✅ Authentication System

- [ ] JWT token generation and validation
- [ ] User session management
- [ ] Permission-based access control
- [ ] Token refresh mechanism

### ✅ File Upload System

- [ ] Multi-part file upload handling
- [ ] File type validation (.sol, .vy, .json)
- [ ] Secure file storage
- [ ] File cleanup mechanisms

### ✅ WebSocket Connections

- [ ] Real-time dashboard updates
- [ ] Mempool transaction stream
- [ ] MEV opportunity alerts
- [ ] System health monitoring

### ✅ Database Integration

- [ ] User data storage
- [ ] Scan results persistence
- [ ] Configuration storage
- [ ] Audit trail logging

### ✅ External API Integration

- [ ] Ethereum RPC connections
- [ ] Etherscan API integration
- [ ] Notification service APIs (Telegram, Slack, Discord)
- [ ] IPFS for large file storage

### ✅ Security Features

- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] CORS configuration
- [ ] API key management

---

## 🚀 DEPLOYMENT REQUIREMENTS

### Backend Services

```bash
# Main API Server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Scanner Microservice
uvicorn scanner_api_server:app --host 0.0.0.0 --port 8001

# Mempool Microservice
uvicorn mempool_api_server:app --host 0.0.0.0 --port 8002

# MEV Microservice
uvicorn mev_api_server:app --host 0.0.0.0 --port 8003
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/scorpius
REDIS_URL=redis://localhost:6379

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org

# External APIs
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key

# Security
JWT_SECRET_KEY=your_secret_key
ENCRYPTION_KEY=your_encryption_key

# Notifications
TELEGRAM_BOT_TOKEN=your_telegram_token
SLACK_WEBHOOK_URL=your_slack_webhook
DISCORD_WEBHOOK_URL=your_discord_webhook
```

---

## 📊 DATA MODELS

### User Model

```python
class User(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime
    last_login: datetime
    permissions: List[str]
    subscription_tier: str
```

### Scan Result Model

```python
class ScanResult(BaseModel):
    id: str
    user_id: str
    contract_address: Optional[str]
    scan_type: str
    status: str  # queued, running, completed, failed
    vulnerabilities: List[Vulnerability]
    risk_score: float
    created_at: datetime
    completed_at: Optional[datetime]
```

### MEV Strategy Model

```python
class MEVStrategy(BaseModel):
    id: str
    user_id: str
    strategy_type: str
    parameters: Dict[str, Any]
    status: str  # active, paused, stopped
    profit_generated: float
    trades_executed: int
    created_at: datetime
```

---

## 🔧 TESTING REQUIREMENTS

### Unit Tests

- [ ] API endpoint testing
- [ ] Database model testing
- [ ] Authentication testing
- [ ] File upload testing

### Integration Tests

- [ ] Frontend-backend integration
- [ ] WebSocket connection testing
- [ ] External API integration testing
- [ ] End-to-end user workflows

### Performance Tests

- [ ] Load testing for scan endpoints
- [ ] WebSocket connection limits
- [ ] Database query optimization
- [ ] File upload performance

---

## 📋 FINAL IMPLEMENTATION NOTES

1. **All buttons and interactions** documented above MUST have corresponding backend endpoints
2. **Real-time features** require WebSocket implementation for live updates
3. **File uploads** need proper validation and security measures
4. **Authentication** must be implemented on all protected endpoints
5. **Error handling** should provide meaningful feedback to frontend
6. **Database relationships** must support the data flows described
7. **Performance optimization** is critical for real-time scanning and monitoring

This document provides **100% coverage** of every interactive element in the Scorpius frontend and maps each to specific backend requirements. Use this as your complete integration blueprint for seamless backend development.

---

**🔥 SCORPIUS CYBERSECURITY PLATFORM - READY FOR BACKEND INTEGRATION 🔥**
