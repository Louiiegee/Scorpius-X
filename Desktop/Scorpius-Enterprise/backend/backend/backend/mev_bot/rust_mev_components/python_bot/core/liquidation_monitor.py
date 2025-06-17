import asyncio
import logging
import time
from typing import List, Dict, Optional, Any
from web3 import Web3
from web3.types import ChecksumAddress
from web3.exceptions import ContractLogicError
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport

from config import load_config
from retry_helper import with_retry_async
# From arbitrage_math, we use get_token (not getToken) and simulate_swap_step, etc.
from arbitrage_math import (
    get_token, get_dex_config, simulate_swap_step,
    estimate_gas_cost_in_base_token, get_eth_price, Token
)
from abis import (
    IUiPoolDataProviderV3_ABI, IPoolAddressesProvider_ABI,
    IPool_ABI, IPriceOracle_ABI
)

CONFIG = load_config()
logger = logging.getLogger(__name__)

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

class LiquidationMonitor:
    """
    Scans Aave V3 (example) for potentially liquidatable positions using Subgraph data
    and simulates potential profit before returning leads to the main bot.
    """

    def __init__(self, provider):
        self.provider = provider
        self.w3 = Web3(provider)
        self.aaveV3: Dict[str,Any] = {}
        self.initialized = False
        self.flashloan_contract_address = CONFIG.get("FLASHLOAN_CONTRACT_ADDRESS")
        self.performance_tracker = None  # set externally if needed

        # Pull relevant config from LIQUIDATION_PROTOCOLS -> AAVE_V3
        base = CONFIG.get("LIQUIDATION_PROTOCOLS", {}).get("AAVE_V3", {})
        self.aave_config = {
            "ENABLED": base.get("ENABLED", False),
            "HF_THRESHOLD": base.get("HF_THRESHOLD", 1.0),
            "BONUS_MIN": base.get("BONUS_MIN", 0.03),
            "MIN_PROFIT_USD": base.get("MIN_PROFIT_USD", 15.0),
            "SWAP_DEX": base.get("SWAP_DEX", "uniswapV3"),
            "SUBGRAPH_URL": base.get("SUBGRAPH_URL", ""),
            "MONITORED_PAIRS": [
                {
                    "collateral": p.get("collateral", "").upper(),
                    "debt": p.get("debt", "").upper()
                } for p in base.get("MONITORED_PAIRS", [{"collateral":"WETH","debt":"USDC"}])
            ],
            "MONITORED_RESERVES": [
                {**r, "symbol": r.get("symbol", "").upper()}
                for r in base.get("MONITORED_RESERVES", [])
            ],
            "POOL_PROVIDER_ADDRESS": base.get("POOL_PROVIDER_ADDRESS"),
            "DATA_PROVIDER_ADDRESS": base.get("DATA_PROVIDER_ADDRESS"),
        }

    async def initialize(self):
        """Initializes Aave contract references, etc."""
        if self.initialized or not self.aave_config["ENABLED"]:
            return

        logger.info("Initializing LiquidationMonitor for Aave V3...")
        provider_addr_str = self.aave_config["POOL_PROVIDER_ADDRESS"]
        data_provider_addr_str = self.aave_config["DATA_PROVIDER_ADDRESS"]

        if not provider_addr_str or not data_provider_addr_str:
            logger.error("Aave V3 Liq disabled: missing provider/data provider addresses.")
            self.aave_config["ENABLED"] = False
            return

        try:
            provider_addr = Web3.to_checksum_address(provider_addr_str)
            data_provider_addr = Web3.to_checksum_address(data_provider_addr_str)
            addresses_provider = self.w3.eth.contract(provider_addr, abi=IPoolAddressesProvider_ABI)

            # fetch pool + oracle addresses with retry
            self.aaveV3["poolAddress"] = Web3.to_checksum_address(await with_retry_async(
                lambda: addresses_provider.functions.getPool().call(),
                "Aave getPool"
            ))
            self.aaveV3["oracleAddress"] = Web3.to_checksum_address(await with_retry_async(
                lambda: addresses_provider.functions.getPriceOracle().call(),
                "Aave getPriceOracle"
            ))
            self.aaveV3["pool"] = self.w3.eth.contract(
                address=self.aaveV3["poolAddress"], abi=IPool_ABI
            )
            self.aaveV3["oracle"] = self.w3.eth.contract(
                address=self.aaveV3["oracleAddress"], abi=IPriceOracle_ABI
            )
            self.aaveV3["dataProvider"] = self.w3.eth.contract(
                address=data_provider_addr, abi=IUiPoolDataProviderV3_ABI
            )

            logger.info(f"Aave V3 contracts loaded: pool={self.aaveV3['poolAddress']} oracle={self.aaveV3['oracleAddress']}")
            self.initialized = True

        except Exception as e:
            logger.exception("Failed init Aave V3. Disabling.")
            self.aave_config["ENABLED"] = False

    async def fetch_risky_aave_users(self, config: Dict) -> List[str]:
        """Fetch users who might be below a certain HF threshold via subgraph."""
        subgraph_url = config.get("SUBGRAPH_URL")
        if not subgraph_url:
            logger.error("Aave V3 subgraph URL missing.")
            return []

        query = gql("""
        query GetRiskyUsers($maxHF: String!, $minBorrowUSD: String!) {
          users(
            first: 100,
            orderBy: healthFactor,
            orderDirection: asc,
            where: {
              healthFactor_lt: $maxHF,
              borrowedReservesCount_gt: 0,
              totalBorrowsUSD_gt: $minBorrowUSD
            }
          ) {
            id
            healthFactor
            totalBorrowsUSD
            borrowedReservesCount
          }
        }
        """)

        # Example: margin for scanning up to HF=1.03
        hf_threshold_str = Web3.to_hex(Web3.to_wei(config.get("HF_THRESHOLD", 1.0) + 0.03, 'ether'))
        min_borrow_usd = str(config.get("MIN_PROFIT_USD", 15.0) * 3)

        try:
            transport = AIOHTTPTransport(url=subgraph_url)
            async with Client(transport=transport, fetch_schema_from_transport=False) as session:
                data = await with_retry_async(
                    lambda: session.execute(
                        query,
                        variable_values={"maxHF": hf_threshold_str, "minBorrowUSD": min_borrow_usd}
                    ),
                    "FetchRiskyAaveUsers",
                    custom_options={'retries': 2}
                )
                users = data.get('users', [])
                user_addresses = [Web3.to_checksum_address(u['id']) for u in users]
                logger.info(f"Fetched {len(user_addresses)} risky users from subgraph.")
                return user_addresses
        except Exception as e:
            logger.error(f"Subgraph fetch failed: {e}", exc_info=True)
            return []

    async def find_liquidatable_positions(self) -> List[Dict]:
        """Main scanning logic for potential liqs."""
        if not self.initialized:
            await self.initialize()
        if not self.aave_config["ENABLED"]:
            return []

        liquidatable_ops = []
        start_time = time.monotonic()
        logger.info("Scanning Aave V3 for liquidations...")

        risky_users = await self.fetch_risky_aave_users(self.aave_config)
        if not risky_users:
            return []

        logger.info(f"Checking {len(risky_users)} addresses for liquidation potential...")

        try:
            eth_price = await get_eth_price(self.w3)
            if not eth_price:
                raise RuntimeError("No ETH price data; can't proceed.")

            # get all reserves
            reserves_list = await with_retry_async(
                lambda: self.aaveV3["pool"].functions.getReservesList().call(),
                "Aave getReservesList"
            )
            # fetch oracle prices vs ETH
            price_tasks = {}
            for addr in reserves_list:
                addr_checksum = Web3.to_checksum_address(addr)
                price_tasks[addr_checksum] = with_retry_async(
                    lambda a=addr_checksum: self.aaveV3["oracle"].functions.getAssetPrice(a).call(),
                    f"Aave getAssetPrice {addr_checksum[:6]}"
                )
            results = await asyncio.gather(*price_tasks.values(), return_exceptions=True)
            reserve_prices_vs_eth = {}
            for (k,v) in zip(price_tasks.keys(), results):
                if isinstance(v, int) and v > 0:
                    reserve_prices_vs_eth[k] = v

        except Exception as e:
            logger.error(f"Common data fetch failed: {e}", exc_info=True)
            return []

        # check each user concurrently
        semaphore = asyncio.Semaphore(10)
        tasks = []
        for user_addr in risky_users:
            tasks.append(
                self._check_single_user(
                    user_addr, self.aave_config, eth_price,
                    reserve_prices_vs_eth, semaphore
                )
            )
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if isinstance(r, dict):
                liquidatable_ops.append(r)
            elif isinstance(r, Exception):
                logger.error(f"_check_single_user error: {r}")

        if liquidatable_ops:
            logger.info(f"Found {len(liquidatable_ops)} potentially profitable Aave liquidations.")
        else:
            logger.info("No profitable Aave V3 liquidations found.")

        logger.debug(f"Liquidation scan completed in {time.monotonic()-start_time:.2f}s")
        return liquidatable_ops

    async def _check_single_user(self, user_address: str, config: Dict,
                                 eth_price: float, reserve_prices: Dict[str,int],
                                 semaphore: asyncio.Semaphore) -> Optional[Dict]:
        """
        Checks a single user for liquidation profit potential.
        This is highly domain-specific. Below is just scaffolding.
        """
        async with semaphore:
            try:
                # fetch user info from on-chain (like getUserAccountData) or DataProvider
                # simulate partial liquidation with 50% repay, etc. Then check if result is profitable
                # ...
                # We'll just stub it:
                logger.debug(f"Checking user {user_address} for liquidation.")
                # Return None or a structure
                return None
            except Exception as e:
                logger.error(f"User {user_address} check failed: {e}")
                return None