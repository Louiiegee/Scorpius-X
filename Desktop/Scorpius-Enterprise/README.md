# 🦂 Scorpius Security Platform

A comprehensive blockchain security analysis platform combining vulnerability scanning, MEV simulation, and exploit analysis capabilities.

## 🚀 Quick Start (Easy Launch)

### 🎯 One-Click Options
- **Double-click `Launch-Web.bat`** → Web dashboard in browser
- **Double-click `Launch-Desktop.bat`** → Native desktop app
- **Double-click `Launch-Scorpius.bat`** → Full menu with all options

### 🔍 Check Status
- **Double-click `Quick-Status.ps1`** → See what's running

### 💻 Command Line
```powershell
.\Start-Scorpius.ps1 -Mode web       # Web dashboard
.\Start-Scorpius.ps1 -Mode electron  # Desktop app
.\Start-Scorpius.ps1 -Mode status    # Check status
```

📖 **See `QUICK_START.md` for detailed instructions**

---

## 🛠️ Initial Setup (First Time Only)

### Prerequisites
- Docker Desktop
- Git
- PowerShell (Windows) or Bash (Linux/Mac)

### Setup & Launch

1. **Clone and Setup Repositories**
   ```powershell
   # Run the setup script to clone both repositories
   .\setup-scorpius.ps1
   ```

2. **Start the Complete Platform**
   ```powershell
   # Start all services with Docker Compose
   .\scripts\start-scorpius.ps1
   ```

3. **Access the Platform**
   - **Frontend Dashboard**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **WebSocket**: ws://localhost:8001
   - **Anvil Blockchain**: http://localhost:8545

## 🏗️ Architecture

```
Scorpius Security Platform
├── backend/               # Python FastAPI backend (newScorp repo)
│   ├── vulnerability_scanner/  # Slither, MythX integration
│   ├── simulation_engine/      # Foundry/Anvil simulation
│   ├── reporting/             # AI-powered reports
│   └── api/                   # REST + WebSocket APIs
├── frontend/              # React/Next.js dashboard (new-dash repo)
│   ├── components/            # Enterprise UI components
│   ├── pages/                # Dashboard pages
│   └── lib/                  # WebSocket client
├── docker/               # Docker configuration
│   ├── Dockerfile.backend    # Backend container
│   ├── Dockerfile.frontend   # Frontend container
│   ├── nginx.conf           # Reverse proxy
│   └── init-db.sql          # Database schema
└── scripts/              # Management scripts
```

## 🔧 Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React/Next.js Enterprise Dashboard |
| Backend API | 8000 | Python FastAPI with vulnerability scanner |
| WebSocket | 8001 | Real-time data streaming |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching and sessions |
| Anvil | 8545 | Local blockchain simulation |
| Nginx | 80 | Reverse proxy and load balancer |

## 🛡️ Security Features

### Vulnerability Scanning
- **Slither Integration**: Static analysis for Solidity contracts
- **MythX Integration**: Professional security analysis
- **Real-time Scanning**: Live contract monitoring
- **Custom Rules**: Enterprise security policies

### MEV Simulation
- **Foundry/Anvil**: Safe blockchain simulation environment
- **Transaction Replay**: Historical exploit analysis
- **Strategy Testing**: MEV opportunity identification
- **Risk Assessment**: Automated vulnerability scoring

### Enterprise Features
- **Role-based Access**: Multi-tier user management
- **Audit Reports**: AI-powered PoC generation
- **Real-time Monitoring**: WebSocket-based live updates
- **API Integration**: 127 REST endpoints for automation

## 🐳 Docker Commands

```powershell
# Complete platform
.\scripts\start-scorpius.ps1

# Backend only
.\scripts\start-scorpius.ps1 -BackendOnly

# Frontend only
.\scripts\start-scorpius.ps1 -FrontendOnly

# View logs
.\scripts\start-scorpius.ps1 -Logs

# Stop platform
.\scripts\start-scorpius.ps1 -Stop

# Clean everything
.\scripts\start-scorpius.ps1 -Clean
```

## 🔍 Development

### Local Development
```powershell
# Setup development environment
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload

cd frontend
npm install
npm run dev
```

### Environment Variables
```env
# Backend
DATABASE_URL=postgresql://scorpius:scorpius123@localhost:5432/scorpius
REDIS_URL=redis://localhost:6379
MYTHX_API_KEY=your_mythx_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8001
```

## 📊 Monitoring

### Health Checks
- Backend: http://localhost:8000/health
- Frontend: http://localhost:3000/health
- Database: Automatic health monitoring
- Services: Docker Compose health checks

### Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f scorpius-backend
docker-compose logs -f scorpius-frontend
```

## 🔐 Security

### Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- Session management with Redis
- Secure password hashing

### Default Credentials
- **Username**: admin
- **Password**: admin123
- **Email**: admin@scorpius.com

## 🚀 Production Deployment

### SSL/TLS Configuration
1. Place SSL certificates in `docker/ssl/`
2. Update `nginx.conf` for HTTPS
3. Set production environment variables

### Scaling
```yaml
# Scale specific services
docker-compose up -d --scale scorpius-backend=3
docker-compose up -d --scale scorpius-frontend=2
```

## 📚 API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: http://localhost:8000/openapi.json

## 🤝 Contributing

1. Fork the repositories
2. Create feature branches
3. Submit pull requests to:
   - Backend: https://github.com/Louiiegee/newScorp
   - Frontend: https://github.com/Louiiegee/new-dash

## 📄 License

Enterprise License - Contact for commercial use.

## 🆘 Support

- **Issues**: GitHub Issues on respective repositories
- **Documentation**: Built-in help system
- **Community**: Discord support channel

---

🦂 **Scorpius Security Platform** - *Protecting the blockchain ecosystem*
