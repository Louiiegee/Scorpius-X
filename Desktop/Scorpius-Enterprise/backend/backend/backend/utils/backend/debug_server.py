#!/usr/bin/env python3
"""
Debug server to identify startup issues
"""
import uvicorn
import sys
import traceback
import asyncio
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def test_mev_engine():
    """Test MEV engine initialization separately"""
    try:
        logger.info("Testing MEV engine import...")
        from mev_engine import get_mev_engine
        
        logger.info("Testing MEV engine initialization...")
        engine = get_mev_engine()
        
        logger.info("Testing MEV engine methods...")
        opportunities = await engine.get_active_opportunities()
        logger.info(f"Got {len(opportunities)} opportunities")
        
        strategies = await engine.get_strategies_status()
        logger.info(f"Got strategies status: {list(strategies.keys()) if strategies else 'None'}")
        
        logger.info("MEV engine test completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"MEV engine test failed: {e}")
        traceback.print_exc()
        return False

def main():
    try:
        print("Running MEV engine test first...")
        
        # Test MEV engine in isolation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        success = loop.run_until_complete(test_mev_engine())
        loop.close()
        
        if not success:
            print("MEV engine test failed - not starting server")
            return
        
        print("MEV engine test passed - starting server...")
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            log_level="debug",
            reload=False
        )
        
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
