#!/usr/bin/env python3
"""
Test script for the integrated bytecode similarity engine
"""

import asyncio
import json
import logging
from modules.bytecode_similarity_engine import BytecodeSimilarityEngine, analyze_contract_bytecode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_bytecode_similarity_engine():
    """Test the bytecode similarity engine functionality."""
    
    print("🔍 Testing Bytecode Similarity Engine Integration")
    print("=" * 60)
    
    # Initialize engine
    engine = BytecodeSimilarityEngine()
    print(f"✅ Engine initialized with {len(engine.reference_patterns)} reference patterns")
    print(f"✅ Vulnerability patterns loaded: {len(engine.vulnerability_patterns)}")
    
    # Test sample bytecode (ERC20-like pattern)
    sample_bytecode = "0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063a9059cbb14610046578063dd62ed3e1461007657806370a08231146100a6575b600080fd5b6100606004803603810190610053919061024a565b6100d6565b60405161006d919061029f565b60405180910390f35b610090600480360381019061008b91906101fb565b6101ee565b60405161009d91906102ba565b60405180910390f35b6100c060048036038101906100bb91906101ce565b610275565b60405161009d91906102ba565b5050565b"
    
    print(f"\n📊 Analyzing sample bytecode ({len(sample_bytecode)} characters)")
    
    try:
        # Run comprehensive analysis
        results = await engine.analyze_bytecode_similarity(
            bytecode=sample_bytecode,
            include_opcode_analysis=True,
            include_vulnerability_patterns=True,
            include_fingerprinting=True
        )
        
        print("\n🎯 Analysis Results:")
        print(f"   Bytecode Hash: {results['bytecode_hash'][:16]}...")
        print(f"   Risk Score: {results['risk_score']}/10.0")
        print(f"   Classification: {results['classification']['primary_type']}")
        
        print(f"\n🔍 Similarity Matches: {len(results['similarity_matches'])}")
        for match in results['similarity_matches'][:3]:  # Show top 3
            print(f"   • {match['pattern_name']}: {match['confidence']:.3f} confidence")
        
        print(f"\n⚠️  Vulnerability Patterns: {len(results['vulnerability_patterns'])}")
        for vuln in results['vulnerability_patterns']:
            print(f"   • {vuln['pattern_type']}: {vuln['severity']} ({vuln['confidence']:.2f})")
        
        print(f"\n🔧 Opcode Analysis:")
        opcode_analysis = results['opcode_analysis']
        print(f"   • Total Opcodes: {opcode_analysis['total_opcodes']}")
        print(f"   • Unique Opcodes: {opcode_analysis['unique_opcodes']}")
        print(f"   • Complexity Score: {opcode_analysis['complexity_score']:.2f}")
        
        if opcode_analysis.get('suspicious_opcodes'):
            print(f"   • Suspicious Opcodes: {', '.join(opcode_analysis['suspicious_opcodes'])}")
        
        print(f"\n🔒 Security Fingerprint:")
        fingerprint = results['fingerprint']
        print(f"   • Entropy: {fingerprint['entropy']:.3f}")
        print(f"   • Opcode Signature: {fingerprint['opcode_signature'][:32]}...")
        
        print("\n✅ Bytecode similarity engine test completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        logger.error(f"Bytecode analysis test failed: {e}", exc_info=True)
        return False

async def test_convenience_function():
    """Test the convenience function."""
    print("\n🚀 Testing Convenience Function")
    print("-" * 40)
    
    try:
        # Test the convenience function
        quick_results = await analyze_contract_bytecode("0x608060405234801561001057600080fd5b50")
        
        print(f"✅ Quick analysis completed:")
        print(f"   Risk Score: {quick_results['risk_score']}")
        print(f"   Matches Found: {len(quick_results['similarity_matches'])}")
        print(f"   Vulnerabilities: {len(quick_results['vulnerability_patterns'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Convenience function test failed: {e}")
        return False

async def main():
    """Run all tests."""
    print("🎯 SCORPIUS BYTECODE SIMILARITY ENGINE TEST SUITE")
    print("=" * 70)
    
    success_count = 0
    total_tests = 2
    
    # Test 1: Main engine functionality
    if await test_bytecode_similarity_engine():
        success_count += 1
    
    # Test 2: Convenience function
    if await test_convenience_function():
        success_count += 1
    
    print("\n" + "=" * 70)
    print(f"🏁 TEST RESULTS: {success_count}/{total_tests} tests passed")
    
    if success_count == total_tests:
        print("🎉 ALL TESTS PASSED! Bytecode similarity engine is ready for production.")
    else:
        print("⚠️  Some tests failed. Please review the error messages above.")
    
    return success_count == total_tests

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
