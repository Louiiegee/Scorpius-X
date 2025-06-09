# ScorpiusX Platform Startup Script
# Launches all components of the trading platform

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipElectron,
    [switch]$Verbose
)

# Set working directory to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Configuration
$BackendPath = "backend"
$FrontendPath = "frontend"
$WebSocketPort = 8081
$FrontendPort = 8080

Write-Host "Starting ScorpiusX Platform..." -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# 1. Start WebSocket Backend Server
if (-not $SkipBackend) {
    Write-Host ""
    Write-Host "Starting WebSocket Server (Port $WebSocketPort)..." -ForegroundColor Green
    
    if (Test-Port $WebSocketPort) {
        Write-Host "Port $WebSocketPort is already in use. Skipping backend startup." -ForegroundColor Yellow
    }
    else {
        $BackendProcess = Start-Process -FilePath "python" -ArgumentList "$BackendPath\websocket_server.py" -PassThru -WindowStyle Minimized
        Start-Sleep -Seconds 2
        
        if (Test-Port $WebSocketPort) {
            Write-Host "WebSocket Server started successfully on port $WebSocketPort" -ForegroundColor Green
        }
        else {
            Write-Host "Failed to start WebSocket Server" -ForegroundColor Red
        }
    }
}

# 2. Start Frontend Development Server  
if (-not $SkipFrontend) {
    Write-Host ""
    Write-Host "Starting Frontend Dev Server (Port $FrontendPort)..." -ForegroundColor Blue
    
    if (Test-Port $FrontendPort) {
        Write-Host "Port $FrontendPort is already in use. Skipping frontend startup." -ForegroundColor Yellow
    }
    else {
        Set-Location $FrontendPath
        $FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Minimized
        Set-Location $ProjectRoot
        Start-Sleep -Seconds 5
        
        if (Test-Port $FrontendPort) {
            Write-Host "Frontend Dev Server started successfully on port $FrontendPort" -ForegroundColor Blue
        }
        else {
            Write-Host "Failed to start Frontend Dev Server" -ForegroundColor Red
        }
    }
}

# 3. Launch Electron Desktop App
if (-not $SkipElectron) {
    Write-Host ""
    Write-Host "Launching Electron Desktop App..." -ForegroundColor Magenta
    
    Set-Location $FrontendPath
    Start-Sleep -Seconds 2
    $ElectronProcess = Start-Process -FilePath "npm" -ArgumentList "run", "electron" -PassThru
    Set-Location $ProjectRoot
    
    Write-Host "Electron Desktop App launched" -ForegroundColor Magenta
}

Write-Host ""
Write-Host "ScorpiusX Platform startup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access points:" -ForegroundColor White
Write-Host "- WebSocket Server: ws://localhost:$WebSocketPort" -ForegroundColor Gray
Write-Host "- Web Application: http://localhost:$FrontendPort" -ForegroundColor Gray
Write-Host "- Desktop App: Electron window" -ForegroundColor Gray

Write-Host ""
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check service status
        if ($Verbose) {
            $wsStatus = if (Test-Port $WebSocketPort) { "Running" } else { "Stopped" }
            $frontendStatus = if (Test-Port $FrontendPort) { "Running" } else { "Stopped" }
            
            Write-Host "`rWebSocket: $wsStatus | Frontend: $frontendStatus" -NoNewline -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host ""
    Write-Host ""
    Write-Host "Shutting down ScorpiusX Platform..." -ForegroundColor Red
}
