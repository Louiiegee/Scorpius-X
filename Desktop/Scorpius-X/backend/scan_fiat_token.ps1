$contractCode = @"
/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2020 CENTRE SECZ
 */

pragma solidity 0.6.12;

import {
    AdminUpgradeabilityProxy
} from "../upgradeability/AdminUpgradeabilityProxy.sol";

/**
 * @title FiatTokenProxy
 * @dev This contract proxies FiatToken calls and enables FiatToken upgrades
 */
contract FiatTokenProxy is AdminUpgradeabilityProxy {
    constructor(address implementationContract)
        public
        AdminUpgradeabilityProxy(implementationContract)
    {}
}
"@

$body = @{
    contract_address = "0xFiatTokenProxy"
    target_type = "source_code"
    analysis_depth = "comprehensive"
    source_code = $contractCode
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/scorpius/scan/start" -Method POST -Body $body -ContentType "application/json"

Write-Host "Scan initiated with ID: $($response.scan_id)"
Write-Host "Status: $($response.status)"

# Wait a moment then check results
Start-Sleep -Seconds 3

$resultsResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/scorpius/scan/$($response.scan_id)/results" -Method GET
$resultsResponse | ConvertTo-Json -Depth 10
