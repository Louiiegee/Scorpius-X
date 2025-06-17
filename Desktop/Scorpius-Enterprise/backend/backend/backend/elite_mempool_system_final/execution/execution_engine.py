"""
Execution Engine for MEV opportunities.
This module handles the execution of detected MEV opportunities through
both private relays (Flashbots) and public mempool submissions.
"""
import asyncio
import logging
import time
import os
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum

from web3 import Web3, AsyncWeb3
from web3.types import TxParams, TxReceipt, TxData
from web3.exceptions import TransactionNotFound, ContractLogicError
from eth_account import Account
from eth_account.signers.local import LocalAccount

from ..models.mev_opportunity import MEVOpportunity, MEVStrategyType, OpportunityStatus
from ..execution.private_relays import FlashbotsRelayClient
from ..core.utils import async_retry, wei_to_ether, ether_to_wei
from ..core.session_manager import SessionManager

logger = logging.getLogger(__name__)

class ExecutionMethod(Enum):
    """Execution method for transactions."""
    FLASHBOTS = "flashbots"
    PUBLIC_MEMPOOL = "public"
    PRIVATE_RELAY = "private_relay"

@dataclass
class ExecutionResult:
    """Result of a transaction execution attempt."""
    
    success: bool
    tx_hash: Optional[str] = None
    bundle_hash: Optional[str] = None
    block_number: Optional[int] = None
    gas_used: Optional[int] = None
    gas_price: Optional[int] = None
    effective_gas_price: Optional[int] = None
    profit_realized: Optional[float] = None
    error_message: Optional[str] = None
    execution_time: float = 0.0
    method_used: Optional[ExecutionMethod] = None
    
    def __post_init__(self):
        if self.execution_time == 0.0:
            self.execution_time = time.time()

@dataclass
class TransactionParams:
    """Parameters for building a transaction."""
    
    to: str
    value: int = 0
    gas_limit: int = 21000
    gas_price: Optional[int] = None
    max_fee_per_gas: Optional[int] = None
    max_priority_fee_per_gas: Optional[int] = None
    nonce: Optional[int] = None
    data: str = "0x"
    chain_id: Optional[int] = None

class ExecutionEngine:
    """
    Advanced execution engine for MEV opportunities with multiple execution paths.
    """
    
    def __init__(
        self,
        web3: AsyncWeb3,
        network_id: int,
        config: Dict[str, Any],
        session_manager: Optional[SessionManager] = None
    ):
        """
        Initialize the execution engine.
        
        Args:
            web3: AsyncWeb3 instance for blockchain interactions
            network_id: Network ID for the blockchain
            config: Configuration dictionary
            session_manager: HTTP session manager for external requests
        """
        self.web3 = web3
        self.network_id = network_id
        self.config = config
        self.session_manager = session_manager
        
        # Load wallet configuration from environment variables
        self.bot_wallet_address = os.getenv("BOT_WALLET_ADDRESS")
        self.bot_wallet_private_key = os.getenv("BOT_WALLET_PRIVATE_KEY")
        
        if not self.bot_wallet_address or not self.bot_wallet_private_key:
            logger.error("BOT_WALLET_ADDRESS and BOT_WALLET_PRIVATE_KEY must be set in environment variables")
            raise ValueError("Bot wallet credentials not configured")
        
        # Create local account for signing
        try:
            self.account: LocalAccount = Account.from_key(self.bot_wallet_private_key)
            if self.account.address.lower() != self.bot_wallet_address.lower():
                raise ValueError("Private key does not match wallet address")
            logger.info(f"Initialized execution engine with wallet: {self.bot_wallet_address}")
        except Exception as e:
            logger.error(f"Failed to initialize wallet: {e}")
            raise
        
        # Execution configuration
        self.default_submission_method = ExecutionMethod(
            config.get("default_submission_method", "flashbots")
        )
        self.gas_buffer_multiplier = config.get("default_gas_buffer_multiplier", 1.25)
        self.max_retries = config.get("flashbots_max_retries", 3)
        self.retry_delay = config.get("flashbots_retry_delay_seconds", 2)
        
        # Initialize Flashbots client
        flashbots_rpc_url = config.get("flashbots_rpc_url", "https://rpc.flashbots.net")
        self.flashbots_client = FlashbotsRelayClient(
            flashbots_rpc_url=flashbots_rpc_url,
            session_manager=session_manager
        )
        
        # Track execution state
        self.pending_executions: Dict[str, MEVOpportunity] = {}
        self.execution_history: List[ExecutionResult] = []
        self.wallet_nonce: Optional[int] = None
        self.wallet_balance: Optional[int] = None
        
        # Statistics
        self.stats = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "flashbots_submissions": 0,
            "public_submissions": 0,
            "total_profit_eth": 0.0,
            "total_gas_spent_eth": 0.0,
            "last_execution_time": 0.0,
            "wallet_balance_eth": 0.0
        }

    async def execute_opportunity(
        self,
        opportunity: MEVOpportunity,
        method: Optional[ExecutionMethod] = None
    ) -> ExecutionResult:
        """
        Execute a MEV opportunity.
        
        Args:
            opportunity: The MEV opportunity to execute
            method: Execution method (defaults to configured method)
            
        Returns:
            ExecutionResult containing execution details
        """
        start_time = time.time()
        execution_method = method or self.default_submission_method
        
        try:
            logger.info(f"Executing opportunity {opportunity.opportunity_id} via {execution_method.value}")
            
            # Update opportunity status
            opportunity.status = OpportunityStatus.EXECUTING
            self.pending_executions[opportunity.opportunity_id] = opportunity
            
            # Refresh wallet state
            await self._refresh_wallet_state()
            
            # Build transaction(s) for the opportunity
            transactions = await self._build_transactions_for_opportunity(opportunity)
            
            if not transactions:
                raise ValueError("No transactions could be built for opportunity")
            
            # Execute based on method
            if execution_method == ExecutionMethod.FLASHBOTS:
                result = await self._execute_via_flashbots(opportunity, transactions)
            elif execution_method == ExecutionMethod.PUBLIC_MEMPOOL:
                result = await self._execute_via_public_mempool(opportunity, transactions)
            else:
                raise ValueError(f"Unsupported execution method: {execution_method}")
            
            # Update statistics
            self.stats["total_executions"] += 1
            if result.success:
                self.stats["successful_executions"] += 1
                if result.profit_realized:
                    self.stats["total_profit_eth"] += result.profit_realized
                opportunity.status = OpportunityStatus.EXECUTED
            else:
                self.stats["failed_executions"] += 1
                opportunity.status = OpportunityStatus.FAILED
            
            result.execution_time = time.time() - start_time
            result.method_used = execution_method
            self.stats["last_execution_time"] = time.time()
            
            # Store result
            self.execution_history.append(result)
            
            # Clean up
            if opportunity.opportunity_id in self.pending_executions:
                del self.pending_executions[opportunity.opportunity_id]
            
            logger.info(f"Execution completed for {opportunity.opportunity_id}: "
                       f"success={result.success}, profit={result.profit_realized}")
            
            return result
            
        except Exception as e:
            logger.error(f"Execution failed for {opportunity.opportunity_id}: {e}", exc_info=True)
            opportunity.status = OpportunityStatus.FAILED
            
            result = ExecutionResult(
                success=False,
                error_message=str(e),
                execution_time=time.time() - start_time,
                method_used=execution_method
            )
            
            self.stats["total_executions"] += 1
            self.stats["failed_executions"] += 1
            self.execution_history.append(result)
            
            if opportunity.opportunity_id in self.pending_executions:
                del self.pending_executions[opportunity.opportunity_id]
            
            return result

    async def _build_transactions_for_opportunity(
        self,
        opportunity: MEVOpportunity
    ) -> List[TransactionParams]:
        """
        Build transaction parameters for a MEV opportunity.
        
        Args:
            opportunity: The MEV opportunity
            
        Returns:
            List of transaction parameters
        """
        transactions = []
        
        try:
            if opportunity.strategy_type == MEVStrategyType.SANDWICH:
                transactions = await self._build_sandwich_transactions(opportunity)
            elif opportunity.strategy_type == MEVStrategyType.ARBITRAGE:
                transactions = await self._build_arbitrage_transactions(opportunity)
            elif opportunity.strategy_type == MEVStrategyType.LIQUIDATION:
                transactions = await self._build_liquidation_transactions(opportunity)
            else:
                logger.warning(f"Unknown strategy type: {opportunity.strategy_type}")
                
        except Exception as e:
            logger.error(f"Error building transactions for {opportunity.opportunity_id}: {e}")
            
        return transactions

    async def _build_sandwich_transactions(
        self,
        opportunity: MEVOpportunity
    ) -> List[TransactionParams]:
        """Build transactions for sandwich attack."""
        transactions = []
        
        try:
            params = opportunity.execution_params
            victim_tx_hash = params.get("victim_tx_hash")
            front_run_amount = params.get("front_run_amount", 0)
            token_in = params.get("token_in")
            token_out = params.get("token_out")
            dex_router = params.get("dex_router")
            
            if not all([victim_tx_hash, front_run_amount, dex_router]):
                raise ValueError("Missing required parameters for sandwich attack")
            
            # Get current gas price and add buffer for front-running
            gas_price = await self.web3.eth.gas_price
            front_run_gas_price = int(gas_price * 1.1)  # 10% higher for front-running
            back_run_gas_price = int(gas_price * 0.9)   # 10% lower for back-running
            
            # Front-run transaction (buy)
            front_run_tx = TransactionParams(
                to=dex_router,
                value=front_run_amount if token_in == "ETH" else 0,
                gas_limit=200000,
                gas_price=front_run_gas_price,
                data=self._encode_swap_data("buy", token_in, token_out, front_run_amount),
                chain_id=self.network_id
            )
            transactions.append(front_run_tx)
            
            # Back-run transaction (sell) - will be included in the same bundle
            back_run_tx = TransactionParams(
                to=dex_router,
                value=0,  # Selling tokens, not ETH
                gas_limit=200000,
                gas_price=back_run_gas_price,
                data=self._encode_swap_data("sell", token_out, token_in, front_run_amount),
                chain_id=self.network_id
            )
            transactions.append(back_run_tx)
            
            logger.info(f"Built {len(transactions)} transactions for sandwich attack")
            
        except Exception as e:
            logger.error(f"Error building sandwich transactions: {e}")
            
        return transactions

    async def _build_arbitrage_transactions(
        self,
        opportunity: MEVOpportunity
    ) -> List[TransactionParams]:
        """Build transactions for arbitrage opportunity."""
        transactions = []
        
        try:
            params = opportunity.execution_params
            token_pair = params.get("token_pair")
            dex_a = params.get("dex_a")
            dex_b = params.get("dex_b")
            amount = params.get("amount", 0)
            
            if not all([token_pair, dex_a, dex_b, amount]):
                raise ValueError("Missing required parameters for arbitrage")
            
            gas_price = await self.web3.eth.gas_price
            
            # For demonstration, create a simple arbitrage transaction
            # In practice, this might involve flash loans and multiple swaps
            arb_tx = TransactionParams(
                to="0x" + "0" * 40,  # Placeholder address
                value=amount,
                gas_limit=300000,
                gas_price=gas_price,
                data="0x",  # Placeholder data
                chain_id=self.network_id
            )
            transactions.append(arb_tx)
            
            logger.info(f"Built {len(transactions)} transactions for arbitrage")
            
        except Exception as e:
            logger.error(f"Error building arbitrage transactions: {e}")
            
        return transactions

    async def _build_liquidation_transactions(
        self,
        opportunity: MEVOpportunity
    ) -> List[TransactionParams]:
        """Build transactions for liquidation opportunity."""
        transactions = []
        
        try:
            params = opportunity.execution_params
            protocol = params.get("protocol")
            borrower = params.get("borrower")
            collateral_token = params.get("collateral_token")
            debt_token = params.get("debt_token")
            
            if not all([protocol, borrower, collateral_token, debt_token]):
                raise ValueError("Missing required parameters for liquidation")
            
            gas_price = await self.web3.eth.gas_price
            
            # Build liquidation call
            liq_tx = TransactionParams(
                to="0x" + "0" * 40,  # Placeholder - would be protocol address
                value=0,
                gas_limit=400000,
                gas_price=gas_price,
                data="0x",  # Placeholder - would be encoded liquidation call
                chain_id=self.network_id
            )
            transactions.append(liq_tx)
            
            logger.info(f"Built {len(transactions)} transactions for liquidation")
            
        except Exception as e:
            logger.error(f"Error building liquidation transactions: {e}")
            
        return transactions

    def _encode_swap_data(
        self,
        direction: str,
        token_in: str,
        token_out: str,
        amount: int
    ) -> str:
        """
        Encode swap data for DEX interaction.
        This is a placeholder - in practice you'd use proper ABI encoding.
        """
        # Placeholder encoding - replace with actual ABI encoding
        return "0x7ff36ab5"  # swapExactETHForTokens method signature

    async def _execute_via_flashbots(
        self,
        opportunity: MEVOpportunity,
        transactions: List[TransactionParams]
    ) -> ExecutionResult:
        """Execute opportunity via Flashbots relay."""
        try:
            self.stats["flashbots_submissions"] += 1
            
            # Sign all transactions
            signed_txs = []
            current_nonce = await self.web3.eth.get_transaction_count(self.account.address, "pending")
            
            for i, tx_params in enumerate(transactions):
                tx_dict = {
                    "to": tx_params.to,
                    "value": tx_params.value,
                    "gas": tx_params.gas_limit,
                    "gasPrice": tx_params.gas_price,
                    "nonce": current_nonce + i,
                    "data": tx_params.data,
                    "chainId": tx_params.chain_id or self.network_id
                }
                
                signed_tx = self.account.sign_transaction(tx_dict)
                signed_txs.append(signed_tx.rawTransaction.hex())
            
            # Submit bundle to Flashbots
            current_block = await self.web3.eth.block_number
            target_block = current_block + 1
            
            bundle_result = await self.flashbots_client.submit_bundle(
                transactions=signed_txs,
                target_block=target_block,
                signer_address=self.account.address
            )
            
            if bundle_result.get("success"):
                return ExecutionResult(
                    success=True,
                    bundle_hash=bundle_result.get("bundle_hash"),
                    block_number=target_block
                )
            else:
                return ExecutionResult(
                    success=False,
                    error_message=bundle_result.get("error", "Unknown Flashbots error")
                )
                
        except Exception as e:
            logger.error(f"Flashbots execution failed: {e}")
            return ExecutionResult(
                success=False,
                error_message=str(e)
            )

    async def _execute_via_public_mempool(
        self,
        opportunity: MEVOpportunity,
        transactions: List[TransactionParams]
    ) -> ExecutionResult:
        """Execute opportunity via public mempool."""
        try:
            self.stats["public_submissions"] += 1
            
            # For public mempool, we typically send one transaction at a time
            if len(transactions) > 1:
                logger.warning("Public mempool execution with multiple transactions - using first transaction only")
            
            tx_params = transactions[0]
            current_nonce = await self.web3.eth.get_transaction_count(self.account.address, "pending")
            
            tx_dict = {
                "to": tx_params.to,
                "value": tx_params.value,
                "gas": tx_params.gas_limit,
                "gasPrice": tx_params.gas_price,
                "nonce": current_nonce,
                "data": tx_params.data,
                "chainId": tx_params.chain_id or self.network_id
            }
            
            signed_tx = self.account.sign_transaction(tx_dict)
            tx_hash = await self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            logger.info(f"Transaction submitted to public mempool: {tx_hash.hex()}")
            
            return ExecutionResult(
                success=True,
                tx_hash=tx_hash.hex()
            )
            
        except Exception as e:
            logger.error(f"Public mempool execution failed: {e}")
            return ExecutionResult(
                success=False,
                error_message=str(e)
            )

    @async_retry(retries=3, delay=1.0)
    async def _refresh_wallet_state(self) -> None:
        """Refresh wallet balance and nonce."""
        try:
            self.wallet_balance = await self.web3.eth.get_balance(self.account.address)
            self.wallet_nonce = await self.web3.eth.get_transaction_count(self.account.address, "pending")
            self.stats["wallet_balance_eth"] = wei_to_ether(self.wallet_balance)
            
            logger.debug(f"Wallet state: balance={self.stats['wallet_balance_eth']:.4f} ETH, nonce={self.wallet_nonce}")
            
        except Exception as e:
            logger.error(f"Failed to refresh wallet state: {e}")
            raise

    async def check_execution_status(self, execution_result: ExecutionResult) -> Dict[str, Any]:
        """
        Check the status of an executed transaction or bundle.
        
        Args:
            execution_result: The execution result to check
            
        Returns:
            Status information dictionary
        """
        status = {
            "confirmed": False,
            "block_number": None,
            "gas_used": None,
            "profit_realized": None,
            "error": None
        }
        
        try:
            if execution_result.tx_hash:
                # Check individual transaction
                try:
                    receipt = await self.web3.eth.get_transaction_receipt(execution_result.tx_hash)
                    status["confirmed"] = True
                    status["block_number"] = receipt["blockNumber"]
                    status["gas_used"] = receipt["gasUsed"]
                    
                    # Calculate actual profit (simplified)
                    if receipt["status"] == 1:  # Success
                        status["profit_realized"] = 0.01  # Placeholder
                    
                except TransactionNotFound:
                    status["error"] = "Transaction not found"
                    
            elif execution_result.bundle_hash:
                # Check Flashbots bundle status
                bundle_status = await self.flashbots_client.get_bundle_status(
                    execution_result.bundle_hash,
                    execution_result.block_number
                )
                status.update(bundle_status)
                
        except Exception as e:
            status["error"] = str(e)
            logger.error(f"Error checking execution status: {e}")
        
        return status

    def get_stats(self) -> Dict[str, Any]:
        """Get execution engine statistics."""
        stats = self.stats.copy()
        stats.update({
            "pending_executions": len(self.pending_executions),
            "execution_history_count": len(self.execution_history),
            "wallet_address": self.bot_wallet_address,
            "success_rate": (
                self.stats["successful_executions"] / max(1, self.stats["total_executions"])
            ) * 100,
            "average_profit_per_execution": (
                self.stats["total_profit_eth"] / max(1, self.stats["successful_executions"])
            )
        })
        return stats

    async def cleanup(self) -> None:
        """Clean up resources and close connections."""
        try:
            if self.flashbots_client:
                await self.flashbots_client.cleanup()
            
            # Clean up old execution history
            max_history = 1000
            if len(self.execution_history) > max_history:
                self.execution_history = self.execution_history[-max_history:]
            
            logger.info("Execution engine cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
