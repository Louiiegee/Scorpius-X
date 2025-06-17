"""
Abstract Strategy Base Class with Hot-Reload Support
Foundation for all MEV strategies in Scorpius Enterprise
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, AsyncGenerator
import asyncio
import logging
from datetime import datetime
from dataclasses import dataclass, field

from .types import (
    TransactionData, 
    MEVOpportunity, 
    BundleRequest, 
    StrategyResult, 
    StrategyConfig,
    StrategyType
)


@dataclass
class StrategyMetrics:
    """Strategy performance metrics"""
    total_opportunities: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    total_profit_wei: int = 0
    total_gas_spent: int = 0
    avg_confidence: float = 0.0
    last_execution: Optional[datetime] = None
    errors: List[str] = field(default_factory=list)
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage"""
        total = self.successful_executions + self.failed_executions
        return (self.successful_executions / total * 100) if total > 0 else 0.0
    
    @property
    def total_profit_eth(self) -> float:
        """Total profit in ETH"""
        return self.total_profit_wei / 10**18


@dataclass 
class BundleResult:
    """Result from bundle execution"""
    bundle_hash: str
    included: bool
    block_number: Optional[int] = None
    gas_used: Optional[int] = None
    profit_wei: Optional[int] = None
    error: Optional[str] = None


class AbstractStrategy(ABC):
    """
    Abstract base class for all MEV strategies
    
    Provides standardized hooks for strategy lifecycle:
    - on_tx: Called for each relevant transaction
    - on_block: Called for each new block
    - build_bundle: Build execution bundle
    - on_bundle_result: Handle bundle execution result
    """
    
    def __init__(
        self, 
        strategy_type: StrategyType,
        config: StrategyConfig,
        explain: bool = False
    ):
        """
        Initialize strategy
        
        Args:
            strategy_type: Type of MEV strategy
            config: Strategy configuration
            explain: Enable teaching mode with detailed logging
        """
        self.strategy_type = strategy_type
        self.config = config
        self.explain = explain
        self.logger = logging.getLogger(f"Strategy.{strategy_type.value}")
        self.metrics = StrategyMetrics()
        self._running = False
        self._opportunities: asyncio.Queue[MEVOpportunity] = asyncio.Queue(maxsize=1000)
        
        if explain:
            # Set up detailed logging for teaching mode
            handler = logging.StreamHandler()
            handler.setFormatter(
                logging.Formatter(
                    f'[{strategy_type.value.upper()}] %(asctime)s - %(message)s'
                )
            )
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
    
    @abstractmethod
    async def on_tx(self, tx: TransactionData) -> Optional[MEVOpportunity]:
        """
        Hook called for each relevant transaction
        
        Args:
            tx: Transaction data from mempool
            
        Returns:
            MEV opportunity if found, None otherwise
        """
        pass
    
    @abstractmethod  
    async def on_block(self, block_number: int, timestamp: datetime) -> List[MEVOpportunity]:
        """
        Hook called for each new block
        
        Args:
            block_number: New block number
            timestamp: Block timestamp
            
        Returns:
            List of block-based opportunities (e.g., liquidations)
        """
        pass
    
    @abstractmethod
    async def build_bundle(self, opportunity: MEVOpportunity) -> Optional[BundleRequest]:
        """
        Build execution bundle for opportunity
        
        Args:
            opportunity: MEV opportunity to execute
            
        Returns:
            Bundle request or None if cannot build
        """
        pass
    
    @abstractmethod
    async def on_bundle_result(self, result: BundleResult) -> None:
        """
        Hook called when bundle execution completes
        
        Args:
            result: Bundle execution result  
        """
        pass
    
    async def start(self) -> None:
        """Start strategy execution loop"""
        if self._running:
            return
            
        self._running = True
        self.logger.info(f"Starting {self.strategy_type.value} strategy")
        
        if self.explain:
            self.logger.info(f"Teaching mode enabled - detailed explanations will be logged")
        
        # Start opportunity processing loop
        asyncio.create_task(self._process_opportunities())
    
    async def stop(self) -> None:
        """Stop strategy execution"""
        self._running = False
        self.logger.info(f"Stopping {self.strategy_type.value} strategy")
    
    async def _process_opportunities(self) -> None:
        """Internal loop to process queued opportunities"""
        while self._running:
            try:
                # Wait for opportunity with timeout
                opportunity = await asyncio.wait_for(
                    self._opportunities.get(), 
                    timeout=1.0
                )
                
                # Build and submit bundle
                bundle = await self.build_bundle(opportunity)
                if bundle:
                    # This would be handled by the execution engine
                    await self._submit_bundle(bundle, opportunity)
                    
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error(f"Error processing opportunity: {e}")
                self.metrics.errors.append(str(e))
    
    async def _submit_bundle(self, bundle: BundleRequest, opportunity: MEVOpportunity) -> None:
        """Submit bundle for execution (placeholder - handled by execution engine)"""
        if self.explain:
            self.logger.info(
                f"Submitting bundle for {opportunity.id}: "
                f"profit={opportunity.net_profit:.4f} ETH, "
                f"confidence={opportunity.confidence:.2f}"
            )
    
    async def queue_opportunity(self, opportunity: MEVOpportunity) -> bool:
        """
        Queue opportunity for processing
        
        Args:
            opportunity: MEV opportunity to queue
            
        Returns:
            True if queued successfully, False if queue full
        """
        try:
            self._opportunities.put_nowait(opportunity)
            self.metrics.total_opportunities += 1
            return True
        except asyncio.QueueFull:
            self.logger.warning("Opportunity queue full - dropping opportunity")
            return False
    
    def is_enabled(self) -> bool:
        """Check if strategy is enabled"""
        return self.config.enabled
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get strategy performance metrics"""
        return {
            'strategy_type': self.strategy_type.value,
            'total_opportunities': self.metrics.total_opportunities,
            'successful_executions': self.metrics.successful_executions,
            'failed_executions': self.metrics.failed_executions,
            'success_rate': self.metrics.success_rate,
            'total_profit_eth': self.metrics.total_profit_eth,
            'total_gas_spent': self.metrics.total_gas_spent,
            'avg_confidence': self.metrics.avg_confidence,
            'last_execution': self.metrics.last_execution.isoformat() if self.metrics.last_execution else None,
            'recent_errors': self.metrics.errors[-10:],  # Last 10 errors
        }
    
    def update_config(self, new_config: StrategyConfig) -> None:
        """Update strategy configuration (hot-reload support)"""
        old_enabled = self.config.enabled
        self.config = new_config
        
        if self.explain:
            self.logger.info(
                f"Configuration updated: enabled={new_config.enabled}, "
                f"min_profit={new_config.min_profit_wei/10**18:.4f} ETH"
            )
        
        # Handle enable/disable state changes
        if old_enabled != new_config.enabled:
            if new_config.enabled:
                asyncio.create_task(self.start())
            else:
                asyncio.create_task(self.stop())
    
    def _log_explanation(self, message: str) -> None:
        """Log explanation message if teaching mode is enabled"""
        if self.explain:
            self.logger.info(f"[EXPLAIN] {message}")


class StrategyRegistry:
    """Registry for managing strategy instances with hot-reload support"""
    
    def __init__(self):
        self._strategies: Dict[str, AbstractStrategy] = {}
        self._strategy_files: Dict[str, str] = {}  # strategy_name -> file_path
        self.logger = logging.getLogger("StrategyRegistry")
    
    def register_strategy(self, name: str, strategy: AbstractStrategy, file_path: Optional[str] = None) -> None:
        """Register a strategy instance"""
        self._strategies[name] = strategy
        if file_path:
            self._strategy_files[name] = file_path
        self.logger.info(f"Registered strategy: {name}")
    
    def unregister_strategy(self, name: str) -> None:
        """Unregister a strategy"""
        if name in self._strategies:
            strategy = self._strategies[name]
            asyncio.create_task(strategy.stop())
            del self._strategies[name]
            if name in self._strategy_files:
                del self._strategy_files[name]
            self.logger.info(f"Unregistered strategy: {name}")
    
    def get_strategy(self, name: str) -> Optional[AbstractStrategy]:
        """Get strategy by name"""
        return self._strategies.get(name)
    
    def get_all_strategies(self) -> Dict[str, AbstractStrategy]:
        """Get all registered strategies"""
        return self._strategies.copy()
    
    def get_enabled_strategies(self) -> Dict[str, AbstractStrategy]:
        """Get only enabled strategies"""
        return {
            name: strategy 
            for name, strategy in self._strategies.items()
            if strategy.is_enabled()
        }
    
    async def reload_strategy(self, name: str) -> bool:
        """Reload strategy from file (hot-reload)"""
        if name not in self._strategy_files:
            self.logger.warning(f"Cannot reload {name} - no file path registered")
            return False
        
        try:
            # This would implement dynamic module reloading
            # For now, just log the action
            self.logger.info(f"Reloading strategy: {name}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to reload strategy {name}: {e}")
            return False
    
    async def start_all(self) -> None:
        """Start all enabled strategies"""
        for name, strategy in self.get_enabled_strategies().items():
            try:
                await strategy.start()
                self.logger.info(f"Started strategy: {name}")
            except Exception as e:
                self.logger.error(f"Failed to start strategy {name}: {e}")
    
    async def stop_all(self) -> None:
        """Stop all strategies"""
        for name, strategy in self._strategies.items():
            try:
                await strategy.stop()
                self.logger.info(f"Stopped strategy: {name}")
            except Exception as e:
                self.logger.error(f"Failed to stop strategy {name}: {e}")
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get aggregated metrics for all strategies"""
        total_opportunities = 0
        total_profit_eth = 0.0
        total_gas_spent = 0
        strategy_metrics = {}
        
        for name, strategy in self._strategies.items():
            metrics = strategy.get_metrics()
            strategy_metrics[name] = metrics
            total_opportunities += metrics['total_opportunities']
            total_profit_eth += metrics['total_profit_eth']
            total_gas_spent += metrics['total_gas_spent']
        
        return {
            'total_opportunities': total_opportunities,
            'total_profit_eth': total_profit_eth,
            'total_gas_spent': total_gas_spent,
            'strategies': strategy_metrics,
        }
