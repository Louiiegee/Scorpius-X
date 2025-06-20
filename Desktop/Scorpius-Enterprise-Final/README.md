# Scorpius Cybersecurity Dashboard - Enterprise Edition

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker (optional)

### Installation

```bash
# Install frontend dependencies
npm install

# Start development
npm run dev

# Backend (Python Flask)
cd backend/
pip install -r requirements.txt
python app.py
```

### Login

- **Username**: `demo`
- **Password**: `demo`

## 📁 Project Structure

```
Scorpius-Enterprise-Final/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript types
│   │   └── config/            # Configuration
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── backend/                     # Python Flask API
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   └── modules/               # Your existing Python modules
├── docs/                       # Documentation
├── docker/                     # Docker configurations
└── scripts/                    # Build and deployment scripts
```

## 🌟 Features

- **Smart Contract Scanner** - Vulnerability detection & analysis
- **MEV Operations** - Automated trading strategies
- **Real-time Threat Detection** - Live monitoring
- **Time Machine** - Historical blockchain replay
- **Enterprise Security** - JWT auth, RBAC, audit trails
- **Multi-platform** - Web, Desktop (Electron), Mobile PWA

## 🛠️ Development

```bash
# Frontend development
npm run dev                     # Start dev server
npm run build                   # Production build
npm run test                    # Run tests

# Backend development
cd backend/
python app.py                   # Start Flask server

# Full stack
npm run dev:full               # Start both frontend & backend
```

## 🚀 Deployment

```bash
# Docker deployment
docker-compose up -d

# Production build
npm run build:production

# Electron desktop app
npm run electron:build
```

## 📖 Documentation

- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Policy](docs/SECURITY.md)

---

**© 2024 Scorpius Security. Enterprise-grade cybersecurity dashboard.**
