#!/usr/bin/env pwsh
# Scorpius Docker Troubleshooting & Recovery Script

Write-Host "🦂 " -ForegroundColor Red -NoNewline
Write-Host "SCORPIUS DOCKER TROUBLESHOOTING" -ForegroundColor Green
Write-Host ""

function Test-WSL {
    try {
        $wslList = wsl --list --verbose 2>$null
        if ($wslList -match "Ubuntu.*Running") {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

function Start-WSL {
    Write-Host "🔧 Starting WSL (required for Docker)..." -ForegroundColor Yellow
    try {
        wsl --distribution Ubuntu --exec echo "WSL Started" | Out-Null
        Start-Sleep -Seconds 5
        
        if (Test-WSL) {
            Write-Host "✅ WSL is now running" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ Failed to start WSL" -ForegroundColor Red
    }
    return $false
}

function Test-DockerDesktop {
    $dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    return $dockerProcess -ne $null
}

function Test-DockerDaemon {
    try {
        docker ps 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

# Step 1: Check and start WSL
Write-Host "1️⃣ Checking WSL status..." -ForegroundColor Cyan
if (-not (Test-WSL)) {
    Write-Host "   WSL is not running. Starting it..." -ForegroundColor Yellow
    if (-not (Start-WSL)) {
        Write-Host "❌ WSL failed to start. Try these manual steps:" -ForegroundColor Red
        Write-Host "   • Open PowerShell as Administrator" -ForegroundColor Yellow
        Write-Host "   • Run: wsl --set-default-version 2" -ForegroundColor Yellow
        Write-Host "   • Run: wsl --install Ubuntu" -ForegroundColor Yellow
        Write-Host "   • Restart computer" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ WSL is running" -ForegroundColor Green
}

# Step 2: Check Docker Desktop
Write-Host "`n2️⃣ Checking Docker Desktop..." -ForegroundColor Cyan
if (-not (Test-DockerDesktop)) {
    Write-Host "   Docker Desktop is not running. Starting it..." -ForegroundColor Yellow
    
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process -FilePath $dockerPath
        Write-Host "   Docker Desktop started. Waiting for initialization..." -ForegroundColor Cyan
        Start-Sleep -Seconds 10
    } else {
        Write-Host "❌ Docker Desktop not found at expected location" -ForegroundColor Red
        Write-Host "   Please install Docker Desktop from https://docker.com" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Docker Desktop process is running" -ForegroundColor Green
}

# Step 3: Wait for Docker daemon
Write-Host "`n3️⃣ Waiting for Docker daemon..." -ForegroundColor Cyan
$timeout = 120
$elapsed = 0

while (-not (Test-DockerDaemon) -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 10
    $elapsed += 10
    Write-Host "   Still waiting... ($elapsed/$timeout seconds)" -ForegroundColor Yellow
}

if (Test-DockerDaemon) {
    Write-Host "✅ Docker daemon is ready!" -ForegroundColor Green
    
    # Test Docker functionality
    Write-Host "`n4️⃣ Testing Docker..." -ForegroundColor Cyan
    try {
        docker --version
        Write-Host "✅ Docker is working correctly!" -ForegroundColor Green
        
        Write-Host "`n🎉 DOCKER IS READY!" -ForegroundColor Green
        Write-Host "🚀 You can now start Scorpius Platform:" -ForegroundColor Cyan
        Write-Host "   .\scripts\start-scorpius.ps1" -ForegroundColor White
        
    } catch {
        Write-Host "⚠️  Docker version check failed, but daemon is running" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Docker daemon failed to start within $timeout seconds" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Close Docker Desktop completely" -ForegroundColor Cyan
    Write-Host "2. Open Task Manager and end all Docker processes" -ForegroundColor Cyan
    Write-Host "3. Restart Docker Desktop as Administrator" -ForegroundColor Cyan
    Write-Host "4. Wait 3-5 minutes for complete startup" -ForegroundColor Cyan
    Write-Host "5. Check system tray for Docker whale icon" -ForegroundColor Cyan
}
