#!/usr/bin/env python3
"""
Simple server startup script for debugging
"""
import uvicorn
import sys
import traceback

def main():
    try:
        print("Starting MEV Bot backend server...")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False
        )
    except Exception as e:
        print(f"Error starting server: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
