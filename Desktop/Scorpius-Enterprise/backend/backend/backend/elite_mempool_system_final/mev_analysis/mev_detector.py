"""
MEV Detection Engine for identifying various MEV opportunities in real-time.
This module analyzes mempool transactions to detect arbitrage, sandwich attacks,
liquidations, and other MEV opportunities.
"""
import asyncio
import logging
import time
from typing import Dict, List, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from decimal import Decimal
from collections import defaultdict, deque

from web3 import Web3, AsyncWeb3
from web3.types import TxData, TxReceipt
from web3.exceptions import TransactionNotFound, ContractLogicError

from ..models.mempool_event import MempoolEvent, MempoolEventType, MempoolEventSeverity
from ..models.mev_opportunity import MEVOpportunity, MEVStrategyType, OpportunityStatus
from ..core.utils import wei_to_ether, ether_to_wei, async_retry

logger = logging.getLogger(__name__)

@dataclass
class DEXPoolInfo:
    """Information about a DEX liquidity pool."""
    
    pool_address: str
    token0: str
    token1: str
    dex_name: str
    reserves0: int = 0
    reserves1: int = 0
    fee: int = 3000  # 0.3% = 3000 basis points
    last_updated: float = field(default_factory=time.time)
    
    def get_price(self, base_token: str) -> float:
        """Get the price of base_token in terms of the other token."""
        if self.reserves0 == 0 or self.reserves1 == 0:
            return 0.0
        
        if base_token.lower() == self.token0.lower():
            return float(self.reserves1) / float(self.reserves0)
        elif base_token.lower() == self.token1.lower():
            return float(self.reserves0) / float(self.reserves1)
        else:
            return 0.0
    
    def calculate_swap_output(self, input_token: str, input_amount: int) -> int:
        """Calculate output amount for a swap (simple constant product model)."""
        if input_token.lower() == self.token0.lower():
            input_reserve = self.reserves0
            output_reserve = self.reserves1
        elif input_token.lower() == self.token1.lower():
            input_reserve = self.reserves1
            output_reserve = self.reserves0
        else:
            return 0
        
        if input_reserve == 0 or output_reserve == 0:
            return 0
        
        # Apply fee (subtract from input)
        input_amount_after_fee = input_amount * (10000 - self.fee) // 10000
        
        # Constant product formula: (x + dx) * (y - dy) = x * y
        # dy = y * dx / (x + dx)
        output_amount = (output_reserve * input_amount_after_fee) // (input_reserve + input_amount_after_fee)
        
        return output_amount

@dataclass
class PendingSwap:
    """Represents a pending swap transaction."""
    
    tx_hash: str
    from_address: str
    to_address: str
    input_token: str
    output_token: str
    input_amount: int
    min_output_amount: int
    gas_price: int
    block_number: Optional[int] = None
    timestamp: float = field(default_factory=time.time)
    
    def __post_init__(self):
        # Normalize addresses to lowercase
        self.from_address = self.from_address.lower()
        self.to_address = self.to_address.lower()
        self.input_token = self.input_token.lower()
        self.output_token = self.output_token.lower()

class MEVDetector:
    """
    Advanced MEV detection engine with support for multiple strategies.
    """
    
    def __init__(
        self,
        web3: AsyncWeb3,
        network_id: int,
        config: Dict[str, Any]
    ):
        """
        Initialize the MEV detector.
        
        Args:
            web3: AsyncWeb3 instance for blockchain interactions
            network_id: Network ID for the blockchain
            config: Configuration dictionary
        """
        self.web3 = web3
        self.network_id = network_id
        self.config = config
        
        # Configuration from config dict
        self.sandwich_min_victim_value_eth = config.get("sandwich_min_victim_value_eth", 0.1)
        self.sandwich_min_net_profit_eth = config.get("sandwich_min_net_profit_eth", 0.001)
        self.liquidation_min_value_usd = config.get("liquidation_min_value_usd", 500)
        self.liquidation_min_net_profit_usd = config.get("liquidation_min_net_profit_usd", 10)
        self.arbitrage_min_start_amount_eth = config.get("arbitrage_min_start_amount_eth", 0.5)
        self.arbitrage_min_net_profit_eth = config.get("arbitrage_min_net_profit_eth", 0.002)
        
        # Track DEX pools and their states
        self.dex_pools: Dict[str, DEXPoolInfo] = {}
        self.pending_swaps: Dict[str, PendingSwap] = {}
        self.recent_transactions: deque = deque(maxlen=1000)
        
        # Track addresses of interest
        self.dex_router_addresses: Set[str] = set()
        self.lending_protocol_addresses: Set[str] = set()
        self.known_token_addresses: Dict[str, str] = {}  # address -> symbol
        
        # Statistics
        self.stats = {
            "opportunities_detected": 0,
            "sandwich_opportunities": 0,
            "arbitrage_opportunities": 0,
            "liquidation_opportunities": 0,
            "contracts_decoded": 0,
            "decode_failures": 0,
            "last_detection_time": 0.0
        }
        
        self._initialize_known_addresses()
        
    def _initialize_known_addresses(self) -> None:
        """Initialize known DEX and protocol addresses for mainnet."""
        if self.network_id == 1:  # Ethereum mainnet
            # Uniswap V2/V3 routers
            self.dex_router_addresses.update([
                "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",  # Uniswap V2
                "0xe592427a0aece92de3edee1f18e0157c05861564",  # Uniswap V3
                "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",  # Uniswap V3 Router 2
            ])
            
            # SushiSwap router
            self.dex_router_addresses.add("0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f")
            
            # 1inch router
            self.dex_router_addresses.add("0x1111111254fb6c44bac0bed2854e76f90643097d")
            
            # Compound addresses
            self.lending_protocol_addresses.update([
                "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",  # Comptroller
                "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",  # cDAI
                "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5",  # cETH
            ])
            
            # Aave addresses  
            self.lending_protocol_addresses.update([
                "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9",  # Lending Pool
                "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5",  # Addresses Provider
            ])
            
            # Common tokens
            self.known_token_addresses.update({
                "0xa0b86a33e6b2da8bed436c183f8de44f8c48c02a": "WETH",
                "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
                "0xa0b86a33e6b2da8bed436c183f8de44f8c48c02a": "USDC",
                "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
            })

    async def analyze_mempool_event(self, event: MempoolEvent) -> List[MEVOpportunity]:
        """
        Analyze a mempool event for MEV opportunities.
        
        Args:
            event: The mempool event to analyze
            
        Returns:
            List of detected MEV opportunities
        """
        opportunities = []
        
        try:
            self.recent_transactions.append(event)
            
            # Decode transaction if it's a smart contract interaction
            if event.contract_address and event.input_data and event.input_data != "0x":
                decoded_tx = await self._decode_transaction(event)
                if decoded_tx:
                    self.stats["contracts_decoded"] += 1
                    
                    # Check for sandwich opportunities
                    if self._is_dex_swap(decoded_tx):
                        sandwich_ops = await self._detect_sandwich_opportunities(event, decoded_tx)
                        opportunities.extend(sandwich_ops)
                    
                    # Check for arbitrage opportunities
                    if self._is_dex_swap(decoded_tx):
                        arb_ops = await self._detect_arbitrage_opportunities(event, decoded_tx)
                        opportunities.extend(arb_ops)
                    
                    # Check for liquidation opportunities
                    if self._is_lending_interaction(decoded_tx):
                        liq_ops = await self._detect_liquidation_opportunities(event, decoded_tx)
                        opportunities.extend(liq_ops)
                else:
                    self.stats["decode_failures"] += 1
            
            # Update statistics
            if opportunities:
                self.stats["opportunities_detected"] += len(opportunities)
                self.stats["last_detection_time"] = time.time()
                for opp in opportunities:
                    if opp.strategy_type == MEVStrategyType.SANDWICH:
                        self.stats["sandwich_opportunities"] += 1
                    elif opp.strategy_type == MEVStrategyType.ARBITRAGE:
                        self.stats["arbitrage_opportunities"] += 1
                    elif opp.strategy_type == MEVStrategyType.LIQUIDATION:
                        self.stats["liquidation_opportunities"] += 1
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Error analyzing mempool event {event.tx_hash}: {e}", exc_info=True)
            return []

    async def _decode_transaction(self, event: MempoolEvent) -> Optional[Dict[str, Any]]:
        """
        Decode transaction data to extract function calls and parameters.
        
        Args:
            event: The mempool event containing transaction data
            
        Returns:
            Decoded transaction data or None if decoding fails
        """
        try:
            if not event.input_data or len(event.input_data) < 10:
                return None
            
            method_signature = event.input_data[:10]
            
            # Common DEX method signatures
            dex_methods = {
                "0x7ff36ab5": "swapExactETHForTokens",
                "0x18cbafe5": "swapExactTokensForETH", 
                "0x38ed1739": "swapExactTokensForTokens",
                "0x8803dbee": "swapTokensForExactTokens",
                "0x414bf389": "exactInputSingle",  # Uniswap V3
                "0x04e45aaf": "exactOutputSingle",  # Uniswap V3
            }
            
            # Lending protocol methods
            lending_methods = {
                "0xa0712d68": "mint",  # Compound
                "0xdb006a75": "redeem",  # Compound
                "0xe5974619": "liquidateBorrow",  # Compound
                "0xe8eda9df": "deposit",  # Aave
                "0x69328dec": "withdraw",  # Aave
                "0x00a718a9": "liquidationCall",  # Aave
            }
            
            all_methods = {**dex_methods, **lending_methods}
            
            decoded = {
                "method_signature": method_signature,
                "method_name": all_methods.get(method_signature, "unknown"),
                "is_dex_swap": method_signature in dex_methods,
                "is_lending": method_signature in lending_methods,
                "to_address": event.contract_address,
                "value": event.value,
                "gas_price": event.gas_price,
                "from_address": event.from_address
            }
            
            # For DEX swaps, try to extract token information
            if decoded["is_dex_swap"]:
                decoded.update(await self._extract_swap_info(event))
            
            return decoded
            
        except Exception as e:
            logger.error(f"Error decoding transaction {event.tx_hash}: {e}")
            return None

    async def _extract_swap_info(self, event: MempoolEvent) -> Dict[str, Any]:
        """Extract swap information from DEX transaction."""
        swap_info = {
            "input_token": None,
            "output_token": None,
            "input_amount": 0,
            "min_output_amount": 0,
            "deadline": 0,
            "path": []
        }
        
        try:
            # This is a simplified extraction - in production you'd use proper ABI decoding
            if event.input_data and len(event.input_data) > 10:
                # For demonstration, we'll extract basic info
                # In practice, use web3.py's contract decoding with ABIs
                
                # If it's an ETH swap, value tells us the input amount
                if event.value > 0:
                    swap_info["input_amount"] = event.value
                    swap_info["input_token"] = "ETH"
                
                # Store in pending swaps for sandwich detection
                if swap_info["input_amount"] > 0:
                    pending_swap = PendingSwap(
                        tx_hash=event.tx_hash,
                        from_address=event.from_address,
                        to_address=event.contract_address or "",
                        input_token=swap_info["input_token"] or "",
                        output_token=swap_info["output_token"] or "",
                        input_amount=swap_info["input_amount"],
                        min_output_amount=swap_info["min_output_amount"],
                        gas_price=event.gas_price
                    )
                    self.pending_swaps[event.tx_hash] = pending_swap
            
        except Exception as e:
            logger.error(f"Error extracting swap info: {e}")
        
        return swap_info

    def _is_dex_swap(self, decoded_tx: Dict[str, Any]) -> bool:
        """Check if transaction is a DEX swap."""
        return decoded_tx.get("is_dex_swap", False)

    def _is_lending_interaction(self, decoded_tx: Dict[str, Any]) -> bool:
        """Check if transaction is a lending protocol interaction."""
        return decoded_tx.get("is_lending", False)

    async def _detect_sandwich_opportunities(
        self, 
        event: MempoolEvent, 
        decoded_tx: Dict[str, Any]
    ) -> List[MEVOpportunity]:
        """
        Detect sandwich attack opportunities.
        
        A sandwich attack involves:
        1. Front-running a large swap with a buy order
        2. Let the victim's swap execute (increasing price)
        3. Back-running with a sell order for profit
        """
        opportunities = []
        
        try:
            # Check if this is a sufficiently large swap to sandwich
            swap_value_eth = wei_to_ether(event.value) if event.value else 0
            if swap_value_eth < self.sandwich_min_victim_value_eth:
                return opportunities
            
            # Estimate potential profit
            estimated_profit_eth = await self._estimate_sandwich_profit(event, decoded_tx)
            
            if estimated_profit_eth >= self.sandwich_min_net_profit_eth:
                opportunity = MEVOpportunity(
                    opportunity_id=f"sandwich_{event.tx_hash}",
                    strategy_type=MEVStrategyType.SANDWICH,
                    target_tx_hash=event.tx_hash,
                    estimated_profit_usd=estimated_profit_eth * 2000,  # Rough ETH price
                    estimated_profit_eth=estimated_profit_eth,
                    gas_cost_estimate=0.01,  # Rough estimate
                    confidence_score=0.7,
                    network_id=self.network_id,
                    block_number=event.raw_tx_data.get("blockNumber"),
                    execution_params={
                        "victim_tx_hash": event.tx_hash,
                        "victim_swap_amount": event.value,
                        "front_run_amount": int(estimated_profit_eth * 0.1 * 1e18),  # 10% of profit as capital
                        "token_in": decoded_tx.get("input_token"),
                        "token_out": decoded_tx.get("output_token"),
                        "dex_router": event.contract_address
                    },
                    detected_at=time.time()
                )
                opportunity.add_tag("high_value_victim")
                opportunities.append(opportunity)
                
                logger.info(f"Sandwich opportunity detected: {opportunity.opportunity_id}, "
                          f"profit: {estimated_profit_eth:.4f} ETH")
        
        except Exception as e:
            logger.error(f"Error detecting sandwich opportunities: {e}")
        
        return opportunities

    async def _estimate_sandwich_profit(
        self, 
        event: MempoolEvent, 
        decoded_tx: Dict[str, Any]
    ) -> float:
        """
        Estimate potential profit from sandwiching a transaction.
        
        This is a simplified calculation - in practice you'd need:
        - Real-time pool reserves
        - Gas cost calculations
        - Slippage analysis
        - Competition analysis
        """
        try:
            swap_value_eth = wei_to_ether(event.value) if event.value else 0
            
            # Simplified profit estimation based on swap size
            # Larger swaps generally offer more sandwiching profit
            if swap_value_eth >= 10:
                return swap_value_eth * 0.001  # 0.1% profit
            elif swap_value_eth >= 1:
                return swap_value_eth * 0.0005  # 0.05% profit
            else:
                return swap_value_eth * 0.0002  # 0.02% profit
                
        except Exception:
            return 0.0

    async def _detect_arbitrage_opportunities(
        self,
        event: MempoolEvent,
        decoded_tx: Dict[str, Any]
    ) -> List[MEVOpportunity]:
        """
        Detect arbitrage opportunities between different DEXes.
        """
        opportunities = []
        
        try:
            # For demo purposes, create a simple arbitrage opportunity
            # In practice, this would involve:
            # 1. Monitoring multiple DEX pools
            # 2. Calculating price differences
            # 3. Considering gas costs and slippage
            
            swap_value_eth = wei_to_ether(event.value) if event.value else 0
            if swap_value_eth < self.arbitrage_min_start_amount_eth:
                return opportunities
            
            # Simulate finding a price discrepancy
            estimated_profit = swap_value_eth * 0.002  # 0.2% profit
            
            if estimated_profit >= self.arbitrage_min_net_profit_eth:
                opportunity = MEVOpportunity(
                    opportunity_id=f"arbitrage_{event.tx_hash}_{int(time.time())}",
                    strategy_type=MEVStrategyType.ARBITRAGE,
                    target_tx_hash=event.tx_hash,
                    estimated_profit_usd=estimated_profit * 2000,
                    estimated_profit_eth=estimated_profit,
                    gas_cost_estimate=0.005,
                    confidence_score=0.6,
                    network_id=self.network_id,
                    execution_params={
                        "token_pair": f"{decoded_tx.get('input_token', 'ETH')}/{decoded_tx.get('output_token', 'UNKNOWN')}",
                        "dex_a": "uniswap",
                        "dex_b": "sushiswap",
                        "amount": event.value
                    },
                    detected_at=time.time()
                )
                opportunity.add_tag("cross_dex_arbitrage")
                opportunities.append(opportunity)
                
                logger.info(f"Arbitrage opportunity detected: {opportunity.opportunity_id}")
        
        except Exception as e:
            logger.error(f"Error detecting arbitrage opportunities: {e}")
        
        return opportunities

    async def _detect_liquidation_opportunities(
        self,
        event: MempoolEvent,
        decoded_tx: Dict[str, Any]
    ) -> List[MEVOpportunity]:
        """
        Detect liquidation opportunities in lending protocols.
        """
        opportunities = []
        
        try:
            # Check if this is a potential liquidation target
            if "liquidat" in decoded_tx.get("method_name", "").lower():
                # Someone is already trying to liquidate - we might be too late
                return opportunities
            
            # Simplified liquidation detection
            # In practice, you'd monitor lending protocols for:
            # 1. Positions close to liquidation threshold
            # 2. Price movements that push positions underwater
            # 3. Gas price competition for liquidation calls
            
            if event.value and wei_to_ether(event.value) > 1.0:  # Significant transaction
                estimated_profit = wei_to_ether(event.value) * 0.05  # 5% liquidation bonus
                
                if estimated_profit * 2000 >= self.liquidation_min_value_usd:  # Convert to USD
                    opportunity = MEVOpportunity(
                        opportunity_id=f"liquidation_{event.tx_hash}_{int(time.time())}",
                        strategy_type=MEVStrategyType.LIQUIDATION,
                        target_tx_hash=event.tx_hash,
                        estimated_profit_usd=estimated_profit * 2000,
                        estimated_profit_eth=estimated_profit,
                        gas_cost_estimate=0.02,
                        confidence_score=0.4,  # Lower confidence for demo
                        network_id=self.network_id,
                        execution_params={
                            "protocol": "compound",  # or aave
                            "borrower": event.from_address,
                            "collateral_token": "ETH",
                            "debt_token": "DAI"
                        },
                        detected_at=time.time()
                    )
                    opportunity.add_tag("lending_liquidation")
                    opportunities.append(opportunity)
                    
                    logger.info(f"Liquidation opportunity detected: {opportunity.opportunity_id}")
        
        except Exception as e:
            logger.error(f"Error detecting liquidation opportunities: {e}")
        
        return opportunities

    async def update_dex_pools(self, pools_data: List[Dict[str, Any]]) -> None:
        """Update DEX pool information for arbitrage detection."""
        for pool_data in pools_data:
            pool_address = pool_data.get("address", "").lower()
            if pool_address:
                pool_info = DEXPoolInfo(
                    pool_address=pool_address,
                    token0=pool_data.get("token0", "").lower(),
                    token1=pool_data.get("token1", "").lower(),
                    dex_name=pool_data.get("dex_name", "unknown"),
                    reserves0=pool_data.get("reserves0", 0),
                    reserves1=pool_data.get("reserves1", 0),
                    fee=pool_data.get("fee", 3000)
                )
                self.dex_pools[pool_address] = pool_info

    def get_stats(self) -> Dict[str, Any]:
        """Get MEV detection statistics."""
        stats = self.stats.copy()
        stats.update({
            "pending_swaps": len(self.pending_swaps),
            "tracked_pools": len(self.dex_pools),
            "recent_transactions": len(self.recent_transactions),
            "known_dex_routers": len(self.dex_router_addresses),
            "known_lending_protocols": len(self.lending_protocol_addresses)
        })
        return stats

    async def cleanup_expired_data(self) -> None:
        """Clean up expired pending swaps and old transactions."""
        current_time = time.time()
        max_age = 300  # 5 minutes
        
        # Remove expired pending swaps
        expired_swaps = [
            tx_hash for tx_hash, swap in self.pending_swaps.items()
            if current_time - swap.timestamp > max_age
        ]
        
        for tx_hash in expired_swaps:
            del self.pending_swaps[tx_hash]
        
        if expired_swaps:
            logger.debug(f"Cleaned up {len(expired_swaps)} expired pending swaps")
