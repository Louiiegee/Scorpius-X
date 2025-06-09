#!/usr/bin/env python3
"""
Scorpius Scanner API Server Launcher
Starts the real vulnerability scanner API server with Slither, Mythril, and Echidna integration
"""

import sys
import os
import subprocess

def main():
    # Add the backend directory to Python path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, backend_dir)
    
    # Start the scanner API server
    try:
        print("🔍 Starting Scorpius Scanner API Server...")
        print("📡 Port: 8001")
        print("🔧 Features: Slither, Mythril, Echidna integration")
        
        # Run the scanner API server
        subprocess.run([sys.executable, "scanner_api_server.py"], cwd=backend_dir)
        
    except KeyboardInterrupt:
        print("\n🛑 Scanner API Server stopped")
    except Exception as e:
        print(f"❌ Error starting scanner: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
