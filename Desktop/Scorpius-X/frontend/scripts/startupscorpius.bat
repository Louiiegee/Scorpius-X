@echo off
REM Scorpius Cybersecurity Platform - Universal Startup Script
REM Automatically installs dependencies, starts servers, and launches applications

setlocal EnableDelayedExpansion

echo.
echo  ████████╗██╗  ██╗███████╗    ███████╗ ██████╗ ██████╗ ██████╗ ██████╗ ██╗██╗   ██╗███████╗
echo  ╚══██╔══╝██║  ██║██╔════╝    ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗██║██║   ██║██╔════╝
echo     ██║   ███████║█████╗      ███████╗██║     ██║   ██║██████╔╝██████╔╝██║██║   ██║███████╗
echo     ██║   ██╔══██║██╔══╝      ╚════██║██║     ██║   ██║██╔══██╗██╔═══╝ ██║██║   ██║╚════██║
echo     ██║   ██║  ██║███████╗    ███████║╚██████╗╚██████╔╝██║  ██║██║     ██║╚██████╔╝███████║
echo     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝
echo.
echo                          🔥 CYBERSECURITY PLATFORM STARTUP 🔥
echo                         ==========================================
echo.

REM Color definitions
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "MAGENTA=[95m"
set "CYAN=[96m"
set "WHITE=[97m"
set "RESET=[0m"

REM Configuration
set "FRONTEND_PORT=8080"
set "BACKEND_PORT=8000"
set "PROJECT_DIR=%~dp0.."
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%"
set "ELECTRON_DELAY=5"
set "HEALTH_CHECK_TIMEOUT=60"

REM Process tracking
set "BACKEND_PID="
set "FRONTEND_PID="
set "ELECTRON_PID="

echo %CYAN%[INFO]%RESET% Starting Scorpius Cybersecurity Platform...
echo %CYAN%[INFO]%RESET% Project Directory: %PROJECT_DIR%
echo.

REM Change to project directory
cd /d "%PROJECT_DIR%"

REM Step 1: Check and install dependencies
echo %YELLOW%[STEP 1/6]%RESET% %BLUE%Checking system requirements...%RESET%
call :check_system_requirements
if errorlevel 1 goto :error

REM Step 2: Install Node.js dependencies
echo %YELLOW%[STEP 2/6]%RESET% %BLUE%Installing Node.js dependencies...%RESET%
call :install_node_dependencies
if errorlevel 1 goto :error

REM Step 3: Install Python dependencies
echo %YELLOW%[STEP 3/6]%RESET% %BLUE%Installing Python dependencies...%RESET%
call :install_python_dependencies
if errorlevel 1 goto :error

REM Step 4: Start backend server
echo %YELLOW%[STEP 4/6]%RESET% %BLUE%Starting backend server...%RESET%
call :start_backend
if errorlevel 1 goto :error

REM Step 5: Start frontend server
echo %YELLOW%[STEP 5/6]%RESET% %BLUE%Starting frontend server...%RESET%
call :start_frontend
if errorlevel 1 goto :error

REM Step 6: Launch applications
echo %YELLOW%[STEP 6/6]%RESET% %BLUE%Launching applications...%RESET%
call :launch_applications

echo.
echo %GREEN%[SUCCESS]%RESET% 🎉 Scorpius Platform started successfully!
echo.
echo %WHITE%Available interfaces:%RESET%
echo   %CYAN%🌐 Web Dashboard:%RESET%   http://localhost:%FRONTEND_PORT%
echo   %CYAN%📡 API Server:%RESET%      http://localhost:%BACKEND_PORT%
echo   %CYAN%🖥️ Desktop App:%RESET%     Launching automatically...
echo   %CYAN%📖 API Docs:%RESET%        http://localhost:%BACKEND_PORT%/docs
echo.
echo %YELLOW%[CONTROLS]%RESET%
echo   Press %WHITE%Ctrl+C%RESET% to stop all services
echo   Check logs in the console for real-time status
echo.

REM Wait for user input or process termination
:wait_loop
timeout /t 5 >nul
call :check_processes
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% One or more services stopped unexpectedly
    goto :cleanup
)
goto :wait_loop

REM Functions
:check_system_requirements
echo %CYAN%[CHECK]%RESET% Verifying system requirements...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Node.js not found. Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %GREEN%[OK]%RESET% Node.js found: %NODE_VERSION%

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Python not found. Please install Python 3.8+ from https://python.org
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo %GREEN%[OK]%RESET% Python found: %PYTHON_VERSION%

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% npm not found. Please reinstall Node.js
    exit /b 1
)
echo %GREEN%[OK]%RESET% npm found

REM Check pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% pip not found. Please reinstall Python
    exit /b 1
)
echo %GREEN%[OK]%RESET% pip found

REM Check ports availability
netstat -an | findstr ":8080 " >nul
if not errorlevel 1 (
    echo %YELLOW%[WARNING]%RESET% Port 8080 is already in use
)

netstat -an | findstr ":8000 " >nul
if not errorlevel 1 (
    echo %YELLOW%[WARNING]%RESET% Port 8000 is already in use
)

echo %GREEN%[OK]%RESET% System requirements check completed
exit /b 0

:install_node_dependencies
echo %CYAN%[INSTALL]%RESET% Installing Node.js packages...

if not exist package.json (
    echo %RED%[ERROR]%RESET% package.json not found in project directory
    exit /b 1
)

REM Check if node_modules exists
if exist node_modules (
    echo %CYAN%[INFO]%RESET% node_modules found, checking for updates...
)

REM Install/update dependencies
npm install
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Failed to install Node.js dependencies
    exit /b 1
)

echo %GREEN%[OK]%RESET% Node.js dependencies installed successfully
exit /b 0

:install_python_dependencies
echo %CYAN%[INSTALL]%RESET% Installing Python packages...

if not exist "%BACKEND_DIR%\requirements.txt" (
    echo %RED%[ERROR]%RESET% requirements.txt not found in backend directory
    exit /b 1
)

cd /d "%BACKEND_DIR%"

REM Install Python dependencies
pip install -r requirements.txt
if errorlevel 1 (
    echo %YELLOW%[WARNING]%RESET% Some Python packages failed to install, continuing...
)

cd /d "%PROJECT_DIR%"
echo %GREEN%[OK]%RESET% Python dependencies installed successfully
exit /b 0

:start_backend
echo %CYAN%[START]%RESET% Launching FastAPI backend server...

cd /d "%BACKEND_DIR%"

REM Start backend in background
start "Scorpius Backend" /min python start.py
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Failed to start backend server
    exit /b 1
)

REM Wait for backend to be ready
echo %CYAN%[WAIT]%RESET% Waiting for backend server to initialize...
set /a "count=0"
:backend_wait
timeout /t 2 >nul
curl -s http://localhost:%BACKEND_PORT%/health >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%[OK]%RESET% Backend server is ready
    cd /d "%PROJECT_DIR%"
    exit /b 0
)

set /a "count+=1"
if %count% lss 30 goto :backend_wait

echo %RED%[ERROR]%RESET% Backend server failed to start within timeout
cd /d "%PROJECT_DIR%"
exit /b 1

:start_frontend
echo %CYAN%[START]%RESET% Launching Vite frontend server...

REM Start frontend in background
start "Scorpius Frontend" /min npm run dev
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Failed to start frontend server
    exit /b 1
)

REM Wait for frontend to be ready
echo %CYAN%[WAIT]%RESET% Waiting for frontend server to initialize...
set /a "count=0"
:frontend_wait
timeout /t 2 >nul
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%[OK]%RESET% Frontend server is ready
    exit /b 0
)

set /a "count+=1"
if %count% lss 20 goto :frontend_wait

echo %RED%[ERROR]%RESET% Frontend server failed to start within timeout
exit /b 1

:launch_applications
echo %CYAN%[LAUNCH]%RESET% Opening applications...

REM Wait a moment for servers to stabilize
timeout /t %ELECTRON_DELAY% >nul

REM Check if first run
if exist "%PROJECT_DIR%\data\first-run.flag" (
    echo %CYAN%[INFO]%RESET% First run detected - will show license verification
    set "LAUNCH_URL=http://localhost:%FRONTEND_PORT%"
) else (
    echo %CYAN%[INFO]%RESET% Returning user - will show login page
    set "LAUNCH_URL=http://localhost:%FRONTEND_PORT%"
)

REM Launch Electron app
echo %CYAN%[LAUNCH]%RESET% Starting Electron desktop application...
start "Scorpius Desktop" npm run electron
if errorlevel 1 (
    echo %YELLOW%[WARNING]%RESET% Failed to start Electron app
)

REM Wait a moment then launch web browser
timeout /t 3 >nul
echo %CYAN%[LAUNCH]%RESET% Opening web dashboard in browser...
start "" "!LAUNCH_URL!"

echo %GREEN%[OK]%RESET% Applications launched successfully
exit /b 0

:check_processes
REM Check if backend is still running
tasklist /FI "WINDOWTITLE eq Scorpius Backend" 2>nul | findstr /i "python.exe" >nul
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Backend server stopped
    exit /b 1
)

REM Check if frontend is still running
tasklist /FI "WINDOWTITLE eq Scorpius Frontend" 2>nul | findstr /i "node.exe" >nul
if errorlevel 1 (
    echo %RED%[ERROR]%RESET% Frontend server stopped
    exit /b 1
)

exit /b 0

:cleanup
echo.
echo %YELLOW%[CLEANUP]%RESET% Stopping all services...

REM Stop all related processes
taskkill /F /FI "WINDOWTITLE eq Scorpius*" >nul 2>&1
taskkill /F /IM "npm.cmd" >nul 2>&1
taskkill /F /IM "node.exe" >nul 2>&1
taskkill /F /IM "python.exe" >nul 2>&1

echo %GREEN%[OK]%RESET% All services stopped
echo %CYAN%[INFO]%RESET% Thank you for using Scorpius Cybersecurity Platform!
exit /b 0

:error
echo.
echo %RED%[FATAL ERROR]%RESET% Startup failed. Please check the errors above and try again.
echo %CYAN%[HELP]%RESET% For support, visit: https://support.scorpius-security.com
call :cleanup
exit /b 1
