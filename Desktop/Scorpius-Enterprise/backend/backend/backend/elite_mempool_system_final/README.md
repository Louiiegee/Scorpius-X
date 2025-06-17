# Scorpius Mempool Elite

**Advanced Multi-Chain Mempool Monitoring & MEV Detection Platform**

A comprehensive real-time mempool monitoring platform that detects MEV opportunities, analyzes transaction patterns, and provides intelligent alerting across multiple blockchain networks.

## 🌟 Platform Overview

Scorpius Mempool Elite is an enterprise-grade platform designed for:
- **Real-time mempool monitoring** across Ethereum, Arbitrum, Optimism, and Base
- **MEV detection and analysis** with advanced pattern recognition
- **Custom rule engine** with WASM-based sandboxed execution
- **Multi-channel alerting** via Email, Slack, Discord, and more
- **Historical data archival** with efficient querying capabilities
- **Real-time dashboards** with live transaction analytics

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Rule Engine    │
│   (Next.js)     │◄───┤   (FastAPI)     │◄───┤   (Rust)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                        ┌───────▼───────┐       ┌────────▼────────┐
                        │   PostgreSQL  │       │     Kafka       │
                        │   (Primary)   │       │  (Streaming)    │
                        └───────────────┘       └─────────────────┘
                                │                        │
            ┌───────────────────┼────────────────────────┼───────────────────┐
            │                   │                        │                   │
    ┌───────▼───────┐  ┌────────▼────────┐      ┌────────▼────────┐  ┌───────▼───────┐
    │   Notifier    │  │  Time Machine   │      │     Redis       │  │  ClickHouse   │
    │  (Alerts)     │  │   (Archive)     │      │   (Cache)       │  │ (Analytics)   │
    └───────────────┘  └─────────────────┘      └─────────────────┘  └───────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- 8GB+ RAM available
- 50GB+ disk space
- Git for cloning

### 1. Clone Repository
```bash
git clone <repository-url>
cd elite_mempool_system_final
chmod +x scripts/*.sh
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit configuration (required)
nano .env
```

### 3. Start Platform
```bash
# Start all services
./scripts/start.sh

# Check health
./scripts/health-check.sh
```

### 4. Access Services
- **API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Kafka UI**: http://localhost:8080

## 📦 Core Services

### 🔧 **API Gateway** (Python FastAPI)
- RESTful API with OpenAPI documentation
- WebSocket support for real-time updates
- JWT authentication and RBAC
- Rate limiting and request validation
- **Location**: `services/api/`

### ⚡ **Rule Engine** (Rust)
- High-performance WASM runtime for custom rules
- Pattern matching and anomaly detection
- Concurrent rule execution (10,000+ rules)
- Real-time transaction processing
- **Location**: `services/rule_engine/`

### 📡 **Ingestion Service** (Go)
- Multi-chain mempool monitoring
- WebSocket connections to RPC providers
- Transaction normalization and enrichment
- High-throughput Kafka producer
- **Location**: `services/ingestion/`

## 🎯 Microservices

### 📧 **Notifier Service** (Python Async)
- Multi-channel alert delivery (Email, Slack, Discord)
- Rate limiting and retry logic with exponential backoff
- Jinja2 templating for customizable notifications
- Redis-based delivery tracking and deduplication
- **Location**: `services/notifier/`

**Features:**
- Kafka consumer for real-time alert processing
- Configurable rate limits per channel and recipient
- Background tasks for retry handling and config reload
- Template-based notifications with dynamic content

### 🕒 **Time Machine Service** (Python Async)
- Historical transaction data archival to S3
- Multiple compression formats (gzip, lz4, zstd)
- Archive formats: Parquet, JSON, Pickle
- Efficient querying with filters and pagination
- **Location**: `services/time_machine/`

**Features:**
- Batch processing with configurable intervals
- Automated cleanup based on retention policies
- Archive metadata management in PostgreSQL
- Query engine for historical analysis

## 💾 Data Layer

### **PostgreSQL** (Primary Database)
- Comprehensive schema for all platform data
- JSONB support for flexible document storage
- Full-text search with GIN indexes
- Automated backup and recovery
- **Schema**: `database/schema.sql`

### **Kafka** (Event Streaming)
- Topic-based message routing
- Consumer groups for scalable processing
- Event sourcing architecture
- Topics: `tx_raw`, `tx_enriched`, `alerts`, `mev_bundles`

### **Redis** (Caching & Sessions)
- Session storage and user authentication
- Rate limiting counters and sliding windows
- Real-time data buffering
- Pub/sub for notifications

### **ClickHouse** (Analytics)
- Time-series data for analytics
- High-performance aggregations
- Real-time dashboard queries
- Data retention policies

## 🛠️ Development

### Development Environment
```bash
# Start development mode with hot reload
./scripts/dev.sh start

# View logs for specific service
./scripts/dev.sh logs api

# Open shell in container
./scripts/dev.sh shell rule-engine

# Run tests
./scripts/dev.sh test notifier
```

### Service Development

#### API Service
```bash
cd services/api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Rule Engine
```bash
cd services/rule_engine
cargo build --release
cargo test
./target/release/rule_engine
```

#### Microservices
```bash
cd services/notifier  # or time_machine
pip install -r requirements.txt
python main.py
```

## 📊 Monitoring & Observability

### Grafana Dashboards
- System metrics and performance monitoring
- Service health and uptime tracking
- Transaction volume and latency analytics
- Alert delivery statistics and success rates

### Prometheus Metrics
- Custom application metrics from all services
- Infrastructure monitoring (CPU, memory, disk)
- Alerting rules and threshold definitions
- Historical data retention and aggregation

### Health Monitoring
```bash
# Comprehensive health check
./scripts/health-check.sh

# Individual service health
curl http://localhost:8000/health
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API key management for external integrations
- Rate limiting and DDoS protection

### Data Security
- Encrypted data at rest (PostgreSQL, Redis)
- TLS/SSL for all communications
- Secrets management with environment variables
- Input validation and sanitization

## 📈 Production Deployment

### Environment Configuration
```bash
# Required environment variables
ALCHEMY_API_KEY=your_alchemy_key
POSTGRES_PASSWORD=secure_password
SECRET_KEY=jwt_signing_key
AWS_ACCESS_KEY_ID=your_access_key
SMTP_USERNAME=your_email@domain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Scaling Configuration
```yaml
# Resource limits for production
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
```

### High Availability
- Multiple API instances behind load balancer
- Database clustering with read replicas
- Kafka cluster with multiple brokers
- Redis sentinel for failover

## 🧪 Testing

### Automated Testing
```bash
# Run all tests
./scripts/dev.sh test

# Service-specific tests
./scripts/dev.sh test api
./scripts/dev.sh test rule-engine
./scripts/dev.sh test notifier
```

### Integration Testing
```bash
# End-to-end testing
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📚 API Documentation

### REST API
- **OpenAPI Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### WebSocket API
- **Real-time alerts**: `ws://localhost:8000/ws/alerts`
- **Transaction stream**: `ws://localhost:8000/ws/transactions`
- **System status**: `ws://localhost:8000/ws/status`

## 🔧 Configuration

### Blockchain Networks
```bash
# Supported networks
ETHEREUM_RPC_URLS=wss://eth-mainnet.ws.alchemyapi.io/v2/YOUR_KEY
ARBITRUM_RPC_URLS=wss://arb-mainnet.ws.alchemyapi.io/v2/YOUR_KEY
OPTIMISM_RPC_URLS=wss://opt-mainnet.ws.alchemyapi.io/v2/YOUR_KEY
BASE_RPC_URLS=wss://base-mainnet.ws.alchemyapi.io/v2/YOUR_KEY
```

### Performance Tuning
```bash
# Rule engine performance
MAX_CONCURRENT_RULES=10000
WASM_CACHE_SIZE=1000

# Time machine archival
BATCH_SIZE=10000
ARCHIVE_INTERVAL_HOURS=1
COMPRESSION_TYPE=gzip

# Notifier rate limits
MAX_NOTIFICATIONS_PER_HOUR=1000
MAX_RETRIES=3
```

## 🆘 Troubleshooting

### Common Issues
```bash
# Service won't start
docker-compose logs service-name

# Database connection issues
./scripts/health-check.sh
docker-compose restart postgres

# Kafka topic issues
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check service health
./scripts/health-check.sh

# View detailed logs
./scripts/dev.sh logs api
```

## 📄 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Comprehensive deployment instructions
- **[API Documentation](http://localhost:8000/docs)** - Interactive API explorer
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and components
- **[Security Guide](docs/SECURITY.md)** - Security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:
1. Check the troubleshooting guide
2. Review existing GitHub issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Built with ❤️ by the Scorpius Team**
