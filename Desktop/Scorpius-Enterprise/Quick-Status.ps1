#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick status check for Scorpius platform
.DESCRIPTION
    Rapidly check what's running and provide access URLs
#>

# Quick header
Write-Host "🦂 Scorpius Platform Status Check" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

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

# Function to test HTTP endpoint
function Test-HttpEndpoint {
    param($Url, $TimeoutSec = 2)
    try {
        $null = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Check core services
$services = @(
    @{Name="Backend API"; Port=3001; Url="http://localhost:3001/health"},
    @{Name="Frontend Web"; Port=3002; Url="http://localhost:3002"},
    @{Name="Vite Dev Server"; Port=8080; Url="http://localhost:8080"},
    @{Name="PostgreSQL DB"; Port=5432; Url=$null},
    @{Name="Redis Cache"; Port=6379; Url=$null},
    @{Name="Nginx Proxy"; Port=80; Url="http://localhost"}
)

$runningCount = 0
foreach ($service in $services) {
    $isRunning = Test-Port -Port $service.Port
    
    if ($isRunning) {
        # If it has a URL, test it too
        if ($service.Url) {
            $httpOk = Test-HttpEndpoint -Url $service.Url
            if ($httpOk) {
                Write-Host "✅ $($service.Name) (Port $($service.Port)) - HTTP OK" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $($service.Name) (Port $($service.Port)) - Port open but HTTP failing" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✅ $($service.Name) (Port $($service.Port))" -ForegroundColor Green
        }
        $runningCount++
    } else {
        Write-Host "❌ $($service.Name) (Port $($service.Port)) - Not running" -ForegroundColor Red
    }
}

Write-Host ""

# Overall status
if ($runningCount -eq $services.Count) {
    Write-Host "🎉 All services are running! Platform is ready." -ForegroundColor Green
} elseif ($runningCount -gt 0) {
    Write-Host "⚡ $runningCount/$($services.Count) services running. Partial platform available." -ForegroundColor Yellow
} else {
    Write-Host "💤 Platform is not running. Use Launch-Web.bat or Launch-Desktop.bat to start." -ForegroundColor Red
}

Write-Host ""
Write-Host "🔗 Quick Access:" -ForegroundColor Cyan
if (Test-Port -Port 3002) {
    Write-Host "   🌐 Web Dashboard: http://localhost:3002" -ForegroundColor White
}
if (Test-Port -Port 80) {
    Write-Host "   🌟 Main Portal: http://localhost" -ForegroundColor White
}
if (Test-Port -Port 3001) {
    Write-Host "   🔧 Backend API: http://localhost:3001" -ForegroundColor White
}

Write-Host ""
Write-Host "⚡ Quick Actions:" -ForegroundColor Yellow
Write-Host "   • Double-click Launch-Web.bat for web dashboard" -ForegroundColor White
Write-Host "   • Double-click Launch-Desktop.bat for desktop app" -ForegroundColor White
Write-Host "   • Run .\Start-Scorpius.ps1 for full menu" -ForegroundColor White
