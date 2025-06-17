#!/usr/bin/env pwsh

# Test the exact frontend login request
Write-Host "Testing frontend-style login request..." -ForegroundColor Green

$loginData = @{
    email = "admin@scorpiusx.io"
    password = "scorpius123"
    licenseKey = ""
    rememberMe = $false
} | ConvertTo-Json

Write-Host "Sending request with data: $loginData" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -Verbose
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Get detailed error response
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response
        Write-Host "Status Code: $($errorResponse.StatusCode)" -ForegroundColor Red
        
        try {
            $errorStream = $errorResponse.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read error body" -ForegroundColor Red
        }
    }
}
