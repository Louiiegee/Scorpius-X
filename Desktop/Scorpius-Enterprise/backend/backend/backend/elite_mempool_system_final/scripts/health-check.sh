#!/bin/bash

# Scorpius Mempool Elite - Health Check Script
# Comprehensive system health monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=10
API_URL="http://localhost:8000"
KAFKA_UI_URL="http://localhost:8080"
GRAFANA_URL="http://localhost:3001"
PROMETHEUS_URL="http://localhost:9090"

echo -e "${BLUE}🔍 Scorpius Mempool Elite - Health Check${NC}"
echo "=============================================="

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "  • $name: "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ OK ($response)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Unexpected status ($response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed (timeout/error)${NC}"
        return 1
    fi
}

# Function to check TCP port
check_port() {
    local name=$1
    local host=$2
    local port=$3
    
    echo -n "  • $name ($host:$port): "
    
    if nc -z -w $TIMEOUT "$host" "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ Open${NC}"
        return 0
    else
        echo -e "${RED}❌ Closed/Filtered${NC}"
        return 1
    fi
}

# Function to check Docker service
check_docker_service() {
    local service=$1
    echo -n "  • $service: "
    
    if docker-compose ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    elif docker-compose ps | grep -q "$service.*Exit"; then
        echo -e "${RED}❌ Exited${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  Not found${NC}"
        return 1
    fi
}

# Function to check Kafka topics
check_kafka_topics() {
    echo -n "  • Kafka Topics: "
    
    if topics=$(docker-compose exec -T kafka kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null); then
        topic_count=$(echo "$topics" | wc -l)
        echo -e "${GREEN}✅ $topic_count topics${NC}"
        return 0
    else
        echo -e "${RED}❌ Cannot list topics${NC}"
        return 1
    fi
}

# Function to check database
check_database() {
    echo -n "  • PostgreSQL Connection: "
    
    if docker-compose exec -T postgres pg_isready -U scorpius -d scorpius_elite >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Connection failed${NC}"
        return 1
    fi
}

# Initialize counters
total_checks=0
passed_checks=0

# 1. Docker Services Health Check
echo -e "\n${BLUE}🐳 Docker Services${NC}"
services=("postgres" "redis" "kafka" "clickhouse" "api" "rule-engine" "notifier" "time-machine")
for service in "${services[@]}"; do
    total_checks=$((total_checks + 1))
    if check_docker_service "$service"; then
        passed_checks=$((passed_checks + 1))
    fi
done

# 2. Infrastructure Health Check
echo -e "\n${BLUE}🏗️  Infrastructure Services${NC}"
infrastructure_checks=(
    "PostgreSQL:localhost:5432"
    "Redis:localhost:6379"
    "Kafka:localhost:9092"
    "ClickHouse:localhost:8123"
)

for check in "${infrastructure_checks[@]}"; do
    IFS=':' read -r name host port <<< "$check"
    total_checks=$((total_checks + 1))
    if check_port "$name" "$host" "$port"; then
        passed_checks=$((passed_checks + 1))
    fi
done

# 3. Application Health Check
echo -e "\n${BLUE}🌐 Application Services${NC}"
total_checks=$((total_checks + 1))
if check_http "API Health" "$API_URL/health"; then
    passed_checks=$((passed_checks + 1))
fi

total_checks=$((total_checks + 1))
if check_http "API Docs" "$API_URL/docs"; then
    passed_checks=$((passed_checks + 1))
fi

# 4. Monitoring Health Check
echo -e "\n${BLUE}📊 Monitoring Services${NC}"
total_checks=$((total_checks + 1))
if check_http "Grafana" "$GRAFANA_URL/api/health"; then
    passed_checks=$((passed_checks + 1))
fi

total_checks=$((total_checks + 1))
if check_http "Prometheus" "$PROMETHEUS_URL/-/healthy"; then
    passed_checks=$((passed_checks + 1))
fi

total_checks=$((total_checks + 1))
if check_http "Kafka UI" "$KAFKA_UI_URL"; then
    passed_checks=$((passed_checks + 1))
fi

# 5. Data Services Health Check
echo -e "\n${BLUE}💾 Data Services${NC}"
total_checks=$((total_checks + 1))
if check_database; then
    passed_checks=$((passed_checks + 1))
fi

total_checks=$((total_checks + 1))
if check_kafka_topics; then
    passed_checks=$((passed_checks + 1))
fi

# 6. Resource Usage Check
echo -e "\n${BLUE}📈 Resource Usage${NC}"
echo "  • Docker Container Stats:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -10

# 7. Disk Usage Check
echo -e "\n${BLUE}💽 Disk Usage${NC}"
echo "  • Available Disk Space:"
df -h | grep -E '(Filesystem|/dev/)' | head -5

# Summary
echo -e "\n${BLUE}📋 Health Check Summary${NC}"
echo "=============================================="

percentage=$((passed_checks * 100 / total_checks))

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}🎉 All systems operational! ($passed_checks/$total_checks)${NC}"
    exit_code=0
elif [ $percentage -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most systems operational ($passed_checks/$total_checks - $percentage%)${NC}"
    exit_code=0
else
    echo -e "${RED}❌ Multiple system issues detected ($passed_checks/$total_checks - $percentage%)${NC}"
    exit_code=1
fi

echo ""
echo -e "${BLUE}🔗 Service URLs:${NC}"
echo "  • API:         $API_URL"
echo "  • Grafana:     $GRAFANA_URL"
echo "  • Prometheus:  $PROMETHEUS_URL"
echo "  • Kafka UI:    $KAFKA_UI_URL"
echo ""
echo -e "${BLUE}🛠️  Troubleshooting:${NC}"
echo "  • View logs:   docker-compose logs [service]"
echo "  • Restart:     docker-compose restart [service]"
echo "  • Full status: docker-compose ps"
echo ""

exit $exit_code
