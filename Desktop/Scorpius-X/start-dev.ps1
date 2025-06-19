# Simple development starter - avoids PowerShell profile issues

Write-Host "🚀 Starting ScorpiusX Development Environment" -ForegroundColor Green

# Change to project directory
Set-Location "C:\Users\ADMIN\Desktop\Scorpius-X"

# Start frontend in new PowerShell window
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd 'C:\Users\ADMIN\Desktop\Scorpius-X\frontend'; npm run dev; Read-Host 'Press Enter to close'"

# Wait a moment
Start-Sleep -Seconds 2

# Start backend if it exists
if (Test-Path "backend") {
    Write-Host "Starting Backend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd 'C:\Users\ADMIN\Desktop\Scorpius-X\backend'; npm start; Read-Host 'Press Enter to close'"
}

Write-Host "✅ Services started! Check the new windows that opened." -ForegroundColor Green
Write-Host "🌐 Frontend should be at: http://localhost:5173" -ForegroundColor Cyan
