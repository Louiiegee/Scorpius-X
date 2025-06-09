# ScorpiusX - Advanced Real-time Trading Platform

ScorpiusX is a comprehensive real-time trading platform with WebSocket integration, featuring both web and desktop applications built with modern technologies.

## 🚀 Features

- **Real-time WebSocket Communication** - Live data streaming and chat functionality
- **Electron Desktop App** - Native desktop experience with advanced UI
- **React Frontend** - Modern web interface with TypeScript
- **Python Backend** - Robust WebSocket server with SQLite persistence
- **Professional UI** - Shadcn/ui components with Tailwind CSS
- **Cross-platform** - Works on Windows, macOS, and Linux

## 📁 Project Structure

```
Scorpius-X/
├── backend/           # Python WebSocket server and APIs
│   ├── websocket_server.py
│   ├── requirements.txt
│   └── chat_messages.db
├── frontend/          # React TypeScript application
│   ├── src/           # Source code
│   ├── electron/      # Electron main and preload scripts
│   ├── package.json   # Frontend dependencies
│   └── dist/          # Built files
├── scripts/           # Automation scripts
│   └── startup.ps1    # PowerShell startup script
├── docs/              # Documentation
└── package.json       # Main project configuration
```

## 🛠 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.8+)
- **npm** (v8+)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the complete platform:**
   ```bash
   npm start
   ```

### Individual Components

#### Backend (WebSocket Server)
```bash
npm run backend
```
- Runs on port 8081
- Provides real-time WebSocket communication
- Stores chat messages in SQLite database

#### Frontend (Web Application)
```bash
npm run frontend:dev
```
- Runs on port 8080
- React development server with hot reload

#### Desktop App (Electron)
```bash
npm run electron-dev
```
- Starts both frontend dev server and Electron app
- Full desktop experience with native features

## 🔧 Configuration

### WebSocket Server
- **Port:** 8081
- **Database:** `backend/chat_messages.db`
- **CORS:** Enabled for all origins

### Frontend
- **Dev Server:** http://localhost:8080
- **Build Output:** `frontend/dist/`
- **Electron Build:** Uses electron-builder

### Startup Script
The PowerShell script (`scripts/startup.ps1`) automatically:
- Starts the WebSocket server
- Launches the frontend dev server
- Opens the Electron desktop app
- Provides status monitoring

## 📦 Build & Distribution

### Build Frontend
```bash
npm run frontend:build
```

### Build Electron App
```bash
npm run electron --prefix frontend -- --build
```

## 🎯 Key Technologies

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Desktop:** Electron with security best practices
- **Backend:** Python, WebSockets, SQLite
- **Real-time:** WebSocket communication with reconnection logic
- **Build:** Vite bundler, Electron Builder

## 🔐 Security Features

- Context isolation enabled
- Node integration disabled
- Web security enabled
- Secure preload scripts
- CORS protection

## 🚀 Development

### Hot Reload Development
```bash
npm run electron-dev
```

### Testing
```bash
npm test
```

### Code Formatting
```bash
npm run format.fix --prefix frontend
```

## 📈 Performance

- Optimized WebSocket connections with auto-reconnect
- Efficient React component rendering
- Native Electron performance
- Minimal bundle size with tree shaking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔧 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if port 8081 is available
   - Ensure Python backend is running

2. **Electron App Won't Start**
   - Run `npm install --prefix frontend`
   - Check Node.js version compatibility

3. **Frontend Build Errors**
   - Clear node_modules: `rm -rf frontend/node_modules`
   - Reinstall: `npm install --prefix frontend`

### Support

For issues and questions, check the troubleshooting section or create an issue.

---

**ScorpiusX** - Professional Trading Platform © 2025
