#!/usr/bin/env pwsh
# Quick Docker Build and Test Script

param(
    [switch]$Build,
    [switch]$Test,
    [switch]$Clean
)

Write-Host "🦂 Scorpius Docker Management" -ForegroundColor Green

if ($Clean) {
    Write-Host "🧹 Cleaning Docker resources..." -ForegroundColor Yellow
    docker-compose down -v --remove-orphans
    docker system prune -f
    docker volume prune -f
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
    exit 0
}

if ($Build) {
    Write-Host "🔨 Building Docker images..." -ForegroundColor Yellow
    
    # Build backend
    Write-Host "Building backend..." -ForegroundColor Cyan
    docker-compose build scorpius-backend --no-cache
    
    # Build frontend  
    Write-Host "Building frontend..." -ForegroundColor Cyan
    docker-compose build scorpius-frontend --no-cache
    
    Write-Host "✅ Build complete!" -ForegroundColor Green
}

if ($Test) {
    Write-Host "🧪 Testing platform startup..." -ForegroundColor Yellow
    
    # Start database and Redis first
    docker-compose up -d scorpius-db scorpius-redis
    Start-Sleep -Seconds 10
    
    # Start backend
    docker-compose up -d scorpius-backend
    Start-Sleep -Seconds 15
    
    # Start frontend
    docker-compose up -d scorpius-frontend
    Start-Sleep -Seconds 10
    
    # Test health endpoints
    Write-Host "Testing health endpoints..." -ForegroundColor Cyan
    try {
        $backendHealth = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5
        Write-Host "✅ Backend health: OK" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Backend health: FAIL" -ForegroundColor Red
    }
    
    try {
        $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        Write-Host "✅ Frontend health: OK" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Frontend health: FAIL" -ForegroundColor Red
    }
    
    Write-Host "📊 Platform Status:" -ForegroundColor Yellow
    docker-compose ps
}

Write-Host ""
Write-Host "🛠️  Available commands:" -ForegroundColor Yellow
Write-Host "   .\docker-manager.ps1 -Build    # Build images"
Write-Host "   .\docker-manager.ps1 -Test     # Test platform"
Write-Host "   .\docker-manager.ps1 -Clean    # Clean everything"
