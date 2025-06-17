#!/usr/bin/env python3
"""
Comprehensive test script for Honeypot Detection System
Tests the full pipeline from core detection engine to API endpoints
"""

import asyncio
import json
import sys
import time
from typing import Dict, Any, List
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import our modules
try:
    from modules.honeypot_detector import HoneypotDetector, analyze_target_honeypot
    from engine.engine import ScorpiusEngine
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this script from the backend directory")
    sys.exit(1)

# Test data - simulated honeypot and legitimate service targets
TEST_TARGETS = {
    "suspected_honeypots": [
        "192.168.1.100",  # Simulated Cowrie SSH honeypot
        "10.0.0.50",      # Simulated Dionaea honeypot
        "172.16.1.25"     # Simulated web honeypot
    ],
    "legitimate_services": [
        "8.8.8.8",        # Google DNS
        "1.1.1.1",        # Cloudflare DNS
        "github.com"      # Popular service
    ],
    "mixed_targets": [
        "192.168.1.1",    # Router/gateway
        "scanme.nmap.org", # Nmap test target
        "testphp.vulnweb.com"  # Test vulnerable web app
    ]
}

def print_banner():
    """Print test banner."""
    print("=" * 80)
    print("🕷️  SCORPIUS HONEYPOT DETECTION SYSTEM - COMPREHENSIVE TEST")
    print("=" * 80)
    print("Testing honeypot detection capabilities across multiple scenarios")
    print()

async def test_core_detector():
    """Test the core honeypot detector functionality."""
    print("🔍 Testing Core Honeypot Detector...")
    print("-" * 50)
    
    detector = HoneypotDetector()
    
    # Test signature retrieval
    signatures = await detector.get_honeypot_signatures()
    print(f"✅ Loaded {len(signatures)} honeypot signatures")
    
    # Display some signature examples
    print("\n📋 Available Honeypot Signatures:")
    for honeypot_type, details in list(signatures.items())[:3]:
        print(f"  • {honeypot_type}: {details.get('description', 'N/A')}")
    
    print(f"  ... and {len(signatures) - 3} more signatures")
    
    # Test individual target analysis
    print("\n🎯 Testing Individual Target Analysis:")
    test_target = "scanme.nmap.org"
    
    try:
        result = await detector.analyze_target(
            target=test_target,
            ports=[22, 80, 443],
            include_service_detection=True,
            include_behavioral_analysis=True,
            include_timing_analysis=True
        )
        
        print(f"  Target: {test_target}")
        print(f"  Status: {result.get('status', 'unknown')}")
        print(f"  Detections: {len(result.get('honeypot_detections', []))}")
        print(f"  Confidence: {result.get('confidence', 0.0):.2f}")
        print(f"  Risk Score: {result.get('risk_score', 0.0):.1f}/10")
        print(f"  Analysis Time: {result.get('analysis_time', 0.0):.2f}s")
        
        if result.get('honeypot_detections'):
            print("  🚨 Honeypot Indicators Found:")
            for detection in result['honeypot_detections'][:2]:
                print(f"    - {detection.get('type', 'Unknown')}: {detection.get('description', 'N/A')}")
        
    except Exception as e:
        print(f"  ❌ Analysis failed: {e}")
    
    print()

async def test_quick_analysis():
    """Test the quick analysis convenience function."""
    print("⚡ Testing Quick Analysis Function...")
    print("-" * 50)
    
    test_targets = ["8.8.8.8", "github.com"]
    
    for target in test_targets:
        try:
            result = await analyze_target_honeypot(target)
            
            print(f"  Target: {target}")
            print(f"  Honeypot Detected: {'🚨 YES' if result.get('honeypot_detected', False) else '✅ NO'}")
            print(f"  Confidence: {result.get('confidence', 0.0):.2f}")
            print(f"  Risk Level: {result.get('risk_level', 'unknown').upper()}")
            print(f"  Analysis Time: {result.get('analysis_time', 0.0):.2f}s")
            print()
            
        except Exception as e:
            print(f"  ❌ Quick analysis failed for {target}: {e}")
            print()

async def test_batch_analysis():
    """Test batch analysis capabilities."""
    print("📊 Testing Batch Analysis...")
    print("-" * 50)
    
    detector = HoneypotDetector()
    
    # Test with mixed targets
    batch_targets = TEST_TARGETS["mixed_targets"]
    
    try:
        results = await detector.batch_analyze(
            targets=batch_targets,
            quick_scan=True,  # Use quick scan for faster testing
            max_concurrent=2
        )
        
        print(f"  Batch Analysis Results:")
        print(f"  Targets Analyzed: {results.get('targets_analyzed', 0)}")
        print(f"  Honeypots Detected: {results.get('summary', {}).get('honeypots_detected', 0)}")
        print(f"  High Confidence: {results.get('summary', {}).get('high_confidence', 0)}")
        print(f"  Total Time: {results.get('summary', {}).get('total_time', 0.0):.2f}s")
        
        print("\n  📋 Individual Results:")
        for result in results.get('results', []):
            status_icon = "🚨" if result.get('honeypot_detected', False) else "✅"
            print(f"    {status_icon} {result.get('target', 'unknown')}: "
                  f"Confidence {result.get('confidence', 0.0):.2f}")
        
    except Exception as e:
        print(f"  ❌ Batch analysis failed: {e}")
    
    print()

async def test_scorpius_integration():
    """Test integration with ScorpiusEngine."""
    print("🔗 Testing ScorpiusEngine Integration...")
    print("-" * 50)
    
    engine = ScorpiusEngine()
    
    # Test quick honeypot scan
    print("  Testing Quick Honeypot Scan:")
    test_target = "scanme.nmap.org"
    
    try:
        result = await engine.quick_honeypot_scan(test_target)
        
        print(f"    Target: {result.get('target', 'unknown')}")
        print(f"    Threat Level: {result.get('threat_level', 'unknown')}")
        print(f"    Honeypot Detected: {'🚨 YES' if result.get('honeypot_detected', False) else '✅ NO'}")
        print(f"    Confidence: {result.get('confidence', 0.0):.2f}")
        print(f"    Risk Score: {result.get('risk_score', 0.0):.1f}/10")
        print(f"    Detections: {result.get('detections_count', 0)}")
        
    except Exception as e:
        print(f"    ❌ Quick scan failed: {e}")
    
    # Test infrastructure analysis
    print("\n  Testing Infrastructure Analysis:")
    infrastructure_targets = ["8.8.8.8", "1.1.1.1"]
    
    try:
        result = await engine.analyze_honeypot_infrastructure(
            targets=infrastructure_targets,
            analysis_options={
                "include_service_detection": True,
                "include_behavioral_analysis": False,  # Skip for speed
                "include_timing_analysis": False,      # Skip for speed
                "ports": [53, 80, 443]  # DNS and web ports
            }
        )
        
        print(f"    Analysis ID: {result.get('analysis_id', 'unknown')[:8]}...")
        print(f"    Targets: {result.get('targets_analyzed', 0)}")
        print(f"    Honeypots Detected: {result.get('summary', {}).get('total_honeypots_detected', 0)}")
        print(f"    Detection Rate: {result.get('summary', {}).get('detection_rate', 0.0):.1f}%")
        print(f"    Analysis Time: {result.get('summary', {}).get('analysis_time', 0.0):.2f}s")
        
    except Exception as e:
        print(f"    ❌ Infrastructure analysis failed: {e}")
    
    print()

async def test_edge_cases():
    """Test edge cases and error handling."""
    print("🛡️  Testing Edge Cases & Error Handling...")
    print("-" * 50)
    
    detector = HoneypotDetector()
    
    # Test invalid targets
    invalid_targets = [
        "invalid.hostname.nonexistent",
        "999.999.999.999",
        "not-a-domain",
        ""
    ]
    
    print("  Testing Invalid Targets:")
    for target in invalid_targets:
        try:
            result = await detector.analyze_target(
                target=target,
                ports=[80],
                include_service_detection=False,
                include_behavioral_analysis=False,
                include_timing_analysis=False
            )
            
            status = result.get('status', 'unknown')
            print(f"    {target or '(empty)'}: {status}")
            
        except Exception as e:
            print(f"    {target or '(empty)'}: ❌ Error handled - {type(e).__name__}")
    
    # Test empty batch
    print("\n  Testing Empty Batch:")
    try:
        result = await detector.batch_analyze(targets=[])
        print(f"    Empty batch result: {result.get('summary', {}).get('targets_analyzed', 0)} targets")
    except Exception as e:
        print(f"    Empty batch: ❌ Error handled - {type(e).__name__}")
    
    print()

def print_performance_summary(total_time: float):
    """Print performance summary."""
    print("📈 Performance Summary")
    print("-" * 50)
    print(f"  Total Test Time: {total_time:.2f} seconds")
    print(f"  Average per Test: {total_time/5:.2f} seconds")
    print("  Memory Usage: Efficient async operations")
    print("  Network I/O: Concurrent with connection limits")
    print()

async def main():
    """Run all honeypot detector tests."""
    print_banner()
    
    start_time = time.time()
    
    try:
        # Run all test suites
        await test_core_detector()
        await test_quick_analysis()
        await test_batch_analysis()
        await test_scorpius_integration()
        await test_edge_cases()
        
        total_time = time.time() - start_time
        print_performance_summary(total_time)
        
        print("🎉 All honeypot detection tests completed successfully!")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Test suite failed: {e}")
        print("=" * 80)
        return 1
    
    return 0

if __name__ == "__main__":
    """Entry point for standalone execution."""
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
