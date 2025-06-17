#!/bin/bash

# Scorpius Mempool Elite - Maintenance Script
# Production maintenance operations and database management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
LOG_DIR="./logs"
RETENTION_DAYS=30

echo -e "${BLUE}🔧 Scorpius Mempool Elite - Maintenance${NC}"
echo "========================================="

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  backup-db     - Create database backup"
    echo "  restore-db    - Restore database from backup"
    echo "  cleanup       - Clean old logs and backups"
    echo "  vacuum        - Vacuum and analyze database"
    echo "  reindex       - Rebuild database indexes"
    echo "  logs          - Archive and rotate logs"
    echo "  kafka-reset   - Reset Kafka topics and offsets"
    echo "  redis-flush   - Flush Redis cache"
    echo "  stats         - Show system statistics"
    echo "  security      - Run security checks"
    echo ""
    echo "Examples:"
    echo "  $0 backup-db"
    echo "  $0 cleanup"
    echo "  $0 stats"
}

# Function to create directories
create_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
}

# Function to backup database
backup_database() {
    echo -e "${BLUE}💾 Creating database backup...${NC}"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/scorpius_backup_$timestamp.sql"
    
    # Create backup
    docker-compose exec -T postgres pg_dump -U scorpius scorpius_elite > "$backup_file"
    
    # Compress backup
    gzip "$backup_file"
    backup_file="$backup_file.gz"
    
    echo -e "${GREEN}✅ Database backup created: $backup_file${NC}"
    
    # Show backup size
    local size=$(du -h "$backup_file" | cut -f1)
    echo -e "   Backup size: $size"
    
    return 0
}

# Function to restore database
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}❌ Please specify backup file${NC}"
        echo "Available backups:"
        ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found: $backup_file${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  This will overwrite the current database. Continue? (y/N)${NC}"
    read -r confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Restore cancelled"
        return 0
    fi
    
    echo -e "${BLUE}🔄 Restoring database from backup...${NC}"
    
    # Stop services
    docker-compose stop api rule-engine notifier time-machine
    
    # Drop and recreate database
    docker-compose exec postgres psql -U scorpius -c "DROP DATABASE IF EXISTS scorpius_elite;"
    docker-compose exec postgres psql -U scorpius -c "CREATE DATABASE scorpius_elite;"
    
    # Restore data
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker-compose exec -T postgres psql -U scorpius scorpius_elite
    else
        docker-compose exec -T postgres psql -U scorpius scorpius_elite < "$backup_file"
    fi
    
    # Restart services
    docker-compose start api rule-engine notifier time-machine
    
    echo -e "${GREEN}✅ Database restored successfully${NC}"
}

# Function to cleanup old files
cleanup_old_files() {
    echo -e "${BLUE}🧹 Cleaning up old files...${NC}"
    
    # Remove old backups
    echo "  • Removing backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Remove old logs
    echo "  • Removing logs older than $RETENTION_DAYS days..."
    find "$LOG_DIR" -name "*.log" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Clean Docker
    echo "  • Cleaning Docker images and volumes..."
    docker system prune -f
    docker volume prune -f
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to vacuum database
vacuum_database() {
    echo -e "${BLUE}🔄 Vacuuming and analyzing database...${NC}"
    
    # Vacuum and analyze all tables
    docker-compose exec postgres psql -U scorpius scorpius_elite -c "VACUUM ANALYZE;"
    
    # Show database statistics
    echo -e "${BLUE}📊 Database statistics:${NC}"
    docker-compose exec postgres psql -U scorpius scorpius_elite -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    "
    
    echo -e "${GREEN}✅ Database maintenance completed${NC}"
}

# Function to reindex database
reindex_database() {
    echo -e "${BLUE}🔄 Rebuilding database indexes...${NC}"
    
    # Reindex all databases
    docker-compose exec postgres psql -U scorpius scorpius_elite -c "REINDEX DATABASE scorpius_elite;"
    
    echo -e "${GREEN}✅ Database reindex completed${NC}"
}

# Function to rotate logs
rotate_logs() {
    echo -e "${BLUE}📝 Rotating and archiving logs...${NC}"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Archive current logs
    docker-compose logs > "$LOG_DIR/all_services_$timestamp.log"
    
    # Restart services to create new logs
    docker-compose restart
    
    echo -e "${GREEN}✅ Logs archived to $LOG_DIR/all_services_$timestamp.log${NC}"
}

# Function to reset Kafka
reset_kafka() {
    echo -e "${YELLOW}⚠️  This will reset all Kafka topics and consumer offsets. Continue? (y/N)${NC}"
    read -r confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Kafka reset cancelled"
        return 0
    fi
    
    echo -e "${BLUE}🔄 Resetting Kafka topics...${NC}"
    
    # Stop services that consume from Kafka
    docker-compose stop rule-engine notifier time-machine
    
    # Delete and recreate topics
    topics=("tx_raw" "tx_enriched" "alerts" "mev_bundles")
    for topic in "${topics[@]}"; do
        echo "  • Recreating topic: $topic"
        docker-compose exec kafka kafka-topics --delete --topic "$topic" --bootstrap-server localhost:9092 2>/dev/null || true
        docker-compose exec kafka kafka-topics --create --topic "$topic" --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
    done
    
    # Restart services
    docker-compose start rule-engine notifier time-machine
    
    echo -e "${GREEN}✅ Kafka reset completed${NC}"
}

# Function to flush Redis
flush_redis() {
    echo -e "${YELLOW}⚠️  This will flush all Redis data. Continue? (y/N)${NC}"
    read -r confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Redis flush cancelled"
        return 0
    fi
    
    echo -e "${BLUE}🔄 Flushing Redis cache...${NC}"
    
    docker-compose exec redis redis-cli FLUSHALL
    
    echo -e "${GREEN}✅ Redis cache flushed${NC}"
}

# Function to show system statistics
show_statistics() {
    echo -e "${BLUE}📊 System Statistics${NC}"
    echo "===================="
    
    echo -e "\n${BLUE}🐳 Docker Container Stats:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo -e "\n${BLUE}💾 Database Size:${NC}"
    docker-compose exec postgres psql -U scorpius scorpius_elite -c "
        SELECT 
            pg_database.datname,
            pg_size_pretty(pg_database_size(pg_database.datname)) AS size
        FROM pg_database
        WHERE datname = 'scorpius_elite';
    "
    
    echo -e "\n${BLUE}📈 Kafka Topics:${NC}"
    docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
    
    echo -e "\n${BLUE}🔄 Redis Info:${NC}"
    docker-compose exec redis redis-cli INFO memory | grep -E "(used_memory_human|used_memory_peak_human)"
    
    echo -e "\n${BLUE}💽 Disk Usage:${NC}"
    df -h | grep -E "(Filesystem|/dev/|tmpfs)" | head -5
    
    echo -e "\n${BLUE}🕒 System Uptime:${NC}"
    uptime
}

# Function to run security checks
run_security_checks() {
    echo -e "${BLUE}🔒 Running security checks...${NC}"
    
    echo -e "\n${BLUE}• Checking for exposed ports:${NC}"
    netstat -tuln | grep -E "(3000|8000|5432|6379|9092)" || echo "No exposed ports found"
    
    echo -e "\n${BLUE}• Checking environment file permissions:${NC}"
    if [ -f ".env" ]; then
        ls -la .env
        if [ "$(stat -c %a .env)" != "600" ]; then
            echo -e "${YELLOW}⚠️  .env file should have 600 permissions${NC}"
        else
            echo -e "${GREEN}✅ .env file permissions OK${NC}"
        fi
    fi
    
    echo -e "\n${BLUE}• Checking for default passwords:${NC}"
    if grep -q "changeme\|admin123\|password" .env 2>/dev/null; then
        echo -e "${RED}❌ Default passwords found in .env${NC}"
    else
        echo -e "${GREEN}✅ No default passwords found${NC}"
    fi
    
    echo -e "\n${BLUE}• Checking Docker daemon:${NC}"
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker daemon accessible${NC}"
    else
        echo -e "${RED}❌ Docker daemon not accessible${NC}"
    fi
    
    echo -e "${GREEN}✅ Security check completed${NC}"
}

# Main command handling
case "$1" in
    "backup-db")
        create_directories
        backup_database
        ;;
    "restore-db")
        restore_database "$2"
        ;;
    "cleanup")
        cleanup_old_files
        ;;
    "vacuum")
        vacuum_database
        ;;
    "reindex")
        reindex_database
        ;;
    "logs")
        create_directories
        rotate_logs
        ;;
    "kafka-reset")
        reset_kafka
        ;;
    "redis-flush")
        flush_redis
        ;;
    "stats")
        show_statistics
        ;;
    "security")
        run_security_checks
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
