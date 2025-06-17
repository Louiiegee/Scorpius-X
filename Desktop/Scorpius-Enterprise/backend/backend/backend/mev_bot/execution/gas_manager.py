"""
Advanced Gas Management System
Optimizes gas pricing and execution timing for maximum MEV profitability
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
from decimal import Decimal
import statistics

from web3 import Web3
from web3.types import TxParams


class GasStrategy(Enum):
    """Gas pricing strategies"""
    CONSERVATIVE = "conservative"  # Lower gas, longer wait times
    AGGRESSIVE = "aggressive"      # Higher gas, faster execution
    ADAPTIVE = "adaptive"          # Dynamic based on network conditions
    MEV_OPTIMIZED = "mev_optimized"  # Optimized for MEV profitability


@dataclass
class GasPriceData:
    """Gas price information"""
    timestamp: float
    base_fee: int  # EIP-1559 base fee in wei
    priority_fee: int  # Priority fee in wei
    gas_price: int  # Legacy gas price in wei
    
    @property
    def max_fee_per_gas(self) -> int:
        """Calculate max fee per gas for EIP-1559"""
        return self.base_fee * 2 + self.priority_fee
    
    @property
    def max_priority_fee_per_gas(self) -> int:
        """Calculate max priority fee per gas"""
        return self.priority_fee


@dataclass
class GasEstimate:
    """Gas estimation for transaction"""
    gas_limit: int
    max_fee_per_gas: int
    max_priority_fee_per_gas: int
    gas_price: int  # Legacy fallback
    total_cost_wei: int
    confidence: float  # 0.0-1.0
    strategy_used: GasStrategy
    
    @property
    def total_cost_eth(self) -> float:
        """Total gas cost in ETH"""
        return self.total_cost_wei / 10**18


class GasPriceOracle:
    """
    Advanced gas price oracle with multiple data sources
    
    Features:
    - EIP-1559 support
    - Network congestion analysis
    - MEV-aware pricing
    - Historical trend analysis
    """
    
    def __init__(self, web3: Web3, explain: bool = False):
        """
        Initialize gas price oracle
        
        Args:
            web3: Web3 instance
            explain: Enable explanations
        """
        self.web3 = web3
        self.explain = explain
        self.logger = logging.getLogger("GasPriceOracle")
        
        # Gas price history
        self._price_history: List[GasPriceData] = []
        self._max_history = 100
        
        # Network analysis
        self._pending_tx_count = 0
        self._block_utilization = 0.0
        self._congestion_level = 0.0
        
        self.logger.info("Gas price oracle initialized")
    
    async def get_current_gas_prices(self) -> GasPriceData:
        """
        Get current gas prices from network
        
        Returns:
            Current gas price data
        """
        try:
            # Get latest block for base fee
            latest_block = await asyncio.to_thread(self.web3.eth.get_block, 'latest')
            base_fee = latest_block.get('baseFeePerGas', 0)
            
            # Get gas price from network
            gas_price = await asyncio.to_thread(self.web3.eth.gas_price)
            
            # Estimate priority fee (simple approach)
            # In production, would use fee history API
            priority_fee = max(2 * 10**9, gas_price - base_fee)  # Minimum 2 gwei
            
            gas_data = GasPriceData(
                timestamp=time.time(),
                base_fee=base_fee,
                priority_fee=priority_fee,
                gas_price=gas_price
            )
            
            # Update history
            self._update_price_history(gas_data)
            
            if self.explain:
                self.logger.info(
                    f"Current gas prices: Base={base_fee/10**9:.2f} gwei, "
                    f"Priority={priority_fee/10**9:.2f} gwei, "
                    f"Legacy={gas_price/10**9:.2f} gwei"
                )
            
            return gas_data
            
        except Exception as e:
            self.logger.error(f"Error getting gas prices: {e}")
            # Return fallback values
            return GasPriceData(
                timestamp=time.time(),
                base_fee=20 * 10**9,  # 20 gwei fallback
                priority_fee=2 * 10**9,   # 2 gwei fallback
                gas_price=25 * 10**9   # 25 gwei fallback
            )
    
    async def analyze_network_congestion(self) -> float:
        """
        Analyze current network congestion level
        
        Returns:
            Congestion level 0.0-1.0
        """
        try:
            # Get pending transaction count
            pending_count = await asyncio.to_thread(
                self.web3.manager.request_blocking, 
                "txpool_status", 
                []
            )
            
            if isinstance(pending_count, dict):
                self._pending_tx_count = int(pending_count.get('pending', '0x0'), 16)
            
            # Get latest block to analyze utilization
            latest_block = await asyncio.to_thread(self.web3.eth.get_block, 'latest')
            gas_used = latest_block.get('gasUsed', 0)
            gas_limit = latest_block.get('gasLimit', 1)
            
            self._block_utilization = gas_used / gas_limit
            
            # Calculate congestion score
            # High pending txs + high block utilization = high congestion
            pending_score = min(self._pending_tx_count / 10000, 1.0)  # Normalize to 0-1
            utilization_score = self._block_utilization
            
            self._congestion_level = (pending_score + utilization_score) / 2
            
            if self.explain:
                self.logger.info(
                    f"Network congestion: {self._congestion_level:.2f} "
                    f"(Pending: {self._pending_tx_count}, "
                    f"Block util: {self._block_utilization:.2%})"
                )
            
            return self._congestion_level
            
        except Exception as e:
            self.logger.error(f"Error analyzing network congestion: {e}")
            return 0.5  # Default moderate congestion
    
    def predict_gas_price_trend(self, minutes_ahead: int = 5) -> Tuple[int, float]:
        """
        Predict gas price trend for near future
        
        Args:
            minutes_ahead: Minutes to predict ahead
            
        Returns:
            Tuple of (predicted_gas_price_wei, confidence)
        """
        try:
            if len(self._price_history) < 10:
                # Not enough data for prediction
                latest = self._price_history[-1] if self._price_history else None
                if latest:
                    return latest.gas_price, 0.3
                return 25 * 10**9, 0.1  # Fallback
            
            # Simple trend analysis using recent prices
            recent_prices = [p.gas_price for p in self._price_history[-20:]]
            
            # Calculate trend
            if len(recent_prices) >= 5:
                recent_trend = statistics.mean(recent_prices[-5:]) - statistics.mean(recent_prices[-10:-5])
                
                # Project trend forward
                current_price = recent_prices[-1]
                predicted_price = current_price + (recent_trend * minutes_ahead / 5)
                
                # Confidence based on trend consistency
                price_variance = statistics.variance(recent_prices) if len(recent_prices) > 1 else 0
                confidence = max(0.1, 1.0 - (price_variance / (current_price ** 2)))
                
                return int(max(1 * 10**9, predicted_price)), min(confidence, 0.9)
            
            return recent_prices[-1], 0.5
            
        except Exception as e:
            self.logger.error(f"Error predicting gas price trend: {e}")
            return 25 * 10**9, 0.1
    
    def _update_price_history(self, gas_data: GasPriceData) -> None:
        """Update gas price history"""
        self._price_history.append(gas_data)
        
        # Keep only recent history
        if len(self._price_history) > self._max_history:
            self._price_history = self._price_history[-self._max_history:]
    
    def get_historical_stats(self) -> Dict[str, Any]:
        """Get historical gas price statistics"""
        if not self._price_history:
            return {}
        
        gas_prices = [p.gas_price for p in self._price_history]
        base_fees = [p.base_fee for p in self._price_history]
        priority_fees = [p.priority_fee for p in self._price_history]
        
        return {
            'gas_price': {
                'min': min(gas_prices) / 10**9,
                'max': max(gas_prices) / 10**9,
                'mean': statistics.mean(gas_prices) / 10**9,
                'median': statistics.median(gas_prices) / 10**9
            },
            'base_fee': {
                'min': min(base_fees) / 10**9,
                'max': max(base_fees) / 10**9,
                'mean': statistics.mean(base_fees) / 10**9,
                'median': statistics.median(base_fees) / 10**9
            },
            'priority_fee': {
                'min': min(priority_fees) / 10**9,
                'max': max(priority_fees) / 10**9,
                'mean': statistics.mean(priority_fees) / 10**9,
                'median': statistics.median(priority_fees) / 10**9
            },
            'congestion_level': self._congestion_level,
            'pending_tx_count': self._pending_tx_count,
            'block_utilization': self._block_utilization
        }


class GasManager:
    """
    Advanced gas management with MEV-optimized strategies
    
    Features:
    - Multiple gas pricing strategies
    - MEV profitability optimization
    - Dynamic gas adjustment
    - Network congestion awareness
    """
    
    def __init__(self, web3: Web3, oracle: GasPriceOracle, explain: bool = False):
        """
        Initialize gas manager
        
        Args:
            web3: Web3 instance
            oracle: Gas price oracle
            explain: Enable explanations
        """
        self.web3 = web3
        self.oracle = oracle
        self.explain = explain
        self.logger = logging.getLogger("GasManager")
        
        # Strategy configurations
        self.strategy_configs = {
            GasStrategy.CONSERVATIVE: {
                'base_multiplier': 1.0,
                'priority_multiplier': 1.0,
                'max_gas_price_gwei': 50
            },
            GasStrategy.AGGRESSIVE: {
                'base_multiplier': 1.5,
                'priority_multiplier': 2.0,
                'max_gas_price_gwei': 200
            },
            GasStrategy.ADAPTIVE: {
                'base_multiplier': 1.1,
                'priority_multiplier': 1.2,
                'max_gas_price_gwei': 100
            },
            GasStrategy.MEV_OPTIMIZED: {
                'base_multiplier': 1.2,
                'priority_multiplier': 1.5,
                'max_gas_price_gwei': 300
            }
        }
        
        self.logger.info("Gas manager initialized")
    
    async def estimate_gas(
        self, 
        tx_params: TxParams, 
        strategy: GasStrategy = GasStrategy.MEV_OPTIMIZED,
        max_profit_wei: Optional[int] = None
    ) -> GasEstimate:
        """
        Estimate optimal gas parameters for transaction
        
        Args:
            tx_params: Transaction parameters
            strategy: Gas pricing strategy
            max_profit_wei: Maximum profit expected (for optimization)
            
        Returns:
            Gas estimate with optimal parameters
        """
        try:
            if self.explain:
                self.logger.info(f"Estimating gas with {strategy.value} strategy")
            
            # Get current gas prices
            current_gas = await self.oracle.get_current_gas_prices()
            
            # Estimate gas limit
            gas_limit = await self._estimate_gas_limit(tx_params)
            
            # Calculate optimal gas prices based on strategy
            gas_prices = await self._calculate_optimal_gas_prices(
                current_gas, strategy, max_profit_wei
            )
            
            # Calculate total cost
            total_cost = gas_limit * gas_prices['max_fee_per_gas']
            
            # Calculate confidence based on network conditions
            confidence = await self._calculate_gas_confidence(current_gas, strategy)
            
            estimate = GasEstimate(
                gas_limit=gas_limit,
                max_fee_per_gas=gas_prices['max_fee_per_gas'],
                max_priority_fee_per_gas=gas_prices['max_priority_fee_per_gas'],
                gas_price=gas_prices['gas_price'],
                total_cost_wei=total_cost,
                confidence=confidence,
                strategy_used=strategy
            )
            
            if self.explain:
                self.logger.info(
                    f"Gas estimate: Limit={gas_limit:,}, "
                    f"MaxFee={gas_prices['max_fee_per_gas']/10**9:.2f} gwei, "
                    f"Cost={total_cost/10**18:.6f} ETH"
                )
            
            return estimate
            
        except Exception as e:
            self.logger.error(f"Error estimating gas: {e}")
            # Return conservative fallback estimate
            return GasEstimate(
                gas_limit=200000,
                max_fee_per_gas=50 * 10**9,
                max_priority_fee_per_gas=2 * 10**9,
                gas_price=50 * 10**9,
                total_cost_wei=200000 * 50 * 10**9,
                confidence=0.3,
                strategy_used=strategy
            )
    
    async def optimize_for_mev_profit(
        self, 
        tx_params: TxParams, 
        expected_profit_wei: int,
        max_gas_cost_ratio: float = 0.3
    ) -> GasEstimate:
        """
        Optimize gas for MEV profitability
        
        Args:
            tx_params: Transaction parameters
            expected_profit_wei: Expected profit in wei
            max_gas_cost_ratio: Maximum gas cost as ratio of profit
            
        Returns:
            Optimized gas estimate
        """
        try:
            max_gas_cost = int(expected_profit_wei * max_gas_cost_ratio)
            
            if self.explain:
                self.logger.info(
                    f"Optimizing gas for MEV: Expected profit={expected_profit_wei/10**18:.6f} ETH, "
                    f"Max gas cost={max_gas_cost/10**18:.6f} ETH"
                )
            
            # Start with MEV-optimized strategy
            estimate = await self.estimate_gas(
                tx_params, 
                GasStrategy.MEV_OPTIMIZED, 
                expected_profit_wei
            )
            
            # If gas cost exceeds maximum, try less aggressive strategies
            if estimate.total_cost_wei > max_gas_cost:
                if self.explain:
                    self.logger.info("Gas cost too high, trying adaptive strategy")
                
                estimate = await self.estimate_gas(
                    tx_params, 
                    GasStrategy.ADAPTIVE, 
                    expected_profit_wei
                )
                
                if estimate.total_cost_wei > max_gas_cost:
                    if self.explain:
                        self.logger.info("Still too high, trying conservative strategy")
                    
                    estimate = await self.estimate_gas(
                        tx_params, 
                        GasStrategy.CONSERVATIVE, 
                        expected_profit_wei
                    )
            
            # Final check - if still too expensive, reduce gas limit
            if estimate.total_cost_wei > max_gas_cost:
                max_affordable_gas = max_gas_cost // estimate.max_fee_per_gas
                
                if max_affordable_gas < 21000:  # Minimum gas for basic tx
                    if self.explain:
                        self.logger.warning("MEV opportunity not profitable after gas costs")
                    estimate.confidence = 0.0
                else:
                    estimate.gas_limit = int(max_affordable_gas)
                    estimate.total_cost_wei = max_affordable_gas * estimate.max_fee_per_gas
                    estimate.confidence *= 0.7  # Lower confidence for reduced gas
            
            return estimate
            
        except Exception as e:
            self.logger.error(f"Error optimizing gas for MEV: {e}")
            return await self.estimate_gas(tx_params, GasStrategy.CONSERVATIVE)
    
    async def _estimate_gas_limit(self, tx_params: TxParams) -> int:
        """
        Estimate gas limit for transaction
        
        Args:
            tx_params: Transaction parameters
            
        Returns:
            Estimated gas limit
        """
        try:
            # Use web3 gas estimation
            estimated = await asyncio.to_thread(
                self.web3.eth.estimate_gas, 
                tx_params
            )
            
            # Add 20% buffer for safety
            return int(estimated * 1.2)
            
        except Exception as e:
            self.logger.error(f"Error estimating gas limit: {e}")
            # Return reasonable default
            return 200000
    
    async def _calculate_optimal_gas_prices(
        self, 
        current_gas: GasPriceData, 
        strategy: GasStrategy,
        max_profit_wei: Optional[int] = None
    ) -> Dict[str, int]:
        """
        Calculate optimal gas prices based on strategy
        
        Args:
            current_gas: Current gas price data
            strategy: Gas pricing strategy
            max_profit_wei: Maximum expected profit
            
        Returns:
            Dictionary with gas price components
        """
        try:
            config = self.strategy_configs[strategy]
            
            # Get network congestion
            congestion = await self.oracle.analyze_network_congestion()
            
            # Adjust multipliers based on congestion
            congestion_multiplier = 1.0 + (congestion * 0.5)  # Up to 50% increase
            
            base_multiplier = config['base_multiplier'] * congestion_multiplier
            priority_multiplier = config['priority_multiplier'] * congestion_multiplier
            
            # Calculate EIP-1559 prices
            max_priority_fee = int(current_gas.priority_fee * priority_multiplier)
            max_fee = int(current_gas.base_fee * base_multiplier) + max_priority_fee
            
            # Apply maximum gas price limit
            max_gas_price_wei = config['max_gas_price_gwei'] * 10**9
            max_fee = min(max_fee, max_gas_price_wei)
            
            # If we have profit information, optimize further
            if max_profit_wei and strategy == GasStrategy.MEV_OPTIMIZED:
                # Don't spend more than 30% of profit on gas
                max_affordable_gas = max_profit_wei * 0.3
                # Assuming typical transaction uses 200k gas
                max_affordable_price = max_affordable_gas / 200000
                max_fee = min(max_fee, int(max_affordable_price))
            
            # Legacy gas price (fallback)
            gas_price = min(max_fee, int(current_gas.gas_price * base_multiplier))
            
            return {
                'max_fee_per_gas': max_fee,
                'max_priority_fee_per_gas': max_priority_fee,
                'gas_price': gas_price
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating optimal gas prices: {e}")
            return {
                'max_fee_per_gas': current_gas.max_fee_per_gas,
                'max_priority_fee_per_gas': current_gas.max_priority_fee_per_gas,
                'gas_price': current_gas.gas_price
            }
    
    async def _calculate_gas_confidence(
        self, 
        current_gas: GasPriceData, 
        strategy: GasStrategy
    ) -> float:
        """
        Calculate confidence score for gas estimate
        
        Args:
            current_gas: Current gas price data
            strategy: Gas pricing strategy
            
        Returns:
            Confidence score 0.0-1.0
        """
        try:
            base_confidence = 0.7
            
            # Higher confidence for less aggressive strategies
            strategy_confidence = {
                GasStrategy.CONSERVATIVE: 0.9,
                GasStrategy.ADAPTIVE: 0.8,
                GasStrategy.AGGRESSIVE: 0.6,
                GasStrategy.MEV_OPTIMIZED: 0.7
            }
            
            confidence = strategy_confidence.get(strategy, 0.7)
            
            # Adjust for network congestion
            congestion = await self.oracle.analyze_network_congestion()
            confidence *= (1.0 - congestion * 0.3)  # Lower confidence in high congestion
            
            # Adjust for price volatility
            historical_stats = self.oracle.get_historical_stats()
            if 'gas_price' in historical_stats:
                current_price_gwei = current_gas.gas_price / 10**9
                mean_price = historical_stats['gas_price']['mean']
                
                # Lower confidence if current price is very different from mean
                price_deviation = abs(current_price_gwei - mean_price) / mean_price
                confidence *= max(0.3, 1.0 - price_deviation)
            
            return max(0.1, min(confidence, 1.0))
            
        except Exception as e:
            self.logger.error(f"Error calculating gas confidence: {e}")
            return 0.5
    
    def get_strategy_recommendation(
        self, 
        expected_profit_wei: int, 
        urgency: float = 0.5
    ) -> GasStrategy:
        """
        Recommend optimal gas strategy based on conditions
        
        Args:
            expected_profit_wei: Expected profit from transaction
            urgency: Urgency level 0.0-1.0
            
        Returns:
            Recommended gas strategy
        """
        try:
            # High profit transactions can afford aggressive gas
            if expected_profit_wei > 10 * 10**18:  # > 10 ETH profit
                return GasStrategy.AGGRESSIVE if urgency > 0.7 else GasStrategy.MEV_OPTIMIZED
            
            # Medium profit transactions
            elif expected_profit_wei > 1 * 10**18:  # > 1 ETH profit
                return GasStrategy.MEV_OPTIMIZED if urgency > 0.5 else GasStrategy.ADAPTIVE
            
            # Lower profit transactions
            else:
                return GasStrategy.ADAPTIVE if urgency > 0.7 else GasStrategy.CONSERVATIVE
            
        except Exception as e:
            self.logger.error(f"Error recommending strategy: {e}")
            return GasStrategy.ADAPTIVE
