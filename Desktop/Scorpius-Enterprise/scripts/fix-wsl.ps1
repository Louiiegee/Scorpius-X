#!/usr/bin/env pwsh
# Quick WSL & Docker Fix for Windows

Write-Host "🔧 WSL & Docker Quick Fix" -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs Administrator privileges for WSL setup" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Manual Steps (Run in Administrator PowerShell):" -ForegroundColor Cyan
    Write-Host "1. Right-click PowerShell and 'Run as Administrator'" -ForegroundColor White
    Write-Host "2. Run: wsl --install" -ForegroundColor White
    Write-Host "3. Run: wsl --set-default-version 2" -ForegroundColor White
    Write-Host "4. Restart computer" -ForegroundColor White
    Write-Host "5. Start Docker Desktop" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Alternative: Use direct startup (no Docker needed):" -ForegroundColor Green
    Write-Host "   .\scripts\start-direct.ps1" -ForegroundColor White
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green

# Install/Enable WSL
Write-Host "🔧 Setting up WSL..." -ForegroundColor Yellow
try {
    wsl --install --no-distribution
    wsl --set-default-version 2
    
    Write-Host "✅ WSL setup complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Computer restart may be required" -ForegroundColor Yellow
    Write-Host "After restart:" -ForegroundColor Cyan
    Write-Host "1. Start Docker Desktop" -ForegroundColor White
    Write-Host "2. Wait for it to fully load" -ForegroundColor White
    Write-Host "3. Run: .\scripts\start-scorpius.ps1" -ForegroundColor White
}
catch {
    Write-Host "❌ WSL setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual fix required:" -ForegroundColor Yellow
    Write-Host "1. Open Windows Features (appwiz.cpl)" -ForegroundColor Cyan
    Write-Host "2. Enable 'Windows Subsystem for Linux'" -ForegroundColor Cyan
    Write-Host "3. Enable 'Virtual Machine Platform'" -ForegroundColor Cyan
    Write-Host "4. Restart computer" -ForegroundColor Cyan
    Write-Host "5. Run 'wsl --install' in Administrator PowerShell" -ForegroundColor Cyan
}
