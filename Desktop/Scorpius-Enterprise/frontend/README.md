# 🦂 Scorpius - Blockchain Security Analysis Platform

**Analyze. Simulate. Exploit.**

Scorpius is a comprehensive blockchain security analysis platform featuring both web and desktop applications with advanced visualization, real-time monitoring, and AI-powered analysis capabilities.

![Scorpius Dashboard](./public/screenshot.png)

## 🚀 Features

### 🔍 **Scanner Module**

- Advanced static analysis with AI-powered detection
- 3D network topology visualization
- Multiple detection engines (Slither, Mythril, Custom Heuristics)
- Real-time vulnerability scanning

### 📊 **Mempool Monitor**

- Live transaction flow analysis
- MEV opportunity detection
- Real-time gas price tracking
- Interactive charts and metrics

### 🔧 **Bytecode Analysis**

- Deep bytecode inspection and decompilation
- Function complexity analysis
- Vulnerability pattern detection
- Interactive flow diagrams

### ⏰ **Time Machine**

- Historical blockchain state simulation
- Security event timeline
- Exploit replay functionality
- Fork-based analysis

### 🎮 **Simulation Engine**

- 3D transaction simulation
- Fuzzing and exploit generation
- Mainnet-forked environments
- Real-time transaction visualization

### 📈 **Reports**

- Comprehensive security analytics
- Multi-format export (PDF, CSV, JSON)
- Custom report templates
- Performance metrics dashboard

### 💰 **MEV Operations**

- MEV opportunity tracking
- Strategy performance analysis
- Profit optimization tools
- Risk assessment

### 🎯 **Honeypot Detector**

- Multi-dimensional risk assessment
- Behavioral pattern analysis
- Interactive radar charts
- Risk factor visualization

### ⚙️ **System Monitoring**

- Real-time health metrics
- Performance alerts
- Resource utilization tracking
- System configuration management

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: TailwindCSS, shadcn/ui, Framer Motion
- **Charts**: Recharts, D3.js
- **3D Graphics**: Three.js, React Three Fiber
- **Desktop**: Electron
- **Build Tools**: Vite, ESBuild

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Web Application

```bash
# Clone the repository
git clone https://github.com/your-org/scorpius-dashboard.git
cd scorpius-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Electron Desktop Application

```bash
# Install Electron dependencies
cd electron
npm install

# Development mode (starts both web and electron)
npm run electron:dev

# Build desktop app for all platforms
npm run electron:build

# Build for specific platforms
npm run electron:dist-mac    # macOS
npm run electron:dist-win    # Windows
npm run electron:dist-linux  # Linux
```

## 🔌 API Integration

### Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_BASE_URL=ws://localhost:3001
VITE_API_TIMEOUT=30000

# Authentication
VITE_JWT_SECRET=your-secret-key
VITE_JWT_EXPIRES_IN=24h

# Blockchain RPC
VITE_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-key
VITE_POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your-key
VITE_BSC_RPC_URL=https://bsc-dataseed.binance.org/

# External Services
VITE_FLASHLOAN_PROVIDER_API=your-api-key
VITE_MEV_RELAY_URL=https://relay.flashbots.net

# Redis (for caching and WebSocket)
VITE_REDIS_URL=redis://localhost:6379
```

### API Endpoints Summary

The complete API specification is available in [`API_SPECIFICATION.md`](./API_SPECIFICATION.md).

#### Core Modules:

| Module             | REST Endpoints       | WebSocket           | Description                                 |
| ------------------ | -------------------- | ------------------- | ------------------------------------------- |
| **Authentication** | `/api/auth/*`        | `/ws/auth/status`   | User authentication & authorization         |
| **Scanner**        | `/api/scanner/*`     | `/ws/scanner/*`     | Vulnerability scanning & network topology   |
| **Mempool**        | `/api/mempool/*`     | `/ws/mempool/*`     | Live transaction monitoring & MEV detection |
| **Bytecode**       | `/api/bytecode/*`    | `/ws/bytecode/*`    | Code analysis & decompilation               |
| **Time Machine**   | `/api/timemachine/*` | `/ws/timemachine/*` | Historical analysis & replay                |
| **Simulation**     | `/api/simulation/*`  | `/ws/simulation/*`  | Environment simulation & fuzzing            |
| **Reports**        | `/api/reports/*`     | `/ws/reports/*`     | Analytics & report generation               |
| **MEV Operations** | `/api/mev/*`         | `/ws/mev/*`         | MEV strategy management                     |
| **Honeypot**       | `/api/honeypot/*`    | `/ws/honeypot/*`    | Risk assessment & detection                 |
| **Settings**       | `/api/settings/*`    | `/ws/settings/*`    | System configuration & health               |

### WebSocket Integration

```typescript
// Example WebSocket connection
const ws = new WebSocket("ws://localhost:3001/ws/scanner/progress");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time scan progress
};
```

### REST API Usage

```typescript
// Example API call
const scanContract = async (address: string) => {
  const response = await fetch("/api/scanner/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contract: address }),
  });

  return response.json();
};
```

## 🖥 Desktop Features

### Native Integration

- **File Operations**: Native file dialogs for contract uploads
- **Menu Integration**: Full native menu support with keyboard shortcuts
- **Auto Updates**: Automatic application updates
- **System Tray**: Background monitoring capabilities
- **Native Notifications**: System-level alert notifications

### Keyboard Shortcuts

| Shortcut               | Action             |
| ---------------------- | ------------------ |
| `Ctrl/Cmd + N`         | New Scan           |
| `Ctrl/Cmd + O`         | Open Contract      |
| `Ctrl/Cmd + E`         | Export Report      |
| `Ctrl/Cmd + 1-9`       | Navigate to Module |
| `Ctrl/Cmd + Shift + M` | Start Monitoring   |
| `Ctrl/Cmd + Shift + S` | Stop All Scans     |

## 🔧 Development

### Project Structure

```
scorpius-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   └── charts/             # Chart components
│   ├── hooks/                  # React hooks
│   ├── pages/                  # Page components
│   └── lib/                    # Utilities
├── electron/                   # Electron main process
├── scripts/                    # Build scripts
└── public/                     # Static assets
```

### Adding New Features

1. **Create Component**: Add new component in `src/components/`
2. **Add API Integration**: Update API calls in hooks
3. **Update Types**: Add TypeScript interfaces
4. **Add Tests**: Include unit tests for new features
5. **Update Docs**: Document new endpoints in API_SPECIFICATION.md

### Code Style

```bash
# Format code
npm run format.fix

# Type checking
npm run typecheck

# Run tests
npm run test
```

## 🚢 Deployment

### Web Deployment

```bash
# Build for production
npm run build

# Deploy to your hosting platform
# The built files will be in the 'dist' directory
```

### Desktop Distribution

```bash
# Build for all platforms
npm run electron:build

# The built applications will be in electron/dist/
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

## 📊 Monitoring & Analytics

### Performance Metrics

- Real-time system health monitoring
- API response time tracking
- Memory and CPU usage alerts
- WebSocket connection health

### Error Tracking

- Comprehensive error logging
- User activity tracking
- Performance bottleneck identification
- Crash reporting

## 🔒 Security

### Authentication

- JWT-based authentication
- Role-based access control (RBAC)
- Session management
- Secure token storage

### API Security

- Rate limiting
- Input validation
- CORS configuration
- Request/response encryption

### Desktop Security

- Code signing for desktop builds
- Secure update mechanism
- Sandboxed renderer processes
- Restricted node integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the established code style
- Add meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.scorpius.security](https://docs.scorpius.security)
- **API Reference**: [api.scorpius.security](https://api.scorpius.security)
- **Issues**: [GitHub Issues](https://github.com/your-org/scorpius-dashboard/issues)
- **Discord**: [Community Server](https://discord.gg/scorpius)

## 🗺 Roadmap

### Q1 2024

- [ ] Advanced AI-powered analysis
- [ ] Multi-chain support (Polygon, BSC, Arbitrum)
- [ ] Real-time collaboration features
- [ ] Advanced MEV strategies

### Q2 2024

- [ ] Mobile application
- [ ] Plugin ecosystem
- [ ] Custom analysis rules
- [ ] Enterprise features

### Q3 2024

- [ ] Decentralized scanning network
- [ ] Integration with major security tools
- [ ] Advanced reporting features
- [ ] Performance optimizations

---

**Built with ❤️ by the Scorpius Security Team**

_Analyze. Simulate. Exploit._
