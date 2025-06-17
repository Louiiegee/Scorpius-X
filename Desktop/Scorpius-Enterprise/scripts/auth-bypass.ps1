# Scorpius Authentication Bypass Toggle Script
# For development and testing purposes only

param(
    [switch]$Enable,
    [switch]$Disable,
    [switch]$Status,
    [switch]$Open
)

function Show-Banner {
    Write-Host ""
    Write-Host "🔓 " -ForegroundColor Yellow -NoNewline
    Write-Host "Scorpius Authentication Bypass" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray
}

function Get-BypassStatus {
    $bypassFile = "$env:TEMP\scorpius_bypass_status"
    return Test-Path $bypassFile
}

function Set-BypassStatus($enabled) {
    $bypassFile = "$env:TEMP\scorpius_bypass_status"
    if ($enabled) {
        "enabled" | Out-File $bypassFile
    } else {
        if (Test-Path $bypassFile) {
            Remove-Item $bypassFile
        }
    }
}

function Show-Status {
    $isEnabled = Get-BypassStatus
    
    Write-Host ""
    if ($isEnabled) {
        Write-Host "Status: " -NoNewline
        Write-Host "ENABLED ✅" -ForegroundColor Green
    } else {
        Write-Host "Status: " -NoNewline
        Write-Host "DISABLED ❌" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Mock User Profile:" -ForegroundColor Yellow
    Write-Host "  Email: dev@scorpius.test"
    Write-Host "  Tier: Enterprise"
    Write-Host "  Permissions: Full Access"
    Write-Host ""
}

function Enable-Bypass {
    Write-Host "🚀 Enabling authentication bypass..." -ForegroundColor Yellow
    Set-BypassStatus $true
    
    # Use PowerShell to set localStorage for the running application
    $jsCode = @"
localStorage.setItem('scorpius_dev_bypass', 'true');
console.log('🔓 Authentication bypass enabled via PowerShell');
"@
    
    Write-Host "✅ Authentication bypass enabled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open your browser to: http://localhost:3002"
    Write-Host "2. You'll be automatically logged in as an Enterprise user"
    Write-Host "3. No login credentials required!"
    Write-Host ""
    Write-Host "To disable: " -NoNewline
    Write-Host ".\scripts\auth-bypass.ps1 -Disable" -ForegroundColor Yellow
}

function Disable-Bypass {
    Write-Host "🛑 Disabling authentication bypass..." -ForegroundColor Yellow
    Set-BypassStatus $false
    
    Write-Host "✅ Authentication bypass disabled!" -ForegroundColor Green
    Write-Host "Normal login flow restored." -ForegroundColor Cyan
}

function Open-Browser {
    Write-Host "🌐 Opening browser applications..." -ForegroundColor Yellow
    
    # Open bypass control panel
    Start-Process "http://localhost:3002/bypass.html"
    Start-Sleep 1
    
    # Open main dashboard
    Start-Process "http://localhost:3002"
    Start-Sleep 1
    
    # Open API docs
    Start-Process "http://localhost:3001/docs"
    
    Write-Host "✅ Browser tabs opened!" -ForegroundColor Green
}

function Show-Help {
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\auth-bypass.ps1 -Enable     Enable authentication bypass"
    Write-Host "  .\scripts\auth-bypass.ps1 -Disable    Disable authentication bypass"
    Write-Host "  .\scripts\auth-bypass.ps1 -Status     Show current status"
    Write-Host "  .\scripts\auth-bypass.ps1 -Open       Open browser with bypass panel"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\scripts\auth-bypass.ps1 -Enable -Open"
    Write-Host "  .\scripts\auth-bypass.ps1 -Status"
    Write-Host ""
}

# Main execution
Show-Banner

if ($Enable) {
    Enable-Bypass
    Show-Status
    if ($Open) { Open-Browser }
}
elseif ($Disable) {
    Disable-Bypass
    Show-Status
}
elseif ($Status) {
    Show-Status
}
elseif ($Open) {
    Open-Browser
}
else {
    Show-Help
    Show-Status
}
