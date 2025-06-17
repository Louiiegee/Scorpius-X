"""
Main Execution Engine
Orchestrates gas management, nonce tracking, and bundle submission
"""

import asyncio
import logging
import time
import uuid
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from decimal import Decimal

from web3 import Web3
from web3.types import TxParams

from .gas_manager import GasManager, GasPriceOracle, GasStrategy
from .nonce_manager import NonceManager
from .bundle_submitter import BundleSubmitter, BundleSubmissionResult
from ..core.types import (
    BundleRequest, 
    BundleTransaction, 
    BundleStatus,
    MEVOpportunity,
    StrategyResult
)


class ExecutionStatus(Enum):
    """Execution status states"""
    PENDING = "pending"
    PREPARING = "preparing"  
    SUBMITTING = "submitting"
    SUBMITTED = "submitted"
    INCLUDED = "included"
    FAILED = "failed"
    EXPIRED = "expired"


@dataclass
class ExecutionResult:
    """Result of MEV execution"""
    execution_id: str
    opportunity_id: str
    status: ExecutionStatus
    block_number: int
    
    # Transaction details
    bundle_id: Optional[str] = None
    transaction_hashes: List[str] = None
    gas_used: Optional[int] = None
    gas_price: Optional[int] = None
    
    # Profitability
    expected_profit_wei: int = 0
    actual_profit_wei: Optional[int] = None
    gas_cost_wei: int = 0
    net_profit_wei: Optional[int] = None
    
    # Timing
    created_at: float = 0.0
    submitted_at: Optional[float] = None
    included_at: Optional[float] = None
    
    # Errors
    error: Optional[str] = None
    relay_results: List[BundleSubmissionResult] = None
    
    def __post_init__(self):
        if self.transaction_hashes is None:
            self.transaction_hashes = []
        if self.relay_results is None:
            self.relay_results = []
        if self.created_at == 0.0:
            self.created_at = time.time()
    
    @property
    def execution_time(self) -> Optional[float]:
        """Total execution time in seconds"""
        if self.included_at and self.created_at:
            return self.included_at - self.created_at
        return None
    
    @property
    def profit_percentage(self) -> Optional[float]:
        """Profit percentage relative to gas cost"""
        if self.net_profit_wei and self.gas_cost_wei > 0:
            return (self.net_profit_wei / self.gas_cost_wei) * 100
        return None


class ExecutionEngine:
    """
    Advanced MEV execution engine
    
    Features:
    - Integrated gas optimization
    - Nonce management
    - Multi-relay submission
    - Profit optimization
    - Performance monitoring
    """
    
    def __init__(
        self, 
        web3: Web3,
        private_key: str,
        wallet_address: str,
        explain: bool = False
    ):
        """
        Initialize execution engine
        
        Args:
            web3: Web3 instance
            private_key: Private key for transactions
            wallet_address: Wallet address
            explain: Enable explanations
        """
        self.web3 = web3
        self.private_key = private_key
        self.wallet_address = Web3.toChecksumAddress(wallet_address)
        self.explain = explain
        self.logger = logging.getLogger("ExecutionEngine")
        
        # Core components
        self.gas_oracle = GasPriceOracle(web3, explain)
        self.gas_manager = GasManager(web3, self.gas_oracle, explain)
        self.nonce_manager = NonceManager(web3, explain)
        self.bundle_submitter = BundleSubmitter(private_key, explain)
        
        # Execution tracking
        self.active_executions: Dict[str, ExecutionResult] = {}
        self.execution_history: List[ExecutionResult] = []
        
        # Configuration
        self.max_concurrent_executions = 10
        self.execution_timeout = 300  # 5 minutes
        self.profit_threshold_wei = 1 * 10**15  # 0.001 ETH minimum profit
        
        # Performance metrics
        self.metrics = {
            'total_executions': 0,
            'successful_executions': 0,
            'failed_executions': 0,
            'total_profit_wei': 0,
            'total_gas_spent_wei': 0,
            'avg_execution_time': 0.0,
            'best_profit_wei': 0,
            'worst_loss_wei': 0
        }
        
        # Background tasks
        self._monitor_task: Optional[asyncio.Task] = None
        self._running = False
        
        self.logger.info("Execution engine initialized")
    
    async def start(self) -> None:
        """Start execution engine"""
        if self._running:
            return
        
        self._running = True
        
        # Start components
        await self.nonce_manager.start()
        await self.bundle_submitter.start()
        
        # Start monitoring
        self._monitor_task = asyncio.create_task(self._monitor_executions())
        
        self.logger.info("Execution engine started")
    
    async def stop(self) -> None:
        """Stop execution engine"""
        self._running = False
        
        # Stop monitoring
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        
        # Stop components
        await self.nonce_manager.stop()
        await self.bundle_submitter.stop()
        
        self.logger.info("Execution engine stopped")
    
    async def execute_opportunity(
        self, 
        opportunity: MEVOpportunity,
        strategy_result: StrategyResult
    ) -> ExecutionResult:
        """
        Execute MEV opportunity
        
        Args:
            opportunity: MEV opportunity to execute
            strategy_result: Strategy execution result
            
        Returns:
            Execution result
        """
        execution_id = str(uuid.uuid4())
        
        try:
            if self.explain:
                self.logger.info(
                    f"Executing opportunity {opportunity.id} "
                    f"(execution: {execution_id[:8]}...)"
                )
            
            # Check concurrent execution limit
            if len(self.active_executions) >= self.max_concurrent_executions:
                return ExecutionResult(
                    execution_id=execution_id,
                    opportunity_id=opportunity.id,
                    status=ExecutionStatus.FAILED,
                    block_number=opportunity.block_number,
                    error="Too many concurrent executions"
                )
            
            # Create execution record
            execution = ExecutionResult(
                execution_id=execution_id,
                opportunity_id=opportunity.id,
                status=ExecutionStatus.PREPARING,
                block_number=opportunity.block_number,
                expected_profit_wei=int(opportunity.profit_estimate * Decimal(10**18))
            )
            
            self.active_executions[execution_id] = execution
            
            # Check profitability threshold
            if execution.expected_profit_wei < self.profit_threshold_wei:
                execution.status = ExecutionStatus.FAILED
                execution.error = f"Profit below threshold: {execution.expected_profit_wei/10**18:.6f} ETH"
                return execution
            
            # Prepare bundle for execution
            bundle = strategy_result.bundle
            if not bundle:
                execution.status = ExecutionStatus.FAILED
                execution.error = "No bundle provided by strategy"
                return execution
            
            # Optimize gas for all transactions
            execution.status = ExecutionStatus.PREPARING
            optimized_bundle = await self._optimize_bundle_gas(bundle, execution.expected_profit_wei)
            
            if not optimized_bundle:
                execution.status = ExecutionStatus.FAILED
                execution.error = "Bundle gas optimization failed"
                return execution
            
            # Reserve nonces for transactions
            nonce_reservations = await self._reserve_bundle_nonces(optimized_bundle, execution_id)
            
            if not nonce_reservations:
                execution.status = ExecutionStatus.FAILED
                execution.error = "Failed to reserve nonces"
                return execution
            
            # Submit bundle to relays
            execution.status = ExecutionStatus.SUBMITTING
            execution.submitted_at = time.time()
            
            bundle_id = f"bundle_{execution_id}"
            submission_results = await self.bundle_submitter.submit_bundle(
                optimized_bundle, 
                bundle_id
            )
            
            if not submission_results:
                execution.status = ExecutionStatus.FAILED
                execution.error = "Bundle submission failed"
                await self._cleanup_nonces(nonce_reservations)
                return execution
            
            # Update execution with submission results
            execution.bundle_id = bundle_id
            execution.relay_results = submission_results
            execution.status = ExecutionStatus.SUBMITTED
            
            # Calculate gas costs
            execution.gas_cost_wei = sum(
                tx.gas_limit * tx.gas_price for tx in optimized_bundle.transactions
            )
            
            if self.explain:
                successful_submissions = sum(1 for r in submission_results if r.status == BundleStatus.SUBMITTED)
                self.logger.info(
                    f"Execution {execution_id[:8]}...: {successful_submissions} successful submissions, "
                    f"expected profit: {execution.expected_profit_wei/10**18:.6f} ETH"
                )
            
            self.metrics['total_executions'] += 1
            
            return execution
            
        except Exception as e:
            self.logger.error(f"Error executing opportunity: {e}")
            
            execution = ExecutionResult(
                execution_id=execution_id,
                opportunity_id=opportunity.id,
                status=ExecutionStatus.FAILED,
                block_number=opportunity.block_number,
                error=str(e)
            )
            
            self.active_executions[execution_id] = execution
            return execution
    
    async def _optimize_bundle_gas(
        self, 
        bundle: BundleRequest, 
        expected_profit_wei: int
    ) -> Optional[BundleRequest]:
        """
        Optimize gas for all transactions in bundle
        
        Args:
            bundle: Original bundle
            expected_profit_wei: Expected profit
            
        Returns:
            Optimized bundle
        """
        try:
            optimized_transactions = []
            
            for tx in bundle.transactions:
                # Build transaction parameters for gas estimation
                tx_params: TxParams = {
                    'to': tx.to,
                    'value': tx.value,
                    'data': tx.data,
                    'from': self.wallet_address
                }
                
                # Get optimal gas estimate
                gas_estimate = await self.gas_manager.optimize_for_mev_profit(
                    tx_params,
                    expected_profit_wei
                )
                
                # Create optimized transaction
                optimized_tx = BundleTransaction(
                    to=tx.to,
                    value=tx.value,
                    data=tx.data,
                    gas_limit=gas_estimate.gas_limit,
                    gas_price=gas_estimate.max_fee_per_gas
                )
                
                optimized_transactions.append(optimized_tx)
            
            return BundleRequest(
                transactions=optimized_transactions,
                block_number=bundle.block_number,
                min_timestamp=bundle.min_timestamp,
                max_timestamp=bundle.max_timestamp
            )
            
        except Exception as e:
            self.logger.error(f"Error optimizing bundle gas: {e}")
            return None
    
    async def _reserve_bundle_nonces(
        self, 
        bundle: BundleRequest, 
        execution_id: str
    ) -> List[Any]:
        """
        Reserve nonces for all bundle transactions
        
        Args:
            bundle: Bundle to reserve nonces for
            execution_id: Execution identifier
            
        Returns:
            List of nonce reservations
        """
        try:
            reservations = []
            
            for i, tx in enumerate(bundle.transactions):
                nonce_reservation = await self.nonce_manager.reserve_nonce(
                    self.wallet_address,
                    f"{execution_id}_tx_{i}",
                    tx.gas_price
                )
                
                if nonce_reservation:
                    reservations.append(nonce_reservation)
                else:
                    # Failed to reserve nonce, cleanup and return
                    await self._cleanup_nonces(reservations)
                    return []
            
            return reservations
            
        except Exception as e:
            self.logger.error(f"Error reserving bundle nonces: {e}")
            return []
    
    async def _cleanup_nonces(self, reservations: List[Any]) -> None:
        """Clean up nonce reservations"""
        for reservation in reservations:
            if hasattr(reservation, 'transaction_id'):
                await self.nonce_manager.confirm_nonce(reservation.transaction_id, success=False)
    
    async def _monitor_executions(self) -> None:
        """Background task to monitor execution status"""
        while self._running:
            try:
                current_time = time.time()
                completed_executions = []
                
                for execution_id, execution in self.active_executions.items():
                    # Check for timeouts
                    if (current_time - execution.created_at > self.execution_timeout and
                        execution.status not in [ExecutionStatus.INCLUDED, ExecutionStatus.FAILED]):
                        execution.status = ExecutionStatus.EXPIRED
                        execution.error = "Execution timeout"
                        completed_executions.append(execution_id)
                        continue
                    
                    # Check bundle inclusion status
                    if execution.bundle_id and execution.status == ExecutionStatus.SUBMITTED:
                        updated_results = await self.bundle_submitter.check_bundle_inclusion(
                            execution.bundle_id
                        )
                        
                        execution.relay_results = updated_results
                        
                        # Check if any relay included the bundle
                        included_results = [r for r in updated_results if r.included]
                        if included_results:
                            execution.status = ExecutionStatus.INCLUDED
                            execution.included_at = current_time
                            
                            # Calculate actual profit from first included result
                            best_result = included_results[0]
                            if best_result.profit_wei:
                                execution.actual_profit_wei = best_result.profit_wei
                                execution.net_profit_wei = best_result.profit_wei - execution.gas_cost_wei
                            
                            if best_result.gas_used:
                                execution.gas_used = best_result.gas_used
                            
                            completed_executions.append(execution_id)
                            
                            # Update metrics
                            self.metrics['successful_executions'] += 1
                            if execution.net_profit_wei:
                                self.metrics['total_profit_wei'] += execution.net_profit_wei
                                self.metrics['best_profit_wei'] = max(
                                    self.metrics['best_profit_wei'], 
                                    execution.net_profit_wei
                                )
                            
                            self.metrics['total_gas_spent_wei'] += execution.gas_cost_wei
                            
                            if self.explain:
                                self.logger.info(
                                    f"Execution {execution_id[:8]}... INCLUDED! "
                                    f"Profit: {execution.net_profit_wei/10**18:.6f} ETH"
                                )
                
                # Move completed executions to history
                for execution_id in completed_executions:
                    execution = self.active_executions.pop(execution_id)
                    self.execution_history.append(execution)
                    
                    if execution.status == ExecutionStatus.FAILED:
                        self.metrics['failed_executions'] += 1
                        
                        if execution.net_profit_wei and execution.net_profit_wei < 0:
                            self.metrics['worst_loss_wei'] = min(
                                self.metrics['worst_loss_wei'],
                                execution.net_profit_wei
                            )
                
                # Update average execution time
                completed_executions_with_time = [
                    ex for ex in self.execution_history 
                    if ex.execution_time is not None
                ]
                
                if completed_executions_with_time:
                    total_time = sum(ex.execution_time for ex in completed_executions_with_time)
                    self.metrics['avg_execution_time'] = total_time / len(completed_executions_with_time)
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                self.logger.error(f"Error in execution monitoring: {e}")
                await asyncio.sleep(5)
    
    def get_execution_status(self, execution_id: str) -> Optional[ExecutionResult]:
        """
        Get execution status
        
        Args:
            execution_id: Execution identifier
            
        Returns:
            Execution result if found
        """
        # Check active executions first
        if execution_id in self.active_executions:
            return self.active_executions[execution_id]
        
        # Check history
        for execution in self.execution_history:
            if execution.execution_id == execution_id:
                return execution
        
        return None
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get execution engine performance metrics"""
        total_executions = self.metrics['total_executions']
        success_rate = (self.metrics['successful_executions'] / max(total_executions, 1)) * 100
        
        return {
            **self.metrics,
            'success_rate_percent': success_rate,
            'total_profit_eth': self.metrics['total_profit_wei'] / 10**18,
            'total_gas_spent_eth': self.metrics['total_gas_spent_wei'] / 10**18,
            'best_profit_eth': self.metrics['best_profit_wei'] / 10**18,
            'worst_loss_eth': self.metrics['worst_loss_wei'] / 10**18,
            'active_executions': len(self.active_executions),
            'execution_history_count': len(self.execution_history),
            'nonce_manager_metrics': self.nonce_manager.get_metrics(),
            'bundle_submitter_stats': self.bundle_submitter.get_submission_stats(),
            'gas_oracle_stats': self.gas_oracle.get_historical_stats()
        }
    
    async def emergency_stop(self) -> None:
        """Emergency stop all executions"""
        self.logger.warning("Emergency stop initiated")
        
        # Mark all active executions as failed
        for execution in self.active_executions.values():
            execution.status = ExecutionStatus.FAILED
            execution.error = "Emergency stop"
        
        # Stop the engine
        await self.stop()
        
        self.logger.warning("Emergency stop completed")
