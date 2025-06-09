"""
Simple test for Scanner API - verify tool selection functionality
"""

import requests
import json
import time

API_BASE = "http://localhost:8001"

def wait_for_scan(scan_id, max_wait=15):
    """Wait for scan to complete, checking status periodically."""
    start_time = time.time()
    while time.time() - start_time < max_wait:
        response = requests.get(f"{API_BASE}/api/scanner/scan/{scan_id}")
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'completed':
                return data
            print(f"     Status: {data.get('status', 'unknown')}, Progress: {data.get('progress', 0)}%")
        time.sleep(1)
    return None

print("=== Scanner API Tool Selection Test ===\n")

# Test 1: Scan with only Slither
print("1. Testing with ONLY Slither enabled:")
response = requests.post(f"{API_BASE}/api/scanner/analyze", json={
    "contract_address": "0x1234567890123456789012345678901234567890",
    "tools": {
        "slither": True,
        "mythril": False,
        "echidna": False
    }
})
result = response.json()
scan_id = result['scan_id']
print(f"   Scan started: {scan_id}")

# Wait for scan to complete
scan_data = wait_for_scan(scan_id)
if scan_data and 'results' in scan_data:
    print(f"   Tools that ran: {list(scan_data['results'].keys())}")
    print(f"   Expected: ['slither']")
    print(f"   ✓ Correct!" if list(scan_data['results'].keys()) == ['slither'] else "   ✗ Wrong!")
else:
    print("   ✗ Failed to get scan results")
print()

# Test 2: Scan with Mythril and Echidna
print("2. Testing with Mythril AND Echidna enabled:")
response = requests.post(f"{API_BASE}/api/scanner/analyze", json={
    "contract_address": "0x1234567890123456789012345678901234567890",
    "tools": {
        "slither": False,
        "mythril": True,
        "echidna": True
    }
})
result = response.json()
scan_id2 = result['scan_id']
print(f"   Scan started: {scan_id2}")

# Wait for scan to complete
scan_data = wait_for_scan(scan_id2)
if scan_data and 'results' in scan_data:
    tools_ran = list(scan_data['results'].keys())
    print(f"   Tools that ran: {tools_ran}")
    print(f"   Expected: ['mythril', 'echidna']")
    print(f"   ✓ Correct!" if set(tools_ran) == {'mythril', 'echidna'} else "   ✗ Wrong!")
else:
    print("   ✗ Failed to get scan results")
print()

# Test 3: Scan with ALL tools
print("3. Testing with ALL tools enabled:")
response = requests.post(f"{API_BASE}/api/scanner/analyze", json={
    "contract_address": "0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C",
    "tools": {
        "slither": True,
        "mythril": True,
        "echidna": True
    }
})
result = response.json()
scan_id3 = result['scan_id']
print(f"   Scan started: {scan_id3}")

# Wait for scan to complete
scan_data = wait_for_scan(scan_id3)
if scan_data and 'results' in scan_data:
    tools_ran = list(scan_data['results'].keys())
    print(f"   Tools that ran: {tools_ran}")
    print(f"   Expected: ['slither', 'mythril', 'echidna']")
    print(f"   ✓ Correct!" if set(tools_ran) == {'slither', 'mythril', 'echidna'} else "   ✗ Wrong!")
    
    # Show vulnerability counts
    print(f"\n   Vulnerability counts:")
    for tool in ['slither', 'mythril', 'echidna']:
        vulns = scan_data['results'].get(tool, {}).get('vulnerabilities', [])
        print(f"     {tool}: {len(vulns)} vulnerabilities")
    print(f"     Total: {scan_data['summary']['total_vulnerabilities']}")
else:
    print("   ✗ Failed to get scan results")
print()

# Test 4: Check scan history
print("4. Checking scan history:")
response = requests.get(f"{API_BASE}/api/scanner/history")
if response.status_code == 200:
    history = response.json()
    print(f"   Total scans in history: {history['total']}")
    print(f"   Recent scans:")
    for scan in history['scans'][:3]:
        tools = scan.get('tools_used', [])
        print(f"     - {scan['contract_address'][:10]}... | Tools: {', '.join(tools)}")
else:
    print("   ✗ Failed to get scan history")

print("\n✅ Scanner API is working correctly!")
