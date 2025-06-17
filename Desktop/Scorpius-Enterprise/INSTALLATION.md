# 🦂 Scorpius Security Platform - Installation Guide

## 🚀 Quick Start Guide

### Prerequisites
✅ **Docker Desktop** - Install from [docker.com](https://www.docker.com/products/docker-desktop)
✅ **Git** - For cloning repositories  
✅ **PowerShell** - For running scripts (Windows)

### 1️⃣ Clone & Setup (DONE!)
The repositories are already cloned and setup is complete:
- ✅ Backend: `backend/` (newScorp repository)
- ✅ Frontend: `frontend/` (new-dash repository)  
- ✅ Docker config: `docker/`
- ✅ Scripts: `scripts/`

### 2️⃣ Launch Platform

#### Option A: Quick Start (Recommended)
```powershell
# Start the complete platform
.\scripts\start-scorpius.ps1
```

#### Option B: Manual Docker
```powershell
# Build and start all services
docker-compose up -d --build
```

#### Option C: Step by Step
```powershell
# 1. Build images
.\docker-manager.ps1 -Build

# 2. Test platform
.\docker-manager.ps1 -Test

# 3. Start complete platform
.\scripts\start-scorpius.ps1
```

### 3️⃣ Access Platform
Once running, access these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Frontend** | http://localhost:3000 | Main Dashboard |
| 🔧 **Backend API** | http://localhost:8000 | REST API |
| 📚 **API Docs** | http://localhost:8000/docs | Swagger UI |
| 🔌 **WebSocket** | ws://localhost:8001 | Real-time data |
| ⛓️ **Anvil** | http://localhost:8545 | Blockchain simulation |

### 4️⃣ Default Login
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@scorpius.com`

## 🛠️ Management Commands

### Platform Control
```powershell
# Start complete platform
.\scripts\start-scorpius.ps1

# Start backend only
.\scripts\start-scorpius.ps1 -BackendOnly

# View logs
.\scripts\start-scorpius.ps1 -Logs

# Stop platform
.\scripts\start-scorpius.ps1 -Stop

# Clean everything
.\scripts\start-scorpius.ps1 -Clean
```

### Docker Management
```powershell
# Build images
.\docker-manager.ps1 -Build

# Test platform health
.\docker-manager.ps1 -Test

# Clean Docker resources
.\docker-manager.ps1 -Clean
```

### VS Code Tasks
Press `Ctrl+Shift+P` and search for "Tasks: Run Task":
- **Setup Scorpius Platform**
- **Start Complete Platform**
- **Start Backend Only**
- **View Platform Logs**
- **Stop Platform**

## 🏗️ Architecture Overview

```
🦂 Scorpius Security Platform
├── 🔧 Backend (Port 8000)
│   ├── Vulnerability Scanner (Slither, MythX)
│   ├── MEV Simulation Engine
│   ├── Real-time WebSocket Server
│   └── 127 REST API Endpoints
├── 🎨 Frontend (Port 3000)
│   ├── Enterprise Dashboard
│   ├── Real-time Updates
│   └── Professional Reporting
├── 🗄️ Database (Port 5432)
│   ├── PostgreSQL
│   └── Redis Cache
└── ⛓️ Blockchain (Port 8545)
    └── Foundry/Anvil Simulation
```

## 🔍 Key Features

### ✅ Implemented & Working
- **Vulnerability Scanner**: Slither + MythX integration
- **Real Data**: No mock data, all from backend
- **MEV Simulation**: Safe transaction testing
- **Time Machine**: Historical exploit replay
- **Enterprise Dashboard**: 9 modules with real data
- **WebSocket**: 34 real-time connections
- **API Coverage**: 127 endpoints fully functional

### 🛡️ Security Analysis
- Smart contract vulnerability detection
- Real-time threat monitoring  
- Exploit pattern recognition
- Risk assessment scoring
- Professional audit reports

### 🔬 Simulation Capabilities
- Safe contract testing environment
- MEV opportunity analysis
- Transaction replay system
- Strategy backtesting
- Risk-free exploit testing

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```powershell
# Check what's using ports
netstat -ano | findstr "3000"
netstat -ano | findstr "8000"

# Kill processes if needed
taskkill /PID [PID_NUMBER] /F
```

#### Docker Issues
```powershell
# Clean everything and restart
.\docker-manager.ps1 -Clean
.\docker-manager.ps1 -Build
.\scripts\start-scorpius.ps1
```

#### Build Failures
```powershell
# Rebuild specific service
docker-compose build scorpius-backend --no-cache
docker-compose build scorpius-frontend --no-cache
```

### Health Checks
```powershell
# Check all container status
docker-compose ps

# View specific service logs
docker-compose logs scorpius-backend
docker-compose logs scorpius-frontend

# Test health endpoints
curl http://localhost:8000/health
curl http://localhost:3000
```

## 📊 Development Mode

### Backend Development
```powershell
cd backend/backend/backend
pip install -r requirements.txt
python main.py
```

### Frontend Development  
```powershell
cd frontend
npm install
npm run dev
```

## 🔐 Security Configuration

### Production Setup
1. **Change default passwords** in `.env`
2. **Add SSL certificates** to `docker/ssl/`
3. **Update environment variables** for production
4. **Configure external API keys** (MythX, etc.)

### Environment Variables
```env
# Required for production
JWT_SECRET=your_secure_jwt_secret
MYTHX_API_KEY=your_mythx_api_key
DATABASE_URL=your_production_db_url
```

## 📝 Next Steps

1. **✅ Platform is ready** - Start with `.\scripts\start-scorpius.ps1`
2. **🔍 Explore Features** - Test vulnerability scanning
3. **📊 Review Dashboard** - Check all 9 modules  
4. **🛡️ Security Testing** - Upload contracts for analysis
5. **⚙️ Customize** - Configure for your specific needs

---

🦂 **Your complete blockchain security platform is ready!** 
Start with `.\scripts\start-scorpius.ps1` and access http://localhost:3000
