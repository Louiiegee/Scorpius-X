$contractAddress = "0x4f80Ce44aFAb1e5E940574F135802E12ad2A5eF0"

Write-Host "Starting Scorpius AI Vulnerability Scan..." -ForegroundColor Cyan
Write-Host "Target Contract: $contractAddress" -ForegroundColor Yellow

$scanBody = @{
    contract_address = $contractAddress
    target_type = "deployed_contract"
    analysis_depth = "comprehensive"
} | ConvertTo-Json

$scanResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/scorpius/scan/start" -Method POST -Body $scanBody -ContentType "application/json"

Write-Host "Scan initiated!" -ForegroundColor Green
Write-Host "Scan ID: $($scanResponse.scan_id)" -ForegroundColor White
Write-Host "Status: $($scanResponse.status)" -ForegroundColor White

# Wait and check results
Start-Sleep -Seconds 10

$resultsResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/scorpius/scan/$($scanResponse.scan_id)/results" -Method GET
$resultsResponse | ConvertTo-Json -Depth 10
