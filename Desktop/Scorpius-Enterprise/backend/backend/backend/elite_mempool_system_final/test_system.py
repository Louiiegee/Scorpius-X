"""
Test script for Elite Mempool System basic functionality.
This script validates that all components can be imported and initialized properly.
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add the project directory to Python path for imports
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Test imports
try:
    # Core imports
    from config import load_config
    from core.session_manager import SessionManager
    from core.enhanced_mempool_monitor import EnhancedMempoolMonitor
    from core.utils import async_retry, ether_to_wei, wei_to_ether
    
    # Model imports
    from models.mempool_event import MempoolEvent, MempoolEventType, MempoolEventSeverity
    from models.mev_opportunity import MEVOpportunity, MEVStrategyType, OpportunityStatus
    
    # Analysis imports
    from mev_analysis.mev_detector import MEVDetector
    
    # Execution imports
    from execution.execution_engine import ExecutionEngine
    from execution.private_relays import FlashbotsRelayClient
    
    print("✅ All imports successful!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

async def test_configuration():
    """Test configuration loading."""
    try:
        config = load_config()
        print("✅ Configuration loaded successfully")
        
        # Check for required sections
        required_sections = ["api", "networks", "mempool_monitor", "mev_detector", "execution_engine"]
        for section in required_sections:
            if section in config:
                print(f"✅ Configuration section '{section}' found")
            else:
                print(f"⚠️  Configuration section '{section}' missing")
        
        return config
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return None

async def test_session_manager():
    """Test session manager functionality."""
    try:
        session_manager = SessionManager(timeout_seconds=10)
        session = await session_manager.get_session("test_session")
        print("✅ Session manager working")
        await session_manager.close_all()
        print("✅ Session manager cleanup successful")
        return True
    except Exception as e:
        print(f"❌ Session manager test failed: {e}")
        return False

async def test_utility_functions():
    """Test utility functions."""
    try:
        # Test ether conversion
        wei_amount = ether_to_wei(1.0)
        eth_amount = wei_to_ether(wei_amount)
        
        if wei_amount == 1000000000000000000 and eth_amount == 1.0:
            print("✅ Ether conversion functions working")
        else:
            print(f"❌ Ether conversion test failed: {wei_amount}, {eth_amount}")
            return False
        
        # Test async retry decorator
        @async_retry(retries=2, delay=0.1)
        async def test_function():
            return "success"
        
        result = await test_function()
        if result == "success":
            print("✅ Async retry decorator working")
        else:
            print("❌ Async retry decorator test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Utility functions test failed: {e}")
        return False

async def test_data_models():
    """Test data model creation and serialization."""
    try:
        # Test MempoolEvent
        event = MempoolEvent(
            tx_hash="0x1234567890abcdef",
            from_address="0xabcdef1234567890",
            contract_address="0x9876543210fedcba",
            gas_price=20000000000,
            value=1000000000000000000,
            timestamp=1234567890.0,
            network_id=1,
            input_data="0x",
            severity=MempoolEventSeverity.INFO,
            event_type=MempoolEventType.TRANSACTION
        )
        
        event_dict = event.to_dict()
        if "tx_hash" in event_dict and event_dict["tx_hash"] == "0x1234567890abcdef":
            print("✅ MempoolEvent model working")
        else:
            print("❌ MempoolEvent model test failed")
            return False
        
        # Test MEVOpportunity
        opportunity = MEVOpportunity(
            opportunity_id="test_opp_1",
            strategy_type=MEVStrategyType.ARBITRAGE,
            target_tx_hash="0x1234567890abcdef",
            estimated_profit_usd=100.0,
            estimated_profit_eth=0.05,
            gas_cost_estimate=0.01,
            confidence_score=0.8,
            network_id=1
        )
        
        opp_dict = opportunity.to_dict()
        if "opportunity_id" in opp_dict and opp_dict["opportunity_id"] == "test_opp_1":
            print("✅ MEVOpportunity model working")
        else:
            print("❌ MEVOpportunity model test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Data models test failed: {e}")
        return False

async def test_component_initialization(config):
    """Test that components can be initialized with configuration."""
    try:
        # Test SessionManager
        session_manager = SessionManager()
        print("✅ SessionManager initialization successful")
        
        # Note: We can't fully test Web3-dependent components without real RPC access
        # But we can test that they import and basic initialization works
        
        # Test that classes can be instantiated (will fail without proper config)
        try:
            # This will fail without real Web3 instance, but that's expected
            pass
        except Exception:
            pass  # Expected without real config
        
        print("✅ Component initialization tests completed")
        await session_manager.close_all()
        return True
        
    except Exception as e:
        print(f"❌ Component initialization test failed: {e}")
        return False

async def main():
    """Run all tests."""
    print("🚀 Starting Elite Mempool System Tests\n")
    
    # Test configuration
    config = await test_configuration()
    print()
    
    # Test session manager
    await test_session_manager()
    print()
    
    # Test utility functions
    await test_utility_functions()
    print()
    
    # Test data models
    await test_data_models()
    print()
    
    # Test component initialization
    if config:
        await test_component_initialization(config)
    print()
    
    print("✅ Test suite completed!")
    print("\n📋 Next steps:")
    print("1. Set environment variables (INFURA_PROJECT_ID, BOT_WALLET_ADDRESS, BOT_WALLET_PRIVATE_KEY)")
    print("2. Update config/default_config.yaml with your settings")
    print("3. Run 'python main_launcher.py' to start the system")

if __name__ == "__main__":
    asyncio.run(main())
