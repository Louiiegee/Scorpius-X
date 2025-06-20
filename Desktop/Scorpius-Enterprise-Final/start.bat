@echo off
echo 🚀 Starting Scorpius Cybersecurity Dashboard...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.9+ and try again.
    pause
    exit /b 1
)

echo ✅ Requirements check passed
echo.

REM Install frontend dependencies if needed
echo 📦 Installing frontend dependencies...
cd frontend\
if not exist node_modules\ (
    npm install
)

REM Install backend dependencies
echo 🐍 Installing backend dependencies...
cd ..\backend\
pip install flask flask-cors flask-jwt-extended

echo.
echo 🌟 STARTING SCORPIUS DASHBOARD...
echo.
echo 🌐 Frontend: http://localhost:8080
echo 🔗 Backend:  http://localhost:8000
echo 🔑 Login:    demo/demo
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend
start /B python app.py

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
cd ..\frontend\
npm run dev

pause
