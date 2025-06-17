#!/usr/bin/env pwsh
# Scorpius Security Platform Setup Script
# This script clones both repositories and sets up the complete platform

Write-Host "🦂 Setting up Scorpius Security Platform..." -ForegroundColor Green

# Create directory structure
Write-Host "📁 Creating project structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "backend"
New-Item -ItemType Directory -Force -Path "frontend" 
New-Item -ItemType Directory -Force -Path "docker"
New-Item -ItemType Directory -Force -Path "scripts"

# Clone backend repository (newScorp)
Write-Host "🔧 Cloning backend repository (newScorp)..." -ForegroundColor Yellow
if (Test-Path "backend\.git") {
    Write-Host "Backend already exists, pulling latest changes..." -ForegroundColor Cyan
    Set-Location "backend"
    git pull origin main
    Set-Location ".."
} else {
    git clone https://github.com/Louiiegee/newScorp.git backend
}

# Clone frontend repository (new-dash)
Write-Host "🎨 Cloning frontend repository (new-dash)..." -ForegroundColor Yellow
if (Test-Path "frontend\.git") {
    Write-Host "Frontend already exists, pulling latest changes..." -ForegroundColor Cyan
    Set-Location "frontend"
    git pull origin main
    Set-Location ".."
} else {
    git clone https://github.com/Louiiegee/new-dash.git frontend
}

Write-Host "✅ Repository setup complete!" -ForegroundColor Green
Write-Host "🐳 Next: Run docker-compose up to start the platform" -ForegroundColor Cyan
