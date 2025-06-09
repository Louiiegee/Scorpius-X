# 🦂 Scorpius Security Platform - Setup Guide

A cyberpunk-themed blockchain security platform with advanced MEV analysis, smart contract scanning, and threat detection.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **Git**

### 1. Get All Files

You can get the complete project by:

#### Option A: Download from Current Environment

If you're in a development environment, you can export/download all files.

#### Option B: Clone from Repository

```bash
git clone <your-repository-url>
cd scorpius-dashboard
```

### 2. Frontend Setup (React/TypeScript)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Backend Setup (Python/FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install requirements and start server
python start.py
```

The backend will be available at `http://localhost:8000`

## 📁 Project Structure

```
scorpius-dashboard/
├── src/                          # Frontend React app
│   ├── components/              # Reusable components
│   │   ├── ui/                 # UI components (buttons, inputs, etc.)
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── Navbar.tsx          # Top navigation
│   │   ├── Calendar3D.tsx      # 3D calendar component
│   │   ├── Chart3D.tsx         # 3D chart visualizations
│   │   └── NetworkModel3D.tsx  # 3D network visualization
│   ├── pages/                  # Application pages
│   │   ├── Login.tsx          # Authentication page
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── SmartContractScanner.tsx
│   │   ├── MEVOperations.tsx
│   │   ├── Training.tsx       # Cyber Academy
│   │   └── ...
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   └── App.tsx               # Main app component
├── backend/                    # Python FastAPI backend
│   ├── main.py               # FastAPI application
│   ├── modules/              # Custom Python modules
│   │   ├── blockchain_scanner.py
│   │   ├── mev_analyzer.py
│   │   ├── security_auditor.py
│   │   ├── mempool_monitor.py
│   │   └── threat_detector.py
│   ├── requirements.txt      # Python dependencies
│   └── start.py             # Startup script
└── package.json             # Frontend dependencies
```

## 🔐 Authentication

**Default Login Credentials:**

- Username: `alice`
- Password: `admin123`

## 🛠 Your Python Modules

The backend includes template modules that you can replace with your actual implementations:

### blockchain_scanner.py

- Smart contract vulnerability scanning
- Bytecode analysis
- Pattern detection (ERC-20, DEX, Proxy contracts)
- Security scoring

### mev_analyzer.py

- MEV strategy deployment
- Arbitrage opportunity detection
- Performance tracking
- Strategy simulation

### security_auditor.py

- Comprehensive security audits
- Vulnerability classification
- Risk assessment
- Audit reporting

### mempool_monitor.py

- Real-time mempool monitoring
- Gas price tracking
- Transaction analysis
- Alert generation

### threat_detector.py

- Zero-day threat detection
- Active threat monitoring
- Risk assessment
- Threat intelligence

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Smart Contract Analysis

- `POST /api/scanner/analyze` - Analyze contract
- `POST /api/security/audit` - Security audit

### MEV Operations

- `POST /api/mev/deploy-strategy` - Deploy MEV strategy
- `GET /api/mev/strategies` - Get active strategies

### Monitoring

- `GET /api/mempool/alerts` - Mempool alerts
- `GET /api/threats/zero-day` - Zero-day threats
- `GET /api/system/health` - System health

## 🎨 Features

### 🌟 Cyberpunk Interface

- Neon glow effects and animations
- Helios Pro font styling
- 3D visualizations
- Holographic backgrounds

### 🛡 Security Features

- JWT authentication
- Role-based access control
- Encrypted communications
- Session management

### 📊 Dashboards

- **Mission Control** - Main overview
- **Simulate & Strike** - Contract scanning
- **Flashbot Commander** - MEV operations
- **TX Watchtower** - Mempool monitoring
- **Cyber Academy** - Training system
- **Threatboard** - Bug bounty system

### 🔄 Real-time Features

- Live mempool monitoring
- Real-time threat detection
- Animated 3D visualizations
- WebSocket connections (ready)

## 🚀 Deployment

### Development

```bash
# Frontend
npm run dev

# Backend
cd backend && python start.py
```

### Production

```bash
# Frontend build
npm run build

# Backend production
cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🔧 Customization

### Adding Your Python Code

1. Replace the template modules in `backend/modules/` with your actual implementations
2. Update the API endpoints in `main.py` to call your functions
3. Add new endpoints as needed

### Frontend Customization

1. Modify components in `src/components/`
2. Add new pages in `src/pages/`
3. Update routing in `App.tsx`
4. Customize styling in `src/index.css`

## 🐛 Troubleshooting

### Common Issues

1. **CORS errors**: Update CORS origins in `backend/main.py`
2. **Module not found**: Run `pip install -r requirements.txt`
3. **Port conflicts**: Change ports in startup scripts
4. **Authentication issues**: Check JWT secret key

### Development Tips

- Use browser dev tools for frontend debugging
- Check backend logs at `http://localhost:8000/docs`
- Enable hot reload for both frontend and backend
- Use environment variables for configuration

## 📚 Technologies Used

### Frontend

- **React** 18 with TypeScript
- **Vite** for development server
- **Tailwind CSS** for styling
- **Lucide** for icons
- **React Router** for navigation

### Backend

- **FastAPI** for API framework
- **Python** 3.8+
- **JWT** for authentication
- **Uvicorn** for ASGI server
- **Web3.py** for blockchain interaction

## 💫 Next Steps

1. **Replace template modules** with your actual Python code
2. **Configure blockchain connections** (Infura, Alchemy, etc.)
3. **Set up database** (PostgreSQL, MongoDB, etc.)
4. **Add WebSocket** for real-time updates
5. **Deploy to production** (AWS, GCP, etc.)

---

**🦂 Scorpius Security Platform v3.1.0**  
_Advanced Blockchain Security Operations Center_
