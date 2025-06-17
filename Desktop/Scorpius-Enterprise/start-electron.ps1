#!/usr/bin/env pwsh
# Simple Scorpius Electron Launcher

Write-Host "🦂 Launching Scorpius Electron Dashboard..." -ForegroundColor Green

# Ensure we're in the frontend directory
Set-Location "C:\Users\ADMIN\Desktop\Scorpius-Enterprise\frontend"

# Start Electron in development mode
npm run electron:dev
