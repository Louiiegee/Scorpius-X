#!/bin/bash

# Scorpius Mempool Elite - Startup Script
# This script initializes and starts all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="scorpius-elite"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

echo -e "${BLUE}🚀 Starting Scorpius Mempool Elite Platform${NC}"
echo "=================================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Environment file not found. Creating from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from template${NC}"
        echo -e "${YELLOW}📝 Please edit .env file with your configuration before continuing${NC}"
        exit 0
    else
        echo -e "${RED}❌ No .env.example template found${NC}"
        exit 1
    fi
fi

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local host=${3:-localhost}
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    timeout=120
    while [ $timeout -gt 0 ]; do
        if nc -z $host $port 2>/dev/null; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    echo -e "${RED}❌ Timeout waiting for $service_name${NC}"
    return 1
}

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/clickhouse
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Pull latest images
echo -e "${BLUE}📥 Pulling latest Docker images...${NC}"
docker-compose pull

# Build custom services
echo -e "${BLUE}🔨 Building custom services...${NC}"
docker-compose build

# Initialize database schema
echo -e "${BLUE}🗄️  Setting up database...${NC}"
docker-compose up -d postgres
wait_for_service "PostgreSQL" 5432

# Apply database schema
echo -e "${BLUE}📊 Applying database schema...${NC}"
docker-compose exec postgres psql -U scorpius -d scorpius_elite -f /docker-entrypoint-initdb.d/schema.sql || {
    echo -e "${YELLOW}⚠️  Schema may already be applied${NC}"
}

# Start infrastructure services
echo -e "${BLUE}🏗️  Starting infrastructure services...${NC}"
docker-compose up -d zookeeper kafka redis clickhouse

# Wait for Kafka to be ready
wait_for_service "Kafka" 9092

# Start core services
echo -e "${BLUE}⚙️  Starting core services...${NC}"
docker-compose up -d rule-engine api

# Wait for API to be ready
wait_for_service "API" 8000

# Start microservices
echo -e "${BLUE}🔧 Starting microservices...${NC}"
docker-compose up -d notifier time-machine

# Start monitoring
echo -e "${BLUE}📊 Starting monitoring services...${NC}"
docker-compose up -d prometheus grafana kafka-ui

# Start frontend (if available)
if grep -q "frontend:" "$COMPOSE_FILE"; then
    echo -e "${BLUE}🖥️  Starting frontend...${NC}"
    docker-compose up -d frontend
    wait_for_service "Frontend" 3000
fi

# Display status
echo ""
echo -e "${GREEN}🎉 Scorpius Mempool Elite Platform Started Successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "  • API Server:      http://localhost:8000"
echo "  • Kafka UI:        http://localhost:8080"
echo "  • Grafana:         http://localhost:3001 (admin/admin123)"
echo "  • Prometheus:      http://localhost:9090"
if grep -q "frontend:" "$COMPOSE_FILE"; then
    echo "  • Frontend:        http://localhost:3000"
fi
echo ""
echo -e "${BLUE}📈 Health Checks:${NC}"
echo "  • API Health:      curl http://localhost:8000/health"
echo "  • Service Status:  docker-compose ps"
echo "  • Service Logs:    docker-compose logs [service-name]"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "  1. Configure your blockchain RPC endpoints in .env"
echo "  2. Set up notification channels (Slack, Discord, Email)"
echo "  3. Configure AWS S3 for Time Machine archival"
echo "  4. Visit the frontend to start monitoring transactions"
echo ""
echo -e "${GREEN}✨ Happy monitoring!${NC}"
