import asyncio
import random
import time
import logging
from typing import List, Optional, Dict, Any

from web3 import Web3, AsyncHTTPProvider, WebsocketProvider
from web3.providers.async_base import AsyncBaseProvider
from cachetools import TTLCache

from config import load_config
from retry_helper import with_retry_async

CONFIG = load_config()
logger = logging.getLogger(__name__)

# Tracks short-term health of each provider
provider_health_cache = TTLCache(
    maxsize=100,
    ttl=CONFIG.get("CACHE_PROVIDER_HEALTH_TTL_S", 10)
)

class ProviderManager:
    """
    Manages multiple (primary + fallback) RPC endpoints with asynchronous or WebSocket providers.
    Periodically checks health/latency to pick the best.
    """

    def __init__(self):
        if not CONFIG.get("RPC_URL"):
            raise ValueError("Must specify an RPC_URL in config.")

        fallback_urls = CONFIG.get("FALLBACK_RPC_URLS", [])
        primary_url = CONFIG.get("WS_RPC_URL") or CONFIG.get("RPC_URL")

        self.initial_provider = primary_url

        # Build primary & fallback providers
        self.providers: Dict[str, Any] = {
            "primary": self._create_async_provider(primary_url, is_websocket_preferred=True),
            "fallbacks": []
        }

        # Always ensure the main RPC is in fallback list if it's distinct from WS
        main_http_provider = None
        if CONFIG["RPC_URL"] and CONFIG["RPC_URL"] != primary_url:
            main_http_provider = self._create_async_provider(CONFIG["RPC_URL"], is_websocket_preferred=False)

        if main_http_provider:
            self.providers["fallbacks"].append(main_http_provider)

        # Add user-defined fallback URLs
        for url in fallback_urls:
            provider_obj = self._create_async_provider(url, is_websocket_preferred=False)
            if provider_obj:
                self.providers["fallbacks"].append(provider_obj)

        # Filter out any None
        self.providers["fallbacks"] = [p for p in self.providers["fallbacks"] if p]

        # If primary is None, promote first fallback
        if not self.providers["primary"]:
            if self.providers["fallbacks"]:
                fallback_first = self.providers["fallbacks"].pop(0)
                logger.warning(f"Primary provider creation failed, promoting fallback {self._get_provider_url(fallback_first)}.")
                self.providers["primary"] = fallback_first
            else:
                raise ConnectionError("No providers (primary or fallback) could be created.")

        self.current_provider: Optional[AsyncBaseProvider] = self.providers["primary"]
        if not self.current_provider:
            raise ConnectionError("ProviderManager: No valid provider after init.")

        self.provider_latency: Dict[str, float] = {}
        self._latency_check_task: Optional[asyncio.Task] = None

        logger.info(
            f"ProviderManager: Primary={self._get_provider_url(self.current_provider)}, "
            f"Fallbacks={[self._get_provider_url(p) for p in self.providers['fallbacks']]}"
        )

    async def init_async(self):
        """Async init to start tasks once an event loop is running."""
        self._start_latency_monitoring()

    def _get_provider_url(self, provider: Optional[AsyncBaseProvider]) -> str:
        """Safely extract a URL from the provider if possible."""
        if not provider:
            return "(None)"
        return getattr(provider, '_endpoint_uri', getattr(provider, 'endpoint_uri', '(Unknown)'))

    def _create_async_provider(self, url: str, is_websocket_preferred: bool) -> Optional[AsyncBaseProvider]:
        if not url:
            return None
        try:
            request_kwargs = {'timeout': CONFIG.get("RPC_TIMEOUT_S", 15)}

            # If it's explicitly WSS and we want WebSocket, try that
            if is_websocket_preferred and url.startswith('ws'):
                logger.debug(f"Trying WebsocketProvider for {url}")
                return Web3(WebsocketProvider(url, websocket_timeout=request_kwargs['timeout'] * 2)).provider

            elif url.startswith('http'):
                logger.debug(f"Creating AsyncHTTPProvider for {url}")
                return AsyncHTTPProvider(url, request_kwargs=request_kwargs)

            elif url.startswith('ws'):
                logger.debug(f"Got WS URL but not preferred; falling back to AsyncHTTPProvider for {url}.")
                return AsyncHTTPProvider(url, request_kwargs=request_kwargs)
            else:
                logger.error(f"Invalid URL (not http or ws): {url}")
                return None
        except Exception as e:
            logger.error(f"Failed to create provider for {url}: {e}")
            return None

    def _start_latency_monitoring(self):
        """Starts background latency checks if enabled."""
        interval_s = CONFIG.get("providerLatencyCheckInterval", 15)
        if interval_s <= 0:
            logger.info("Latency monitoring disabled by config.")
            return

        valid_providers = []
        if self.providers["primary"]:
            valid_providers.append(self.providers["primary"])
        valid_providers.extend(self.providers["fallbacks"])
        if not valid_providers:
            return

        async def latency_loop():
            logger.info(f"Starting latency checks every {interval_s}s...")
            while True:
                await asyncio.sleep(interval_s)
                tasks = []
                for p in valid_providers:
                    tasks.append(self._check_single_provider_latency(p))
                await asyncio.gather(*tasks, return_exceptions=True)

        self._latency_check_task = asyncio.create_task(latency_loop())

    async def _check_single_provider_latency(self, provider: AsyncBaseProvider):
        url = self._get_provider_url(provider)

        async def check_block_number():
            return await provider.request_func("eth_blockNumber", [])

        start_t = time.monotonic()
        try:
            await with_retry_async(
                f"HealthCheck({url})",
                check_block_number,
                max_retries=2
            )
        except Exception:
            logger.warning(f"Provider health check failed for {url}: 'coroutine' object is not callable")
            raise

    async def get_provider(self) -> Web3:
        """
        Returns a Web3 instance using the currently selected best provider.
        If the current is unhealthy, tries to find the best fallback.
        """
        # Check if local dev node
        if self.initial_provider and ("127.0.0.1" in self.initial_provider or "localhost" in self.initial_provider):
            try:
                w3_local = Web3(Web3.HTTPProvider(self.initial_provider))
                w3_local.eth.chain_id  # test call
                # If no exception, we assume local node is up
                return w3_local
            except Exception as e:
                logger.error(f"Local node {self.initial_provider} connection error: {e}")
                # fall through to standard approach

        if self.current_provider and await self.is_provider_healthy(self.current_provider):
            return Web3(self.current_provider)

        logger.warning(f"Current provider {self._get_provider_url(self.current_provider)} is unhealthy. Selecting optimal.")
        new_provider = await self.get_optimal_provider()
        return Web3(new_provider)

    async def is_provider_healthy(self, provider: AsyncBaseProvider) -> bool:
        """Checks cached health for the provider, or does a quick check if not cached."""
        url = self._get_provider_url(provider)
        if not url or url.startswith('(Unknown'):
            return False

        # local node short-circuit
        if "127.0.0.1" in url or "localhost" in url:
            provider_health_cache[url] = True
            return True

        if url in provider_health_cache:
            return provider_health_cache[url]

        try:
            w3_temp = Web3(provider)
            async def health_check():
                return await w3_temp.eth.chain_id
            await with_retry_async(
                f"HealthCheck({url})",
                health_check,
                max_retries=1
            )
            provider_health_cache[url] = True
            return True
        except Exception as e:
            logger.warning(f"Provider health check failed for {url}: {e}")
            provider_health_cache[url] = False
            return False

    async def get_optimal_provider(self) -> AsyncBaseProvider:
        """Selects the lowest-latency healthy provider from primary + fallbacks."""
        logger.info("ProviderManager: searching best provider by health/latency...")
        candidates = []

        # Primary
        primary = self.providers["primary"]
        if primary and await self.is_provider_healthy(primary):
            p_url = self._get_provider_url(primary)
            lat = self.provider_latency.get(p_url, float('inf'))
            candidates.append({"provider": primary, "latency": lat, "url": p_url, "isPrimary": True})

        # Fallbacks
        for p in self.providers["fallbacks"]:
            if p and await self.is_provider_healthy(p):
                f_url = self._get_provider_url(p)
                lat = self.provider_latency.get(f_url, float('inf'))
                candidates.append({"provider": p, "latency": lat, "url": f_url, "isPrimary": False})

        if not candidates:
            logger.critical("No healthy providers found!")
            raise ConnectionError("All providers are down or unhealthy.")

        candidates.sort(key=lambda x: x["latency"])
        best = candidates[0]
        old_url = self._get_provider_url(self.current_provider)
        if old_url != best["url"]:
            logger.info(f"Switching provider from {old_url} to {best['url']} (latency {best['latency']:.1f}ms).")
            self.current_provider = best["provider"]
        return self.current_provider

    async def get_network(self, provider_to_check: Optional[AsyncBaseProvider] = None) -> Optional[Dict[str, Any]]:
        """Gets chain_id and a guess at the name for the given provider (or current)."""
        provider = provider_to_check or self.current_provider
        if not provider:
            return None
        w3_temp = Web3(provider)

        async def fetch_chain_id():
            return await w3_temp.eth.chain_id

        try:
            chain_id = await with_retry_async(f"getChainId({self._get_provider_url(provider)})", fetch_chain_id)
            net_map = {1:"mainnet",11155111:"sepolia",137:"polygon",42161:"arbitrum",8453:"base"}
            return {"chainId": chain_id, "name": net_map.get(chain_id,"unknown")}
        except Exception as e:
            logger.error(f"Failed to get network info: {e}")
            return None

    async def stop(self):
        """Stop background tasks (e.g., latency checks)."""
        logger.info("ProviderManager stopping latency monitor.")
        if self._latency_check_task and not self._latency_check_task.done():
            self._latency_check_task.cancel()
