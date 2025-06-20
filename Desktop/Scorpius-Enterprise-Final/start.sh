#!/bin/bash

# SCORPIUS ENTERPRISE - ONE-CLICK STARTUP
# This script starts both frontend and backend together

echo "🚀 Starting Scorpius Cybersecurity Dashboard..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.9+ and try again."
    exit 1
fi

echo "✅ Requirements check passed"
echo ""

# Install frontend dependencies if needed
echo "📦 Installing frontend dependencies..."
cd frontend/
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install backend dependencies if needed
echo "🐍 Installing backend dependencies..."
cd ../backend/
if ! python3 -c "import flask" 2>/dev/null; then
    pip install flask flask-cors flask-jwt-extended
fi

echo ""
echo "🌟 STARTING SCORPIUS DASHBOARD..."
echo ""
echo "🌐 Frontend: http://localhost:8080"
echo "🔗 Backend:  http://localhost:8000"
echo "🔑 Login:    demo/demo"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
python3 app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend in background
cd ../frontend/
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
