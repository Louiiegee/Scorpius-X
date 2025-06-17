@echo off
cd /d "C:\Users\ADMIN\Desktop\Scorpius-Enterprise"
echo Starting Scorpius Desktop App...
powershell.exe -ExecutionPolicy Bypass -File "Start-Scorpius.ps1" -Mode electron
