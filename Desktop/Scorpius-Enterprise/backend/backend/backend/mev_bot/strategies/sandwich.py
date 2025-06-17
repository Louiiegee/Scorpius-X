"""
Sandwich Attack Strategy Implementation
Educational implementation showing sandwich attack mechanics
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
from dataclasses import dataclass
import json

from web3 import Web3
from web3.types import TxParams
from eth_abi import encode_abi, decode_abi

from ..core.strategy import AbstractStrategy
from ..core.types import (
    TransactionData, 
    MEVOpportunity, 
    BundleRequest, 
    BundleTransaction,
    StrategyType,
    StrategyConfig
)


@dataclass
class UniswapV2Pool:
    """Uniswap V2 pool information"""
    address: str
    token0: str
    token1: str
    reserve0: int
    reserve1: int
    fee: int = 300  # 0.3% in basis points
    
    def get_amount_out(self, amount_in: int, token_in: str) -> int:
        """Calculate output amount for given input"""
        if token_in == self.token0:
            reserve_in, reserve_out = self.reserve0, self.reserve1
        else:
            reserve_in, reserve_out = self.reserve1, self.reserve0
        
        amount_in_with_fee = amount_in * (10000 - self.fee)
        numerator = amount_in_with_fee * reserve_out
        denominator = reserve_in * 10000 + amount_in_with_fee
        return numerator // denominator


@dataclass
class SandwichOpportunity:
    """Sandwich attack opportunity data"""
    victim_tx: TransactionData
    pool: UniswapV2Pool
    victim_amount_in: int
    victim_min_amount_out: int
    frontrun_amount: int
    expected_profit: int
    gas_cost: int
    victim_slippage: float


class SandwichStrategy(AbstractStrategy):
    """
    Sandwich Attack Strategy
    
    Educational implementation that demonstrates:
    1. Detecting vulnerable swap transactions
    2. Calculating optimal frontrun amounts
    3. Building sandwich bundles (frontrun + victim + backrun)
    4. Profit maximization with gas optimization
    """
    
    def __init__(self, config: StrategyConfig, web3: Web3, explain: bool = False):
        """
        Initialize sandwich strategy
        
        Args:
            config: Strategy configuration
            web3: Web3 instance for blockchain interaction
            explain: Enable detailed explanations
        """
        super().__init__(StrategyType.SANDWICH, config, explain)
        self.web3 = web3
        
        # Pool cache for quick lookups
        self._pool_cache: Dict[str, UniswapV2Pool] = {}
        
        # Known DEX routers
        self.dex_routers = {
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap V2
            "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",  # Sushiswap
        }
        
        # Function selectors for swap functions
        self.swap_selectors = {
            "0x7ff36ab5",  # swapExactETHForTokens
            "0x18cbafe5",  # swapExactTokensForETH
            "0x38ed1739",  # swapExactTokensForTokens
            "0x8803dbee",  # swapTokensForExactTokens
        }
        
        self.logger.info("Sandwich strategy initialized")
    
    async def on_tx(self, tx: TransactionData) -> Optional[MEVOpportunity]:
        """
        Analyze transaction for sandwich opportunities
        
        Args:
            tx: Transaction to analyze
            
        Returns:
            MEV opportunity if found
        """
        try:
            # Quick filter: must be to known DEX router
            if tx.to_address not in self.dex_routers:
                return None
            
            # Quick filter: must be known swap function
            if tx.selector not in self.swap_selectors:
                return None
            
            # Quick filter: must have sufficient value
            if tx.value < self.config.min_profit_wei:
                return None
            
            if self.explain:
                self._log_explanation(
                    f"Analyzing potential victim swap: {tx.hash[:10]}... "
                    f"Value: {tx.value_eth:.4f} ETH, Router: {tx.to_address[:10]}..."
                )
            
            # Decode swap parameters
            swap_params = await self._decode_swap_transaction(tx)
            if not swap_params:
                return None
            
            # Find the pool being used
            pool = await self._get_pool_info(swap_params['path'][0], swap_params['path'][1])
            if not pool:
                return None
            
            # Calculate sandwich opportunity
            sandwich_opp = await self._calculate_sandwich_opportunity(tx, swap_params, pool)
            if not sandwich_opp:
                return None
            
            # Check profitability
            if sandwich_opp.expected_profit < self.config.min_profit_wei:
                if self.explain:
                    self._log_explanation(
                        f"Sandwich not profitable: expected profit {sandwich_opp.expected_profit/10**18:.6f} ETH "
                        f"< minimum {self.config.min_profit_wei/10**18:.6f} ETH"
                    )
                return None
            
            if self.explain:
                self._log_explanation(
                    f"Sandwich opportunity found! Victim slippage: {sandwich_opp.victim_slippage:.2f}%, "
                    f"Expected profit: {sandwich_opp.expected_profit/10**18:.6f} ETH"
                )
            
            # Create MEV opportunity
            opportunity = MEVOpportunity(
                id=f"sandwich_{tx.hash}",
                strategy_type=StrategyType.SANDWICH,
                profit_estimate=Decimal(sandwich_opp.expected_profit) / Decimal(10**18),
                gas_cost=Decimal(sandwich_opp.gas_cost) / Decimal(10**18),
                net_profit=Decimal(sandwich_opp.expected_profit - sandwich_opp.gas_cost) / Decimal(10**18),
                confidence=self._calculate_confidence(sandwich_opp),
                victim_tx=tx,
                block_number=tx.block_number or 0,
                timestamp=tx.timestamp,
                metadata={
                    'sandwich_data': sandwich_opp,
                    'pool': pool,
                    'victim_slippage': sandwich_opp.victim_slippage
                }
            )
            
            return opportunity
            
        except Exception as e:
            self.logger.error(f"Error analyzing sandwich opportunity: {e}")
            return None
    
    async def on_block(self, block_number: int, timestamp) -> List[MEVOpportunity]:
        """
        Block-based opportunity detection (not used for sandwich)
        
        Returns:
            Empty list - sandwich is transaction-based
        """
        return []
    
    async def build_bundle(self, opportunity: MEVOpportunity) -> Optional[BundleRequest]:
        """
        Build sandwich bundle (frontrun + victim + backrun)
        
        Args:
            opportunity: Sandwich opportunity
            
        Returns:
            Bundle request with three transactions
        """
        try:
            sandwich_data = opportunity.metadata['sandwich_data']
            pool = opportunity.metadata['pool']
            
            if self.explain:
                self._log_explanation(
                    f"Building sandwich bundle for {opportunity.id}: "
                    f"frontrun {sandwich_data.frontrun_amount/10**18:.4f} ETH"
                )
            
            # Build frontrun transaction
            frontrun_tx = await self._build_frontrun_transaction(sandwich_data, pool)
            if not frontrun_tx:
                return None
            
            # Build backrun transaction  
            backrun_tx = await self._build_backrun_transaction(sandwich_data, pool)
            if not backrun_tx:
                return None
            
            # Create bundle with victim transaction in middle
            bundle = BundleRequest(
                transactions=[frontrun_tx, backrun_tx],  # Victim tx will be inserted by execution engine
                block_number=opportunity.block_number + 1,  # Next block
                min_timestamp=None,
                max_timestamp=None
            )
            
            return bundle
            
        except Exception as e:
            self.logger.error(f"Error building sandwich bundle: {e}")
            return None
    
    async def on_bundle_result(self, result) -> None:
        """
        Handle sandwich bundle execution result
        
        Args:
            result: Bundle execution result
        """
        try:
            if result.included:
                self.metrics.successful_executions += 1
                if result.profit_wei:
                    self.metrics.total_profit_wei += result.profit_wei
                
                if self.explain:
                    self._log_explanation(
                        f"Sandwich executed successfully! "
                        f"Profit: {result.profit_wei/10**18:.6f} ETH, "
                        f"Gas used: {result.gas_used}"
                    )
            else:
                self.metrics.failed_executions += 1
                
                if self.explain:
                    self._log_explanation(
                        f"Sandwich failed to execute: {result.error or 'Unknown error'}"
                    )
                    
        except Exception as e:
            self.logger.error(f"Error handling bundle result: {e}")
    
    async def _decode_swap_transaction(self, tx: TransactionData) -> Optional[Dict[str, Any]]:
        """
        Decode swap transaction parameters
        
        Args:
            tx: Transaction to decode
            
        Returns:
            Decoded swap parameters
        """
        try:
            if tx.selector == "0x7ff36ab5":  # swapExactETHForTokens
                # function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
                decoded = decode_abi(
                    ['uint256', 'address[]', 'address', 'uint256'],
                    bytes.fromhex(tx.data[10:])  # Skip selector
                )
                return {
                    'function': 'swapExactETHForTokens',
                    'amount_in': tx.value,
                    'amount_out_min': decoded[0], 
                    'path': decoded[1],
                    'to': decoded[2],
                    'deadline': decoded[3]
                }
            
            elif tx.selector == "0x18cbafe5":  # swapExactTokensForETH
                decoded = decode_abi(
                    ['uint256', 'uint256', 'address[]', 'address', 'uint256'],
                    bytes.fromhex(tx.data[10:])
                )
                return {
                    'function': 'swapExactTokensForETH',
                    'amount_in': decoded[0],
                    'amount_out_min': decoded[1],
                    'path': decoded[2],
                    'to': decoded[3],
                    'deadline': decoded[4]
                }
            
            # Add more swap function decodings as needed
            
        except Exception as e:
            self.logger.error(f"Error decoding swap transaction: {e}")
        
        return None
    
    async def _get_pool_info(self, token0: str, token1: str) -> Optional[UniswapV2Pool]:
        """
        Get pool information for token pair
        
        Args:
            token0: First token address
            token1: Second token address
            
        Returns:
            Pool information
        """
        try:
            # Check cache first
            pool_key = f"{token0}_{token1}"
            if pool_key in self._pool_cache:
                return self._pool_cache[pool_key]
            
            # Calculate Uniswap V2 pool address
            factory_address = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
            init_code_hash = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"
            
            # Sort tokens
            if token0.lower() > token1.lower():
                token0, token1 = token1, token0
            
            # Compute pool address
            salt = Web3.solidityKeccak(['address', 'address'], [token0, token1])
            pool_address = Web3.solidityKeccak(
                ['bytes1', 'address', 'bytes32', 'bytes32'],
                ['0xff', factory_address, salt, init_code_hash]
            )[-20:].hex()
            pool_address = Web3.toChecksumAddress('0x' + pool_address)
            
            # Get pool reserves (this would need actual Web3 calls)
            # For demo purposes, using mock data
            pool = UniswapV2Pool(
                address=pool_address,
                token0=token0,
                token1=token1,
                reserve0=1000000 * 10**18,  # Mock reserves
                reserve1=2000 * 10**18
            )
            
            # Cache the result
            self._pool_cache[pool_key] = pool
            
            return pool
            
        except Exception as e:
            self.logger.error(f"Error getting pool info: {e}")
            return None
    
    async def _calculate_sandwich_opportunity(
        self, 
        tx: TransactionData, 
        swap_params: Dict[str, Any], 
        pool: UniswapV2Pool
    ) -> Optional[SandwichOpportunity]:
        """
        Calculate optimal sandwich parameters
        
        Args:
            tx: Victim transaction
            swap_params: Decoded swap parameters
            pool: Pool information
            
        Returns:
            Sandwich opportunity data
        """
        try:
            victim_amount_in = swap_params['amount_in']
            victim_min_out = swap_params['amount_out_min']
            
            # Calculate victim's expected output without frontrunning
            victim_expected_out = pool.get_amount_out(victim_amount_in, pool.token0)
            
            # Calculate victim's slippage tolerance
            victim_slippage = (victim_expected_out - victim_min_out) / victim_expected_out
            
            # Only proceed if victim has meaningful slippage
            if victim_slippage < 0.005:  # 0.5% minimum
                return None
            
            # Calculate optimal frontrun amount
            # This is a simplified calculation - real implementation would be more sophisticated
            optimal_frontrun = min(
                victim_amount_in // 4,  # Max 25% of victim amount
                10 * 10**18  # Max 10 ETH
            )
            
            # Simulate the sandwich
            # 1. Frontrun execution
            pool_after_frontrun = self._simulate_swap(pool, optimal_frontrun, pool.token0)
            tokens_bought = pool.get_amount_out(optimal_frontrun, pool.token0)
            
            # 2. Victim execution on modified pool
            victim_actual_out = pool_after_frontrun.get_amount_out(victim_amount_in, pool.token0)
            pool_after_victim = self._simulate_swap(pool_after_frontrun, victim_amount_in, pool.token0)
            
            # 3. Backrun execution
            eth_received = pool_after_victim.get_amount_out(tokens_bought, pool.token1)
            
            # Calculate profit
            profit = eth_received - optimal_frontrun
            
            # Calculate gas costs (simplified)
            gas_cost = 200000 * 50 * 10**9  # 200k gas * 50 gwei
            
            # Check if profitable after gas
            if profit <= gas_cost:
                return None
            
            return SandwichOpportunity(
                victim_tx=tx,
                pool=pool,
                victim_amount_in=victim_amount_in,
                victim_min_amount_out=victim_min_out,
                frontrun_amount=optimal_frontrun,
                expected_profit=profit,
                gas_cost=gas_cost,
                victim_slippage=victim_slippage
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating sandwich opportunity: {e}")
            return None
    
    def _simulate_swap(self, pool: UniswapV2Pool, amount_in: int, token_in: str) -> UniswapV2Pool:
        """
        Simulate swap execution on pool
        
        Args:
            pool: Original pool state
            amount_in: Input amount
            token_in: Input token address
            
        Returns:
            Pool state after swap
        """
        amount_out = pool.get_amount_out(amount_in, token_in)
        
        if token_in == pool.token0:
            new_reserve0 = pool.reserve0 + amount_in
            new_reserve1 = pool.reserve1 - amount_out
        else:
            new_reserve0 = pool.reserve0 - amount_out
            new_reserve1 = pool.reserve1 + amount_in
        
        return UniswapV2Pool(
            address=pool.address,
            token0=pool.token0,
            token1=pool.token1,
            reserve0=new_reserve0,
            reserve1=new_reserve1,
            fee=pool.fee
        )
    
    def _calculate_confidence(self, sandwich_opp: SandwichOpportunity) -> float:
        """
        Calculate confidence score for sandwich opportunity
        
        Args:
            sandwich_opp: Sandwich opportunity
            
        Returns:
            Confidence score 0.0-1.0
        """
        # Base confidence
        confidence = 0.5
        
        # Higher confidence for higher victim slippage
        confidence += min(sandwich_opp.victim_slippage * 2, 0.3)
        
        # Higher confidence for higher profit margins
        profit_margin = sandwich_opp.expected_profit / sandwich_opp.frontrun_amount
        confidence += min(profit_margin * 0.5, 0.2)
        
        return min(confidence, 1.0)
    
    async def _build_frontrun_transaction(
        self, 
        sandwich_data: SandwichOpportunity, 
        pool: UniswapV2Pool
    ) -> Optional[BundleTransaction]:
        """
        Build frontrun transaction
        
        Args:
            sandwich_data: Sandwich opportunity data
            pool: Pool information
            
        Returns:
            Frontrun transaction
        """
        try:
            # Build swapExactETHForTokens call
            router_address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
            
            # Encode function call
            function_selector = "0x7ff36ab5"  # swapExactETHForTokens
            params = encode_abi(
                ['uint256', 'address[]', 'address', 'uint256'],
                [
                    0,  # amountOutMin (we'll take whatever we get)
                    [pool.token0, pool.token1],  # path
                    "0x" + "0" * 40,  # to (our address)
                    9999999999  # deadline (far future)
                ]
            )
            
            data = function_selector + params.hex()
            
            return BundleTransaction(
                to=router_address,
                value=sandwich_data.frontrun_amount,
                data=data,
                gas_limit=200000,
                gas_price=50 * 10**9  # 50 gwei
            )
            
        except Exception as e:
            self.logger.error(f"Error building frontrun transaction: {e}")
            return None
    
    async def _build_backrun_transaction(
        self, 
        sandwich_data: SandwichOpportunity, 
        pool: UniswapV2Pool
    ) -> Optional[BundleTransaction]:
        """
        Build backrun transaction
        
        Args:
            sandwich_data: Sandwich opportunity data
            pool: Pool information
            
        Returns:
            Backrun transaction
        """
        try:
            # Build swapExactTokensForETH call
            router_address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
            
            # Calculate tokens to sell (from frontrun)
            tokens_to_sell = pool.get_amount_out(sandwich_data.frontrun_amount, pool.token0)
            
            # Encode function call
            function_selector = "0x18cbafe5"  # swapExactTokensForETH
            params = encode_abi(
                ['uint256', 'uint256', 'address[]', 'address', 'uint256'],
                [
                    tokens_to_sell,  # amountIn
                    0,  # amountOutMin
                    [pool.token1, pool.token0],  # path (reverse)
                    "0x" + "0" * 40,  # to (our address) 
                    9999999999  # deadline
                ]
            )
            
            data = function_selector + params.hex()
            
            return BundleTransaction(
                to=router_address,
                value=0,
                data=data,
                gas_limit=200000,
                gas_price=50 * 10**9
            )
            
        except Exception as e:
            self.logger.error(f"Error building backrun transaction: {e}")
            return None
