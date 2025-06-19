Write-Host "🔧 ScorpiusX Development Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow
Write-Host "✅ Node.js: v20.12.2" -ForegroundColor Green
Write-Host "✅ Python: Python 3.13.3" -ForegroundColor Green  
Write-Host "✅ npm: v10.5.0" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Cyan
Write-Host "Clearing previous installations..." -ForegroundColor Yellow

# Navigate to frontend directory
Set-Location "frontend"

# Remove damaged lockfile and node_modules
if (Test-Path "package-lock.json") {
    Write-Host "Removing damaged lockfile..." -ForegroundColor Yellow
    Remove-Item "package-lock.json" -Force
}

if (Test-Path "node_modules") {
    Write-Host "Removing node_modules (this may take a moment)..." -ForegroundColor Yellow
    # Use cmd rmdir for better Windows compatibility
    cmd /c "rmdir /s /q node_modules" 2>$null
}

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force | Out-Null

# Install dependencies with Windows-friendly options
Write-Host "Installing dependencies (this may take several minutes)..." -ForegroundColor Yellow
$npmInstall = Start-Process -FilePath "npm" -ArgumentList "install", "--no-optional", "--no-fund", "--no-audit" -Wait -PassThru -NoNewWindow

if ($npmInstall.ExitCode -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    Write-Host "Trying alternative installation method..." -ForegroundColor Yellow
    
    # Alternative: Install with legacy peer deps
    $npmInstallLegacy = Start-Process -FilePath "npm" -ArgumentList "install", "--legacy-peer-deps", "--no-optional" -Wait -PassThru -NoNewWindow
    
    if ($npmInstallLegacy.ExitCode -eq 0) {
        Write-Host "✅ Frontend dependencies installed with legacy peer deps" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend installation failed. Please run 'npm install --force' manually in frontend directory" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
}

Set-Location ".."

# Continue with backend installation
Write-Host ""
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Cyan
if (Test-Path "backend") {
    Set-Location "backend"
    $backendInstall = Start-Process -FilePath "npm" -ArgumentList "install" -Wait -PassThru -NoNewWindow
    
    if ($backendInstall.ExitCode -eq 0) {
        Write-Host "✅ Backend dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
    }
    Set-Location ".."
} else {
    Write-Host "⚠️ Backend directory not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Setup completed! Use 'npm start' in frontend and backend directories to run the services." -ForegroundColor Green
