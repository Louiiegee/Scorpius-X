#!/usr/bin/env pwsh
# Alternative Scorpius Startup (No Docker Required)

Write-Host "🦂 " -ForegroundColor Red -NoNewline
Write-Host "SCORPIUS DIRECT STARTUP (No Docker)" -ForegroundColor Green
Write-Host "   Running components directly on your system" -ForegroundColor Cyan
Write-Host ""

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Stop,
    [switch]$Setup
)

function Test-Python {
    try {
        python --version | Out-Null
        return $true
    }
    catch {
        try {
            python3 --version | Out-Null
            return $true
        }
        catch {
            return $false
        }
    }
}

function Test-Node {
    try {
        node --version | Out-Null
        npm --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Start-Backend {
    Write-Host "🔧 Starting Python Backend..." -ForegroundColor Yellow
    
    if (-not (Test-Path "backend\backend\backend\main.py")) {
        Write-Host "❌ Backend files not found" -ForegroundColor Red
        return $false
    }
    
    Push-Location "backend\backend\backend"
    
    try {
        # Install dependencies if needed
        if (Test-Path "requirements.txt") {
            Write-Host "   Installing Python dependencies..." -ForegroundColor Cyan
            pip install -r requirements.txt --quiet
        }
        
        # Start the backend server
        Write-Host "   Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
        Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru
        
        return $true
    }
    catch {
        Write-Host "❌ Failed to start backend" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-Host "🎨 Starting React Frontend..." -ForegroundColor Yellow
    
    if (-not (Test-Path "frontend\package.json")) {
        Write-Host "❌ Frontend files not found" -ForegroundColor Red
        return $false
    }
    
    Push-Location "frontend"
    
    try {
        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Host "   Installing Node.js dependencies..." -ForegroundColor Cyan
            npm install
        }
        
        # Start the frontend server
        Write-Host "   Starting React dev server on http://localhost:3000" -ForegroundColor Green
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru
        
        return $true
    }
    catch {
        Write-Host "❌ Failed to start frontend" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

function Stop-ScorpiusProcesses {
    Write-Host "⏹️  Stopping Scorpius processes..." -ForegroundColor Yellow
    
    # Stop Python processes (backend)
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force
    
    # Stop Node processes (frontend)
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" } | Stop-Process -Force
    
    Write-Host "✅ Processes stopped" -ForegroundColor Green
}

# Handle operations
if ($Stop) {
    Stop-ScorpiusProcesses
    exit 0
}

if ($Setup) {
    Write-Host "🔧 Setting up direct development environment..." -ForegroundColor Yellow
    
    # Check prerequisites
    if (-not (Test-Python)) {
        Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
        Write-Host "   Download from: https://python.org" -ForegroundColor Cyan
        exit 1
    }
    
    if (-not (Test-Node)) {
        Write-Host "❌ Node.js not found. Please install Node.js 16+" -ForegroundColor Red
        Write-Host "   Download from: https://nodejs.org" -ForegroundColor Cyan
        exit 1
    }
    
    Write-Host "✅ Prerequisites met!" -ForegroundColor Green
    exit 0
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan

if (-not (Test-Python)) {
    Write-Host "❌ Python not found. Please install Python 3.8+ from https://python.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python available" -ForegroundColor Green

if (-not (Test-Node)) {
    Write-Host "❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js available" -ForegroundColor Green

# Start services
if ($BackendOnly) {
    Start-Backend
}
elseif ($FrontendOnly) {
    Start-Frontend
}
else {
    # Start both
    Write-Host "`n🚀 Starting complete Scorpius Platform..." -ForegroundColor Green
    
    if (Start-Backend) {
        Start-Sleep -Seconds 5
        Start-Frontend
        
        Write-Host ""
        Write-Host "🎉 Scorpius Platform Started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Access Points:" -ForegroundColor Cyan
        Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
        Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White
        Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor White
        Write-Host ""
        Write-Host "⏹️  To stop: .\scripts\start-direct.ps1 -Stop" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "💡 Note: This runs without Docker. For full features including:" -ForegroundColor Yellow
Write-Host "   • Database (PostgreSQL)" -ForegroundColor Cyan
Write-Host "   • Cache (Redis)" -ForegroundColor Cyan  
Write-Host "   • Blockchain simulation (Anvil)" -ForegroundColor Cyan
Write-Host "   Please fix Docker and use: .\scripts\start-scorpius.ps1" -ForegroundColor Cyan
