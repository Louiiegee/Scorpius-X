#!/bin/bash

# Scorpius Mempool Elite - Stop Script
# This script gracefully stops all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Scorpius Mempool Elite Platform${NC}"
echo "=================================================="

# Function to stop services gracefully
stop_services() {
    local service_group=$1
    shift
    local services=("$@")
    
    echo -e "${YELLOW}⏹️  Stopping $service_group...${NC}"
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            echo "  • Stopping $service..."
            docker-compose stop "$service"
        fi
    done
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed.${NC}"
    exit 1
fi

# Stop services in reverse dependency order
stop_services "Frontend" frontend
stop_services "Monitoring" grafana prometheus kafka-ui
stop_services "Microservices" notifier time-machine
stop_services "Core Services" api rule-engine
stop_services "Infrastructure" kafka zookeeper redis clickhouse postgres

echo ""
echo -e "${GREEN}✅ All services stopped successfully${NC}"
echo ""
echo -e "${BLUE}📊 Cleanup Options:${NC}"
echo "  • Remove containers:  docker-compose down"
echo "  • Remove volumes:     docker-compose down -v"
echo "  • Remove images:      docker-compose down --rmi all"
echo "  • Full cleanup:       docker-compose down -v --rmi all --remove-orphans"
echo ""
echo -e "${YELLOW}💡 To restart: ./scripts/start.sh${NC}"
