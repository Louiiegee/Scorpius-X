Write-Host "🔧 Fixing Windows Dependencies for ScorpiusX" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Set-Location "C:\Users\ADMIN\Desktop\Scorpius-X\frontend"

Write-Host "Installing missing Windows binaries..." -ForegroundColor Yellow

# Install Windows-specific Rollup binary
npm install @rollup/rollup-win32-x64-msvc --save-dev --no-audit --no-fund

# Install Windows-specific SWC binary  
npm install @swc/core-win32-x64-msvc --save-dev --no-audit --no-fund

# Install any other Windows-specific binaries that might be needed
npm install @esbuild/win32-x64 --save-dev --no-audit --no-fund

Write-Host "✅ Windows dependencies installed!" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Cyan

Set-Location ".."
