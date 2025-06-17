"""
Two-Hop Arbitrage Strategy Implementation
Detects and executes arbitrage opportunities across DEX pairs
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
from dataclasses import dataclass
import math

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
class DEXPool:
    """DEX pool information"""
    dex_name: str
    address: str
    token0: str
    token1: str
    reserve0: int
    reserve1: int
    fee_bps: int  # Fee in basis points
    router: str
    
    def get_amount_out(self, amount_in: int, token_in: str) -> int:
        """Calculate output amount for given input"""
        if token_in == self.token0:
            reserve_in, reserve_out = self.reserve0, self.reserve1
        else:
            reserve_in, reserve_out = self.reserve1, self.reserve0
            
        # Apply fee
        amount_in_with_fee = amount_in * (10000 - self.fee_bps)
        numerator = amount_in_with_fee * reserve_out
        denominator = reserve_in * 10000 + amount_in_with_fee
        return numerator // denominator
    
    def get_price(self, token_in: str) -> float:
        """Get price of token_in in terms of the other token"""
        if token_in == self.token0:
            return self.reserve1 / self.reserve0
        else:
            return self.reserve0 / self.reserve1


@dataclass
class ArbitrageRoute:
    """Arbitrage route between two DEXes"""
    token_a: str
    token_b: str
    dex1: DEXPool  # Buy from
    dex2: DEXPool  # Sell to
    optimal_amount: int
    expected_profit: int
    gas_cost: int
    price_difference: float
    
    @property
    def net_profit(self) -> int:
        return self.expected_profit - self.gas_cost
    
    @property
    def profit_percentage(self) -> float:
        if self.optimal_amount == 0:
            return 0.0
        return (self.expected_profit / self.optimal_amount) * 100


@dataclass
class ArbitrageOpportunity:
    """Complete arbitrage opportunity data"""
    route: ArbitrageRoute
    block_number: int
    timestamp: float
    confidence: float


class TwoHopArbitrageStrategy(AbstractStrategy):
    """
    Two-Hop Arbitrage Strategy
    
    Detects price differences between DEX pairs and executes profitable trades:
    1. Monitors price feeds from multiple DEXes
    2. Calculates optimal arbitrage amounts
    3. Executes atomic arbitrage transactions
    4. Handles gas optimization and slippage
    """
    
    def __init__(self, config: StrategyConfig, web3, explain: bool = False):
        """
        Initialize two-hop arbitrage strategy
        
        Args:
            config: Strategy configuration
            web3: Web3 instance
            explain: Enable explanations
        """
        super().__init__(StrategyType.TWO_HOP_ARB, config, explain)
        self.web3 = web3
        
        # DEX configurations
        self.dex_configs = {
            "uniswap_v2": {
                "router": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
                "factory": "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
                "fee_bps": 300,
                "init_code_hash": "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"
            },
            "sushiswap": {
                "router": "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
                "factory": "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
                "fee_bps": 300,
                "init_code_hash": "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303"
            }
        }
        
        # Pool cache and monitoring
        self._pool_cache: Dict[str, DEXPool] = {}
        self._monitored_pairs: List[Tuple[str, str]] = []
        self._price_cache: Dict[str, Dict[str, float]] = {}
        self._last_update: Dict[str, float] = {}
        
        # Initialize monitored token pairs
        self._initialize_monitored_pairs()
        
        self.logger.info(f"Two-hop arbitrage strategy initialized with {len(self._monitored_pairs)} pairs")
    
    def _initialize_monitored_pairs(self) -> None:
        """Initialize list of token pairs to monitor for arbitrage"""
        # High-volume pairs for arbitrage opportunities
        self._monitored_pairs = [
            ("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86a33E6c77218f9ceB6ffa4fd4Ee5Bd6a96be"),  # WETH/USDC
            ("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0x6B175474E89094C44Da98b954EedeAC495271d0F"),  # WETH/DAI
            ("0xA0b86a33E6c77218f9ceB6ffa4fd4Ee5Bd6a96be", "0x6B175474E89094C44Da98b954EedeAC495271d0F"),  # USDC/DAI
            ("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),  # WBTC/WETH
        ]
    
    async def on_tx(self, tx: TransactionData) -> Optional[MEVOpportunity]:
        """
        Analyze transaction for arbitrage-triggering events
        
        Args:
            tx: Transaction to analyze
            
        Returns:
            MEV opportunity if found
        """
        # Two-hop arbitrage is primarily block-based, not transaction-based
        # But we can detect large swaps that might create temporary imbalances
        
        try:
            # Check if it's a large swap on a monitored pair
            if await self._is_large_swap(tx):
                if self.explain:
                    self._log_explanation(
                        f"Large swap detected: {tx.hash[:10]}... "
                        f"May create arbitrage opportunity"
                    )
                
                # Trigger immediate arbitrage check
                opportunities = await self._scan_arbitrage_opportunities(
                    tx.block_number or 0,
                    tx.timestamp
                )
                
                if opportunities:
                    return opportunities[0]  # Return best opportunity
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error analyzing transaction for arbitrage: {e}")
            return None
    
    async def on_block(self, block_number: int, timestamp: float) -> List[MEVOpportunity]:
        """
        Block-based arbitrage opportunity detection
        
        Args:
            block_number: Current block number
            timestamp: Block timestamp
            
        Returns:
            List of arbitrage opportunities
        """
        try:
            opportunities = await self._scan_arbitrage_opportunities(block_number, timestamp)
            
            if opportunities and self.explain:
                self._log_explanation(
                    f"Block {block_number}: Found {len(opportunities)} arbitrage opportunities"
                )
            
            return opportunities
            
        except Exception as e:
            self.logger.error(f"Error scanning block for arbitrage: {e}")
            return []
    
    async def build_bundle(self, opportunity: MEVOpportunity) -> Optional[BundleRequest]:
        """
        Build arbitrage execution bundle
        
        Args:
            opportunity: Arbitrage opportunity
            
        Returns:
            Bundle request with arbitrage transaction
        """
        try:
            arb_data = opportunity.metadata['arbitrage_data']
            
            if self.explain:
                self._log_explanation(
                    f"Building arbitrage bundle: {arb_data.route.token_a[:10]}... -> "
                    f"{arb_data.route.token_b[:10]}... via {arb_data.route.dex1.dex_name} -> "
                    f"{arb_data.route.dex2.dex_name}"
                )
            
            # Build arbitrage transaction
            arb_tx = await self._build_arbitrage_transaction(arb_data.route)
            if not arb_tx:
                return None
            
            bundle = BundleRequest(
                transactions=[arb_tx],
                block_number=opportunity.block_number + 1,
                min_timestamp=None,
                max_timestamp=None
            )
            
            return bundle
            
        except Exception as e:
            self.logger.error(f"Error building arbitrage bundle: {e}")
            return None
    
    async def on_bundle_result(self, result) -> None:
        """
        Handle arbitrage bundle execution result
        
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
                        f"Arbitrage executed successfully! "
                        f"Profit: {result.profit_wei/10**18:.6f} ETH"
                    )
            else:
                self.metrics.failed_executions += 1
                
                if self.explain:
                    self._log_explanation(
                        f"Arbitrage execution failed: {result.error or 'Unknown error'}"
                    )
                    
        except Exception as e:
            self.logger.error(f"Error handling bundle result: {e}")
    
    async def _is_large_swap(self, tx: TransactionData) -> bool:
        """
        Check if transaction is a large swap that might create arbitrage
        
        Args:
            tx: Transaction to check
            
        Returns:
            True if large swap
        """
        # Check if swap value is above threshold
        min_swap_value = 50 * 10**18  # 50 ETH equivalent
        return tx.value >= min_swap_value
    
    async def _scan_arbitrage_opportunities(
        self, 
        block_number: int, 
        timestamp: float
    ) -> List[MEVOpportunity]:
        """
        Scan for arbitrage opportunities across all monitored pairs
        
        Args:
            block_number: Current block number
            timestamp: Block timestamp
            
        Returns:
            List of profitable arbitrage opportunities
        """
        opportunities = []
        
        try:
            # Update pool data
            await self._update_pool_data()
            
            # Check each monitored pair
            for token_a, token_b in self._monitored_pairs:
                routes = await self._find_arbitrage_routes(token_a, token_b)
                
                for route in routes:
                    if route.net_profit > self.config.min_profit_wei:
                        # Create arbitrage opportunity
                        arb_opp = ArbitrageOpportunity(
                            route=route,
                            block_number=block_number,
                            timestamp=timestamp,
                            confidence=self._calculate_confidence(route)
                        )
                        
                        opportunity = MEVOpportunity(
                            id=f"arbitrage_{token_a[:6]}_{token_b[:6]}_{block_number}",
                            strategy_type=StrategyType.TWO_HOP_ARB,
                            profit_estimate=Decimal(route.expected_profit) / Decimal(10**18),
                            gas_cost=Decimal(route.gas_cost) / Decimal(10**18),
                            net_profit=Decimal(route.net_profit) / Decimal(10**18),
                            confidence=arb_opp.confidence,
                            victim_tx=None,
                            block_number=block_number,
                            timestamp=timestamp,
                            metadata={
                                'arbitrage_data': arb_opp,
                                'route': route,
                                'price_difference': route.price_difference
                            }
                        )
                        
                        opportunities.append(opportunity)
            
            # Sort by net profit descending
            opportunities.sort(key=lambda x: x.net_profit, reverse=True)
            
            return opportunities[:5]  # Return top 5 opportunities
            
        except Exception as e:
            self.logger.error(f"Error scanning arbitrage opportunities: {e}")
            return []
    
    async def _update_pool_data(self) -> None:
        """
        Update pool reserves and pricing data
        """
        try:
            # In real implementation, this would fetch live data from blockchain
            # For demo purposes, using mock data
            
            for token_a, token_b in self._monitored_pairs:
                for dex_name, dex_config in self.dex_configs.items():
                    pool_key = f"{dex_name}_{token_a}_{token_b}"
                    
                    # Mock pool data
                    if pool_key not in self._pool_cache:
                        self._pool_cache[pool_key] = DEXPool(
                            dex_name=dex_name,
                            address=f"0x{'0'*40}",  # Mock address
                            token0=token_a,
                            token1=token_b,
                            reserve0=1000000 * 10**18,  # Mock reserves
                            reserve1=2000000 * 10**18,
                            fee_bps=dex_config["fee_bps"],
                            router=dex_config["router"]
                        )
            
        except Exception as e:
            self.logger.error(f"Error updating pool data: {e}")
    
    async def _find_arbitrage_routes(self, token_a: str, token_b: str) -> List[ArbitrageRoute]:
        """
        Find profitable arbitrage routes for token pair
        
        Args:
            token_a: First token address
            token_b: Second token address
            
        Returns:
            List of profitable arbitrage routes
        """
        routes = []
        
        try:
            # Get pools for each DEX
            pools = {}
            for dex_name in self.dex_configs.keys():
                pool_key = f"{dex_name}_{token_a}_{token_b}"
                if pool_key in self._pool_cache:
                    pools[dex_name] = self._pool_cache[pool_key]
            
            if len(pools) < 2:
                return routes  # Need at least 2 DEXes for arbitrage
            
            # Compare all DEX pairs
            dex_names = list(pools.keys())
            for i in range(len(dex_names)):
                for j in range(i + 1, len(dex_names)):
                    dex1_name, dex2_name = dex_names[i], dex_names[j]
                    pool1, pool2 = pools[dex1_name], pools[dex2_name]
                    
                    # Check arbitrage in both directions
                    route1 = await self._calculate_arbitrage_route(pool1, pool2, token_a)
                    if route1 and route1.net_profit > 0:
                        routes.append(route1)
                    
                    route2 = await self._calculate_arbitrage_route(pool2, pool1, token_a)
                    if route2 and route2.net_profit > 0:
                        routes.append(route2)
            
            return routes
            
        except Exception as e:
            self.logger.error(f"Error finding arbitrage routes: {e}")
            return []
    
    async def _calculate_arbitrage_route(
        self, 
        buy_pool: DEXPool, 
        sell_pool: DEXPool, 
        token_in: str
    ) -> Optional[ArbitrageRoute]:
        """
        Calculate optimal arbitrage parameters for given route
        
        Args:
            buy_pool: Pool to buy from
            sell_pool: Pool to sell to
            token_in: Input token
            
        Returns:
            Arbitrage route if profitable
        """
        try:
            # Get prices
            buy_price = buy_pool.get_price(token_in)
            sell_price = sell_pool.get_price(token_in)
            
            # Check if there's a price difference worth exploiting
            price_diff = (sell_price - buy_price) / buy_price
            if price_diff <= 0.005:  # Minimum 0.5% difference
                return None
            
            # Calculate optimal amount using binary search
            optimal_amount = await self._find_optimal_amount(buy_pool, sell_pool, token_in)
            
            if optimal_amount == 0:
                return None
            
            # Calculate expected profit
            token_out = buy_pool.token1 if token_in == buy_pool.token0 else buy_pool.token0
            
            # Buy tokens from first pool
            tokens_bought = buy_pool.get_amount_out(optimal_amount, token_in)
            
            # Sell tokens to second pool
            final_amount = sell_pool.get_amount_out(tokens_bought, token_out)
            
            expected_profit = final_amount - optimal_amount
            
            # Calculate gas cost
            gas_cost = await self._estimate_arbitrage_gas_cost()
            
            if expected_profit <= gas_cost:
                return None
            
            return ArbitrageRoute(
                token_a=token_in,
                token_b=token_out,
                dex1=buy_pool,
                dex2=sell_pool,
                optimal_amount=optimal_amount,
                expected_profit=expected_profit,
                gas_cost=gas_cost,
                price_difference=price_diff
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating arbitrage route: {e}")
            return None
    
    async def _find_optimal_amount(
        self, 
        buy_pool: DEXPool, 
        sell_pool: DEXPool, 
        token_in: str
    ) -> int:
        """
        Find optimal arbitrage amount using binary search
        
        Args:
            buy_pool: Pool to buy from
            sell_pool: Pool to sell to
            token_in: Input token
            
        Returns:
            Optimal amount to arbitrage
        """
        try:
            # Binary search for optimal amount
            min_amount = 1 * 10**18  # 1 token minimum
            max_amount = 100 * 10**18  # 100 tokens maximum
            
            best_amount = 0
            best_profit = 0
            
            # Simple search (in production, use more sophisticated optimization)
            for amount in range(int(min_amount), int(max_amount), int(1 * 10**18)):
                try:
                    # Simulate the arbitrage
                    token_out = buy_pool.token1 if token_in == buy_pool.token0 else buy_pool.token0
                    
                    tokens_bought = buy_pool.get_amount_out(amount, token_in)
                    final_amount = sell_pool.get_amount_out(tokens_bought, token_out)
                    
                    profit = final_amount - amount
                    
                    if profit > best_profit:
                        best_profit = profit
                        best_amount = amount
                
                except:
                    continue  # Skip invalid amounts
            
            return best_amount
            
        except Exception as e:
            self.logger.error(f"Error finding optimal amount: {e}")
            return 0
    
    async def _estimate_arbitrage_gas_cost(self) -> int:
        """
        Estimate gas cost for arbitrage transaction
        
        Returns:
            Gas cost in wei
        """
        # Estimate gas usage for arbitrage transaction
        gas_limit = 300000  # Typical for complex arbitrage
        gas_price = 50 * 10**9  # 50 gwei
        
        return gas_limit * gas_price
    
    def _calculate_confidence(self, route: ArbitrageRoute) -> float:
        """
        Calculate confidence score for arbitrage route
        
        Args:
            route: Arbitrage route
            
        Returns:
            Confidence score 0.0-1.0
        """
        # Base confidence
        confidence = 0.6
        
        # Higher confidence for larger price differences
        confidence += min(route.price_difference * 10, 0.3)
        
        # Higher confidence for higher profit margins
        profit_margin = route.expected_profit / route.optimal_amount
        confidence += min(profit_margin * 5, 0.1)
        
        return min(confidence, 1.0)
    
    async def _build_arbitrage_transaction(self, route: ArbitrageRoute) -> Optional[BundleTransaction]:
        """
        Build arbitrage execution transaction
        
        Args:
            route: Arbitrage route
            
        Returns:
            Arbitrage transaction
        """
        try:
            # In a real implementation, this would build a complex transaction
            # that performs the arbitrage atomically, possibly using a custom contract
            
            # For demo purposes, return a mock transaction
            return BundleTransaction(
                to=route.dex1.router,
                value=route.optimal_amount if route.token_a == "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" else 0,
                data="0x" + "0" * 136,  # Mock data
                gas_limit=300000,
                gas_price=50 * 10**9
            )
            
        except Exception as e:
            self.logger.error(f"Error building arbitrage transaction: {e}")
            return None
