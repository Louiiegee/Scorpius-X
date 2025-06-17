# Scorpius Mempool Elite - Deployment Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- 8GB+ RAM available
- 50GB+ disk space
- Git (for cloning)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd elite_mempool_system_final
chmod +x scripts/*.sh
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Start Platform
```bash
./scripts/start.sh
```

### 4. Verify Deployment
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f api

# Health checks
curl http://localhost:8000/health
```

## Architecture Overview

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

## Service Configuration

### Core Services

#### 1. API Gateway (Port 8000)
- FastAPI-based REST API
- WebSocket support for real-time updates
- Authentication and authorization
- Rate limiting and request validation

#### 2. Rule Engine (Rust)
- WASM runtime for custom rule execution
- High-performance transaction processing
- Pattern matching and anomaly detection
- Kafka producer for alerts

#### 3. Ingestion Service (Go)
- Multi-chain mempool monitoring
- WebSocket connections to RPC providers
- Transaction normalization and enrichment
- Kafka producer for raw transactions

### Microservices

#### 4. Notifier Service (Python)
- Multi-channel alert delivery
- Rate limiting and retry logic
- Template-based notifications
- Email, Slack, Discord support

#### 5. Time Machine Service (Python)
- Historical data archival to S3
- Multiple compression formats
- Query engine for historical analysis
- Retention policy management

### Infrastructure

#### 6. PostgreSQL
- Primary data storage
- JSONB support for flexible schemas
- Full-text search capabilities
- Automated backups

#### 7. Kafka
- Event streaming platform
- Topic-based message routing
- Scalable and fault-tolerant
- Consumer group management

#### 8. Redis
- Session storage and caching
- Rate limiting counters
- Real-time data buffer
- Pub/sub for notifications

#### 9. ClickHouse
- Analytics and time-series data
- High-performance aggregations
- Real-time dashboards
- Data retention policies

## Environment Variables

### Required Configuration

```bash
# Blockchain Providers
ALCHEMY_API_KEY=your_alchemy_key
INFURA_PROJECT_ID=your_infura_id

# Database
POSTGRES_PASSWORD=secure_password
SECRET_KEY=jwt_signing_key

# AWS S3 (Time Machine)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your-bucket-name

# Notifications
SMTP_USERNAME=your_email@domain.com
SMTP_PASSWORD=your_app_password
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Optional Configuration

```bash
# Performance Tuning
MAX_CONCURRENT_RULES=10000
BATCH_SIZE=10000
MAX_MEMORY_MB=2048

# Monitoring
GRAFANA_PASSWORD=admin123
PROMETHEUS_RETENTION=200h

# Security
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_PER_MINUTE=1000
```

## Monitoring and Observability

### Grafana Dashboards (Port 3001)
- System metrics and performance
- Service health and uptime
- Transaction volume and latency
- Alert delivery statistics

### Prometheus Metrics (Port 9090)
- Custom application metrics
- Infrastructure monitoring
- Alerting rules and thresholds
- Historical data retention

### Kafka UI (Port 8080)
- Topic management and monitoring
- Consumer group status
- Message inspection
- Performance metrics

## Production Deployment

### 1. Security Hardening
```bash
# Generate strong secrets
openssl rand -hex 32 > .secrets/jwt_key
openssl rand -hex 16 > .secrets/db_password

# Set proper file permissions
chmod 600 .env .secrets/*
```

### 2. SSL/TLS Configuration
```bash
# Generate certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Update docker-compose for HTTPS
# Add nginx reverse proxy with SSL termination
```

### 3. Resource Allocation
```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### 4. High Availability
```bash
# Multiple API instances
docker-compose up -d --scale api=3

# Database clustering (PostgreSQL)
# Kafka cluster (3+ brokers)
# Redis cluster/sentinel
```

## Backup and Recovery

### Database Backups
```bash
# Automated daily backups
docker-compose exec postgres pg_dump -U scorpius scorpius_elite > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec postgres psql -U scorpius scorpius_elite < backup_20240101.sql
```

### S3 Archive Management
```bash
# Configure lifecycle policies
# Set up cross-region replication
# Enable versioning for data protection
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check dependencies
docker-compose ps

# Restart specific service
docker-compose restart service-name
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U scorpius

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### Kafka Topic Issues
```bash
# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Create missing topics
docker-compose exec kafka kafka-topics --create --topic alerts --bootstrap-server localhost:9092
```

### Performance Optimization

#### Memory Usage
```bash
# Monitor container memory
docker stats

# Adjust JVM heap (Kafka)
KAFKA_HEAP_OPTS="-Xmx2G -Xms2G"
```

#### Disk I/O
```bash
# Use SSD storage for PostgreSQL
# Configure proper volume mounts
# Monitor disk usage with df -h
```

## Scaling Guidelines

### Horizontal Scaling
- API: Add more instances behind load balancer
- Rule Engine: Increase Kafka partitions and consumers
- Notifier: Multiple instances with different channels

### Vertical Scaling
- Increase CPU/memory limits in docker-compose
- Optimize database queries and indexes
- Tune Kafka and Redis configurations

### Storage Scaling
- Partition PostgreSQL tables by date
- Implement data archival policies
- Use read replicas for analytics queries

## Support and Maintenance

### Health Checks
```bash
# System health
./scripts/health-check.sh

# Service endpoints
curl -f http://localhost:8000/health
curl -f http://localhost:9090/-/healthy
curl -f http://localhost:3001/api/health
```

### Log Management
```bash
# Centralized logging with ELK stack
# Log rotation policies
# Error alerting and notifications
```

### Updates and Patches
```bash
# Update to latest version
git pull origin main
docker-compose pull
docker-compose up -d --build
```

For additional support, please refer to the troubleshooting guide or contact the development team.
