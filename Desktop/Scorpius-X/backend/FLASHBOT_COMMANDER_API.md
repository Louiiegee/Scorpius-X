# 🔥 FLASHBOT COMMANDER API INTEGRATION

## 🚀 **API Server for Scorpius Dashboard - Flashbot Commander Module**

**Base URL:** `http://127.0.0.1:8001`  
**WebSocket:** `ws://127.0.0.1:8001/flashbot/live`

---

## 📊 **MAIN ENDPOINTS FOR FLASHBOT COMMANDER**

### **1. Bot Status & Control**
```javascript
// Get comprehensive bot status
GET /flashbot/status
Response: {
  status: "running" | "stopped" | "error",
  mode: "demo" | "live" | "simulation",
  total_profit: 145.67,
  opportunities_found: 23,
  successful_bundles: 18,
  failed_bundles: 5,
  cycles_completed: 156,
  gas_saved: 234.50,
  success_rate: 0.78,
  last_updated: "2025-05-31T12:00:00Z",
  wallet_balances: {...},
  active_strategies: ["arbitrage", "liquidation"],
  chain_status: {...}
}

// Start Flashbot Commander
POST /flashbot/command
Body: { "action": "start" }

// Stop Flashbot Commander  
POST /flashbot/command
Body: { "action": "stop" }

// Change mode
POST /flashbot/command
Body: { 
  "action": "change_mode", 
  "parameters": { "mode": "live" }
}
```

### **2. MEV Opportunities & Bundles**
```javascript
// Get recent Flashbot bundles
GET /flashbot/bundles
Response: {
  bundles: [
    {
      bundle_id: "fb_opp_1701234567_0",
      type: "arbitrage",
      profit_usd: 67.45,
      gas_price: 45.0,
      confidence: 0.85,
      chain: "ethereum",
      tokens: ["USDC", "WETH"],
      timestamp: "2025-05-31T12:00:00Z",
      status: "included",
      block_number: 19000045,
      transaction_hash: "0x123...abc"
    }
  ],
  total_count: 25,
  successful: 18,
  failed: 7
}

// Get live opportunities being scanned
GET /flashbot/opportunities  
Response: {
  opportunities: [
    {
      id: "opp_1701234567_0",
      type: "arbitrage",
      profit_estimate: 45.67,
      confidence: 0.75,
      chain: "ethereum", 
      gas_cost: 25.0,
      time_sensitive: true,
      status: "evaluating"
    }
  ],
  count: 3
}
```

### **3. Analytics & Performance**
```javascript
// Get detailed analytics
GET /flashbot/analytics
Response: {
  performance: {
    total_profit: 234.56,
    gas_saved: 145.67,
    bundle_success_rate: 0.78,
    avg_profit_per_bundle: 12.45,
    opportunities_per_hour: 4.2,
    mev_extraction_efficiency: 0.85
  },
  chains: {
    ethereum: { active: true, profit: 120.34, bundles: 12 },
    polygon: { active: true, profit: 67.89, bundles: 8 },
    arbitrum: { active: true, profit: 34.56, bundles: 4 },
    base: { active: true, profit: 11.77, bundles: 1 }
  },
  strategies: {
    arbitrage: { enabled: true, profit: 117.28, count: 12 },
    liquidation: { enabled: true, profit: 70.37, count: 8 },
    sandwich: { enabled: false, profit: 46.91, count: 4 }
  },
  system_health: {
    rpc_latency: "12ms",
    mempool_coverage: "94%", 
    flashbot_connectivity: "optimal",
    ml_model_accuracy: "87%"
  }
}
```

### **4. Wallet & MEV Readiness**
```javascript
// Get wallet status optimized for MEV
GET /flashbot/wallet
Response: {
  balances: {
    ethereum: { balance: 0.0070, symbol: "ETH", usd_value: 21 },
    polygon: { balance: 1.4636, symbol: "MATIC", usd_value: 1 },
    total_usd: 26
  },
  mev_readiness: "low" | "medium" | "high",
  recommendations: [
    "⚠️ Balance too low for profitable MEV - minimum $1000 recommended"
  ],
  gas_reserves: {
    ethereum: 0.0007,  // 10% reserved for gas
    polygon: 0.0732,   // 5% reserved for gas
    arbitrum: 0.0000,  // 8% reserved for gas
    base: 0.0001       // 7% reserved for gas
  }
}
```

---

## 🔴 **REAL-TIME WEBSOCKET**

Connect to: `ws://127.0.0.1:8001/flashbot/live`

```javascript
// WebSocket real-time updates
const ws = new WebSocket('ws://127.0.0.1:8001/flashbot/live');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Update format:
  {
    type: "flashbot_update",
    data: {
      status: "running",
      profit: 145.67,
      bundles: 18,
      opportunities: 3,
      gas_saved: 234.50
    },
    timestamp: "2025-05-31T12:00:00Z"
  }
};
```

---

## 🎯 **FRONTEND INTEGRATION EXAMPLES**

### **Dashboard Status Card**
```javascript
// Fetch status every 3 seconds
const fetchFlashbotStatus = async () => {
  const response = await fetch('http://127.0.0.1:8001/flashbot/status');
  const status = await response.json();
  
  // Update UI elements
  document.getElementById('profit').textContent = `$${status.total_profit}`;
  document.getElementById('bundles').textContent = status.successful_bundles;
  document.getElementById('status').className = status.status === 'running' ? 'active' : 'inactive';
};
```

### **Start/Stop Controls**
```javascript
// Start Flashbot Commander
const startBot = async () => {
  const response = await fetch('http://127.0.0.1:8001/flashbot/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start' })
  });
  const result = await response.json();
  console.log('Bot started:', result);
};

// Stop Flashbot Commander
const stopBot = async () => {
  const response = await fetch('http://127.0.0.1:8001/flashbot/command', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'stop' })
  });
  const result = await response.json();
  console.log('Bot stopped:', result);
};
```

---

## 🚀 **GETTING STARTED**

1. **Start the API server:**
   ```bash
   cd C:\Users\ADMIN\Desktop\Scorpius\mev_backend
   python start_flashbot_api.py
   ```

2. **Test the API:**
   - Open: http://127.0.0.1:8001/docs (FastAPI documentation)
   - Test endpoint: http://127.0.0.1:8001/flashbot/status

3. **Integrate with your Flashbot Commander frontend:**
   - Use the endpoints above to fetch data
   - Connect WebSocket for real-time updates
   - Implement start/stop controls

---

## 📝 **NOTES**

- **Port:** API runs on `8001` to avoid conflicts
- **CORS:** Enabled for all origins (development)
- **Demo Mode:** Bot runs in simulation mode with low balance
- **Real Mode:** Requires proper wallet funding and API keys
- **Logging:** All actions logged with emoji indicators

The API is now ready for your **Flashbot Commander** module integration! 🔥⚡
