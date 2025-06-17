#!/bin/bash

# Scorpius Mempool Elite - Development Script
# Streamlined development environment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEV_COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_NAME="scorpius-dev"

echo -e "${BLUE}⚡ Scorpius Mempool Elite - Development Mode${NC}"
echo "=================================================="

# Function to show usage
show_usage() {
    echo "Usage: $0 [command] [service]"
    echo ""
    echo "Commands:"
    echo "  start     - Start development environment"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart specific service or all"
    echo "  logs      - Show logs for specific service or all"
    echo "  shell     - Open shell in service container"
    echo "  test      - Run tests for specific service"
    echo "  build     - Build specific service or all"
    echo "  clean     - Clean up containers and volumes"
    echo "  status    - Show service status"
    echo ""
    echo "Services:"
    echo "  api, rule-engine, notifier, time-machine, frontend"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs api"
    echo "  $0 restart rule-engine"
    echo "  $0 shell api"
    echo "  $0 test notifier"
}

# Function to check if dev compose file exists
check_dev_compose() {
    if [ ! -f "$DEV_COMPOSE_FILE" ]; then
        echo -e "${YELLOW}⚠️  Development compose file not found. Creating...${NC}"
        create_dev_compose
    fi
}

# Function to create development compose file
create_dev_compose() {
    cat > "$DEV_COMPOSE_FILE" << 'EOF'
version: '3.8'

services:
  # Development overrides for faster iteration
  api:
    build:
      context: ./services/api
      dockerfile: Dockerfile.dev
    volumes:
      - ./services/api:/app
      - /app/node_modules
    environment:
      - ENVIRONMENT=development
      - DEBUG=true
      - HOT_RELOAD=true
    ports:
      - "8000:8000"
      - "8001:8001"  # Debug port

  rule-engine:
    build:
      context: ./services/rule_engine
      dockerfile: Dockerfile.dev
    volumes:
      - ./services/rule_engine:/app
      - cargo-cache:/usr/local/cargo/registry
    environment:
      - RUST_LOG=debug
      - CARGO_INCREMENTAL=1

  notifier:
    build:
      context: ./services/notifier
      dockerfile: Dockerfile.dev
    volumes:
      - ./services/notifier:/app
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug

  time-machine:
    build:
      context: ./services/time_machine
      dockerfile: Dockerfile.dev
    volumes:
      - ./services/time_machine:/app
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug

volumes:
  cargo-cache:
EOF
    echo -e "${GREEN}✅ Created development compose file${NC}"
}

# Function to start development environment
start_dev() {
    echo -e "${BLUE}🚀 Starting development environment...${NC}"
    
    # Start infrastructure first
    docker-compose up -d postgres redis kafka clickhouse
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for infrastructure...${NC}"
    sleep 10
    
    # Start development services
    docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" up -d
    
    echo -e "${GREEN}✅ Development environment started${NC}"
    echo ""
    echo -e "${BLUE}🔗 Development URLs:${NC}"
    echo "  • API:         http://localhost:8000"
    echo "  • API Debug:   http://localhost:8001"
    echo "  • Kafka UI:    http://localhost:8080"
    echo "  • Grafana:     http://localhost:3001"
    echo ""
    echo -e "${BLUE}💡 Development Tips:${NC}"
    echo "  • Code changes are hot-reloaded"
    echo "  • Use 'dev logs [service]' to view logs"
    echo "  • Use 'dev shell [service]' to debug"
}

# Function to stop services
stop_dev() {
    echo -e "${BLUE}🛑 Stopping development environment...${NC}"
    docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" down
    echo -e "${GREEN}✅ Development environment stopped${NC}"
}

# Function to restart service
restart_service() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${BLUE}🔄 Restarting all services...${NC}"
        docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" restart
    else
        echo -e "${BLUE}🔄 Restarting $service...${NC}"
        docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" restart "$service"
    fi
    echo -e "${GREEN}✅ Restart complete${NC}"
}

# Function to show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" logs -f
    else
        docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" logs -f "$service"
    fi
}

# Function to open shell
open_shell() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${RED}❌ Please specify a service name${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🐚 Opening shell in $service container...${NC}"
    docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" exec "$service" /bin/bash
}

# Function to run tests
run_tests() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${BLUE}🧪 Running all tests...${NC}"
        # Run tests for each service
        for svc in api rule-engine notifier time-machine; do
            echo -e "${YELLOW}Testing $svc...${NC}"
            run_service_tests "$svc"
        done
    else
        run_service_tests "$service"
    fi
}

# Function to run tests for specific service
run_service_tests() {
    local service=$1
    case $service in
        "api")
            docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" exec api pytest tests/ -v
            ;;
        "rule-engine")
            docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" exec rule-engine cargo test
            ;;
        "notifier"|"time-machine")
            docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" exec "$service" python -m pytest tests/ -v
            ;;
        *)
            echo -e "${RED}❌ Unknown service: $service${NC}"
            return 1
            ;;
    esac
}

# Function to build services
build_services() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${BLUE}🔨 Building all services...${NC}"
        docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" build
    else
        echo -e "${BLUE}🔨 Building $service...${NC}"
        docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" build "$service"
    fi
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Function to clean up
clean_up() {
    echo -e "${BLUE}🧹 Cleaning up development environment...${NC}"
    docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Service Status${NC}"
    docker-compose -f docker-compose.yml -f "$DEV_COMPOSE_FILE" ps
    echo ""
    echo -e "${BLUE}📈 Resource Usage${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -10
}

# Main command handling
case "$1" in
    "start")
        check_dev_compose
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "restart")
        restart_service "$2"
        ;;
    "logs")
        show_logs "$2"
        ;;
    "shell")
        open_shell "$2"
        ;;
    "test")
        run_tests "$2"
        ;;
    "build")
        build_services "$2"
        ;;
    "clean")
        clean_up
        ;;
    "status")
        show_status
        ;;
    "")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_usage
        exit 1
        ;;
esac
