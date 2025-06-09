#!/usr/bin/env python3
"""
Simple test script to use the Scorpius AI vulnerability scanner
without the full backend server dependencies.
"""
import requests
import json
import time
import sys

CONTRACT_ADDRESS = "0x4f80Ce44aFAb1e5E940574F135802E12ad2A5eF0"
BASE_URL = "http://localhost:8000"

def test_direct_analysis():
    """Test the AI scanner using direct method calls."""
    print("🔍 Testing Direct AI Analysis Method...")
    
    try:
        # Import the scanner directly
        sys.path.append('.')
        from modules.ai_vulnerability_scanner import AIVulnerabilityScanner
        
        scanner = AIVulnerabilityScanner()
        
        # Mock contract data for testing
        contract_info = {
            "address": CONTRACT_ADDRESS,
            "source_code": "// Mock contract for testing",
            "bytecode": "0x608060405234801561001057600080fd5b50...",
            "abi": []
        }
        
        print(f"📍 Analyzing contract: {CONTRACT_ADDRESS}")
        
        # Run the analysis
        results = scanner.analyze_contract(
            contract_address=CONTRACT_ADDRESS,
            contract_info=contract_info
        )
        
        print("\n" + "="*60)
        print("🤖 AI VULNERABILITY ANALYSIS RESULTS")
        print("="*60)
        print(f"🎯 Contract: {CONTRACT_ADDRESS}")
        print(f"⚡ Risk Score: {results.get('risk_score', 'N/A')}/100")
        print(f"⏱️  Analysis Duration: {results.get('analysis_duration', 'N/A')} seconds")
        print()
        
        vulnerabilities = results.get('vulnerabilities', [])
        if vulnerabilities:
            print("🚨 VULNERABILITIES FOUND:")
            print()
            
            for i, vuln in enumerate(vulnerabilities, 1):
                severity_colors = {
                    "CRITICAL": "🔴",
                    "HIGH": "🟠", 
                    "MEDIUM": "🟡",
                    "LOW": "🟢"
                }
                
                severity = vuln.get('severity', 'UNKNOWN')
                icon = severity_colors.get(severity, "⚪")
                
                print(f"{icon} {i}. {vuln.get('title', 'Unknown Vulnerability')}")
                print(f"   Severity: {severity}")
                print(f"   Confidence: {vuln.get('confidence', 'N/A')}%")
                print(f"   Description: {vuln.get('description', 'No description')}")
                
                if vuln.get('recommendation'):
                    print(f"   💡 Fix: {vuln.get('recommendation')}")
                print()
        else:
            print("✅ No critical vulnerabilities found!")
            
        if results.get('ai_analysis'):
            print("🤖 AI ANALYSIS:")
            print(results['ai_analysis'])
            
        print("="*60)
        return True
        
    except Exception as e:
        print(f"❌ Direct analysis failed: {e}")
        return False

def test_api_if_available():
    """Test the API if server is running."""
    print("🌐 Testing API Method...")
    
    try:
        # Test health check first
        response = requests.get(f"{BASE_URL}/api/scorpius/health", timeout=5)
        if response.status_code != 200:
            print("❌ API not available")
            return False
            
        print("✅ API is available")
        
        # Start scan
        scan_data = {
            "contract_address": CONTRACT_ADDRESS,
            "target_type": "deployed_contract", 
            "analysis_depth": "comprehensive"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/scorpius/scan/start",
            json=scan_data,
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to start scan: {response.text}")
            return False
            
        scan_result = response.json()
        scan_id = scan_result.get('scan_id')
        
        print(f"✅ Scan started with ID: {scan_id}")
        print("⏳ Waiting for results...")
        
        # Poll for results
        for i in range(12):  # 1 minute max
            time.sleep(5)
            
            try:
                response = requests.get(f"{BASE_URL}/api/scorpius/scan/{scan_id}/results", timeout=5)
                if response.status_code == 200:
                    results = response.json()
                    print(f"\n📋 Scan completed! Risk score: {results.get('risk_score', 'N/A')}")
                    print(f"Found {len(results.get('vulnerabilities', []))} vulnerabilities")
                    return True
            except:
                pass
                
            print(f"⏳ Still analyzing... ({i+1}/12)")
            
        print("⏰ Scan timeout - check results manually")
        return True
        
    except requests.exceptions.RequestException:
        print("❌ Could not connect to API")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Scorpius AI Vulnerability Scanner Test")
    print(f"🎯 Target Contract: {CONTRACT_ADDRESS}")
    print()
    
    # Try API first, then direct method
    api_success = test_api_if_available()
    
    if not api_success:
        print("\n" + "-"*50)
        print("🔄 Falling back to direct analysis...")
        test_direct_analysis()
    
    print("\n✅ Scan complete!")
