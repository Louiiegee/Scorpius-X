# 🦂 Scorpius Security Platform - Quick Start Guide

## 🚀 Getting Started in 30 Seconds

### One-Click Launch Options

**🌐 Web Dashboard (Recommended for First-Time Users)**
```powershell
.\Start-Scorpius.ps1 -Mode web
```

**📱 Desktop App (Native Electron Experience)**
```powershell
.\Start-Scorpius.ps1 -Mode electron
```

**📊 Check What's Running**
```powershell
.\Start-Scorpius.ps1 -Mode status
```

### 🎯 What Each Mode Does

| Mode | Description | Best For |
|------|-------------|----------|
| **Web** | Browser-based dashboard at `http://localhost:3002` | First-time users, demonstrations |
| **Electron** | Native desktop app with DevTools | Development, power users |
| **Backend** | API services only | API testing, development |
| **Full** | Complete platform with all services | Production-like environment |
| **Status** | Check what services are running | Troubleshooting |

### 🔗 Access Points Once Running

- **Main Web Interface**: http://localhost (via Nginx)
- **Direct Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Dev Server**: http://localhost:8080 (Electron development)

### 🛠️ What Gets Started Automatically

- ✅ **Backend API** (FastAPI) - Port 3001
- ✅ **PostgreSQL Database** - Port 5432
- ✅ **Redis Cache** - Port 6379
- ✅ **Frontend Web App** - Port 3002
- ✅ **Nginx Proxy** - Port 80
- ✅ **Anvil Blockchain** - Port 8545 (for smart contract testing)

### 🐛 Troubleshooting

**If something doesn't start:**
1. Run `.\Start-Scorpius.ps1 -Mode status` to see what's working
2. Check Docker is running: `docker ps`
3. Restart Docker Desktop if needed
4. Re-run your preferred mode

**Common Issues:**
- **Port conflicts**: Close other applications using ports 3001, 3002, 80
- **Docker not running**: Start Docker Desktop
- **Slow startup**: Give it 30-60 seconds for all services to initialize

### 🔧 Advanced Options

**Stop everything:**
```powershell
.\scripts\start-scorpius.ps1 -Stop
```

**View logs:**
```powershell
.\scripts\start-scorpius.ps1 -Logs
```

**Rebuild containers (if you made changes):**
```powershell
docker-compose down
docker-compose up -d --build
```

## 🎯 For Future Sessions

1. Open PowerShell in this directory
2. Run `.\Start-Scorpius.ps1` 
3. Choose your preferred mode (1-5)
4. Wait for services to start (~30-60 seconds)
5. Open your browser or use the Electron app

**That's it! 🎉**

---

**💡 Pro Tip**: Bookmark this folder and use `.\Start-Scorpius.ps1 -Mode web` for the fastest startup experience.
