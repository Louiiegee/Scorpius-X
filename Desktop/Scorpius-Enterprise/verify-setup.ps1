#!/usr/bin/env pwsh
# Scorpius Platform Verification Script

Write-Host "🦂 " -ForegroundColor Red -NoNewline
Write-Host "SCORPIUS PLATFORM VERIFICATION" -ForegroundColor Green
Write-Host ""

$allGood = $true

# Check directories
Write-Host "📁 Checking directory structure..." -ForegroundColor Yellow
$requiredDirs = @(
    "backend",
    "frontend", 
    "docker",
    "scripts",
    "data",
    ".vscode"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "  ✅ $dir" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $dir missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Check key files
Write-Host "`n📄 Checking key files..." -ForegroundColor Yellow
$requiredFiles = @(
    "docker-compose.yml",
    "README.md",
    "INSTALLATION.md",
    ".env",
    "setup-scorpius.ps1",
    "scripts\start-scorpius.ps1",
    "docker\Dockerfile.backend",
    "docker\Dockerfile.frontend",
    "docker\nginx.conf",
    "docker\init-db.sql"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Check repository status
Write-Host "`n📦 Checking repositories..." -ForegroundColor Yellow

if (Test-Path "backend\.git") {
    Write-Host "  ✅ Backend repository (newScorp)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Backend repository missing" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "frontend\.git") {
    Write-Host "  ✅ Frontend repository (new-dash)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend repository missing" -ForegroundColor Red
    $allGood = $false
}

# Check Python backend files
Write-Host "`n🐍 Checking Python backend..." -ForegroundColor Yellow
$backendFiles = @(
    "backend\backend\backend\main.py",
    "backend\backend\backend\requirements.txt",
    "backend\backend\backend\api_server.py"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Check frontend files
Write-Host "`n⚛️  Checking React frontend..." -ForegroundColor Yellow
$frontendFiles = @(
    "frontend\package.json",
    "frontend\src",
    "frontend\public"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Check Docker
Write-Host "`n🐳 Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "  ✅ Docker available" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker not found" -ForegroundColor Red
    $allGood = $false
}

try {
    docker-compose --version | Out-Null
    Write-Host "  ✅ Docker Compose available" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker Compose not found" -ForegroundColor Red
    $allGood = $false
}

# Final status
Write-Host ""
if ($allGood) {
    Write-Host "🎉 " -ForegroundColor Green -NoNewline
    Write-Host "SCORPIUS PLATFORM READY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Quick Start Commands:" -ForegroundColor Cyan
    Write-Host "   .\scripts\start-scorpius.ps1         # Start complete platform"
    Write-Host "   .\scripts\start-scorpius.ps1 -Logs   # View logs"
    Write-Host "   .\scripts\start-scorpius.ps1 -Stop   # Stop platform"
    Write-Host ""
    Write-Host "🌐 Access Points (after startup):" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3000"
    Write-Host "   Backend:   http://localhost:8000"
    Write-Host "   API Docs:  http://localhost:8000/docs"
} else {
    Write-Host "❌ " -ForegroundColor Red -NoNewline
    Write-Host "SETUP INCOMPLETE" -ForegroundColor Red
    Write-Host "Please run: .\setup-scorpius.ps1" -ForegroundColor Yellow
}
