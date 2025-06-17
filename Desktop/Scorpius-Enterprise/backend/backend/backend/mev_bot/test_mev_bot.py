#!/usr/bin/env python3
"""
Ultimate MEV Bot Test Script
Tests all 6 strategies and API endpoints
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:8003"

async def test_mev_bot():
    """Test the Ultimate MEV Bot API endpoints"""
    
    print("🚀 Testing Ultimate MEV Bot API...")
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Get Bot Status
        print("\n1. Testing bot status...")
        async with session.get(f"{BASE_URL}/status") as resp:
            if resp.status == 200:
                status = await resp.json()
                print(f"✅ Bot Status: {status}")
                print(f"   Running: {status['is_running']}")
                print(f"   Active Strategies: {len(status['active_strategies'])}")
                print(f"   Total Profit: {status['total_profit']} ETH")
                print(f"   Rust Engine: {status['rust_engine_status']}")
            else:
                print(f"❌ Status test failed: {resp.status}")
        
        # Test 2: Get All Strategies
        print("\n2. Testing strategies endpoint...")
        async with session.get(f"{BASE_URL}/strategies") as resp:
            if resp.status == 200:
                strategies = await resp.json()
                print(f"✅ Available Strategies: {len(strategies)}")
                for name, details in strategies.items():
                    print(f"   {details['name']}: Active={details['is_active']}")
            else:
                print(f"❌ Strategies test failed: {resp.status}")
        
        # Test 3: Toggle Flash Loan Arbitrage Strategy
        print("\n3. Testing strategy toggle...")
        toggle_data = {
            "strategy_type": "flashloan_arbitrage",
            "enabled": True
        }
        async with session.post(f"{BASE_URL}/strategy/toggle", json=toggle_data) as resp:
            if resp.status == 200:
                result = await resp.json()
                print(f"✅ Strategy Toggle: {result['message']}")
            else:
                print(f"❌ Strategy toggle failed: {resp.status}")
        
        # Test 4: Get Strategy Stats
        print("\n4. Testing strategy stats...")
        async with session.get(f"{BASE_URL}/strategy/flashloan_arbitrage/stats") as resp:
            if resp.status == 200:
                stats = await resp.json()
                print(f"✅ Flash Loan Stats:")
                print(f"   Opportunities: {stats['total_opportunities']}")
                print(f"   Successful: {stats['successful_executions']}")
                print(f"   Failed: {stats['failed_executions']}")
                print(f"   Total Profit: {stats['total_profit']} ETH")
            else:
                print(f"❌ Stats test failed: {resp.status}")
        
        # Test 5: Get Performance Metrics
        print("\n5. Testing performance metrics...")
        async with session.get(f"{BASE_URL}/performance") as resp:
            if resp.status == 200:
                performance = await resp.json()
                print(f"✅ Performance Metrics:")
                print(f"   Total Profit: {performance['total_profit_eth']} ETH")
                print(f"   Total Opportunities: {performance['total_opportunities']}")
                print(f"   Success Rate: {performance['success_rate']:.1%}")
                print(f"   Uptime: {performance['uptime_hours']:.2f} hours")
            else:
                print(f"❌ Performance test failed: {resp.status}")
        
        # Test 6: Get Recent Opportunities
        print("\n6. Testing opportunities endpoint...")
        async with session.get(f"{BASE_URL}/opportunities?limit=10") as resp:
            if resp.status == 200:
                opportunities = await resp.json()
                print(f"✅ Recent Opportunities: {len(opportunities)}")
                for opp in opportunities[:3]:  # Show first 3
                    print(f"   {opp['strategy_type']}: {opp['estimated_profit']:.4f} ETH")
            else:
                print(f"❌ Opportunities test failed: {resp.status}")
        
        # Test 7: Get Recent Executions
        print("\n7. Testing executions endpoint...")
        async with session.get(f"{BASE_URL}/executions?limit=10") as resp:
            if resp.status == 200:
                executions = await resp.json()
                print(f"✅ Recent Executions: {len(executions)}")
                for exec in executions[:3]:  # Show first 3
                    status_icon = "✅" if exec['success'] else "❌"
                    print(f"   {status_icon} {exec['strategy_type']}: {exec['estimated_profit']:.4f} ETH")
            else:
                print(f"❌ Executions test failed: {resp.status}")
        
        # Test 8: Test All Strategy Types
        print("\n8. Testing all strategy types...")
        strategy_types = [
            "flashloan_arbitrage",
            "sandwich_attack", 
            "liquidation_bot",
            "cross_chain_arbitrage",
            "oracle_manipulation",
            "governance_attack"
        ]
        
        for strategy in strategy_types:
            # Enable strategy
            toggle_data = {"strategy_type": strategy, "enabled": True}
            async with session.post(f"{BASE_URL}/strategy/toggle", json=toggle_data) as resp:
                if resp.status == 200:
                    print(f"   ✅ {strategy}: Enabled")
                else:
                    print(f"   ❌ {strategy}: Failed to enable")
            
            # Wait a moment for strategy to start
            await asyncio.sleep(0.5)
            
            # Get strategy stats
            async with session.get(f"{BASE_URL}/strategy/{strategy}/stats") as resp:
                if resp.status == 200:
                    stats = await resp.json()
                    print(f"      Stats: {stats['total_opportunities']} opportunities")
                else:
                    print(f"      Failed to get stats")
        
        print("\n9. Monitoring for opportunities (30 seconds)...")
        print("   Watching for MEV opportunities being generated...")
        
        # Monitor for 30 seconds
        start_time = time.time()
        while time.time() - start_time < 30:
            async with session.get(f"{BASE_URL}/opportunities?limit=5") as resp:
                if resp.status == 200:
                    opportunities = await resp.json()
                    if opportunities:
                        latest = opportunities[-1]
                        print(f"   📊 New opportunity: {latest['strategy_type']} - "
                              f"{latest['estimated_profit']:.4f} ETH (confidence: {latest['confidence_score']:.1%})")
            
            await asyncio.sleep(3)
        
        print("\n🎉 All tests completed!")
        
        # Final status check
        print("\n📊 Final Status Check:")
        async with session.get(f"{BASE_URL}/status") as resp:
            if resp.status == 200:
                final_status = await resp.json()
                print(f"   Active Strategies: {len(final_status['active_strategies'])}")
                print(f"   Total Opportunities: {final_status['total_opportunities']}")
                print(f"   Total Profit: {final_status['total_profit']} ETH")
                print(f"   Uptime: {final_status['uptime_seconds']:.0f} seconds")

async def test_websocket():
    """Test WebSocket real-time updates"""
    print("\n🔌 Testing WebSocket connection...")
    
    try:
        import websockets
        
        uri = "ws://localhost:8003/ws"
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected")
            
            # Listen for updates for 10 seconds
            start_time = time.time()
            while time.time() - start_time < 10:
                try:
                    # Send a ping to keep connection alive
                    await websocket.send("ping")
                    
                    # Try to receive data with timeout
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(message)
                    if data.get('type') == 'status_update':
                        print(f"📡 WebSocket update: {data['recent_opportunities']} opportunities, "
                              f"{data['recent_executions']} executions")
                except asyncio.TimeoutError:
                    pass  # No message received, continue
                except json.JSONDecodeError:
                    pass  # Invalid JSON, continue
                
                await asyncio.sleep(2)
            
            print("✅ WebSocket test completed")
            
    except ImportError:
        print("⚠️ WebSocket test skipped (websockets package not installed)")
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🤖 ULTIMATE MEV BOT API TEST SUITE")
    print("=" * 60)
    print("Testing comprehensive MEV bot with 6 strategies:")
    print("• Flash Loan Arbitrage")
    print("• Sandwich Attack")  
    print("• Liquidation Bot")
    print("• Cross-Chain Arbitrage")
    print("• Oracle Manipulation")
    print("• Governance Attack")
    print("=" * 60)
    
    # Run the tests
    asyncio.run(test_mev_bot())
    asyncio.run(test_websocket())
    
    print("\n✨ Testing complete! Check the results above.")
    print("💡 To view the API documentation, visit: http://localhost:8003/docs")
