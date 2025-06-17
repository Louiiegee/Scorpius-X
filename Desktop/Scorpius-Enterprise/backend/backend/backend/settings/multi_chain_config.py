#!/usr/bin/env python3
"""
Multi-Chain Configuration for Elite MEV System
Supports Ethereum, Polygon, Arbitrum, Base, and other chains.
"""
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class SupportedChain(Enum):
    """Supported blockchain networks."""
    ETHEREUM = "ethereum"
    POLYGON = "polygon"
    ARBITRUM = "arbitrum"
    BASE = "base"
    OPTIMISM = "optimism"
    BSC = "bsc"
    AVALANCHE = "avalanche"

@dataclass
class ChainConfig:
    """Configuration for a specific blockchain."""
    chain_id: int
    name: str
    symbol: str
    rpc_url: str
    ws_url: Optional[str]
    explorer_url: str
    native_token: str
    gas_token: str
    block_time_seconds: float
    max_gas_price_gwei: int
    flashloan_providers: List[str]
    major_dexes: Dict[str, str]
    stable_coins: Dict[str, str]
    wrapped_native: str
    multicall_address: Optional[str]
    
    # MEV-specific configuration
    mev_relay_endpoints: List[str]
    builder_endpoints: List[str]
    private_mempool_support: bool
    sandwich_profitability_threshold: float
    arbitrage_profitability_threshold: float
    liquidation_profitability_threshold: float

class MultiChainConfig:
    """Multi-chain configuration manager for Elite MEV System."""
    
    def __init__(self):
        """Initialize multi-chain configuration."""
        self.chains: Dict[SupportedChain, ChainConfig] = {}
        self._load_chain_configs()
    
    def _load_chain_configs(self) -> None:
        """Load configuration for all supported chains."""
        
        # Ethereum Mainnet
        self.chains[SupportedChain.ETHEREUM] = ChainConfig(
            chain_id=1,
            name="Ethereum Mainnet",
            symbol="ETH",
            rpc_url=os.getenv("ALCHEMY_MAINNET", ""),
            ws_url=os.getenv("ALCHEMY_MAINNET_WS", ""),
            explorer_url="https://etherscan.io",
            native_token="ETH",
            gas_token="ETH",
            block_time_seconds=12.0,
            max_gas_price_gwei=500,
            flashloan_providers=["aave", "dydx", "euler", "compound"],
            major_dexes={
                "uniswap_v2": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
                "uniswap_v3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
                "sushiswap": "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
                "1inch": "0x1111111254EEB25477B68fb85Ed929f73A960582",
                "curve": "0x99a58482BD75cbab83b27EC03CA68fF489b5788f"
            },
            stable_coins={
                "USDC": "0xA0b86a33E6411419fd00823E5800174a4fb54b18",
                "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
            },
            wrapped_native="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            multicall_address="0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
            mev_relay_endpoints=[
                "https://relay.flashbots.net",
                "https://rpc.beaverbuild.org",
                "https://rpc.titanbuilder.xyz"
            ],
            builder_endpoints=[
                "https://builder0x69.io",
                "https://rpc.payload.de"
            ],
            private_mempool_support=True,
            sandwich_profitability_threshold=0.005,  # 0.5% minimum
            arbitrage_profitability_threshold=0.003,  # 0.3% minimum
            liquidation_profitability_threshold=0.01   # 1% minimum
        )
        
        # Polygon
        self.chains[SupportedChain.POLYGON] = ChainConfig(
            chain_id=137,
            name="Polygon",
            symbol="MATIC",
            rpc_url=os.getenv("ALCHEMY_POLYGON", ""),
            ws_url=os.getenv("ALCHEMY_POLYGON_WS", ""),
            explorer_url="https://polygonscan.com",
            native_token="MATIC",
            gas_token="MATIC",
            block_time_seconds=2.0,
            max_gas_price_gwei=1000,
            flashloan_providers=["aave", "quickswap"],
            major_dexes={
                "quickswap": "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
                "sushiswap": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
                "uniswap_v3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
                "1inch": "0x1111111254EEB25477B68fb85Ed929f73A960582"
            },
            stable_coins={
                "USDC": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
                "USDT": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
                "DAI": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
            },
            wrapped_native="0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
            multicall_address="0x275617327c958bD06b5D6b871E7f491D76113dd8",
            mev_relay_endpoints=[],  # No major MEV relays yet
            builder_endpoints=[],
            private_mempool_support=False,
            sandwich_profitability_threshold=0.002,  # Lower fees = lower threshold
            arbitrage_profitability_threshold=0.001,
            liquidation_profitability_threshold=0.005
        )
        
        # Arbitrum
        self.chains[SupportedChain.ARBITRUM] = ChainConfig(
            chain_id=42161,
            name="Arbitrum One",
            symbol="ETH",
            rpc_url=os.getenv("ALCHEMY_ARBITRUM", ""),
            ws_url=os.getenv("ALCHEMY_ARBITRUM_WS", ""),
            explorer_url="https://arbiscan.io",
            native_token="ETH",
            gas_token="ETH",
            block_time_seconds=0.25,  # ~250ms blocks
            max_gas_price_gwei=50,
            flashloan_providers=["aave", "radiant"],
            major_dexes={
                "uniswap_v3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
                "sushiswap": "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
                "camelot": "0xc873fEcbd354f5A56E00E710B90EF4201db2448d",
                "1inch": "0x1111111254EEB25477B68fb85Ed929f73A960582"
            },
            stable_coins={
                "USDC": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
                "USDT": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                "DAI": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
            },
            wrapped_native="0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
            multicall_address="0x842eC2c7D803033Edf55E478F461FC547Bc54EB2",
            mev_relay_endpoints=[],
            builder_endpoints=[],
            private_mempool_support=False,
            sandwich_profitability_threshold=0.001,  # Very low gas fees
            arbitrage_profitability_threshold=0.0005,
            liquidation_profitability_threshold=0.002
        )
        
        # Base
        self.chains[SupportedChain.BASE] = ChainConfig(
            chain_id=8453,
            name="Base",
            symbol="ETH",
            rpc_url=os.getenv("ALCHEMY_BASE", ""),
            ws_url=os.getenv("ALCHEMY_BASE_WS", ""),
            explorer_url="https://basescan.org",
            native_token="ETH",
            gas_token="ETH",
            block_time_seconds=2.0,
            max_gas_price_gwei=50,
            flashloan_providers=["aave"],
            major_dexes={
                "uniswap_v3": "0x2626664c2603336E57B271c5C0b26F421741e481",
                "sushiswap": "0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891",
                "1inch": "0x1111111254EEB25477B68fb85Ed929f73A960582"
            },
            stable_coins={
                "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                "DAI": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
            },
            wrapped_native="0x4200000000000000000000000000000000000006",
            multicall_address="0xcA11bde05977b3631167028862bE2a173976CA11",
            mev_relay_endpoints=[],
            builder_endpoints=[],
            private_mempool_support=False,
            sandwich_profitability_threshold=0.001,
            arbitrage_profitability_threshold=0.0005,
            liquidation_profitability_threshold=0.002
        )
        
        # Add other chains...
        self._add_optimism_config()
        self._add_bsc_config()
        self._add_avalanche_config()
    
    def _add_optimism_config(self) -> None:
        """Add Optimism configuration."""
        self.chains[SupportedChain.OPTIMISM] = ChainConfig(
            chain_id=10,
            name="Optimism",
            symbol="ETH",
            rpc_url=os.getenv("ALCHEMY_OPTIMISM", ""),
            ws_url=os.getenv("ALCHEMY_OPTIMISM_WS", ""),
            explorer_url="https://optimistic.etherscan.io",
            native_token="ETH",
            gas_token="ETH",
            block_time_seconds=2.0,
            max_gas_price_gwei=50,
            flashloan_providers=["aave"],
            major_dexes={
                "uniswap_v3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
                "1inch": "0x1111111254EEB25477B68fb85Ed929f73A960582"
            },
            stable_coins={
                "USDC": "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
                "USDT": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
                "DAI": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
            },
            wrapped_native="0x4200000000000000000000000000000000000006",
            multicall_address="0xcA11bde05977b3631167028862bE2a173976CA11",
            mev_relay_endpoints=[],
            builder_endpoints=[],
            private_mempool_support=False,
            sandwich_profitability_threshold=0.001,
            arbitrage_profitability_threshold=0.0005,
            liquidation_profitability_threshold=0.002
        )
    
    def _add_bsc_config(self) -> None:
        """Add Binance Smart Chain configuration."""
        self.chains[SupportedChain.BSC] = ChainConfig(
            chain_id=56,
            name="Binance Smart Chain",
            symbol="BNB",
            rpc_url=os.getenv("BSC_RPC", "https://bsc-dataseed.binance.org/"),
            ws_url=None,
            explorer_url="https://bscscan.com",
            native_token="BNB",
            gas_token="BNB",
            block_time_seconds=3.0,
            max_gas_price_gwei=20,
            flashloan_providers=["venus", "pancakeswap"],
            major_dexes={
                "pancakeswap": "0x10ED43C718714eb63d5aA57B78B54704E256024E",
                "1inch": "0x1111111254EEB25477B68fb85Ed929f73A960582"
            },
            stable_coins={
                "USDC": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
                "USDT": "0x55d398326f99059fF775485246999027B3197955",
                "BUSD": "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
            },
            wrapped_native="0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            multicall_address="0xcA11bde05977b3631167028862bE2a173976CA11",
            mev_relay_endpoints=[],
            builder_endpoints=[],
            private_mempool_support=False,
            sandwich_profitability_threshold=0.001,
            arbitrage_profitability_threshold=0.0005,
            liquidation_profitability_threshold=0.002
        )
    
    def _add_avalanche_config(self) -> None:
        """Add Avalanche configuration."""
        self.chains[SupportedChain.AVALANCHE] = ChainConfig(
            chain_id=43114,
            name="Avalanche C-Chain",
            symbol="AVAX",
            rpc_url=os.getenv("AVALANCHE_RPC", "https://api.avax.network/ext/bc/C/rpc"),
            ws_url=None,
            explorer_url="https://snowtrace.io",
            native_token="AVAX",
            gas_token="AVAX",
            block_time_seconds=2.0,
            max_gas_price_gwei=50,
            flashloan_providers=["aave", "benqi"],
            major_dexes={
                "traderjoe": "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
                "pangolin": "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"
            },
            stable_coins={
                "USDC": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
                "USDT": "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"
            },
            wrapped_native="0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
            multicall_address="0xcA11bde05977b3631167028862bE2a173976CA11",
            mev_relay_endpoints=[],
            builder_endpoints=[],
            private_mempool_support=False,
            sandwich_profitability_threshold=0.001,
            arbitrage_profitability_threshold=0.0005,
            liquidation_profitability_threshold=0.002
        )
    
    def get_chain_config(self, chain: SupportedChain) -> Optional[ChainConfig]:
        """Get configuration for a specific chain."""
        return self.chains.get(chain)
    
    def get_all_chains(self) -> List[SupportedChain]:
        """Get list of all supported chains."""
        return list(self.chains.keys())
    
    def get_chains_with_flashloans(self) -> List[SupportedChain]:
        """Get chains that support flashloans."""
        return [
            chain for chain, config in self.chains.items()
            if config.flashloan_providers
        ]
    
    def get_chains_with_mev_support(self) -> List[SupportedChain]:
        """Get chains with MEV relay support."""
        return [
            chain for chain, config in self.chains.items()
            if config.private_mempool_support or config.mev_relay_endpoints
        ]
    
    def get_low_fee_chains(self) -> List[SupportedChain]:
        """Get chains with low transaction fees (good for smaller opportunities)."""
        return [
            chain for chain, config in self.chains.items()
            if config.max_gas_price_gwei <= 100
        ]
    
    def validate_chain_setup(self, chain: SupportedChain) -> bool:
        """Validate that a chain is properly configured."""
        config = self.get_chain_config(chain)
        if not config:
            return False
        
        # Check essential configuration
        if not config.rpc_url:
            return False
        
        if not config.major_dexes:
            return False
        
        if not config.stable_coins:
            return False
        
        return True
    
    def get_cross_chain_opportunities(self) -> List[tuple]:
        """Get potential cross-chain arbitrage pairs."""
        opportunities = []
        chains = list(self.chains.keys())
        
        for i, chain1 in enumerate(chains):
            for chain2 in chains[i+1:]:
                config1 = self.chains[chain1]
                config2 = self.chains[chain2]
                
                # Find common tokens
                common_stables = set(config1.stable_coins.keys()) & set(config2.stable_coins.keys())
                if common_stables:
                    opportunities.append((chain1, chain2, list(common_stables)))
        
        return opportunities

# Global multi-chain configuration instance
multi_chain_config = MultiChainConfig()
