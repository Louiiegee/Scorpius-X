param(
    [string]$ContractAddress = "0x4f80Ce44aFAb1e5E940574F135802E12ad2A5eF0"
)

Write-Host "🔍 Starting Scorpius AI Vulnerability Scan..." -ForegroundColor Cyan
Write-Host "📍 Target Contract: $ContractAddress" -ForegroundColor Yellow
Write-Host ""

# Start the scan
$scanBody = @{
    contract_address = $ContractAddress
    target_type = "deployed_contract"
    analysis_depth = "comprehensive"
} | ConvertTo-Json

try {
    $scanResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/scorpius/scan/start" -Method POST -Body $scanBody -ContentType "application/json"
    
    Write-Host "✅ Scan initiated successfully!" -ForegroundColor Green
    Write-Host "🆔 Scan ID: $($scanResponse.scan_id)" -ForegroundColor White
    Write-Host "📊 Status: $($scanResponse.status)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "⏳ Waiting for analysis to complete..." -ForegroundColor Yellow
    
    # Poll for results every 5 seconds
    $maxAttempts = 24  # 2 minutes total
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 5
        $attempt++
        
        try {
            $progressResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/scorpius/scan/$($scanResponse.scan_id)/progress" -Method GET
            Write-Host "📈 Progress: $($progressResponse.progress)% - Stage: $($progressResponse.current_stage)" -ForegroundColor Cyan
            
            if ($progressResponse.status -eq "completed") {
                Write-Host ""
                Write-Host "🎉 Analysis Complete! Fetching results..." -ForegroundColor Green
                
                $resultsResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/scorpius/scan/$($scanResponse.scan_id)/results" -Method GET
                
                Write-Host "=" * 60 -ForegroundColor White
                Write-Host "📋 VULNERABILITY SCAN RESULTS" -ForegroundColor Green
                Write-Host "=" * 60 -ForegroundColor White
                Write-Host "🎯 Contract: $($resultsResponse.contract_address)" -ForegroundColor White
                Write-Host "⚡ Risk Score: $($resultsResponse.risk_score)/100" -ForegroundColor $(if($resultsResponse.risk_score -gt 70){"Red"}elseif($resultsResponse.risk_score -gt 40){"Yellow"}else{"Green"})
                Write-Host "⏱️  Scan Duration: $($resultsResponse.scan_duration) seconds" -ForegroundColor White
                Write-Host ""
                
                if ($resultsResponse.vulnerabilities -and $resultsResponse.vulnerabilities.Count -gt 0) {
                    Write-Host "🚨 VULNERABILITIES FOUND:" -ForegroundColor Red
                    Write-Host ""
                    
                    foreach ($vuln in $resultsResponse.vulnerabilities) {
                        $severityColor = switch ($vuln.severity) {
                            "CRITICAL" { "Red" }
                            "HIGH" { "Red" }
                            "MEDIUM" { "Yellow" }
                            "LOW" { "Green" }
                            default { "White" }
                        }
                        
                        Write-Host "🔴 $($vuln.title)" -ForegroundColor $severityColor
                        Write-Host "   Severity: $($vuln.severity)" -ForegroundColor $severityColor
                        Write-Host "   Confidence: $($vuln.confidence)%" -ForegroundColor White
                        Write-Host "   Description: $($vuln.description)" -ForegroundColor Gray
                        if ($vuln.recommendation) {
                            Write-Host "   💡 Fix: $($vuln.recommendation)" -ForegroundColor Cyan
                        }
                        Write-Host ""
                    }
                } else {
                    Write-Host "✅ No critical vulnerabilities found!" -ForegroundColor Green
                }
                
                if ($resultsResponse.ai_analysis) {
                    Write-Host "🤖 AI ANALYSIS:" -ForegroundColor Magenta
                    Write-Host $resultsResponse.ai_analysis -ForegroundColor White
                }
                
                Write-Host "=" * 60 -ForegroundColor White
                break
            }
            elseif ($progressResponse.status -eq "failed") {
                Write-Host "❌ Scan failed: $($progressResponse.error)" -ForegroundColor Red
                break
            }
        }
        catch {
            Write-Host "⚠️  Waiting for scan to start..." -ForegroundColor Yellow
        }
        
    } while ($attempt -lt $maxAttempts)
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "⏰ Scan taking longer than expected. Check results manually with scan ID: $($scanResponse.scan_id)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error starting scan: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Make sure the Scorpius backend is running on http://localhost:8000" -ForegroundColor Yellow
}
