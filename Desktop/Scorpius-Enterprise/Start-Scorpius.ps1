#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick launcher for Scorpius Security Platform

.DESCRIPTION
    This script provides easy access to different ways of running the Scorpius platform:
    - Web Dashboard (browser-based)
    - Electron Desktop App
    - Backend Only
    - Full Platform (all services)

.PARAMETER Mode
    Choose how to run Scorpius:
    - "web" or "w" = Web dashboard in browser
    - "electron" or "e" = Desktop Electron app
    - "backend" or "b" = Backend services only
    - "full" or "f" = Complete platform with all services
    - "status" or "s" = Check platform status

.EXAMPLE
    .\Start-Scorpius.ps1 -Mode web
    .\Start-Scorpius.ps1 -Mode electron
    .\Start-Scorpius.ps1 -Mode backend
    .\Start-Scorpius.ps1 -Mode full
    .\Start-Scorpius.ps1 -Mode status
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("web", "w", "electron", "e", "backend", "b", "full", "f", "status", "s")]
    [string]$Mode
)

# ASCII Art Header
$header = @"
╔══════════════════════════════════════════════════════════════╗
║                    🦂 SCORPIUS SECURITY PLATFORM 🦂          ║
║                  Blockchain Security Analysis Suite          ║
╚══════════════════════════════════════════════════════════════╝
"@

Write-Host $header -ForegroundColor Cyan
Write-Host ""

# If no mode specified, show menu
if (-not $Mode) {
    Write-Host "🚀 How would you like to run Scorpius today?" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. 🌐 Web Dashboard       (browser-based interface)" -ForegroundColor White
    Write-Host "2. 📱 Electron Desktop    (native desktop app)" -ForegroundColor White  
    Write-Host "3. 🔧 Backend Only        (API services only)" -ForegroundColor White
    Write-Host "4. 🌟 Full Platform       (all services + Docker)" -ForegroundColor White
    Write-Host "5. 📊 Status Check        (check what's running)" -ForegroundColor White
    Write-Host ""
    
    do {
        $choice = Read-Host "Enter your choice (1-5)"
    } while ($choice -notin @("1", "2", "3", "4", "5"))
    
    switch ($choice) {
        "1" { $Mode = "web" }
        "2" { $Mode = "electron" }
        "3" { $Mode = "backend" }
        "4" { $Mode = "full" }
        "5" { $Mode = "status" }
    }
}

# Normalize mode aliases
switch ($Mode) {
    "w" { $Mode = "web" }
    "e" { $Mode = "electron" }
    "b" { $Mode = "backend" }
    "f" { $Mode = "full" }
    "s" { $Mode = "status" }
}

# Function to check service status
function Test-ServiceStatus {
    param($Url, $Name, $TimeoutSec = 3)
    
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
        Write-Host "✅ $Name is running" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Name is not responding" -ForegroundColor Red
        return $false
    }
}

# Function to check if port is in use
function Test-Port {
    param($Port)
    
    try {
        $listener = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
        return $listener.Port -contains $Port
    } catch {
        return $false
    }
}

# Ensure we're in the correct directory
Set-Location "C:\Users\ADMIN\Desktop\Scorpius-Enterprise"

Write-Host "🎯 Mode: $($Mode.ToUpper())" -ForegroundColor Yellow
Write-Host ""

switch ($Mode) {
    "status" {
        Write-Host "📊 Checking Scorpius Platform Status..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check backend
        $backendOk = Test-ServiceStatus -Url "http://localhost:3001/health" -Name "Backend API (Port 3001)"
        
        # Check frontend web
        if (Test-Port -Port 3002) {
            Write-Host "✅ Frontend Web (Port 3002) is running" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend Web (Port 3002) is not running" -ForegroundColor Red
        }
        
        # Check Vite dev server
        if (Test-Port -Port 8080) {
            Write-Host "✅ Vite Dev Server (Port 8080) is running" -ForegroundColor Green
        } else {
            Write-Host "❌ Vite Dev Server (Port 8080) is not running" -ForegroundColor Red
        }
        
        # Check database
        if (Test-Port -Port 5432) {
            Write-Host "✅ PostgreSQL Database (Port 5432) is running" -ForegroundColor Green
        } else {
            Write-Host "❌ PostgreSQL Database (Port 5432) is not running" -ForegroundColor Red
        }
        
        # Check Redis
        if (Test-Port -Port 6379) {
            Write-Host "✅ Redis Cache (Port 6379) is running" -ForegroundColor Green
        } else {
            Write-Host "❌ Redis Cache (Port 6379) is not running" -ForegroundColor Red
        }
        
        # Check Nginx
        if (Test-Port -Port 80) {
            Write-Host "✅ Nginx Proxy (Port 80) is running" -ForegroundColor Green
        } else {
            Write-Host "❌ Nginx Proxy (Port 80) is not running" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "🌐 Access Points:" -ForegroundColor Cyan
        Write-Host "   • Main Web Interface: http://localhost" -ForegroundColor White
        Write-Host "   • Direct Frontend: http://localhost:3002" -ForegroundColor White
        Write-Host "   • Backend API: http://localhost:3001" -ForegroundColor White
        Write-Host "   • Dev Server: http://localhost:8080" -ForegroundColor White
    }
    
    "web" {
        Write-Host "🌐 Starting Scorpius Web Dashboard..." -ForegroundColor Green
        
        # Check if platform is running
        $backendOk = Test-ServiceStatus -Url "http://localhost:3001/health" -Name "Backend"
        
        if (-not $backendOk) {
            Write-Host "🚀 Starting backend services..." -ForegroundColor Yellow
            & ".\scripts\start-scorpius.ps1" -BackendOnly
            Start-Sleep -Seconds 5
        }
        
        Write-Host "🌐 Opening web dashboard..." -ForegroundColor Green
        Start-Process "http://localhost:3002"
        
        Write-Host ""
        Write-Host "✅ Scorpius Web Dashboard is ready!" -ForegroundColor Green
        Write-Host "🌐 URL: http://localhost:3002" -ForegroundColor Cyan
        Write-Host "🌟 Alternative: http://localhost (via Nginx)" -ForegroundColor Cyan
    }
    
    "electron" {
        Write-Host "📱 Starting Scorpius Electron Desktop App..." -ForegroundColor Green
        
        # Check backend
        $backendOk = Test-ServiceStatus -Url "http://localhost:3001/health" -Name "Backend"
        
        if (-not $backendOk) {
            Write-Host "🚀 Starting backend services..." -ForegroundColor Yellow
            & ".\scripts\start-scorpius.ps1" -BackendOnly
            Start-Sleep -Seconds 5
        }
        
        # Launch Electron app
        Write-Host "📱 Launching desktop application..." -ForegroundColor Green
        & ".\launch-electron-debug.ps1" -Debug
    }
    
    "backend" {
        Write-Host "🔧 Starting Backend Services Only..." -ForegroundColor Green
        & ".\scripts\start-scorpius.ps1" -BackendOnly
        
        Write-Host ""
        Write-Host "✅ Backend services started!" -ForegroundColor Green
        Write-Host "🔗 API URL: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "📚 Health Check: http://localhost:3001/health" -ForegroundColor Cyan
    }
    
    "full" {
        Write-Host "🌟 Starting Complete Scorpius Platform..." -ForegroundColor Green
        & ".\scripts\start-scorpius.ps1"
        
        Write-Host ""
        Write-Host "✅ Full platform started!" -ForegroundColor Green
        Write-Host "🌐 Main Interface: http://localhost" -ForegroundColor Cyan
        Write-Host "📱 Direct Frontend: http://localhost:3002" -ForegroundColor Cyan
        Write-Host "🔗 Backend API: http://localhost:3001" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "🎯 Quick Commands for Next Time:" -ForegroundColor Yellow
Write-Host "   .\Start-Scorpius.ps1 -Mode web       # Web dashboard" -ForegroundColor White
Write-Host "   .\Start-Scorpius.ps1 -Mode electron  # Desktop app" -ForegroundColor White
Write-Host "   .\Start-Scorpius.ps1 -Mode status    # Check status" -ForegroundColor White
Write-Host ""
Write-Host "🦂 Happy Security Analysis! 🦂" -ForegroundColor Green
