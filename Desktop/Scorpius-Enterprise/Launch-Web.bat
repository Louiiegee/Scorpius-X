@echo off
cd /d "C:\Users\ADMIN\Desktop\Scorpius-Enterprise"
echo Starting Scorpius Web Dashboard...
powershell.exe -ExecutionPolicy Bypass -File "Start-Scorpius.ps1" -Mode web
