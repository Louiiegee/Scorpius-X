@echo off
echo ========================================
echo   SCORPIUS CYBERSECURITY DASHBOARD
echo   Windows Development Mode
echo ========================================
echo.

echo Starting development servers...
echo.
echo [1] Web Server: http://localhost:8080
echo [2] Electron App: Will launch automatically
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start the web development server and Electron app
start "Scorpius Web Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start "Scorpius Electron App" cmd /k "npm run electron"

echo.
echo Both servers are starting...
echo - Web interface: http://localhost:8080
echo - Electron app: Opening in new window
echo.
echo Press any key to exit this script (servers will continue running)...
pause >nul
