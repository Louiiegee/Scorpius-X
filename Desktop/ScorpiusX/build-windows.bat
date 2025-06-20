@echo off
echo ========================================
echo   SCORPIUS CYBERSECURITY DASHBOARD
echo   Windows Build Script
echo ========================================
echo.

echo [1/5] Checking Node.js and npm...
node --version
npm --version
echo.

echo [2/5] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/5] Building React application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build React app
    pause
    exit /b 1
)
echo.

echo [4/5] Building Electron application for Windows...
npm run electron-build-win
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Electron app
    pause
    exit /b 1
)
echo.

echo [5/5] Build completed successfully!
echo.
echo OUTPUT FILES:
echo - Installer: dist-electron\Scorpius-Cybersecurity-Dashboard-*-Windows-x64.exe
echo - Portable: dist-electron\Scorpius-Cybersecurity-Dashboard-*-Windows-x64.zip
echo.
echo The Windows applications are ready for distribution!
echo.

echo Opening output folder...
start dist-electron

echo.
echo Build process completed successfully!
echo Press any key to exit...
pause >nul
