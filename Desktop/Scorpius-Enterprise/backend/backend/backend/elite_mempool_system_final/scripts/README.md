# Scorpius Scripts Documentation

This directory contains operational scripts for managing the Scorpius Mempool Elite platform.

## Scripts Overview

### 🚀 `start.sh` - Platform Startup

**Purpose**: Automated startup of all platform services  
**Usage**: `./scripts/start.sh`

**Features**:

- Environment validation and setup
- Docker and docker-compose availability check
- Directory creation for persistent storage
- Sequential service startup with health checks
- Wait for dependencies before starting dependent services
- URL and status information display

**Process**:

1. Check prerequisites (Docker, docker-compose)
2. Create `.env` from template if not exists
3. Create required directories
4. Start infrastructure services (PostgreSQL, Redis, Kafka, ClickHouse)
5. Wait for infrastructure readiness
6. Start core services (API, Rule Engine, Ingestion)
7. Start microservices (Notifier, Time Machine)
8. Start monitoring (Prometheus, Grafana)
9. Start frontend
10. Display service URLs and status

### 🛑 `stop.sh` - Platform Shutdown

**Purpose**: Graceful shutdown of all services  
**Usage**: `./scripts/stop.sh`

**Features**:

- Reverse dependency order shutdown
- Graceful service termination
- Container and volume cleanup options
- Status confirmation

**Process**:

1. Stop frontend first
2. Stop monitoring services
3. Stop microservices
4. Stop core services
5. Stop infrastructure services last
6. Provide cleanup instructions

### 🔍 `health-check.sh` - System Health Monitoring

**Purpose**: Comprehensive health monitoring and diagnostics  
**Usage**: `./scripts/health-check.sh`

**Features**:

- Docker service status verification
- Infrastructure port connectivity tests
- Application endpoint health checks
- Monitoring service validation
- Database connectivity verification
- Kafka topic listing
- Resource usage reporting
- Disk space monitoring
- Health score calculation

**Checks Performed**:

- **Docker Services**: postgres, redis, kafka, clickhouse, api, rule-engine, notifier, time-machine
- **Infrastructure Ports**: PostgreSQL (5432), Redis (6379), Kafka (9092), ClickHouse (8123)
- **Application Endpoints**: API health, API docs, Grafana, Prometheus, Kafka UI
- **Data Services**: Database connectivity, Kafka topics
- **System Resources**: CPU, memory, disk usage

### ⚡ `dev.sh` - Development Environment Management

**Purpose**: Streamlined development workflow  
**Usage**: `./scripts/dev.sh [command] [service]`

**Commands**:

- `start` - Start development environment with hot reload
- `stop` - Stop all development services
- `restart [service]` - Restart specific service or all
- `logs [service]` - Show logs for specific service or all
- `shell [service]` - Open shell in service container
- `test [service]` - Run tests for specific service or all
- `build [service]` - Build specific service or all
- `clean` - Clean up containers and volumes
- `status` - Show service status and resource usage

**Features**:

- Development-specific docker-compose configuration
- Hot reload for supported services
- Service-specific debugging
- Automated testing
- Interactive shell access
- Resource monitoring

### 🔧 `maintenance.sh` - Production Maintenance

**Purpose**: Production operations and database management  
**Usage**: `./scripts/maintenance.sh [command]`

**Commands**:

- `backup-db` - Create compressed database backup
- `restore-db [file]` - Restore database from backup
- `cleanup` - Clean old logs and backups (30-day retention)
- `vacuum` - Vacuum and analyze database for performance
- `reindex` - Rebuild database indexes
- `logs` - Archive and rotate service logs
- `kafka-reset` - Reset Kafka topics and consumer offsets
- `redis-flush` - Flush Redis cache
- `stats` - Show comprehensive system statistics
- `security` - Run security checks and validation

**Features**:

- Automated backup with compression
- Configurable retention policies
- Database optimization
- Security auditing
- System statistics
- Log management

## Usage Examples

### Quick Start

```bash
# Start the entire platform
./scripts/start.sh

# Check system health
./scripts/health-check.sh

# View API logs
./scripts/dev.sh logs api
```

### Development Workflow

```bash
# Start development environment
./scripts/dev.sh start

# Make code changes, then restart specific service
./scripts/dev.sh restart api

# Run tests
./scripts/dev.sh test notifier

# Open shell for debugging
./scripts/dev.sh shell rule-engine

# Clean up when done
./scripts/dev.sh clean
```

### Production Maintenance

```bash
# Create database backup
./scripts/maintenance.sh backup-db

# Check system statistics
./scripts/maintenance.sh stats

# Clean old files
./scripts/maintenance.sh cleanup

# Optimize database
./scripts/maintenance.sh vacuum
```

### Troubleshooting

```bash
# Check overall health
./scripts/health-check.sh

# View service logs
./scripts/dev.sh logs postgres

# Restart problematic service
./scripts/dev.sh restart kafka

# Reset Kafka if needed
./scripts/maintenance.sh kafka-reset
```

## Configuration

### Environment Variables

Scripts respect the following environment variables:

- `COMPOSE_PROJECT_NAME` - Docker Compose project name
- `TIMEOUT` - Health check timeout (default: 10s)
- `RETENTION_DAYS` - Backup retention period (default: 30 days)

### Prerequisites

- **Docker**: Version 20.10+ with Compose V2
- **System Resources**: 8GB RAM, 50GB disk space
- **Network**: Internet access for image pulls
- **Permissions**: Docker daemon access

## Script Dependencies

```
start.sh
├── Docker & Docker Compose
├── .env configuration
└── docker-compose.yml

health-check.sh
├── curl (HTTP checks)
├── nc (port checks)
└── docker-compose

dev.sh
├── docker-compose.yml
├── docker-compose.dev.yml (auto-created)
└── Service-specific Dockerfiles

maintenance.sh
├── PostgreSQL client tools
├── gzip compression
└── System utilities (find, df, etc.)
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Missing dependency |
| 3 | Configuration error |
| 4 | Service startup failure |
| 5 | Health check failure |

## Security Considerations

### File Permissions

```bash
# Scripts should be executable
chmod +x scripts/*.sh

# Environment file should be protected
chmod 600 .env
```

### Network Security

- Scripts check for exposed ports
- Environment validation prevents default passwords
- Docker daemon security verification

### Data Protection

- Database backups are compressed and timestamped
- Backup retention policies prevent disk exhaustion
- Secure credential handling in maintenance operations

## Monitoring Integration

Scripts integrate with the monitoring stack:

- **Prometheus**: Metrics collection from health checks
- **Grafana**: Dashboard visualization of script execution
- **Logging**: Structured logs for audit trails

## Error Handling

All scripts include:

- Comprehensive error checking with `set -e`
- Colored output for better visibility
- Graceful degradation on service failures
- Detailed error messages and troubleshooting hints

## Extending Scripts

### Adding New Commands

```bash
# In any script, add new case to main switch
case "$1" in
    "new-command")
        new_function "$2"
        ;;
esac
```

### Custom Health Checks

```bash
# Add to health-check.sh
check_custom_service() {
    local service=$1
    # Implementation here
}
```

### Environment Customization

```bash
# Override defaults in .env
CUSTOM_TIMEOUT=30
CUSTOM_RETENTION_DAYS=60
```

---

**Note**: Always test scripts in development before running in production. Use the `dev.sh` script for development and `maintenance.sh` for production operations.
