#!/usr/bin/env pwsh
# Quick start script for Scorpius Security Platform

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Setup,
    [switch]$Stop,
    [switch]$Logs,
    [switch]$Clean
)

function Write-ScorpiusLogo {
    Write-Host "🦂 " -ForegroundColor Red -NoNewline
    Write-Host "SCORPIUS SECURITY PLATFORM" -ForegroundColor Green
    Write-Host "   Blockchain Vulnerability Scanner & Analysis Suite" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Docker {
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
        
        # Check if Docker daemon is running
        docker info 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Start-DockerIfNeeded {
    if (-not (Test-Docker)) {
        Write-Host "🐳 Docker Desktop is not running. Starting it..." -ForegroundColor Yellow
        
        # Try to start Docker Desktop
        $dockerPaths = @(
            "C:\Program Files\Docker\Docker\Docker Desktop.exe",
            "C:\Program Files (x86)\Docker\Docker\Docker Desktop.exe"
        )
        
        $dockerFound = $false
        foreach ($path in $dockerPaths) {
            if (Test-Path $path) {
                Write-Host "   Starting Docker Desktop..." -ForegroundColor Cyan
                Start-Process -FilePath $path -WindowStyle Hidden
                $dockerFound = $true
                break
            }
        }
        
        if (-not $dockerFound) {
            Write-Host "❌ Docker Desktop not found. Please start it manually:" -ForegroundColor Red
            Write-Host "   1. Open Start Menu and search 'Docker Desktop'" -ForegroundColor Yellow
            Write-Host "   2. Click to start Docker Desktop" -ForegroundColor Yellow
            Write-Host "   3. Wait for it to fully start" -ForegroundColor Yellow
            Write-Host "   4. Then run this script again" -ForegroundColor Yellow
            return $false
        }
        
        # Wait for Docker to start
        Write-Host "   Waiting for Docker to start..." -ForegroundColor Cyan
        $timeout = 60
        $elapsed = 0
        
        while (-not (Test-Docker) -and $elapsed -lt $timeout) {
            Start-Sleep -Seconds 5
            $elapsed += 5
            Write-Host "   Still waiting... ($elapsed/$timeout seconds)" -ForegroundColor Cyan
        }
        
        if (-not (Test-Docker)) {
            Write-Host "❌ Docker failed to start. Please start Docker Desktop manually." -ForegroundColor Red
            return $false
        }
        
        Write-Host "✅ Docker Desktop is now running!" -ForegroundColor Green
    }
    return $true
}

Write-ScorpiusLogo

if (-not (Start-DockerIfNeeded)) {
    exit 1
}

# Handle different operations
if ($Setup) {
    Write-Host "🔧 Setting up Scorpius Platform..." -ForegroundColor Yellow
    & ".\setup-scorpius.ps1"
    exit 0
}

if ($Stop) {
    Write-Host "⏹️  Stopping Scorpius Platform..." -ForegroundColor Yellow
    docker-compose down
    exit 0
}

if ($Clean) {
    Write-Host "🧹 Cleaning up Scorpius Platform..." -ForegroundColor Yellow
    docker-compose down -v --remove-orphans
    docker system prune -f
    exit 0
}

if ($Logs) {
    Write-Host "📋 Showing Scorpius Platform logs..." -ForegroundColor Yellow
    docker-compose logs -f
    exit 0
}

# Start services
if ($BackendOnly) {
    Write-Host "🔧 Starting backend services only..." -ForegroundColor Yellow
    docker-compose up -d scorpius-backend scorpius-db scorpius-redis scorpius-anvil
}
elseif ($FrontendOnly) {
    Write-Host "🎨 Starting frontend service only..." -ForegroundColor Yellow
    docker-compose up -d scorpius-frontend
}
else {
    Write-Host "🚀 Starting complete Scorpius Security Platform..." -ForegroundColor Yellow
    docker-compose up -d
}

Write-Host ""
Write-Host "✅ Platform Status:" -ForegroundColor Green
Write-Host "   🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "   🔌 WebSocket: ws://localhost:8001" -ForegroundColor Cyan
Write-Host "   ⛓️  Anvil Blockchain: http://localhost:8545" -ForegroundColor Cyan
Write-Host "   📊 Database: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛠️  Management Commands:" -ForegroundColor Yellow
Write-Host "   .\start-scorpius.ps1 -Logs     # View logs"
Write-Host "   .\start-scorpius.ps1 -Stop     # Stop platform"
Write-Host "   .\start-scorpius.ps1 -Clean    # Clean everything"
