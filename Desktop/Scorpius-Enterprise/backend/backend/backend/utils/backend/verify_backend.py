#!/usr/bin/env python3
"""
Backend Module Verification Script
Verifies all backend modules are properly integrated and functional
"""

import os
import sys
import importlib.util
import asyncio

def print_banner():
    """Print verification banner."""
    print("=" * 70)
    print("🕷️  SCORPIUS BACKEND MODULE VERIFICATION")
    print("=" * 70)
    print("Checking all backend modules and integrations...")
    print()

def check_file_exists(file_path: str, description: str) -> bool:
    """Check if a file exists and print status."""
    if os.path.exists(file_path):
        print(f"✅ {description}: {os.path.basename(file_path)}")
        return True
    else:
        print(f"❌ {description}: {os.path.basename(file_path)} - NOT FOUND")
        return False

def check_module_import(module_path: str, module_name: str) -> bool:
    """Check if a module can be imported."""
    try:
        spec = importlib.util.spec_from_file_location(module_name, module_path)
        if spec is None:
            print(f"❌ {module_name}: Cannot create module spec")
            return False
            
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        print(f"✅ {module_name}: Successfully imported")
        return True
    except Exception as e:
        print(f"❌ {module_name}: Import failed - {str(e)[:50]}...")
        return False

def verify_backend_structure():
    """Verify backend directory structure."""
    print("📁 Backend Structure Verification:")
    print("-" * 40)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Check core files
    core_files = [
        (os.path.join(base_path, "api_server.py"), "API Server"),
        (os.path.join(base_path, "engine", "engine.py"), "Scorpius Engine"),
        (os.path.join(base_path, "modules", "__init__.py"), "Modules Init"),
    ]
    
    structure_ok = True
    for file_path, description in core_files:
        if not check_file_exists(file_path, description):
            structure_ok = False
    
    print()
    return structure_ok

def verify_modules():
    """Verify all backend modules."""
    print("🔧 Backend Modules Verification:")
    print("-" * 40)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    modules_path = os.path.join(base_path, "modules")
    
    # Check module files
    modules = [
        ("honeypot_detector.py", "Honeypot Detector"),
        ("bytecode_similarity_engine.py", "Bytecode Similarity Engine"),
        ("real_vulnerability_scanner.py", "Vulnerability Scanner"),
        ("elite_mev_bot.py", "MEV Bot")
    ]
    
    modules_ok = True
    for module_file, description in modules:
        module_path = os.path.join(modules_path, module_file)
        if check_file_exists(module_path, description):
            # Try to import the module
            module_name = module_file.replace('.py', '')
            if not check_module_import(module_path, module_name):
                modules_ok = False
        else:
            modules_ok = False
    
    print()
    return modules_ok

def verify_api_endpoints():
    """Verify API server endpoint definitions."""
    print("🌐 API Endpoints Verification:")
    print("-" * 40)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    api_server_path = os.path.join(base_path, "api_server.py")
    
    if not os.path.exists(api_server_path):
        print("❌ API server file not found")
        return False
    
    try:
        with open(api_server_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for key endpoint patterns
        endpoints = [
            ("/api/honeypot/analyze", "Honeypot Analysis"),
            ("/api/honeypot/signatures", "Honeypot Signatures"),
            ("/api/honeypot/quick-scan", "Quick Honeypot Scan"),
            ("/api/honeypot/batch-analyze", "Batch Honeypot Analysis"),
            ("/api/bytecode/analyze", "Bytecode Analysis"),
            ("/api/scan", "Vulnerability Scan"),
            ("/api/mev", "MEV Operations")
        ]
        
        endpoints_found = 0
        for endpoint, description in endpoints:
            if endpoint in content:
                print(f"✅ {description}: {endpoint}")
                endpoints_found += 1
            else:
                print(f"⚠️  {description}: {endpoint} - NOT FOUND")
        
        print(f"\nEndpoints Found: {endpoints_found}/{len(endpoints)}")
        print()
        
        return endpoints_found >= len(endpoints) - 1  # Allow for 1 missing
        
    except Exception as e:
        print(f"❌ Failed to read API server file: {e}")
        return False

def verify_engine_integration():
    """Verify engine integration."""
    print("⚙️  Engine Integration Verification:")
    print("-" * 40)
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    engine_path = os.path.join(base_path, "engine", "engine.py")
    
    if not os.path.exists(engine_path):
        print("❌ Engine file not found")
        return False
    
    try:
        with open(engine_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for key integrations
        integrations = [
            ("HoneypotDetector", "Honeypot Detector Integration"),
            ("BytecodeSimilarityEngine", "Bytecode Engine Integration"),
            ("analyze_honeypot_infrastructure", "Honeypot Analysis Method"),
            ("quick_honeypot_scan", "Quick Scan Method"),
            ("submit_scan", "Scan Submission"),
            ("get_scan_status", "Scan Status Tracking")
        ]
        
        integrations_found = 0
        for integration, description in integrations:
            if integration in content:
                print(f"✅ {description}")
                integrations_found += 1
            else:
                print(f"❌ {description} - NOT FOUND")
        
        print(f"\nIntegrations Found: {integrations_found}/{len(integrations)}")
        print()
        
        return integrations_found >= len(integrations) - 1  # Allow for 1 missing
        
    except Exception as e:
        print(f"❌ Failed to read engine file: {e}")
        return False

def verify_dependencies():
    """Verify Python dependencies."""
    print("📦 Dependencies Verification:")
    print("-" * 40)
    
    # Check for required Python modules
    required_modules = [
        "asyncio",
        "json", 
        "logging",
        "datetime",
        "hashlib",
        "socket",
        "ssl",
        "ipaddress",
        "uuid",
        "time"
    ]
    
    missing_modules = []
    for module in required_modules:
        try:
            __import__(module)
            print(f"✅ {module}")
        except ImportError:
            print(f"❌ {module} - NOT AVAILABLE")
            missing_modules.append(module)
    
    print(f"\nDependencies: {len(required_modules) - len(missing_modules)}/{len(required_modules)} available")
    print()
    
    return len(missing_modules) == 0

def main():
    """Run complete backend verification."""
    print_banner()
    
    verification_results = []
    
    # Run all verifications
    verification_results.append(("Backend Structure", verify_backend_structure()))
    verification_results.append(("Module Imports", verify_modules()))
    verification_results.append(("API Endpoints", verify_api_endpoints()))
    verification_results.append(("Engine Integration", verify_engine_integration()))
    verification_results.append(("Dependencies", verify_dependencies()))
    
    # Summary
    print("📊 VERIFICATION SUMMARY")
    print("=" * 70)
    
    passed_count = 0
    for test_name, result in verification_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:25} {status}")
        if result:
            passed_count += 1
    
    print(f"\nOverall Result: {passed_count}/{len(verification_results)} tests passed")
    
    if passed_count == len(verification_results):
        print("🎉 ALL BACKEND VERIFICATIONS PASSED!")
        print("Backend is ready for additional modules")
    else:
        print("⚠️  SOME VERIFICATIONS FAILED")
        print("Review failed items before adding new modules")
    
    print("=" * 70)
    
    return 0 if passed_count == len(verification_results) else 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⚠️  Verification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
