# ScorpiusX Development Setup Script
# Installs all dependencies and prepares the development environment

Write-Host "🔧 ScorpiusX Development Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Install Frontend Dependencies
Write-Host "`n📦 Installing Frontend Dependencies..." -ForegroundColor Blue
Set-Location "frontend"

Write-Host "Clearing previous installations..." -ForegroundColor Gray
Remove-Item -Path "node_modules", "package-lock.json" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Installing with --omit=optional to avoid platform issues..." -ForegroundColor Gray
npm install --omit=optional --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

Set-Location $ProjectRoot

# Install Backend Dependencies
Write-Host "`n🐍 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location "backend"

try {
    pip install -r requirements.txt
    Write-Host "✅ Backend dependencies installed successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
    Set-Location $ProjectRoot
    exit 1
}

Set-Location $ProjectRoot

# Create run scripts
Write-Host "`n📝 Creating Quick Run Scripts..." -ForegroundColor Magenta

# Create start-backend.ps1
@"
# Quick Backend Starter
Set-Location "$ProjectRoot\backend"
python websocket_server.py
"@ | Out-File -FilePath "start-backend.ps1" -Encoding UTF8

# Create start-frontend.ps1
@"
# Quick Frontend Starter
Set-Location "$ProjectRoot\frontend"
npm run dev
"@ | Out-File -FilePath "start-frontend.ps1" -Encoding UTF8

# Create start-electron.ps1
@"
# Quick Electron Starter
Set-Location "$ProjectRoot\frontend"
npm run electron
"@ | Out-File -FilePath "start-electron.ps1" -Encoding UTF8

Write-Host "✅ Quick run scripts created" -ForegroundColor Green

# Setup complete
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

Write-Host "`nAvailable Commands:" -ForegroundColor White
Write-Host "• npm start                 - Launch complete platform" -ForegroundColor Gray
Write-Host "• .\start-backend.ps1       - Start WebSocket server only" -ForegroundColor Gray
Write-Host "• .\start-frontend.ps1      - Start web app only" -ForegroundColor Gray
Write-Host "• .\start-electron.ps1      - Start desktop app only" -ForegroundColor Gray
Write-Host "• .\scripts\startup.ps1     - Full platform with monitoring" -ForegroundColor Gray

Write-Host "`nProject Structure:" -ForegroundColor White
Write-Host "• backend/                  - Python WebSocket server" -ForegroundColor Gray
Write-Host "• frontend/                 - React TypeScript app + Electron" -ForegroundColor Gray
Write-Host "• scripts/                  - Automation scripts" -ForegroundColor Gray
Write-Host "• docs/                     - Documentation" -ForegroundColor Gray

Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "1. Run 'npm start' to launch the complete platform" -ForegroundColor Gray
Write-Host "2. Open http://localhost:8080 for web interface" -ForegroundColor Gray
Write-Host "3. Desktop app will launch automatically" -ForegroundColor Gray

Write-Host "`n🚀 Ready to develop!" -ForegroundColor Green
