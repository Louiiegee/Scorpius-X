"""
Test script for Scanner API functionality
Tests all scanner endpoints and tool combinations
"""

import asyncio
import aiohttp
import json
from datetime import datetime

API_BASE_URL = "http://localhost:8001"

async def test_scanner_api():
    """Test all scanner API endpoints."""
    
    print("=== Testing Scanner API ===\n")
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Root endpoint
        print("1. Testing root endpoint...")
        async with session.get(f"{API_BASE_URL}/") as resp:
            data = await resp.json()
            print(f"   Service: {data['service']}")
            print(f"   Version: {data['version']}\n")
        
        # Test 2: Scan with only Slither enabled
        print("2. Testing scan with only Slither enabled...")
        contract_address = "0x1234567890123456789012345678901234567890"
        
        scan_request = {
            "contract_address": contract_address,
            "tools": {
                "slither": True,
                "mythril": False,
                "echidna": False
            }
        }
        
        async with session.post(
            f"{API_BASE_URL}/api/scanner/analyze",
            json=scan_request
        ) as resp:
            data = await resp.json()
            scan_id_slither = data['scan_id']
            print(f"   Scan ID: {scan_id_slither}")
            print(f"   Status: {data['status']}\n")
        
        # Wait for scan to complete
        await asyncio.sleep(3)
        
        # Test 3: Get scan details for Slither-only scan
        print("3. Getting scan details for Slither-only scan...")
        async with session.get(f"{API_BASE_URL}/api/scanner/scan/{scan_id_slither}") as resp:
            data = await resp.json()
            print(f"   Status: {data['status']}")
            print(f"   Progress: {data['progress']}%")
            print(f"   Tools used: {list(data['results'].keys())}")
            
            # Count vulnerabilities from Slither
            slither_vulns = data['results'].get('slither', {}).get('vulnerabilities', [])
            print(f"   Slither vulnerabilities found: {len(slither_vulns)}")
            if slither_vulns:
                print(f"   First vulnerability: {slither_vulns[0]['type']} - {slither_vulns[0]['severity']}\n")
        
        # Test 4: Scan with all tools enabled
        print("4. Testing scan with all tools enabled...")
        scan_request_all = {
            "contract_address": "0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C",  # Known vulnerable contract
            "tools": {
                "slither": True,
                "mythril": True,
                "echidna": True
            }
        }
        
        async with session.post(
            f"{API_BASE_URL}/api/scanner/analyze",
            json=scan_request_all
        ) as resp:
            data = await resp.json()
            scan_id_all = data['scan_id']
            print(f"   Scan ID: {scan_id_all}")
            print(f"   Status: {data['status']}\n")
        
        # Wait for all tools to complete
        await asyncio.sleep(10)
        
        # Test 5: Get scan details for all-tools scan
        print("5. Getting scan details for all-tools scan...")
        async with session.get(f"{API_BASE_URL}/api/scanner/scan/{scan_id_all}") as resp:
            data = await resp.json()
            print(f"   Status: {data['status']}")
            print(f"   Progress: {data['progress']}%")
            print(f"   Tools used: {list(data['results'].keys())}")
            
            # Count vulnerabilities from each tool
            for tool in ['slither', 'mythril', 'echidna']:
                vulns = data['results'].get(tool, {}).get('vulnerabilities', [])
                print(f"   {tool.capitalize()} vulnerabilities: {len(vulns)}")
            
            total_vulns = data['summary']['total_vulnerabilities']
            print(f"   Total vulnerabilities found: {total_vulns}\n")
        
        # Test 6: Scan with Mythril and Echidna only
        print("6. Testing scan with Mythril and Echidna only...")
        scan_request_me = {
            "contract_address": contract_address,
            "tools": {
                "slither": False,
                "mythril": True,
                "echidna": True
            }
        }
        
        async with session.post(
            f"{API_BASE_URL}/api/scanner/analyze",
            json=scan_request_me
        ) as resp:
            data = await resp.json()
            scan_id_me = data['scan_id']
            print(f"   Scan ID: {scan_id_me}")
            print(f"   Status: {data['status']}\n")
        
        # Test 7: Get scan history
        print("7. Testing scan history...")
        async with session.get(f"{API_BASE_URL}/api/scanner/history") as resp:
            data = await resp.json()
            print(f"   Total scans: {data['total']}")
            print(f"   Recent scans:")
            
            for scan in data['scans'][:3]:  # Show last 3 scans
                tools_used = [tool for tool, enabled in scan['tools'].items() if enabled]
                print(f"     - {scan['scan_id']}: {scan['contract_address'][:10]}... | Tools: {', '.join(tools_used)} | Status: {scan['status']}")
            print()
        
        # Test 8: Error handling - no tools selected
        print("8. Testing error handling - no tools selected...")
        invalid_request = {
            "contract_address": contract_address,
            "tools": {
                "slither": False,
                "mythril": False,
                "echidna": False
            }
        }
        
        async with session.post(
            f"{API_BASE_URL}/api/scanner/analyze",
            json=invalid_request
        ) as resp:
            if resp.status == 400:
                data = await resp.json()
                print(f"   Expected error: {data['detail']}\n")
            else:
                print(f"   Unexpected status: {resp.status}\n")
        
        # Test 9: Error handling - invalid contract address
        print("9. Testing error handling - invalid contract address...")
        invalid_address_request = {
            "contract_address": "not-a-valid-address",
            "tools": {
                "slither": True,
                "mythril": False,
                "echidna": False
            }
        }
        
        async with session.post(
            f"{API_BASE_URL}/api/scanner/analyze",
            json=invalid_address_request
        ) as resp:
            if resp.status == 400:
                data = await resp.json()
                print(f"   Expected error: {data['detail']}\n")
            else:
                print(f"   Unexpected status: {resp.status}\n")
    
    print("=== Scanner API Tests Complete ===")

if __name__ == "__main__":
    asyncio.run(test_scanner_api())
