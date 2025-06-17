#!/usr/bin/env pwsh
# Scorpius Electron Dashboard Launcher
# This script will start the Scorpius platform in Electron mode

Write-Host "🦂 Starting Scorpius Electron Dashboard..." -ForegroundColor Green

# Ensure we're in the correct directory
Set-Location "C:\Users\ADMIN\Desktop\Scorpius-Enterprise"

# Check if backend is running
Write-Host "📡 Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "✅ Backend is running and healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not detected. Starting backend first..." -ForegroundColor Yellow
    
    # Start the backend
    Start-Process -FilePath "pwsh" -ArgumentList "-ExecutionPolicy", "Bypass", "-File", ".\scripts\start-scorpius.ps1", "-BackendOnly" -NoNewWindow
    
    Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verify backend is now running
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 10
        Write-Host "✅ Backend started successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start backend. Please check logs." -ForegroundColor Red
        exit 1
    }
}

# Navigate to frontend directory
Set-Location "frontend"

# Check if dist directory exists, if not build the app
if (-not (Test-Path "dist")) {
    Write-Host "🔨 Building frontend application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        exit 1
    }
}

# Start the Electron application
Write-Host "🚀 Launching Scorpius Electron Dashboard..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Dashboard Features:" -ForegroundColor Cyan
Write-Host "   • Blockchain Security Scanning" -ForegroundColor White
Write-Host "   • MEV Analysis & Simulation" -ForegroundColor White
Write-Host "   • Enterprise Dashboard" -ForegroundColor White
Write-Host "   • Real-time Monitoring" -ForegroundColor White
Write-Host "   • Advanced Reporting" -ForegroundColor White
Write-Host ""

# Run the Electron development script
npm run electron:dev

Write-Host "👋 Scorpius Electron Dashboard closed." -ForegroundColor Yellow
