"""
MEV Engine - Central coordinator for all MEV strategies and opportunities
"""

import asyncio
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from mev_strategies import (
    MEVStrategy, MEVOpportunity, StrategyType,
    FlashLoanArbitrageStrategy, SandwichAttackStrategy, 
    LiquidationBotStrategy, StrategyStats
)
from mev_config import load_mev_config

logger = logging.getLogger(__name__)

class MEVEngine:
    """
    Central MEV Engine that coordinates all MEV strategies, manages opportunities,
    and provides API endpoints for the Ultimate MEV Bot backend.
    """
    
    def __init__(self) -> None:
        """Initialize the MEV engine with all strategies."""
        self.config = load_mev_config()
        self.running = False
        self.strategies: Dict[StrategyType, MEVStrategy] = {}
        self.active_opportunities: Dict[str, MEVOpportunity] = {}
        self.executed_opportunities: Dict[str, Dict[str, Any]] = {}
        self.scanning_tasks: List[asyncio.Task] = []  # Store task references
        
        # Initialize strategies
        self._initialize_strategies()
        
        # Engine statistics
        self.start_time = time.time()
        self.total_opportunities_found = 0
        self.total_opportunities_executed = 0
        self.total_profit = 0.0
        
        logger.info("MEV Engine initialized with real MEV scanning strategies")

    def _initialize_strategies(self) -> None:
        """Initialize all MEV strategies."""
        try:
            # Initialize strategies based on configuration
            config = self.config
            
            self.strategies[StrategyType.FLASHLOAN_ARBITRAGE] = FlashLoanArbitrageStrategy()
            self.strategies[StrategyType.SANDWICH_ATTACK] = SandwichAttackStrategy()  
            self.strategies[StrategyType.LIQUIDATION_BOT] = LiquidationBotStrategy()
            
            logger.info(f"✅ Initialized {len(self.strategies)} MEV strategies")
            
        except Exception as e:
            logger.error(f"Failed to initialize MEV strategies: {e}")
            raise

    async def start_scanning(self) -> None:
        """Start the MEV engine and begin scanning for opportunities."""
        if self.running:
            logger.warning("MEV Engine already running")
            return
            
        self.running = True
        logger.info("🚀 Starting MEV Engine - Real MEV opportunity scanning active")
        
        # Start the main scanning loop and store task reference
        scanning_task = asyncio.create_task(self._main_scanning_loop())
        self.scanning_tasks.append(scanning_task)

    async def stop_engine(self) -> None:
        """Stop the MEV engine and cancel all scanning tasks."""
        if not self.running:
            logger.warning("MEV Engine not running")
            return
            
        self.running = False
        logger.info("🛑 Stopping MEV Engine")
        
        # Cancel all scanning tasks more safely
        for task in self.scanning_tasks[:]:  # Create a copy to iterate over
            if not task.done():
                task.cancel()
                # Don't await the task, just cancel it
                # The task will be cleaned up by the event loop
        
        self.scanning_tasks.clear()
        logger.info("MEV Engine stopped")
        
    async def _main_scanning_loop(self) -> None:
        """Main loop that scans for MEV opportunities across all strategies."""
        scan_interval = self.config.get('scan_interval_seconds', 5)
        
        while self.running:
            try:
                await self._scan_all_strategies()
                await asyncio.sleep(scan_interval)
                
            except Exception as e:
                logger.error(f"Error in main scanning loop: {e}")
                await asyncio.sleep(scan_interval * 2)  # Back off on error
                
    async def _scan_all_strategies(self) -> None:
        """Scan all enabled strategies for new opportunities."""
        scan_tasks = []
        
        for strategy_type, strategy in self.strategies.items():
            task = asyncio.create_task(self._scan_strategy(strategy))
            scan_tasks.append(task)
            
        # Wait for all strategy scans to complete
        if scan_tasks:
            await asyncio.gather(*scan_tasks, return_exceptions=True)
            
    async def _scan_strategy(self, strategy: MEVStrategy) -> None:
        """Scan a single strategy for opportunities."""
        try:
            opportunities = await strategy.scan_opportunities()
            
            for opp in opportunities:
                # Generate unique ID for the opportunity
                opp_id = str(uuid.uuid4())
                
                # Store opportunity with ID
                self.active_opportunities[opp_id] = opp
                self.total_opportunities_found += 1
                
                logger.info(f"💰 New {opp.strategy_type.value} opportunity found - "
                           f"Profit: {opp.estimated_profit:.6f} ETH, Confidence: {opp.confidence_score:.2%}")
                
        except Exception as e:
            logger.error(f"Error scanning {strategy.strategy_type.value}: {e}")

    async def get_active_opportunities(self) -> List[MEVOpportunity]:
        """Get all currently active MEV opportunities."""
        # Clean up old opportunities (older than 30 seconds)
        current_time = time.time()
        expired_ids = [
            opp_id for opp_id, opp in self.active_opportunities.items()
            if current_time - opp.timestamp > 30
        ]
        
        for opp_id in expired_ids:
            del self.active_opportunities[opp_id]
            
        return list(self.active_opportunities.values())

    async def execute_opportunity_by_id(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        """Execute a specific opportunity by its ID."""
        if opportunity_id not in self.active_opportunities:
            return None
            
        opportunity = self.active_opportunities[opportunity_id]
        strategy = self.strategies.get(opportunity.strategy_type)
        
        if not strategy:
            logger.error(f"Strategy {opportunity.strategy_type.value} not found")
            return None
            
        try:
            start_time = time.time()
            success = await strategy.execute_opportunity(opportunity)
            execution_time = time.time() - start_time
            
            # Record execution result
            result = {
                "success": success,
                "opportunity_id": opportunity_id,
                "strategy_type": opportunity.strategy_type.value,
                "estimated_profit": opportunity.estimated_profit,
                "profit_realized": opportunity.estimated_profit if success else 0.0,
                "gas_used": opportunity.gas_estimate if success else 0,
                "execution_time": execution_time,
                "timestamp": time.time()
            }
            
            # Move from active to executed
            del self.active_opportunities[opportunity_id]
            self.executed_opportunities[opportunity_id] = result
            
            if success:
                self.total_opportunities_executed += 1
                self.total_profit += opportunity.estimated_profit
                
            return result
            
        except Exception as e:
            logger.error(f"Failed to execute opportunity {opportunity_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "opportunity_id": opportunity_id
            }

    async def get_strategies_status(self) -> Dict[str, Any]:
        """Get status and statistics for all strategies."""
        strategies_status = {}
        
        for strategy_type, strategy in self.strategies.items():
            strategies_status[strategy_type.value] = {
                "enabled": True,
                "total_scans": strategy.stats.total_scans,
                "successful_executions": strategy.stats.successful_executions,
                "failed_executions": strategy.stats.failed_executions,
                "total_profit": strategy.stats.total_profit,
                "total_errors": strategy.stats.total_errors,
                "last_scan_time": strategy.stats.last_scan_time,
                "last_execution": strategy.stats.last_execution,
                "success_rate": (
                    strategy.stats.successful_executions / 
                    max(1, strategy.stats.successful_executions + strategy.stats.failed_executions)
                )
            }
            
        return {
            "strategies": strategies_status,
            "engine_running": self.running,
            "total_active_opportunities": len(self.active_opportunities)
        }

    async def get_performance_stats(self) -> Dict[str, Any]:
        """Get overall MEV engine performance statistics."""
        uptime = time.time() - self.start_time
        
        total_executions = sum(
            strategy.stats.successful_executions + strategy.stats.failed_executions
            for strategy in self.strategies.values()
        )
        
        total_strategy_profit = sum(
            strategy.stats.total_profit
            for strategy in self.strategies.values()
        )
        
        return {
            "engine_uptime_seconds": uptime,
            "total_opportunities_found": self.total_opportunities_found,
            "total_opportunities_executed": self.total_opportunities_executed,
            "active_opportunities_count": len(self.active_opportunities),
            "executed_opportunities_count": len(self.executed_opportunities),
            "total_profit_eth": total_strategy_profit,
            "success_rate": (
                self.total_opportunities_executed / max(1, self.total_opportunities_found)
            ),
            "average_profit_per_execution": (
                total_strategy_profit / max(1, self.total_opportunities_executed)
            ),
            "opportunities_per_minute": (
                self.total_opportunities_found / max(1, uptime / 60)
            ),
            "enabled_strategies": [strategy_type.value for strategy_type in self.strategies.keys()],
            "engine_status": "running" if self.running else "stopped"
        }

# Global MEV engine instance (lazily initialized)
_mev_engine_instance: Optional[MEVEngine] = None

def get_mev_engine() -> MEVEngine:
    """Get the global MEV engine instance, creating it if necessary."""
    global _mev_engine_instance
    if _mev_engine_instance is None:
        _mev_engine_instance = MEVEngine()
        # Start scanning in the background
        asyncio.create_task(_mev_engine_instance.start_scanning())
    return _mev_engine_instance

async def auto_start_mev_engine():
    """Initialize and start the MEV engine for standalone usage."""
    engine = get_mev_engine()
    await engine.start_scanning()
    return engine
