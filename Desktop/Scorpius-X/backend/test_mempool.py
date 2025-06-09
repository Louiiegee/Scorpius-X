#!/usr/bin/env python3
"""
Test script for Mempool Monitor functionality
"""
import asyncio
import logging
import time
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_mempool_monitor():
    """Test the mempool monitor functionality."""
    
    logger.info("🔍 Testing Mempool Monitor Components...")
    
    try:
        # Test 1: Import enhanced mempool monitor
        logger.info("1. Testing Enhanced Mempool Monitor import...")
        from core.enhanced_mempool_monitor import EnhancedMempoolMonitor, RawMempoolTransaction
        logger.info("✅ Enhanced Mempool Monitor imported successfully")
        
        # Test 2: Initialize monitor
        logger.info("2. Testing Monitor initialization...")
        rpc_urls = [
            "https://mainnet.infura.io/v3/dummy",  # Will fail but tests initialization
            "https://eth-mainnet.alchemyapi.io/v2/dummy"
        ]
        
        monitor = EnhancedMempoolMonitor(
            chain_id=1,
            rpc_urls=rpc_urls,
            max_stored_txs=1000,
            poll_interval=1.0
        )
        logger.info("✅ Monitor initialized successfully")
        
        # Test 3: Test Raw Transaction functionality
        logger.info("3. Testing Raw Transaction processing...")
        dummy_tx_data = {
            "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            "from": "0xabcdef1234567890abcdef1234567890abcdef12",
            "to": "0x1234567890abcdef1234567890abcdef12345678",
            "value": "1000000000000000000",  # 1 ETH
            "gasPrice": "20000000000",  # 20 gwei
            "gas": "21000",
            "input": "0x"
        }
        
        raw_tx = RawMempoolTransaction(
            tx_hash=dummy_tx_data["hash"],
            tx_data=dummy_tx_data,
            network_id=1
        )
        
        logger.info(f"✅ Created raw transaction: {raw_tx}")
        
        # Test conversion to mempool event
        mempool_event = raw_tx.to_mempool_event()
        logger.info(f"✅ Converted to mempool event: {mempool_event.tx_hash[:10]}...")
        
        # Test 4: Test MempoolEvent model
        logger.info("4. Testing MempoolEvent model...")
        from models.mempool_event import MempoolEvent, MempoolEventType, MempoolEventSeverity
        
        test_event = MempoolEvent(
            tx_hash="0xtest123",
            from_address="0xfrom123",
            contract_address="0xto123",
            gas_price=20000000000,
            value=1000000000000000000,
            timestamp=time.time(),
            network_id=1,
            input_data="0x",
            severity=MempoolEventSeverity.MEDIUM,
            event_type=MempoolEventType.TRANSACTION,
            raw_tx_data=dummy_tx_data
        )
        logger.info(f"✅ MempoolEvent created: {test_event}")
        
        # Test 5: Test Session Manager
        logger.info("5. Testing Session Manager...")
        from core.session_manager import SessionManager
        
        session_manager = SessionManager(timeout_seconds=10)
        logger.info("✅ Session Manager initialized")
        
        # Clean up
        await session_manager.close_all()
        logger.info("✅ Session Manager closed")
        
        logger.info("🎉 All Mempool Monitor tests passed!")
        return True
        
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Test failed: {e}", exc_info=True)
        return False

async def test_mempool_api_server():
    """Test mempool API server functionality without starting it."""
    
    logger.info("🌐 Testing Mempool API Server...")
    
    try:
        # Test API server imports
        logger.info("1. Testing API server imports...")
        import mempool_api_server
        logger.info("✅ Mempool API server imported successfully")
        
        # Test models
        from mempool_api_server import MempoolTransaction, MonitorRequest
        
        test_tx = MempoolTransaction(
            hash="0xtest123",
            from_address="0xfrom123", 
            to_address="0xto123",
            value=1.5,
            gas_price=25.0,
            gas_limit=21000,
            timestamp="2024-01-01T12:00:00Z",
            status="pending"
        )
        logger.info(f"✅ MempoolTransaction model: {test_tx}")
        
        test_monitor = MonitorRequest(
            address="0x1234567890abcdef1234567890abcdef12345678",
            min_value=0.1,
            max_gas_price=50.0,
            alert_on_large_transfers=True
        )
        logger.info(f"✅ MonitorRequest model: {test_monitor}")
        
        logger.info("🎉 Mempool API Server tests passed!")
        return True
        
    except Exception as e:
        logger.error(f"❌ API Server test failed: {e}", exc_info=True)
        return False

async def main():
    """Main test function."""
    
    logger.info("🚀 Starting Mempool Module Tests...")
    
    # Test core functionality
    monitor_success = await test_mempool_monitor()
    api_success = await test_mempool_api_server()
    
    if monitor_success and api_success:
        logger.info("🎉✅ ALL MEMPOOL TESTS PASSED!")
        logger.info("🔍 Mempool monitoring backend is ready for integration!")
    else:
        logger.error("❌ Some tests failed. Check logs above.")
        
    return monitor_success and api_success

if __name__ == "__main__":
    asyncio.run(main())
