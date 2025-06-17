#!/usr/bin/env pwsh
# Docker Desktop Startup Helper

param(
    [switch]$StartDocker,
    [switch]$Wait
)

function Test-DockerRunning {
    try {
        docker info 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Start-DockerDesktop {
    Write-Host "🐳 Starting Docker Desktop..." -ForegroundColor Yellow
    
    # Try different Docker Desktop paths
    $dockerPaths = @(
        "C:\Program Files\Docker\Docker\Docker Desktop.exe",
        "C:\Program Files (x86)\Docker\Docker\Docker Desktop.exe",
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    )
    
    $dockerStarted = $false
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            Write-Host "Found Docker Desktop at: $path" -ForegroundColor Cyan
            Start-Process -FilePath $path -WindowStyle Hidden
            $dockerStarted = $true
            break
        }
    }
    
    if (-not $dockerStarted) {
        Write-Host "❌ Docker Desktop not found. Please start it manually." -ForegroundColor Red
        Write-Host "   Search for 'Docker Desktop' in Start Menu and run it." -ForegroundColor Yellow
        return $false
    }
    
    # Wait for Docker to start
    Write-Host "⏳ Waiting for Docker to start..." -ForegroundColor Yellow
    $timeout = 120 # 2 minutes
    $elapsed = 0
    
    while (-not (Test-DockerRunning) -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "   Checking... ($elapsed/$timeout seconds)" -ForegroundColor Cyan
    }
    
    if (Test-DockerRunning) {
        Write-Host "✅ Docker Desktop is running!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Docker Desktop failed to start within $timeout seconds" -ForegroundColor Red
        return $false
    }
}

# Main execution
if ($StartDocker -or -not (Test-DockerRunning)) {
    if (-not (Start-DockerDesktop)) {
        Write-Host ""
        Write-Host "🔧 Manual Steps:" -ForegroundColor Yellow
        Write-Host "1. Open Start Menu and search for 'Docker Desktop'" -ForegroundColor Cyan
        Write-Host "2. Click on Docker Desktop to start it" -ForegroundColor Cyan
        Write-Host "3. Wait for Docker to fully start (whale icon in system tray)" -ForegroundColor Cyan
        Write-Host "4. Then run: .\scripts\start-scorpius.ps1" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "✅ Docker is already running!" -ForegroundColor Green
}

if ($Wait) {
    Write-Host ""
    Write-Host "🦂 Docker is ready! You can now start Scorpius Platform." -ForegroundColor Green
    Write-Host "Run: .\scripts\start-scorpius.ps1" -ForegroundColor Cyan
}
