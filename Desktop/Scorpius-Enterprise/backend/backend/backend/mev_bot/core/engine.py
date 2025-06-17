"""
Scorpius Enterprise MEV Engine
Core orchestration engine that coordinates all MEV operations
"""

from __future__ import annotations
import asyncio
import logging
import time
from typing import Dict, List, Optional, Set, Callable, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field

from .types import (
    TransactionData, 
    MEVOpportunity, 
    BundleRequest, 
    BundleResult,
    StrategyType,
    Filter
)
from .strategy import AbstractStrategy, StrategyRegistry
from .config import Config


@dataclass
class EngineMetrics:
    """MEV Engine performance metrics"""
    transactions_processed: int = 0
    opportunities_found: int = 0
    bundles_submitted: int = 0
    bundles_included: int = 0
    total_profit_wei: int = 0
    total_gas_spent: int = 0
    avg_tx_processing_time_ms: float = 0.0
    avg_bundle_submit_time_ms: float = 0.0
    start_time: Optional[datetime] = None
    
    @property
    def uptime_seconds(self) -> float:
        """Calculate uptime in seconds"""
        if not self.start_time:
            return 0.0
        return (datetime.now() - self.start_time).total_seconds()
    
    @property
    def tx_per_second(self) -> float:
        """Calculate transactions per second"""
        if self.uptime_seconds == 0:
            return 0.0
        return self.transactions_processed / self.uptime_seconds
    
    @property
    def bundle_success_rate(self) -> float:
        """Calculate bundle inclusion rate"""
        if self.bundles_submitted == 0:
            return 0.0
        return (self.bundles_included / self.bundles_submitted) * 100


class MEVEngine:
    """
    Core MEV Engine that orchestrates all operations
    
    Responsibilities:
    - Coordinate transaction scanning and filtering
    - Route transactions to appropriate strategies
    - Manage bundle execution
    - Track performance metrics
    - Handle hot-reload of strategies
    """
    
    def __init__(self, config: Config):
        """
        Initialize MEV Engine
        
        Args:
            config: Engine configuration
        """
        self.config = config
        self.logger = logging.getLogger("MEVEngine")
        self.strategy_registry = StrategyRegistry()
        self.metrics = EngineMetrics()
        
        # Internal state
        self._running = False
        self._tx_queue: asyncio.Queue[TransactionData] = asyncio.Queue(maxsize=10000)
        self._bundle_queue: asyncio.Queue[tuple[BundleRequest, MEVOpportunity]] = asyncio.Queue(maxsize=1000)
        self._filters: List[Filter] = []
        self._hot_pairs: Set[str] = set()
        
        # Performance tracking
        self._tx_processing_times: List[float] = []
        self._bundle_submit_times: List[float] = []
        
        # Tasks
        self._tasks: List[asyncio.Task] = []
        
        self.logger.info("MEV Engine initialized")
    
    async def start(self) -> None:
        """Start the MEV engine"""
        if self._running:
            self.logger.warning("Engine already running")
            return
        
        self._running = True
        self.metrics.start_time = datetime.now()
        
        self.logger.info("Starting MEV Engine...")
        
        # Load and compile filters
        await self._load_filters()
        
        # Start core processing tasks
        self._tasks = [
            asyncio.create_task(self._process_transactions()),
            asyncio.create_task(self._process_bundles()),
            asyncio.create_task(self._update_metrics()),
            asyncio.create_task(self._monitor_performance()),
        ]
        
        # Start all strategies
        await self.strategy_registry.start_all()
        
        self.logger.info("MEV Engine started successfully")
    
    async def stop(self) -> None:
        """Stop the MEV engine"""
        if not self._running:
            return
        
        self.logger.info("Stopping MEV Engine...")
        self._running = False
        
        # Stop all strategies
        await self.strategy_registry.stop_all()
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self._tasks, return_exceptions=True)
        
        self.logger.info("MEV Engine stopped")
    
    async def process_transaction(self, tx: TransactionData) -> None:
        """
        Process incoming transaction
        
        Args:
            tx: Transaction data from mempool scanner
        """
        if not self._running:
            return
        
        try:
            # Add to processing queue
            await self._tx_queue.put(tx)
        except asyncio.QueueFull:
            self.logger.warning("Transaction queue full - dropping transaction")
    
    async def process_block(self, block_number: int, timestamp: datetime) -> None:
        """
        Process new block
        
        Args:
            block_number: New block number
            timestamp: Block timestamp
        """
        if not self._running:
            return
        
        # Notify all strategies of new block
        for strategy in self.strategy_registry.get_enabled_strategies().values():
            try:
                opportunities = await strategy.on_block(block_number, timestamp)
                for opportunity in opportunities:
                    await self._handle_opportunity(opportunity, strategy)
            except Exception as e:
                self.logger.error(f"Error in strategy block processing: {e}")
    
    async def _load_filters(self) -> None:
        """Load and compile transaction filters"""
        try:
            # Load global filters from config
            for filter_expr in self.config.global_filters:
                filter_obj = Filter(filter_expr)
                self._filters.append(filter_obj)
            
            # Load hot pairs
            self._hot_pairs = set(self.config.hot_pairs)
            
            self.logger.info(f"Loaded {len(self._filters)} filters and {len(self._hot_pairs)} hot pairs")
        except Exception as e:
            self.logger.error(f"Error loading filters: {e}")
    
    async def _process_transactions(self) -> None:
        """Main transaction processing loop"""
        while self._running:
            try:
                # Get transaction with timeout
                tx = await asyncio.wait_for(self._tx_queue.get(), timeout=1.0)
                
                start_time = time.time()
                
                # Apply global filters
                if not self._passes_filters(tx):
                    continue
                
                # Route to strategies
                await self._route_to_strategies(tx)
                
                # Track processing time
                processing_time = (time.time() - start_time) * 1000
                self._tx_processing_times.append(processing_time)
                
                # Keep only recent times for moving average
                if len(self._tx_processing_times) > 1000:
                    self._tx_processing_times = self._tx_processing_times[-1000:]
                
                self.metrics.transactions_processed += 1
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error(f"Error processing transaction: {e}")
    
    async def _process_bundles(self) -> None:
        """Bundle processing and submission loop"""
        while self._running:
            try:
                # Get bundle with timeout
                bundle_data = await asyncio.wait_for(self._bundle_queue.get(), timeout=1.0)
                bundle, opportunity = bundle_data
                
                start_time = time.time()
                
                # Submit bundle to MEV relays
                result = await self._submit_bundle(bundle, opportunity)
                
                # Track submission time
                submit_time = (time.time() - start_time) * 1000
                self._bundle_submit_times.append(submit_time)
                
                # Keep only recent times
                if len(self._bundle_submit_times) > 100:
                    self._bundle_submit_times = self._bundle_submit_times[-100:]
                
                self.metrics.bundles_submitted += 1
                
                # Handle bundle result
                await self._handle_bundle_result(result, opportunity)
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error(f"Error processing bundle: {e}")
    
    def _passes_filters(self, tx: TransactionData) -> bool:
        """
        Check if transaction passes global filters
        
        Args:
            tx: Transaction to check
            
        Returns:
            True if transaction passes all filters
        """
        try:
            # Check each filter
            for filter_obj in self._filters:
                if not filter_obj.matches(tx):
                    return False
            
            return True
        except Exception as e:
            self.logger.error(f"Error applying filters: {e}")
            return False
    
    async def _route_to_strategies(self, tx: TransactionData) -> None:
        """
        Route transaction to appropriate strategies
        
        Args:
            tx: Transaction to route
        """
        # Route to all enabled strategies
        for strategy in self.strategy_registry.get_enabled_strategies().values():
            try:
                opportunity = await strategy.on_tx(tx)
                if opportunity:
                    await self._handle_opportunity(opportunity, strategy)
            except Exception as e:
                self.logger.error(f"Error in strategy transaction processing: {e}")
    
    async def _handle_opportunity(self, opportunity: MEVOpportunity, strategy: AbstractStrategy) -> None:
        """
        Handle detected MEV opportunity
        
        Args:
            opportunity: Detected opportunity
            strategy: Strategy that found the opportunity
        """
        try:
            self.metrics.opportunities_found += 1
            
            # Build bundle for opportunity
            bundle = await strategy.build_bundle(opportunity)
            if bundle:
                # Queue bundle for submission
                await self._bundle_queue.put((bundle, opportunity))
                
                if self.config.explain_mode:
                    self.logger.info(
                        f"Opportunity found by {strategy.strategy_type.value}: "
                        f"profit={opportunity.net_profit:.4f} ETH, "
                        f"confidence={opportunity.confidence:.2f}"
                    )
        except Exception as e:
            self.logger.error(f"Error handling opportunity: {e}")
    
    async def _submit_bundle(self, bundle: BundleRequest, opportunity: MEVOpportunity) -> BundleResult:
        """
        Submit bundle to MEV relays
        
        Args:
            bundle: Bundle to submit
            opportunity: Associated opportunity
            
        Returns:
            Bundle execution result
        """
        # This would implement actual relay submission
        # For now, return a mock result
        return BundleResult(
            bundle_hash=f"0x{hash(str(bundle)):#x}",
            included=True,  # Mock success
            block_number=bundle.block_number,
            gas_used=sum(tx.gas_limit for tx in bundle.transactions),
            profit_wei=int(opportunity.net_profit * 10**18)
        )
    
    async def _handle_bundle_result(self, result: BundleResult, opportunity: MEVOpportunity) -> None:
        """
        Handle bundle execution result
        
        Args:
            result: Bundle execution result
            opportunity: Associated opportunity
        """
        try:
            if result.included:
                self.metrics.bundles_included += 1
                if result.profit_wei:
                    self.metrics.total_profit_wei += result.profit_wei
            
            if result.gas_used:
                self.metrics.total_gas_spent += result.gas_used
            
            # Notify strategy of result
            # This would require tracking which strategy submitted the bundle
            
        except Exception as e:
            self.logger.error(f"Error handling bundle result: {e}")
    
    async def _update_metrics(self) -> None:
        """Update performance metrics"""
        while self._running:
            try:
                # Update moving averages
                if self._tx_processing_times:
                    self.metrics.avg_tx_processing_time_ms = sum(self._tx_processing_times) / len(self._tx_processing_times)
                
                if self._bundle_submit_times:
                    self.metrics.avg_bundle_submit_time_ms = sum(self._bundle_submit_times) / len(self._bundle_submit_times)
                
                await asyncio.sleep(10)  # Update every 10 seconds
                
            except Exception as e:
                self.logger.error(f"Error updating metrics: {e}")
    
    async def _monitor_performance(self) -> None:
        """Monitor performance and log warnings"""
        while self._running:
            try:
                # Check transaction processing rate
                if self.metrics.tx_per_second > 0:
                    if self.metrics.avg_tx_processing_time_ms > 20:  # Target: <20ms
                        self.logger.warning(
                            f"High transaction processing time: {self.metrics.avg_tx_processing_time_ms:.2f}ms"
                        )
                    
                    if self.metrics.avg_bundle_submit_time_ms > 150:  # Target: <150ms
                        self.logger.warning(
                            f"High bundle submission time: {self.metrics.avg_bundle_submit_time_ms:.2f}ms"
                        )
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Error monitoring performance: {e}")
    
    def register_strategy(self, name: str, strategy: AbstractStrategy) -> None:
        """Register a new strategy"""
        self.strategy_registry.register_strategy(name, strategy)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive engine metrics"""
        return {
            'engine': {
                'uptime_seconds': self.metrics.uptime_seconds,
                'transactions_processed': self.metrics.transactions_processed,
                'tx_per_second': self.metrics.tx_per_second,
                'opportunities_found': self.metrics.opportunities_found,
                'bundles_submitted': self.metrics.bundles_submitted,
                'bundles_included': self.metrics.bundles_included,
                'bundle_success_rate': self.metrics.bundle_success_rate,
                'total_profit_eth': self.metrics.total_profit_wei / 10**18,
                'total_gas_spent': self.metrics.total_gas_spent,
                'avg_tx_processing_time_ms': self.metrics.avg_tx_processing_time_ms,
                'avg_bundle_submit_time_ms': self.metrics.avg_bundle_submit_time_ms,
            },
            'strategies': self.strategy_registry.get_metrics_summary(),
            'queues': {
                'tx_queue_size': self._tx_queue.qsize(),
                'bundle_queue_size': self._bundle_queue.qsize(),
            }
        }
    
    async def reload_strategy(self, name: str) -> bool:
        """Hot-reload a strategy"""
        return await self.strategy_registry.reload_strategy(name)
    
    def is_healthy(self) -> bool:
        """Check if engine is healthy"""
        if not self._running:
            return False
        
        # Check if transaction processing is too slow
        if self.metrics.avg_tx_processing_time_ms > 50:  # 50ms threshold
            return False
        
        # Check if bundle submission is too slow
        if self.metrics.avg_bundle_submit_time_ms > 400:  # 400ms threshold
            return False
        
        # Check if queues are backing up
        if self._tx_queue.qsize() > 5000:  # 50% of max queue size
            return False
        
        return True
