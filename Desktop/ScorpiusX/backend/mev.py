#!/usr/bin/env python3
"""
Scorpius MEV API Server Launcher
Starts the real MEV bot operations API server
"""

import sys
import os
import subprocess

def main():
    # Add the backend directory to Python path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, backend_dir)
    
    # Start the MEV API server
    try:
        print("💰 Starting Scorpius MEV API Server...")
        print("📡 Port: 8003")
        print("🔧 Features: MEV bot operations, sandwich attacks, arbitrage")
        
        # Run the MEV API server
        subprocess.run([sys.executable, "mev_api_server.py"], cwd=backend_dir)
        
    except KeyboardInterrupt:
        print("\n🛑 MEV API Server stopped")
    except Exception as e:
        print(f"❌ Error starting MEV server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
