#!/usr/bin/env pwsh
# Enhanced Scorpius Electron Launcher with Debug Support

param(
    [switch]$Debug,
    [switch]$Restart
)

Write-Host "🦂 Scorpius Electron Dashboard Launcher" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Kill any existing processes if restart is requested
if ($Restart) {
    Write-Host "🔄 Stopping existing processes..." -ForegroundColor Yellow
    Get-Process -Name "electron" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*vite*"} | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Navigate to project root
Set-Location "C:\Users\ADMIN\Desktop\Scorpius-Enterprise"

# Check backend status
Write-Host "📡 Checking backend status..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 3
    Write-Host "✅ Backend is healthy: $($backendResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not responding. You may want to start it:" -ForegroundColor Yellow
    Write-Host "   Run: .\scripts\start-scorpius.ps1 -BackendOnly" -ForegroundColor White
}

# Navigate to frontend
Set-Location "frontend"

# Check if Vite dev server is running
$viteRunning = $false
$vitePort = 8080
Write-Host "🌐 Checking Vite dev server on port $vitePort..." -ForegroundColor Yellow

try {
    $viteResponse = Invoke-WebRequest -Uri "http://localhost:$vitePort" -Method Head -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "✅ Vite dev server is running on port $vitePort" -ForegroundColor Green
    $viteRunning = $true
} catch {
    Write-Host "🚀 Starting Vite dev server..." -ForegroundColor Yellow
    $viteProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru
    
    # Wait for Vite to start
    $attempts = 0
    do {
        Start-Sleep -Seconds 2
        $attempts++
        try {
            $testResponse = Invoke-WebRequest -Uri "http://localhost:$vitePort" -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
            $viteRunning = $true
            break
        } catch {
            Write-Host "⏳ Waiting for Vite to start... (attempt $attempts/10)" -ForegroundColor Yellow
        }
    } while ($attempts -lt 10)
    
    if ($viteRunning) {
        Write-Host "✅ Vite dev server started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start Vite dev server" -ForegroundColor Red
        Write-Host "Please check the terminal output for errors" -ForegroundColor Yellow
        exit 1
    }
}

# Navigate to electron directory
Set-Location "electron"

# Set environment variables
$env:ELECTRON_IS_DEV = "true"
$env:NODE_ENV = "development"

Write-Host "" -ForegroundColor White
Write-Host "🚀 Launching Scorpius Electron Dashboard..." -ForegroundColor Green
Write-Host "📱 Application URL: http://localhost:$vitePort" -ForegroundColor Cyan
Write-Host "🔧 Developer mode enabled with DevTools" -ForegroundColor Cyan

if ($Debug) {
    Write-Host "🐛 Debug mode: DevTools will open automatically" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor White
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • If you see a black screen, check the DevTools console (F12)" -ForegroundColor White
Write-Host "   • Make sure backend is running on http://localhost:3001" -ForegroundColor White
Write-Host "   • Auth bypass is temporarily enabled for development" -ForegroundColor White
Write-Host "" -ForegroundColor White

# Start Electron
try {
    & npm run electron
} catch {
    Write-Host "❌ Failed to start Electron application" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "👋 Electron application closed" -ForegroundColor Yellow
