Write-Host "🧹 Cleaning up npm installation issues..." -ForegroundColor Cyan

# Frontend cleanup
if (Test-Path "frontend") {
    Set-Location "frontend"
    
    Write-Host "Cleaning frontend..." -ForegroundColor Yellow
    
    # Stop any running processes that might lock files
    Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Remove lockfile and node_modules
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
    if (Test-Path "node_modules") {
        cmd /c "rmdir /s /q node_modules" 2>$null
    }
    
    Set-Location ".."
}

# Backend cleanup
if (Test-Path "backend") {
    Set-Location "backend"
    
    Write-Host "Cleaning backend..." -ForegroundColor Yellow
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
    if (Test-Path "node_modules") {
        cmd /c "rmdir /s /q node_modules" 2>$null
    }
    
    Set-Location ".."
}

# Clear global npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "✅ Cleanup completed!" -ForegroundColor Green
Write-Host "Now run .\setup.ps1 to reinstall dependencies" -ForegroundColor Cyan
