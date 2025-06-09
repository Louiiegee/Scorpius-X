#!/bin/bash
# Scorpius Cybersecurity Platform - Universal Startup Script
# Automatically installs dependencies, starts servers, and launches applications

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
RESET='\033[0m'

# Configuration
FRONTEND_PORT=8080
BACKEND_PORT=8000
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"
ELECTRON_DELAY=5
HEALTH_CHECK_TIMEOUT=60

# Process tracking
BACKEND_PID=""
FRONTEND_PID=""
ELECTRON_PID=""

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}[CLEANUP]${RESET} Stopping all services..."
    
    if [[ -n "$BACKEND_PID" ]]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [[ -n "$FRONTEND_PID" ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [[ -n "$ELECTRON_PID" ]]; then
        kill $ELECTRON_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes
    pkill -f "python.*start.py" 2>/dev/null || true
    pkill -f "npm.*run.*dev" 2>/dev/null || true
    pkill -f "electron" 2>/dev/null || true
    
    echo -e "${GREEN}[OK]${RESET} All services stopped"
    echo -e "${CYAN}[INFO]${RESET} Thank you for using Scorpius Cybersecurity Platform!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Print banner
echo -e "
 ████████╗██╗  ██╗███████╗    ███████╗ ██████╗ ██████╗ ██████╗ ██████╗ ██╗██╗   ██╗███████╗
 ╚══██╔══╝██║  ██║██╔════╝    ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗██║██║   ██║██╔════╝
    ██║   ███████║█████╗      ███████╗██║     ██║   ██║██████╔╝██████╔╝██║██║   ██║███████╗
    ██║   ██╔══██║██╔══╝      ╚════██║██║     ██║   ██║██╔══██╗██╔═══╝ ██║██║   ██║╚════██║
    ██║   ██║  ██║███████╗    ███████║╚██████╗╚██████╔╝██║  ██║██║     ██║╚██████╔╝███████║
    ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝

                          🔥 CYBERSECURITY PLATFORM STARTUP 🔥
                         ==========================================
"

echo -e "${CYAN}[INFO]${RESET} Starting Scorpius Cybersecurity Platform..."
echo -e "${CYAN}[INFO]${RESET} Project Directory: $PROJECT_DIR"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# Step 1: Check and install dependencies
echo -e "${YELLOW}[STEP 1/6]${RESET} ${BLUE}Checking system requirements...${RESET}"
check_system_requirements

# Step 2: Install Node.js dependencies
echo -e "${YELLOW}[STEP 2/6]${RESET} ${BLUE}Installing Node.js dependencies...${RESET}"
install_node_dependencies

# Step 3: Install Python dependencies
echo -e "${YELLOW}[STEP 3/6]${RESET} ${BLUE}Installing Python dependencies...${RESET}"
install_python_dependencies

# Step 4: Start backend server
echo -e "${YELLOW}[STEP 4/6]${RESET} ${BLUE}Starting backend server...${RESET}"
start_backend

# Step 5: Start frontend server
echo -e "${YELLOW}[STEP 5/6]${RESET} ${BLUE}Starting frontend server...${RESET}"
start_frontend

# Step 6: Launch applications
echo -e "${YELLOW}[STEP 6/6]${RESET} ${BLUE}Launching applications...${RESET}"
launch_applications

echo ""
echo -e "${GREEN}[SUCCESS]${RESET} 🎉 Scorpius Platform started successfully!"
echo ""
echo -e "${WHITE}Available interfaces:${RESET}"
echo -e "  ${CYAN}🌐 Web Dashboard:${RESET}   http://localhost:$FRONTEND_PORT"
echo -e "  ${CYAN}📡 API Server:${RESET}      http://localhost:$BACKEND_PORT"
echo -e "  ${CYAN}🖥️ Desktop App:${RESET}     Launching automatically..."
echo -e "  ${CYAN}📖 API Docs:${RESET}        http://localhost:$BACKEND_PORT/docs"
echo ""
echo -e "${YELLOW}[CONTROLS]${RESET}"
echo -e "  Press ${WHITE}Ctrl+C${RESET} to stop all services"
echo -e "  Check logs in the console for real-time status"
echo ""

# Wait for user input or process termination
while true; do
    sleep 5
    if ! check_processes; then
        echo -e "${RED}[ERROR]${RESET} One or more services stopped unexpectedly"
        cleanup
    fi
done

# Functions
check_system_requirements() {
    echo -e "${CYAN}[CHECK]${RESET} Verifying system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR]${RESET} Node.js not found. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}[OK]${RESET} Node.js found: $NODE_VERSION"
    
    # Check Python
    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        echo -e "${RED}[ERROR]${RESET} Python not found. Please install Python 3.8+ from https://python.org"
        exit 1
    fi
    
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        PIP_CMD="pip3"
    else
        PYTHON_CMD="python"
        PIP_CMD="pip"
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version)
    echo -e "${GREEN}[OK]${RESET} Python found: $PYTHON_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[ERROR]${RESET} npm not found. Please reinstall Node.js"
        exit 1
    fi
    echo -e "${GREEN}[OK]${RESET} npm found"
    
    # Check pip
    if ! command -v $PIP_CMD &> /dev/null; then
        echo -e "${RED}[ERROR]${RESET} pip not found. Please reinstall Python"
        exit 1
    fi
    echo -e "${GREEN}[OK]${RESET} pip found"
    
    # Check ports availability
    if lsof -i:8080 &> /dev/null; then
        echo -e "${YELLOW}[WARNING]${RESET} Port 8080 is already in use"
    fi
    
    if lsof -i:8000 &> /dev/null; then
        echo -e "${YELLOW}[WARNING]${RESET} Port 8000 is already in use"
    fi
    
    echo -e "${GREEN}[OK]${RESET} System requirements check completed"
}

install_node_dependencies() {
    echo -e "${CYAN}[INSTALL]${RESET} Installing Node.js packages..."
    
    if [[ ! -f "package.json" ]]; then
        echo -e "${RED}[ERROR]${RESET} package.json not found in project directory"
        exit 1
    fi
    
    # Check if node_modules exists
    if [[ -d "node_modules" ]]; then
        echo -e "${CYAN}[INFO]${RESET} node_modules found, checking for updates..."
    fi
    
    # Install/update dependencies
    if ! npm install; then
        echo -e "${RED}[ERROR]${RESET} Failed to install Node.js dependencies"
        exit 1
    fi
    
    echo -e "${GREEN}[OK]${RESET} Node.js dependencies installed successfully"
}

install_python_dependencies() {
    echo -e "${CYAN}[INSTALL]${RESET} Installing Python packages..."
    
    if [[ ! -f "$BACKEND_DIR/requirements.txt" ]]; then
        echo -e "${RED}[ERROR]${RESET} requirements.txt not found in backend directory"
        exit 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Install Python dependencies
    if ! $PIP_CMD install -r requirements.txt; then
        echo -e "${YELLOW}[WARNING]${RESET} Some Python packages failed to install, continuing..."
    fi
    
    cd "$PROJECT_DIR"
    echo -e "${GREEN}[OK]${RESET} Python dependencies installed successfully"
}

start_backend() {
    echo -e "${CYAN}[START]${RESET} Launching FastAPI backend server..."
    
    cd "$BACKEND_DIR"
    
    # Start backend in background
    $PYTHON_CMD start.py &
    BACKEND_PID=$!
    
    if [[ -z "$BACKEND_PID" ]]; then
        echo -e "${RED}[ERROR]${RESET} Failed to start backend server"
        exit 1
    fi
    
    # Wait for backend to be ready
    echo -e "${CYAN}[WAIT]${RESET} Waiting for backend server to initialize..."
    local count=0
    while [[ $count -lt 30 ]]; do
        sleep 2
        if curl -s "http://localhost:$BACKEND_PORT/health" &> /dev/null; then
            echo -e "${GREEN}[OK]${RESET} Backend server is ready"
            cd "$PROJECT_DIR"
            return 0
        fi
        ((count++))
    done
    
    echo -e "${RED}[ERROR]${RESET} Backend server failed to start within timeout"
    cd "$PROJECT_DIR"
    exit 1
}

start_frontend() {
    echo -e "${CYAN}[START]${RESET} Launching Vite frontend server..."
    
    # Start frontend in background
    npm run dev &
    FRONTEND_PID=$!
    
    if [[ -z "$FRONTEND_PID" ]]; then
        echo -e "${RED}[ERROR]${RESET} Failed to start frontend server"
        exit 1
    fi
    
    # Wait for frontend to be ready
    echo -e "${CYAN}[WAIT]${RESET} Waiting for frontend server to initialize..."
    local count=0
    while [[ $count -lt 20 ]]; do
        sleep 2
        if curl -s "http://localhost:$FRONTEND_PORT" &> /dev/null; then
            echo -e "${GREEN}[OK]${RESET} Frontend server is ready"
            return 0
        fi
        ((count++))
    done
    
    echo -e "${RED}[ERROR]${RESET} Frontend server failed to start within timeout"
    exit 1
}

launch_applications() {
    echo -e "${CYAN}[LAUNCH]${RESET} Opening applications..."
    
    # Wait a moment for servers to stabilize
    sleep $ELECTRON_DELAY
    
    # Check if first run
    if [[ -f "$PROJECT_DIR/data/first-run.flag" ]]; then
        echo -e "${CYAN}[INFO]${RESET} First run detected - will show license verification"
        LAUNCH_URL="http://localhost:$FRONTEND_PORT"
    else
        echo -e "${CYAN}[INFO]${RESET} Returning user - will show login page"
        LAUNCH_URL="http://localhost:$FRONTEND_PORT"
    fi
    
    # Launch Electron app
    echo -e "${CYAN}[LAUNCH]${RESET} Starting Electron desktop application..."
    npm run electron &
    ELECTRON_PID=$!
    
    if [[ -z "$ELECTRON_PID" ]]; then
        echo -e "${YELLOW}[WARNING]${RESET} Failed to start Electron app"
    fi
    
    # Wait a moment then launch web browser
    sleep 3
    echo -e "${CYAN}[LAUNCH]${RESET} Opening web dashboard in browser..."
    
    # Open browser based on OS
    if command -v xdg-open &> /dev/null; then
        xdg-open "$LAUNCH_URL" &> /dev/null &
    elif command -v open &> /dev/null; then
        open "$LAUNCH_URL" &> /dev/null &
    else
        echo -e "${YELLOW}[INFO]${RESET} Please open $LAUNCH_URL in your browser"
    fi
    
    echo -e "${GREEN}[OK]${RESET} Applications launched successfully"
}

check_processes() {
    # Check if backend is still running
    if [[ -n "$BACKEND_PID" ]] && ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}[ERROR]${RESET} Backend server stopped"
        return 1
    fi
    
    # Check if frontend is still running
    if [[ -n "$FRONTEND_PID" ]] && ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}[ERROR]${RESET} Frontend server stopped"
        return 1
    fi
    
    return 0
}
