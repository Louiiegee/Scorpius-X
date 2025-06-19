# Backend Developer Integration Guide

## 🎯 **WHAT YOU NEED TO IMPLEMENT**

Your frontend is **100% complete** and ready. You just need to implement these API endpoints to make it fully functional.

## 📋 **QUICK START CHECKLIST**

### 1. **API Base URLs** (Configure these in your Python backend)

```bash
# Main API
http://localhost:8000/api

# Microservice APIs
http://localhost:8001/api  # Scanner Service
http://localhost:8002/api  # Mempool Service
http://localhost:8003/api  # MEV Service
```

### 2. **Authentication Endpoints** (Priority 1 - Required for login)

```python
# POST /api/auth/login
{
  "username": "string",
  "password": "string",
  "rememberMe": boolean
}
# Returns: JWT token + user info

# GET /api/auth/me
# Returns: Current user details

# POST /api/auth/logout
# Clears session

# POST /api/auth/refresh
# Refreshes JWT token
```

### 3. **Dashboard Data Endpoints** (Priority 2 - For main dashboard)

```python
# GET /api/dashboard/stats
# Returns: Core dashboard metrics

# GET /api/dashboard/alerts?page=1&limit=10
# Returns: Threat alerts list

# GET /api/dashboard/charts
# Returns: Chart data for visualizations
```

## 🔧 **CRITICAL DATA STRUCTURES**

### **User Response** (for auth endpoints)

```python
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "admin|analyst|viewer",
  "permissions": ["scan:execute", "mev:manage"],
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "criticalThreats": true
    }
  },
  "lastLoginAt": "2024-12-20T10:30:00.000Z"
}
```

### **Dashboard Stats** (for main dashboard)

```python
{
  "threatsDetected": 47,
  "activeScans": 12,
  "activeBots": 8,
  "systemUptime": 2592000,
  "lastScanTime": "2024-12-20T10:25:00.000Z",
  "totalTransactions": 1847293,
  "mevOpportunities": 234,
  "securityScore": 94.7
}
```

### **Threat Alert Structure**

```python
{
  "id": "string",
  "type": "critical|high|medium|low",
  "title": "Honeypot Contract Detected",
  "description": "Detailed threat description",
  "contractAddress": "0x742d35Cc...",
  "severity": 9.2,
  "status": "active|investigating|resolved",
  "detectedAt": "2024-12-20T10:15:00.000Z",
  "metadata": {
    "confidence": 0.96,
    "estimatedLoss": "$50,000"
  }
}
```

## 🚀 **SMART CONTRACT SCANNER ENDPOINTS**

```python
# POST /api/scanner/analyze
{
  "contractAddress": "0x742d35Cc...",
  "scanType": "quick|full|deep"
}

# GET /api/scanner/results?page=1&limit=20
# Returns: Paginated scan results

# POST /api/scanner/upload
# File upload for contract analysis
```

## 🤖 **MEV OPERATIONS ENDPOINTS**

```python
# GET /api/mev/strategies?page=1&limit=20
# Returns: MEV strategies list

# POST /api/mev/deploy-strategy
{
  "name": "Arbitrage Hunter",
  "type": "arbitrage",
  "parameters": {
    "minProfitThreshold": 50,
    "maxGasPrice": 30
  }
}

# POST /api/mev/strategies/{id}/pause
# POST /api/mev/strategies/{id}/resume
# POST /api/mev/strategies/{id}/stop
```

## 📡 **MEMPOOL MONITOR ENDPOINTS**

```python
# GET /api/mempool/transactions?page=1&limit=50
# Returns: Recent mempool transactions

# GET /api/mempool/alerts?type=mev_opportunity
# Returns: Mempool-related alerts

# GET /api/mempool/live
# Returns: Real-time mempool statistics
```

## ⚡ **REAL-TIME WEBSOCKET** (Optional but recommended)

```python
# WebSocket endpoint: ws://localhost:8000/ws
# Send real-time updates for:
{
  "type": "threat_detected",
  "payload": { /* threat data */ }
}

{
  "type": "mev_opportunity",
  "payload": { /* opportunity data */ }
}

{
  "type": "scan_complete",
  "payload": { /* scan results */ }
}
```

## 🔒 **AUTHENTICATION FLOW**

1. **Frontend sends login request** → `POST /api/auth/login`
2. **Backend validates credentials** → Returns JWT token
3. **Frontend stores token** → Includes in all subsequent requests
4. **Backend validates token** → On every protected endpoint
5. **Auto token refresh** → `POST /api/auth/refresh` before expiry

## 📊 **DATABASE MODELS YOU NEED**

### **Users Table**

```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR,
    password_hash VARCHAR,
    role VARCHAR,
    permissions JSON,
    created_at TIMESTAMP,
    last_login_at TIMESTAMP
);
```

### **Scan Results Table**

```sql
CREATE TABLE scan_results (
    id VARCHAR PRIMARY KEY,
    contract_address VARCHAR,
    scan_type VARCHAR,
    status VARCHAR,
    results JSON,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

### **Threat Alerts Table**

```sql
CREATE TABLE threat_alerts (
    id VARCHAR PRIMARY KEY,
    type VARCHAR,
    title VARCHAR,
    description TEXT,
    severity FLOAT,
    status VARCHAR,
    detected_at TIMESTAMP,
    metadata JSON
);
```

## 🔌 **INTEGRATION WITH YOUR PYTHON MODULES**

### **Connect Your Existing Modules**

```python
# In your API endpoints, use your existing modules:

from your_modules.scanner import SmartContractScanner
from your_modules.mev import MEVDetector
from your_modules.mempool import MempoolMonitor

@app.post("/api/scanner/analyze")
async def analyze_contract(request):
    scanner = SmartContractScanner()
    result = scanner.scan(request.contract_address)
    return format_scan_result(result)

@app.get("/api/mev/opportunities")
async def get_mev_opportunities():
    detector = MEVDetector()
    opportunities = detector.find_opportunities()
    return format_opportunities(opportunities)
```

## 🛠️ **SIMPLE PYTHON FLASK EXAMPLE**

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Your existing modules
from your_modules.scanner import SmartContractScanner
from your_modules.mempool import MempoolMonitor

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    # Validate credentials with your existing auth
    if validate_user(data['username'], data['password']):
        token = jwt.encode({
            'username': data['username'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, 'your-secret-key')

        return jsonify({
            'user': get_user_data(data['username']),
            'accessToken': token,
            'expiresIn': 86400
        })
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/dashboard/stats')
def dashboard_stats():
    # Use your existing modules to get real data
    scanner = SmartContractScanner()
    mempool = MempoolMonitor()

    return jsonify({
        'threatsDetected': scanner.get_threat_count(),
        'activeScans': scanner.get_active_scans(),
        'totalTransactions': mempool.get_transaction_count(),
        'systemUptime': get_system_uptime(),
        'lastScanTime': scanner.get_last_scan_time()
    })

@app.route('/api/scanner/analyze', methods=['POST'])
def analyze_contract():
    data = request.json
    scanner = SmartContractScanner()

    # Use your existing scanner module
    result = scanner.scan_contract(
        address=data['contractAddress'],
        scan_type=data.get('scanType', 'full')
    )

    return jsonify({
        'id': generate_scan_id(),
        'contractAddress': data['contractAddress'],
        'status': 'completed',
        'results': format_scan_results(result)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
```

## 🚨 **MOCK MODE (For Testing)**

The frontend has a **mock mode** enabled by default. Your backend dev can:

1. **Start with mock data** → Frontend works immediately
2. **Implement endpoints gradually** → Replace mock data piece by piece
3. **Test each endpoint** → Switch off mock mode for testing

## 📝 **ENVIRONMENT SETUP**

Your backend dev should set these environment variables:

```bash
# API Configuration
API_BASE_URL=http://localhost:8000/api
SCANNER_API_URL=http://localhost:8001/api
MEMPOOL_API_URL=http://localhost:8002/api
MEV_API_URL=http://localhost:8003/api

# Database
DATABASE_URL=postgresql://user:pass@localhost/scorpius

# JWT Secret
JWT_SECRET_KEY=your-super-secret-key

# CORS (for frontend)
CORS_ORIGINS=http://localhost:8080
```

## 🔄 **TESTING WORKFLOW**

1. **Frontend runs on** → `http://localhost:8080`
2. **Backend runs on** → `http://localhost:8000`
3. **Test each endpoint** → Use frontend UI or curl/Postman
4. **Check logs** → Frontend console shows API calls
5. **Iterate** → Fix issues and test again

## 📞 **WHAT TO DO NEXT**

1. **Clone the frontend repo** → Already set up and working
2. **Start your Python backend** → Implement the endpoints above
3. **Test authentication first** → Get login working
4. **Add dashboard data** → Connect your existing modules
5. **Enable real-time features** → Add WebSocket support
6. **Deploy** → Use the Docker/deployment guides provided

## 🎯 **CRITICAL SUCCESS FACTORS**

- ✅ **CORS enabled** → Frontend can call backend
- ✅ **JWT authentication** → Secure API access
- ✅ **Consistent data formats** → Use the schemas provided
- ✅ **Error handling** → Return proper HTTP status codes
- ✅ **Real-time updates** → WebSocket for live data

## 📋 **PRIORITY IMPLEMENTATION ORDER**

1. **Authentication** (login/logout) - Required for access
2. **Dashboard stats** - Shows main dashboard data
3. **Scanner endpoints** - Core security functionality
4. **MEV operations** - Trading/bot functionality
5. **Real-time WebSocket** - Live updates
6. **Advanced features** - Reports, settings, etc.

---

## 🚀 **THE FRONTEND IS READY!**

Your dashboard is **production-grade** and waiting for these backend endpoints. Once implemented, you'll have a fully functional enterprise cybersecurity platform!

**Questions?** Check the comprehensive API documentation in `COMPLETE_BACKEND_INTEGRATION_GUIDE.md` or the TypeScript types in `src/types/generated.ts`.
