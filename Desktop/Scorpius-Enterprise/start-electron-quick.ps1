#!/usr/bin/env pwsh
# Quick Electron Launcher for Scorpius Dashboard

Write-Host "🦂 Starting Scorpius Electron Dashboard..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "C:\Users\ADMIN\Desktop\Scorpius-Enterprise\frontend"

# Start Vite dev server in background if not already running
$viteRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 2 -ErrorAction SilentlyContinue
    $viteRunning = $true
    Write-Host "✅ Vite dev server is already running" -ForegroundColor Green
} catch {
    Write-Host "🚀 Starting Vite dev server..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru
    Start-Sleep -Seconds 8
}

# Navigate to electron directory and start Electron
Set-Location "electron"
$env:ELECTRON_IS_DEV = "true"
Write-Host "📱 Launching Electron application..." -ForegroundColor Green
npm run electron
