#!/bin/bash

# ASCII Art Header
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🦂 SCORPIUS SECURITY PLATFORM 🦂          ║"
echo "║                  Blockchain Security Analysis Suite          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
}

# Function to check platform status
check_status() {
    echo "🔍 Checking Scorpius Platform Status..."
    echo ""
    
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Platform is running!"
        echo ""
        docker-compose ps
        echo ""
        echo "🌐 Access points:"
        echo "   Frontend Dashboard: http://localhost:3002"
        echo "   Backend API: http://localhost:3001"
        echo "   API Documentation: http://localhost:3001/docs"
        echo "   Health Check: http://localhost:3001/health"
    else
        echo "❌ Platform is not running."
        echo ""
        echo "To start the platform, run:"
        echo "   ./start-scorpius.sh web"
    fi
}

# Function to start web mode
start_web() {
    echo "🌐 Starting Scorpius Web Dashboard..."
    check_docker
    
    # Build and start services
    docker-compose up -d --build
    
    echo ""
    echo "✅ Starting services... This may take a few minutes on first run."
    echo ""
    echo "🔄 Waiting for services to be ready..."
    
    # Wait for backend to be healthy
    timeout=120
    counter=0
    while [ $counter -lt $timeout ]; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo "✅ Backend is ready!"
            break
        fi
        echo "⏳ Waiting for backend... ($counter/$timeout seconds)"
        sleep 5
        counter=$((counter + 5))
    done
    
    if [ $counter -ge $timeout ]; then
        echo "❌ Timeout waiting for backend. Check logs with: docker-compose logs"
        exit 1
    fi
    
    # Wait a bit more for frontend
    sleep 10
    
    echo ""
    echo "🎉 Scorpius Platform is ready!"
    echo ""
    echo "🌐 Frontend Dashboard: http://localhost:3002"
    echo "🔧 Backend API: http://localhost:3001"
    echo "📚 API Documentation: http://localhost:3001/docs"
    echo ""
    echo "📋 Default Login:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    
    # Try to open browser (if available)
    if command -v xdg-open > /dev/null; then
        echo "🌍 Opening browser..."
        xdg-open http://localhost:3002
    elif command -v open > /dev/null; then
        echo "🌍 Opening browser..."
        open http://localhost:3002
    else
        echo "💡 Open http://localhost:3002 in your browser to access the platform"
    fi
}

# Function to start backend only
start_backend() {
    echo "🔧 Starting Scorpius Backend Services Only..."
    check_docker
    
    # Start only backend services
    docker-compose up -d --build scorpius-backend scorpius-db scorpius-redis scorpius-anvil
    
    echo ""
    echo "✅ Backend services started!"
    echo ""
    echo "🔧 Backend API: http://localhost:3001"
    echo "📚 API Documentation: http://localhost:3001/docs"
    echo "🔍 Health Check: http://localhost:3001/health"
}

# Function to stop platform
stop_platform() {
    echo "🛑 Stopping Scorpius Platform..."
    docker-compose down
    echo "✅ Platform stopped!"
}

# Function to show logs
show_logs() {
    echo "📋 Showing platform logs..."
    docker-compose logs -f
}

# Function to clean platform
clean_platform() {
    echo "🧹 Cleaning Scorpius Platform..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    echo "✅ Platform cleaned!"
}

# Function to show menu
show_menu() {
    echo "🚀 How would you like to run Scorpius today?"
    echo ""
    echo "1. 🌐 Web Dashboard       (browser-based interface)"
    echo "2. 🔧 Backend Only        (API services only)"
    echo "3. 📊 Check Status        (see what's running)"
    echo "4. 📋 Show Logs          (view platform logs)"
    echo "5. 🛑 Stop Platform      (stop all services)"
    echo "6. 🧹 Clean Platform     (reset everything)"
    echo ""
    read -p "Choose an option (1-6): " choice
    
    case $choice in
        1) start_web ;;
        2) start_backend ;;
        3) check_status ;;
        4) show_logs ;;
        5) stop_platform ;;
        6) clean_platform ;;
        *) echo "Invalid option. Please choose 1-6." ;;
    esac
}

# Parse command line arguments
case "$1" in
    "web"|"w")
        start_web
        ;;
    "backend"|"b")
        start_backend
        ;;
    "status"|"s")
        check_status
        ;;
    "logs"|"l")
        show_logs
        ;;
    "stop")
        stop_platform
        ;;
    "clean")
        clean_platform
        ;;
    "")
        show_menu
        ;;
    *)
        echo "Usage: $0 [web|backend|status|logs|stop|clean]"
        echo ""
        echo "Options:"
        echo "  web      - Start web dashboard"
        echo "  backend  - Start backend services only"
        echo "  status   - Check platform status"
        echo "  logs     - Show platform logs"
        echo "  stop     - Stop all services"
        echo "  clean    - Clean and reset platform"
        exit 1
        ;;
esac
