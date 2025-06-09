#!/usr/bin/env python3
"""
Simple test script for Honeypot Detection System
Direct module testing without complex imports
"""

import asyncio
import json
import sys
import os

# Simple direct import approach
sys.path.append(os.path.join(os.path.dirname(__file__), 'modules'))

try:
    import honeypot_detector
    print("✅ Successfully imported honeypot_detector module")
except ImportError as e:
    print(f"❌ Failed to import honeypot_detector: {e}")
    sys.exit(1)

async def main():
    """Run a simple honeypot detector test."""
    print("🕷️  SCORPIUS HONEYPOT DETECTION - SIMPLE TEST")
    print("=" * 60)
    
    # Test the module's main components
    try:
        # Create detector instance
        detector = honeypot_detector.HoneypotDetector()
        print("✅ HoneypotDetector instance created successfully")
        
        # Test signature loading
        signatures = await detector.get_honeypot_signatures()
        print(f"✅ Loaded {len(signatures)} honeypot signatures")
        
        # Show some signature examples
        print("\n📋 Available Honeypot Signatures:")
        for i, (honeypot_type, details) in enumerate(signatures.items()):
            if i >= 3:  # Show only first 3
                break
            print(f"  • {honeypot_type}: {details.get('description', 'N/A')}")
        
        # Test the convenience function
        print("\n⚡ Testing Quick Analysis Function...")
        test_target = "8.8.8.8"  # Google DNS - should be clean
        
        result = await honeypot_detector.analyze_target_honeypot(test_target)
        print(f"  Target: {test_target}")
        print(f"  Honeypot Detected: {'🚨 YES' if result.get('honeypot_detected', False) else '✅ NO'}")
        print(f"  Confidence: {result.get('confidence', 0.0):.2f}")
        print(f"  Risk Level: {result.get('risk_level', 'unknown').upper()}")
        print(f"  Analysis Time: {result.get('analysis_time', 0.0):.2f}s")
        
        # Test batch analysis with minimal targets
        print("\n📊 Testing Batch Analysis...")
        batch_targets = ["1.1.1.1", "8.8.8.8"]  # Cloudflare and Google DNS
        
        batch_results = await detector.batch_analyze(
            targets=batch_targets,
            quick_scan=True,
            max_concurrent=1
        )
        
        print(f"  Batch Results:")
        print(f"  Targets Analyzed: {batch_results.get('targets_analyzed', 0)}")
        print(f"  Honeypots Detected: {batch_results.get('summary', {}).get('honeypots_detected', 0)}")
        print(f"  Total Time: {batch_results.get('summary', {}).get('total_time', 0.0):.2f}s")
        
        print("\n🎉 Simple honeypot detection test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
