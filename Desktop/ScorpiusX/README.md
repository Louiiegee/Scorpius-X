# Scorpius Cybersecurity Dashboard

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Version](https://img.shields.io/npm/v/scorpius-cybersecurity-dashboard.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)

Enterprise-grade cybersecurity dashboard for blockchain security analysis, smart contract auditing, and MEV operations.

## 🚀 Features

### Core Security Features

- **Smart Contract Scanner** - Advanced vulnerability detection and bytecode analysis
- **Honeypot Detection** - Sophisticated trap identification with ML algorithms
- **MEV Operations** - Automated arbitrage and liquidation strategies
- **Real-time Threat Detection** - Live monitoring with WebSocket updates
- **Time Machine** - Historical blockchain replay and analysis

### Enterprise Features

- **Multi-chain Support** - Ethereum, Polygon, BSC, Arbitrum, Avalanche
- **Advanced Analytics** - Real-time charts and security posture monitoring
- **Custom Integrations** - Slack, Telegram, Discord notifications
- **API Management** - Rate limiting, authentication, and monitoring
- **Audit Trail** - Comprehensive logging and compliance reporting

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (optional, for containerized deployment)

## 🛠️ Installation

### Development Setup

```bash
# Clone the repository
git clone https://github.com/scorpius-security/cybersecurity-dashboard.git
cd cybersecurity-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production Build

```bash
# Run full production build with tests and linting
npm run build:production

# Or quick build for development
npm run build
```

### Docker Deployment

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE=https://api.scorpius.io/v1
VITE_SCANNER_API_BASE=https://scanner.scorpius.io/v1
VITE_MEMPOOL_API_BASE=https://mempool.scorpius.io/v1
VITE_MEV_API_BASE=https://mev.scorpius.io/v1

# Authentication
VITE_AUTH_DOMAIN=auth.scorpius.io
VITE_AUTH_REFRESH_THRESHOLD=300000

# Feature Flags
VITE_ENABLE_MOCK_MODE=false
VITE_ENABLE_WEBSOCKETS=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false

# WebSocket Configuration
VITE_WS_BASE=wss://api.scorpius.io/ws

# Application
VITE_APP_ENV=production
VITE_LOG_LEVEL=error
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Scorpius Cybersecurity Dashboard
```

## 🎯 Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Quality Assurance

- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run typecheck` - Type checking
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

### Build & Distribution

- `npm run build:production` - Full production build with QA
- `npm run electron:build` - Build Electron app
- `npm run docker:build` - Build Docker image
- `npm run analyze` - Analyze bundle size

### Maintenance

- `npm run clean` - Clean build artifacts
- `npm run security:audit` - Security audit
- `npm run release` - Create new release

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand + React Query
- **UI Components**: Radix UI + Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts + D3.js
- **Testing**: Vitest + Testing Library
- **Build Tool**: Vite + SWC

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   └── charts/         # Chart components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API services and utilities
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
├── config/             # Configuration files
├── mocks/              # Mock data and MSW handlers
└── test/               # Test utilities and setup
```

### Key Features Implementation

#### API Layer

- **Typed API clients** with automatic error handling
- **Mock Service Worker** for development and testing
- **Request/response interceptors** for auth and logging
- **Automatic token refresh** with fallback handling

#### Authentication System

- **JWT-based authentication** with refresh tokens
- **Role-based access control** (RBAC)
- **Session management** with automatic cleanup
- **Multi-provider support** (local, OAuth, SSO)

#### Real-time Features

- **WebSocket connections** with automatic reconnection
- **Live data updates** for charts and alerts
- **Event-driven architecture** for notifications
- **Optimistic updates** for better UX

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The project maintains high test coverage with the following thresholds:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Testing Strategy

- **Unit tests** for utilities and hooks
- **Integration tests** for API services
- **Component tests** for UI components
- **E2E tests** for critical user flows (planned)

## 🔒 Security

### Security Features

- **Content Security Policy** (CSP) headers
- **XSS protection** with sanitized inputs
- **CSRF protection** with token validation
- **Rate limiting** on API endpoints
- **Input validation** with Zod schemas
- **Secure authentication** with JWT tokens

### Security Audit

```bash
# Run security audit
npm run security:audit

# Check for vulnerabilities
npm audit

# Check license compliance
npm run security:licenses
```

## 📊 Monitoring & Analytics

### Performance Monitoring

- **Bundle size analysis** with webpack-bundle-analyzer
- **Runtime performance** tracking
- **Error boundary** implementation
- **Memory leak detection**

### Analytics Integration

- **User behavior tracking** (optional)
- **Error reporting** with stack traces
- **Performance metrics** collection
- **Usage statistics** dashboard

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**

   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export VITE_APP_ENV=production
   ```

2. **Build Application**

   ```bash
   npm run build:production
   ```

3. **Deploy with Docker**
   ```bash
   docker build -t scorpius-dashboard .
   docker run -p 8080:8080 scorpius-dashboard
   ```

### Electron Desktop App

```bash
# Build desktop application
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

### CI/CD Pipeline

The project includes configurations for:

- **GitHub Actions** workflows
- **Docker** containerization
- **Automated testing** on PR/push
- **Security scanning** with dependabot
- **Code quality** checks with ESLint/Prettier

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** your changes (`npm run test`)
5. **Lint** your code (`npm run lint`)
6. **Submit** a pull request

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Semantic Versioning** for releases

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:

- **Lint staged files** with lint-staged
- **Run type checking** with TypeScript
- **Format code** with Prettier
- **Run relevant tests**

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:

- **Email**: support@scorpius.io
- **Documentation**: https://docs.scorpius.io
- **Security Issues**: security@scorpius.io

## 🔗 Links

- **Website**: https://scorpius.io
- **Documentation**: https://docs.scorpius.io
- **API Reference**: https://api.scorpius.io/docs
- **Status Page**: https://status.scorpius.io

---

**© 2024 Scorpius Security. All rights reserved.**
