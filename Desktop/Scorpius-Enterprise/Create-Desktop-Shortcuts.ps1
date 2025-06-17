#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates desktop shortcuts for Scorpius platform
.DESCRIPTION
    Creates convenient desktop shortcuts for launching the Scorpius platform
#>

Write-Host "🦂 Creating Scorpius Desktop Shortcuts..." -ForegroundColor Cyan

$desktopPath = [Environment]::GetFolderPath("Desktop")
$projectPath = "C:\Users\ADMIN\Desktop\Scorpius-Enterprise"

# Function to create shortcut
function New-Shortcut {
    param(
        [string]$Name,
        [string]$TargetPath,
        [string]$Arguments = "",
        [string]$IconPath = "",
        [string]$Description = ""
    )
    
    $shortcutPath = Join-Path $desktopPath "$Name.lnk"
    
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = $TargetPath
        $Shortcut.Arguments = $Arguments
        $Shortcut.WorkingDirectory = $projectPath
        $Shortcut.Description = $Description
        if ($IconPath) {
            $Shortcut.IconLocation = $IconPath
        }
        $Shortcut.Save()
        
        Write-Host "✅ Created: $Name" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to create: $Name - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Create shortcuts
Write-Host ""
Write-Host "Creating shortcuts on desktop..." -ForegroundColor Yellow

$shortcuts = @(
    @{
        Name = "Scorpius Web Dashboard"
        TargetPath = Join-Path $projectPath "Launch-Web.bat"
        Description = "Launch Scorpius Security Platform Web Dashboard"
    },
    @{
        Name = "Scorpius Desktop App"
        TargetPath = Join-Path $projectPath "Launch-Desktop.bat"
        Description = "Launch Scorpius Security Platform Desktop Application"
    },
    @{
        Name = "Scorpius Launcher"
        TargetPath = Join-Path $projectPath "Launch-Scorpius.bat"
        Description = "Scorpius Platform Launcher with Full Menu"
    },
    @{
        Name = "Scorpius Status Check"
        TargetPath = "powershell.exe"
        Arguments = "-ExecutionPolicy Bypass -File `"$projectPath\Quick-Status.ps1`""
        Description = "Check Scorpius Platform Status"
    }
)

$successCount = 0
foreach ($shortcut in $shortcuts) {
    if (New-Shortcut @shortcut) {
        $successCount++
    }
}

Write-Host ""
if ($successCount -eq $shortcuts.Count) {
    Write-Host "🎉 All shortcuts created successfully!" -ForegroundColor Green
    Write-Host "Check your desktop for the new Scorpius shortcuts." -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Created $successCount/$($shortcuts.Count) shortcuts." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 You can now launch Scorpius directly from your desktop!" -ForegroundColor Green
