#!/usr/bin/env pwsh
# Enhanced Docker Startup with Better Error Handling

Write-Host "🦂 Scorpius Docker Startup Helper" -ForegroundColor Green
Write-Host ""

function Test-DockerDaemon {
    try {
        $result = docker ps 2>&1
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Wait-ForDocker {
    param([int]$TimeoutSeconds = 120)
    
    Write-Host "⏳ Waiting for Docker daemon to be ready..." -ForegroundColor Yellow
    $elapsed = 0
    
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-DockerDaemon) {
            Write-Host "✅ Docker daemon is ready!" -ForegroundColor Green
            return $true
        }
        
        Start-Sleep -Seconds 5
        $elapsed += 5
        
        if ($elapsed % 15 -eq 0) {
            Write-Host "   Still waiting... ($elapsed/$TimeoutSeconds seconds)" -ForegroundColor Cyan
        }
    }
    
    Write-Host "❌ Docker daemon failed to start within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Check if Docker Desktop process is running
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue

if (-not $dockerProcess) {
    Write-Host "🐳 Docker Desktop is not running. Please start it manually:" -ForegroundColor Yellow
    Write-Host "   1. Press Windows key and search 'Docker Desktop'" -ForegroundColor Cyan
    Write-Host "   2. Click on Docker Desktop" -ForegroundColor Cyan
    Write-Host "   3. Wait for the whale icon to appear in system tray" -ForegroundColor Cyan
    Write-Host "   4. Run this script again" -ForegroundColor Cyan
    Write-Host ""
    
    # Try to start it automatically
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Write-Host "🚀 Attempting to start Docker Desktop automatically..." -ForegroundColor Yellow
        Start-Process -FilePath $dockerPath
        Write-Host "   Docker Desktop started. Waiting for it to initialize..." -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ Docker Desktop process is running" -ForegroundColor Green
}

# Wait for Docker daemon to be ready
if (Wait-ForDocker -TimeoutSeconds 120) {
    Write-Host ""
    Write-Host "🎉 Docker is fully ready!" -ForegroundColor Green
    Write-Host "🦂 You can now start Scorpius Platform with:" -ForegroundColor Cyan
    Write-Host "   .\scripts\start-scorpius.ps1" -ForegroundColor White
    
    # Test basic Docker functionality
    Write-Host ""
    Write-Host "🧪 Testing Docker functionality..." -ForegroundColor Yellow
    try {
        docker run --rm hello-world | Out-Null
        Write-Host "✅ Docker test successful!" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Docker test failed, but daemon is running" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ Docker startup failed. Manual steps required:" -ForegroundColor Red
    Write-Host "   1. Close any Docker Desktop windows" -ForegroundColor Yellow
    Write-Host "   2. Right-click Docker Desktop in system tray and restart" -ForegroundColor Yellow
    Write-Host "   3. Or restart Docker Desktop completely" -ForegroundColor Yellow
    Write-Host "   4. Wait for full startup (can take 2-3 minutes)" -ForegroundColor Yellow
}
