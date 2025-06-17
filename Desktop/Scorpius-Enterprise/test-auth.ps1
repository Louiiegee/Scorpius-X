#!/usr/bin/env pwsh

# Test the Scorpius authentication flow
Write-Host "Testing Scorpius Authentication Flow..." -ForegroundColor Green

# Test login endpoint
Write-Host "`nTesting login endpoint..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@scorpiusx.io"
    password = "scorpius123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($response.token)" -ForegroundColor Cyan
    Write-Host "User: $($response.user.name) ($($response.user.tier))" -ForegroundColor Cyan
    
    $token = $response.token
    
    # Test the /me endpoint
    Write-Host "`nTesting /me endpoint..." -ForegroundColor Yellow
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $userResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me?token=$token" -Method GET -Headers $headers
    Write-Host "✅ User info retrieved!" -ForegroundColor Green
    Write-Host "User: $($userResponse.name) ($($userResponse.tier))" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Authentication test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorText = $reader.ReadToEnd()
        Write-Host "Response: $errorText" -ForegroundColor Red
    }
}

Write-Host "`n=== Frontend Test ===" -ForegroundColor Green
Write-Host "Please test the login in the browser:"
Write-Host "1. Go to http://localhost:3002" -ForegroundColor Cyan
Write-Host "2. Login with: admin@scorpiusx.io / scorpius123" -ForegroundColor Cyan
Write-Host "3. Check if you're redirected to the dashboard" -ForegroundColor Cyan
