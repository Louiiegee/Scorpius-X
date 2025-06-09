# Time Machine - Blockchain Exploit Replay System

A comprehensive backend API system for replaying and analyzing blockchain exploits with asynchronous task processing.

## 🚀 Features

### Core Functionality
- **Exploit Replay**: Asynchronous replay of blockchain exploits with full state management
- **Transaction Replay**: Replay transaction sequences with detailed tracing
- **Real-time Status Tracking**: Monitor replay progress and status in real-time
- **Session Management**: Create, manage, and clean up replay sessions
- **Detailed Analysis**: Comprehensive exploit analysis with vulnerability pattern detection

### Background Processing
- **Celery Integration**: Distributed task processing with Redis backend
- **Multiple Worker Types**: Specialized workers for replay, analysis, and cleanup tasks
- **Queue Management**: Organized task queues for different operation types
- **Automatic Cleanup**: Scheduled cleanup of old sessions and temporary resources

### API Endpoints
- **FastAPI Framework**: Modern, high-performance API with automatic documentation
- **Comprehensive Coverage**: 20+ endpoints for complete system control
- **Task Management**: Start, monitor, and cancel background tasks
- **Health Monitoring**: System health checks and worker status monitoring

## 📋 Prerequisites

### Required Services
- **Redis Server**: For Celery message broker and result backend
- **Python 3.8+**: With asyncio support
- **Blockchain Node**: Ethereum/Polygon/BSC RPC endpoint access

### Optional Services
- **PostgreSQL**: For persistent session storage (configurable)
- **Docker**: For containerized deployment

## 🛠️ Installation

### 1. Install Dependencies
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements_time_machine.txt
```

### 2. Start Redis Server
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:latest

# Or install Redis locally
# Windows: Download from https://redis.io/download
# Linux: sudo apt install redis-server
# macOS: brew install redis
```

### 3. Configure Environment Variables
```bash
# Create .env file or set environment variables
export TIME_MACHINE_HOST="0.0.0.0"
export TIME_MACHINE_PORT="8010"
export CELERY_BROKER_URL="redis://localhost:6379/0"
export CELERY_RESULT_BACKEND="redis://localhost:6379/0"
export WEB3_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
```

## 🚦 Quick Start

### Method 1: Automated Startup (Recommended)
```bash
# Start everything (API server + Celery workers)
python start_time_machine.py

# Development mode with auto-reload
python start_time_machine.py --dev

# Custom configuration
python start_time_machine.py --host 0.0.0.0 --port 8010 --workers 3

# Start only API server
python start_time_machine.py --api-only

# Start only workers
python start_time_machine.py --workers-only
```

### Method 2: Manual Startup
```bash
# Terminal 1: Start Celery Workers
celery -A celery_app worker --loglevel=info --queues=replay,analysis,cleanup

# Terminal 2: Start API Server
python time_machine_api_server.py
```

## 📚 API Documentation

### Base URL
```
http://localhost:8010/api/time-machine
```

### Interactive Documentation
- **Swagger UI**: http://localhost:8010/docs
- **ReDoc**: http://localhost:8010/redoc

### Key Endpoints

#### Replay Operations
```bash
# Start exploit replay
POST /api/time-machine/replay/exploit/start
{
    "exploit_id": "exploit_123",
    "user_id": "user_456",
    "options": {
        "include_analysis": true,
        "detailed_tracing": true
    }
}

# Start transaction replay
POST /api/time-machine/replay/transactions/start
{
    "transactions": [
        {
            "hash": "0x...",
            "block_number": 18500000
        }
    ],
    "user_id": "user_456"
}

# Get replay status
GET /api/time-machine/replay/{session_id}/status

# Cancel replay
POST /api/time-machine/replay/{session_id}/cancel
```

#### Exploit Management
```bash
# List exploits
GET /api/time-machine/exploits?vulnerability_type=reentrancy&severity=high

# Get exploit details
GET /api/time-machine/exploits/{exploit_id}

# Analyze exploit
POST /api/time-machine/exploits/{exploit_id}/analyze
{
    "analysis_depth": "comprehensive",
    "include_recommendations": true
}
```

#### System Management
```bash
# System health
GET /api/system/health

# Task status
GET /api/tasks/{task_id}/status

# Active tasks
GET /api/tasks/active

# Worker information
GET /api/celery/workers
```

#### Cleanup Operations
```bash
# Clean specific session
POST /api/cleanup/session/{session_id}

# Clean old sessions
POST /api/cleanup/old-sessions?age_hours=24

# Clean expired forks
POST /api/cleanup/expired-forks?expiry_hours=6

# Clean temporary files
POST /api/cleanup/temp-files
```

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │────│  Time Machine   │────│ Background Tasks│
│                 │    │   API Server    │    │ (Celery Workers)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Core Engine     │    │ Redis Message   │
                       │ • ReplayManager │    │ Broker & Cache  │
                       │ • StateManager  │    │                 │
                       │ • ChainAdapter  │    │                 │
                       └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │ Blockchain Node │
                       │ (Ethereum/etc)  │
                       └─────────────────┘
```

### Task Processing Flow

```
API Request → Task Queue → Worker → Core Engine → Blockchain → Results
    ↓             ↓           ↓          ↓            ↓         ↓
Frontend    → Redis     → Celery   → Engine    → Web3    → Database
```

### Worker Specialization
- **Replay Worker**: Handles exploit and transaction replay tasks
- **Analysis Worker**: Performs vulnerability analysis and report generation
- **Cleanup Worker**: Manages resource cleanup and maintenance tasks

## 🔧 Configuration

### Environment Variables
```bash
# API Server
TIME_MACHINE_HOST=0.0.0.0
TIME_MACHINE_PORT=8010
DEBUG=false
RELOAD=false

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Blockchain Configuration
WEB3_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Database (Optional)
DATABASE_URL=postgresql://user:pass@localhost/timemachine

# Logging
LOG_LEVEL=INFO
```

### Celery Settings
```python
# celery_app.py configuration
CELERY_TASK_ROUTES = {
    'tasks.replay_tasks.*': {'queue': 'replay'},
    'tasks.analysis_tasks.*': {'queue': 'analysis'},
    'tasks.cleanup_tasks.*': {'queue': 'cleanup'}
}

CELERY_BEAT_SCHEDULE = {
    'cleanup-old-sessions': {
        'task': 'tasks.cleanup_tasks.cleanup_old_sessions',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    }
}
```

## 📊 Monitoring & Logging

### Log Files
- `time_machine_api.log` - API server logs
- `time_machine_startup.log` - Startup script logs
- `celery_worker.log` - Worker process logs

### Health Monitoring
```bash
# Check system health
curl http://localhost:8010/api/system/health

# Monitor active tasks
curl http://localhost:8010/api/tasks/active

# Check worker status
curl http://localhost:8010/api/celery/workers
```

### Performance Metrics
- Task execution times
- Queue lengths
- Worker utilization
- Memory usage
- Cache hit rates

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
pytest tests/

# Run specific test modules
pytest tests/test_replay_tasks.py
pytest tests/test_analysis_tasks.py
pytest tests/test_cleanup_tasks.py
```

### Integration Tests
```bash
# Test API endpoints
pytest tests/test_api_integration.py

# Test Celery tasks
pytest tests/test_task_integration.py
```

### Load Testing
```bash
# Install load testing tools
pip install locust

# Run load tests
locust -f tests/load_test.py --host=http://localhost:8010
```

## 🚨 Troubleshooting

### Common Issues

#### Redis Connection Failed
```bash
# Check Redis status
redis-cli ping

# Start Redis if not running
redis-server

# Check Redis logs
docker logs redis
```

#### Celery Workers Not Starting
```bash
# Check worker status
celery -A celery_app status

# Restart workers
celery -A celery_app worker --loglevel=debug

# Purge task queues
celery -A celery_app purge
```

#### API Server Errors
```bash
# Check logs
tail -f time_machine_api.log

# Test health endpoint
curl http://localhost:8010/api/system/health

# Restart server
python time_machine_api_server.py
```

#### Task Execution Failures
```bash
# Check task status
curl http://localhost:8010/api/tasks/{task_id}/status

# Monitor worker logs
celery -A celery_app events

# Check Redis for stuck tasks
redis-cli monitor
```

### Debug Mode
```bash
# Start in debug mode
python start_time_machine.py --dev --log-level DEBUG

# Enable verbose logging
export DEBUG=true
export LOG_LEVEL=DEBUG
```

## 🔒 Security Considerations

### API Security
- Rate limiting on endpoints
- Input validation and sanitization
- Authentication tokens (if implemented)
- CORS configuration

### Blockchain Security
- RPC endpoint security
- Private key management
- Transaction simulation vs execution
- Fork isolation

### Data Security
- Temporary file cleanup
- Sensitive data handling
- Log sanitization
- Redis security configuration

## 📈 Performance Optimization

### Scaling Strategies
- Horizontal worker scaling
- Redis clustering
- Database optimization
- Caching strategies

### Resource Management
- Memory usage monitoring
- CPU utilization tracking
- Disk space management
- Network bandwidth optimization

## 🛣️ Roadmap

### Phase 1: Core Features ✅
- [x] Basic replay functionality
- [x] Task processing system
- [x] API endpoints
- [x] Session management

### Phase 2: Advanced Features 🚧
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Multi-chain support
- [ ] Database persistence

### Phase 3: Enterprise Features 📋
- [ ] User authentication
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Enterprise monitoring

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Install development dependencies
4. Run tests
5. Submit pull request

### Code Style
- Python: PEP 8 with Black formatting
- Type hints required
- Docstrings for all functions
- Async/await patterns

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

### Documentation
- API Documentation: `/docs` endpoint
- Code documentation: Inline docstrings
- Architecture docs: `/docs/architecture.md`

### Community
- GitHub Issues: Bug reports and feature requests
- Discussions: Technical questions and ideas
- Wiki: Additional documentation and guides

---

**Time Machine v1.0.0** - Built with ❤️ for blockchain security research
