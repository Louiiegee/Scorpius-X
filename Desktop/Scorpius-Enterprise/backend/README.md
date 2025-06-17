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
# (Assuming an electron subfolder setup as per package.json scripts)
# If electron setup is different, adjust path.
# npm install (if electron has its own package.json)

# Development mode (starts both web and electron)
npm run electron:dev

# Build desktop app for all platforms
npm run electron:build # (This script needs to exist as per package.json)
# Or more specific dist commands:
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
const ws = new WebSocket("ws://localhost:3001/ws/scanner/progress"); // Example endpoint

ws.onmessage = (event) => {
  const data = JSON.parse(event.data as string);
  // Handle real-time scan progress
  console.log(data);
};
```

### REST API Usage

```typescript
// Example API call (ensure token management is implemented)
const scanContract = async (address: string, token: string) => {
  const response = await fetch("/api/scanner/scan", { // Example endpoint
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contract: address }), // Ensure body matches API spec
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
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   └── layout/             # Layout components (Sidebar, Header)
│   ├── hooks/                  # React hooks
│   ├── pages/                  # Page components
│   └── lib/                    # Utilities (e.g., cn function)
├── electron/                   # Electron main process (if main is 'electron/main.js')
├── scripts/                    # Build scripts (e.g., electron-dev.js)
└── public/                     # Static assets
```

### Adding New Features

1. **Create Component**: Add new component in `src/components/` or `src/pages/`
2. **Add API Integration**: Implement API calls, likely within React Query hooks in `src/hooks/` or directly in components.
3. **Update Types**: Add TypeScript interfaces/types as needed.
4. **Add Tests**: Include unit/integration tests (`*.test.tsx` or `*.spec.tsx`).
5. **Update Docs**: Document new endpoints/features (e.g., in `API_SPECIFICATION.md`).

### Code Style

```bash
# Format code
npm run format:fix

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
The `package.json` includes scripts like `electron:dist-mac`, `electron:dist-win`, `electron:dist-linux`. These likely use `electron-builder`.

```bash
# Example: Build for macOS
npm run electron:dist-mac

# The built applications will typically be in an 'electron/dist/' or 'release/' directory,
# depending on electron-builder configuration.
```

### Docker Deployment (Example for Web App)

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf # Optional: custom nginx config
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📊 Monitoring & Analytics

### Performance Metrics

- Real-time system health monitoring (via API)
- API response time tracking
- WebSocket connection health

### Error Tracking
- Implement a service like Sentry or LogRocket.
- Comprehensive error logging on frontend and backend.

## 🔒 Security

### Authentication
- JWT-based authentication (frontend needs to handle token storage and refresh).
- Role-based access control (RBAC) enforced by backend, reflected in UI.

### API Security
- Frontend should always use HTTPS for API calls in production.
- Input validation on frontend as a first line of defense.

### Desktop Security
- Code signing for desktop builds is crucial.
- Secure update mechanism.
- Follow Electron security best practices (e.g., contextIsolation, sandboxing).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices.
- Write comprehensive tests.
- Update documentation.
- Follow the established code style.
- Add meaningful commit messages.

## 📝 License

This project is licensed under the MIT License - see the `LICENSE` file for details (assuming MIT, please create/verify).

## 🆘 Support

- **Documentation**: Check provided `.md` files.
- **Issues**: [GitHub Issues](https://github.com/your-org/scorpius-dashboard/issues) (replace with actual link)

## 🗺 Roadmap

(Refer to existing Roadmap section if available, or fill in as needed)

---

**Built with ❤️ by the Scorpius Security Team**

_Analyze. Simulate. Exploit._
