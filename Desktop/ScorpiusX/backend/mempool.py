#!/usr/bin/env python3
"""
Scorpius Mempool API Server Launcher
Starts the real mempool monitoring API server
"""

import sys
import os
import subprocess

def main():
    # Add the backend directory to Python path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, backend_dir)
    
    # Start the mempool API server
    try:
        print("🌊 Starting Scorpius Mempool API Server...")
        print("📡 Port: 8002")
        print("🔧 Features: Real-time transaction monitoring")
        
        # Run the mempool API server
        subprocess.run([sys.executable, "mempool_api_server.py"], cwd=backend_dir)
        
    except KeyboardInterrupt:
        print("\n🛑 Mempool API Server stopped")
    except Exception as e:
        print(f"❌ Error starting mempool: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
