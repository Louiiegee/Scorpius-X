#!/usr/bin/env pwsh

Write-Host "Testing various login scenarios..." -ForegroundColor Green

# Test 1: Empty credentials
Write-Host "`n1. Testing empty credentials..." -ForegroundColor Yellow
$emptyData = @{
    email = ""
    password = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $emptyData -ContentType "application/json"
    Write-Host "✅ Unexpected success with empty credentials" -ForegroundColor Red
} catch {
    Write-Host "❌ Expected failure with empty credentials" -ForegroundColor Green
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response
        Write-Host "Status: $($errorResponse.StatusCode)" -ForegroundColor Cyan
    }
}

# Test 2: Wrong credentials
Write-Host "`n2. Testing wrong credentials..." -ForegroundColor Yellow
$wrongData = @{
    email = "admin@scorpiusx.io"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $wrongData -ContentType "application/json"
    Write-Host "✅ Unexpected success with wrong credentials" -ForegroundColor Red
} catch {
    Write-Host "❌ Expected failure with wrong credentials" -ForegroundColor Green
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response
        Write-Host "Status: $($errorResponse.StatusCode)" -ForegroundColor Cyan
    }
}

# Test 3: Correct credentials (should work)
Write-Host "`n3. Testing correct credentials..." -ForegroundColor Yellow
$correctData = @{
    email = "admin@scorpiusx.io"
    password = "scorpius123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $correctData -ContentType "application/json"
    Write-Host "✅ Success with correct credentials" -ForegroundColor Green
    Write-Host "Token: $($response.token)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Unexpected failure with correct credentials" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response
        Write-Host "Status: $($errorResponse.StatusCode)" -ForegroundColor Cyan
    }
}

Write-Host "`n4. Check what credentials the frontend might be sending..." -ForegroundColor Yellow
Write-Host "Try logging in with these credentials in the browser:" -ForegroundColor Cyan
Write-Host "Email: admin@scorpiusx.io" -ForegroundColor White
Write-Host "Password: scorpius123" -ForegroundColor White
Write-Host "`nThen check the browser console for debug logs starting with 🔐" -ForegroundColor Cyan
