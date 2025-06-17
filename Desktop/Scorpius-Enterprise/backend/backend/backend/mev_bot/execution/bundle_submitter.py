"""
Bundle Submission Engine with Multi-Relay Support
Handles bundle submission to Flashbots, MEV-Share, and other relays
"""

import asyncio
import logging
import time
import json
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import aiohttp
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

from ..core.types import BundleRequest, BundleTransaction, BundleStatus


class RelayType(Enum):
    """Supported relay types"""
    FLASHBOTS = "flashbots"
    MEV_SHARE = "mev_share"
    BUILDER_0X69 = "builder_0x69"
    EDEN_NETWORK = "eden_network"
    MANIFOLD = "manifold"


@dataclass
class RelayEndpoint:
    """Relay endpoint configuration"""
    name: str
    relay_type: RelayType
    url: str
    auth_header: Optional[str] = None
    priority: int = 1  # Lower = higher priority
    max_bundles_per_block: int = 10
    bundle_simulation: bool = True
    
    # Performance tracking
    success_rate: float = 1.0
    avg_response_time: float = 0.0
    last_success: Optional[float] = None
    consecutive_failures: int = 0


@dataclass
class BundleSubmissionResult:
    """Result of bundle submission"""
    bundle_id: str
    relay_name: str
    status: BundleStatus
    block_number: int
    submitted_at: float
    included: bool = False
    error: Optional[str] = None
    simulation_result: Optional[Dict[str, Any]] = None
    gas_used: Optional[int] = None
    profit_wei: Optional[int] = None
    
    @property
    def response_time(self) -> float:
        """Time from submission to result"""
        return time.time() - self.submitted_at


class RelayClient(ABC):
    """Abstract base class for relay clients"""
    
    def __init__(self, endpoint: RelayEndpoint, private_key: str, explain: bool = False):
        """
        Initialize relay client
        
        Args:
            endpoint: Relay endpoint configuration
            private_key: Private key for signing
            explain: Enable explanations
        """
        self.endpoint = endpoint
        self.private_key = private_key
        self.explain = explain
        self.logger = logging.getLogger(f"RelayClient.{endpoint.name}")
        
        # Account for signing
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        
        # HTTP session
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def start(self) -> None:
        """Start the relay client"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
    
    async def stop(self) -> None:
        """Stop the relay client"""
        if self.session:
            await self.session.close()
            self.session = None
    
    @abstractmethod
    async def submit_bundle(
        self, 
        bundle: BundleRequest,
        bundle_id: str
    ) -> BundleSubmissionResult:
        """
        Submit bundle to relay
        
        Args:
            bundle: Bundle to submit
            bundle_id: Unique bundle identifier
            
        Returns:
            Submission result
        """
        pass
    
    @abstractmethod
    async def check_bundle_status(self, bundle_id: str) -> BundleSubmissionResult:
        """
        Check status of submitted bundle
        
        Args:
            bundle_id: Bundle identifier
            
        Returns:
            Current bundle status
        """
        pass
    
    def _sign_message(self, message: str) -> str:
        """Sign message with private key"""
        message_hash = encode_defunct(text=message)
        signature = self.account.sign_message(message_hash)
        return signature.signature.hex()


class FlashbotsRelay(RelayClient):
    """
    Flashbots relay client
    
    Implements Flashbots bundle submission API
    """
    
    def __init__(self, endpoint: RelayEndpoint, private_key: str, explain: bool = False):
        super().__init__(endpoint, private_key, explain)
        self.bundle_cache: Dict[str, BundleRequest] = {}
    
    async def submit_bundle(
        self, 
        bundle: BundleRequest,
        bundle_id: str
    ) -> BundleSubmissionResult:
        """Submit bundle to Flashbots"""
        try:
            if self.explain:
                self.logger.info(f"Submitting bundle {bundle_id} to Flashbots")
            
            # Cache bundle for status checking
            self.bundle_cache[bundle_id] = bundle
            
            # Build Flashbots bundle
            flashbots_bundle = await self._build_flashbots_bundle(bundle)
            
            # Sign the bundle
            body = json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_sendBundle",
                "params": [flashbots_bundle]
            })
            
            # Create signature
            message = f"{self.address}:{Web3.keccak(text=body).hex()}"
            signature = self._sign_message(message)
            
            headers = {
                "Content-Type": "application/json",
                "X-Flashbots-Signature": f"{self.address}:{signature}"
            }
            
            # Submit bundle
            start_time = time.time()
            async with self.session.post(
                self.endpoint.url,
                data=body,
                headers=headers
            ) as response:
                response_data = await response.json()
                
                if response.status == 200 and "error" not in response_data:
                    if self.explain:
                        self.logger.info(f"Bundle {bundle_id} submitted successfully")
                    
                    return BundleSubmissionResult(
                        bundle_id=bundle_id,
                        relay_name=self.endpoint.name,
                        status=BundleStatus.SUBMITTED,
                        block_number=bundle.block_number,
                        submitted_at=start_time
                    )
                else:
                    error_msg = response_data.get("error", {}).get("message", "Unknown error")
                    self.logger.error(f"Bundle submission failed: {error_msg}")
                    
                    return BundleSubmissionResult(
                        bundle_id=bundle_id,
                        relay_name=self.endpoint.name,
                        status=BundleStatus.FAILED,
                        block_number=bundle.block_number,
                        submitted_at=start_time,
                        error=error_msg
                    )
        
        except Exception as e:
            self.logger.error(f"Error submitting bundle: {e}")
            return BundleSubmissionResult(
                bundle_id=bundle_id,
                relay_name=self.endpoint.name,
                status=BundleStatus.FAILED,
                block_number=bundle.block_number,
                submitted_at=time.time(),
                error=str(e)
            )
    
    async def check_bundle_status(self, bundle_id: str) -> BundleSubmissionResult:
        """Check Flashbots bundle status"""
        try:
            # Get bundle from cache
            bundle = self.bundle_cache.get(bundle_id)
            if not bundle:
                return BundleSubmissionResult(
                    bundle_id=bundle_id,
                    relay_name=self.endpoint.name,
                    status=BundleStatus.UNKNOWN,
                    block_number=0,
                    submitted_at=time.time(),
                    error="Bundle not found in cache"
                )
            
            # Check bundle inclusion via eth_getBundleStats
            body = json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "flashbots_getBundleStats",
                "params": [
                    {
                        "bundleHash": bundle_id,
                        "blockNumber": hex(bundle.block_number)
                    }
                ]
            })
            
            message = f"{self.address}:{Web3.keccak(text=body).hex()}"
            signature = self._sign_message(message)
            
            headers = {
                "Content-Type": "application/json",
                "X-Flashbots-Signature": f"{self.address}:{signature}"
            }
            
            async with self.session.post(
                self.endpoint.url,
                data=body,
                headers=headers
            ) as response:
                response_data = await response.json()
                
                if response.status == 200 and "result" in response_data:
                    stats = response_data["result"]
                    included = stats.get("isSimulated", False) and stats.get("isHighPriority", False)
                    
                    return BundleSubmissionResult(
                        bundle_id=bundle_id,
                        relay_name=self.endpoint.name,
                        status=BundleStatus.INCLUDED if included else BundleStatus.PENDING,
                        block_number=bundle.block_number,
                        submitted_at=time.time(),
                        included=included,
                        simulation_result=stats
                    )
                else:
                    return BundleSubmissionResult(
                        bundle_id=bundle_id,
                        relay_name=self.endpoint.name,
                        status=BundleStatus.PENDING,
                        block_number=bundle.block_number,
                        submitted_at=time.time()
                    )
        
        except Exception as e:
            self.logger.error(f"Error checking bundle status: {e}")
            return BundleSubmissionResult(
                bundle_id=bundle_id,
                relay_name=self.endpoint.name,
                status=BundleStatus.UNKNOWN,
                block_number=0,
                submitted_at=time.time(),
                error=str(e)
            )
    
    async def _build_flashbots_bundle(self, bundle: BundleRequest) -> Dict[str, Any]:
        """Build Flashbots-compatible bundle"""
        transactions = []
        
        for tx in bundle.transactions:
            # Build transaction dict
            tx_dict = {
                "to": tx.to,
                "value": hex(tx.value),
                "data": tx.data,
                "gas": hex(tx.gas_limit),
                "gasPrice": hex(tx.gas_price)
            }
            
            transactions.append(tx_dict)
        
        flashbots_bundle = {
            "txs": transactions,
            "blockNumber": hex(bundle.block_number)
        }
        
        if bundle.min_timestamp:
            flashbots_bundle["minTimestamp"] = bundle.min_timestamp
        
        if bundle.max_timestamp:
            flashbots_bundle["maxTimestamp"] = bundle.max_timestamp
        
        return flashbots_bundle


class MEVShareRelay(RelayClient):
    """
    MEV-Share relay client
    
    Implements MEV-Share bundle submission
    """
    
    async def submit_bundle(
        self, 
        bundle: BundleRequest,
        bundle_id: str
    ) -> BundleSubmissionResult:
        """Submit bundle to MEV-Share"""
        try:
            if self.explain:
                self.logger.info(f"Submitting bundle {bundle_id} to MEV-Share")
            
            # Build MEV-Share bundle (similar to Flashbots but with privacy params)
            mev_share_bundle = await self._build_mev_share_bundle(bundle)
            
            body = json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "mev_sendBundle",
                "params": [mev_share_bundle]
            })
            
            headers = {"Content-Type": "application/json"}
            
            start_time = time.time()
            async with self.session.post(
                self.endpoint.url,
                data=body,
                headers=headers
            ) as response:
                response_data = await response.json()
                
                if response.status == 200 and "error" not in response_data:
                    return BundleSubmissionResult(
                        bundle_id=bundle_id,
                        relay_name=self.endpoint.name,
                        status=BundleStatus.SUBMITTED,
                        block_number=bundle.block_number,
                        submitted_at=start_time
                    )
                else:
                    error_msg = response_data.get("error", {}).get("message", "Unknown error")
                    return BundleSubmissionResult(
                        bundle_id=bundle_id,
                        relay_name=self.endpoint.name,
                        status=BundleStatus.FAILED,
                        block_number=bundle.block_number,
                        submitted_at=start_time,
                        error=error_msg
                    )
        
        except Exception as e:
            return BundleSubmissionResult(
                bundle_id=bundle_id,
                relay_name=self.endpoint.name,
                status=BundleStatus.FAILED,
                block_number=bundle.block_number,
                submitted_at=time.time(),
                error=str(e)
            )
    
    async def check_bundle_status(self, bundle_id: str) -> BundleSubmissionResult:
        """Check MEV-Share bundle status"""
        # MEV-Share status checking implementation
        return BundleSubmissionResult(
            bundle_id=bundle_id,
            relay_name=self.endpoint.name,
            status=BundleStatus.PENDING,
            block_number=0,
            submitted_at=time.time()
        )
    
    async def _build_mev_share_bundle(self, bundle: BundleRequest) -> Dict[str, Any]:
        """Build MEV-Share bundle with privacy settings"""
        transactions = []
        
        for tx in bundle.transactions:
            tx_dict = {
                "to": tx.to,
                "value": hex(tx.value),
                "data": tx.data,
                "gas": hex(tx.gas_limit),
                "gasPrice": hex(tx.gas_price)
            }
            transactions.append(tx_dict)
        
        return {
            "version": "v0.1",
            "inclusion": {
                "block": bundle.block_number,
                "maxBlock": bundle.block_number + 3  # Allow up to 3 blocks
            },
            "body": transactions,
            "privacy": {
                "hints": ["calldata", "logs"],  # What to share
                "builders": ["flashbots"]  # Which builders to send to
            }
        }


class BundleSubmitter:
    """
    Multi-relay bundle submission manager
    
    Features:
    - Multiple relay support
    - Automatic relay selection
    - Fallback mechanisms
    - Performance monitoring
    """
    
    def __init__(self, private_key: str, explain: bool = False):
        """
        Initialize bundle submitter
        
        Args:
            private_key: Private key for signing
            explain: Enable explanations
        """
        self.private_key = private_key
        self.explain = explain
        self.logger = logging.getLogger("BundleSubmitter")
        
        # Relay management
        self.relays: Dict[str, RelayClient] = {}
        self.relay_configs: Dict[str, RelayEndpoint] = {}
        
        # Submission tracking
        self.active_submissions: Dict[str, List[BundleSubmissionResult]] = {}
        self.submission_history: List[BundleSubmissionResult] = []
        
        # Performance metrics
        self.metrics = {
            'bundles_submitted': 0,
            'bundles_included': 0,
            'total_profit_wei': 0,
            'total_gas_used': 0,
            'relay_performance': {}
        }
        
        # Default relay configurations
        self._setup_default_relays()
        
        self.logger.info("Bundle submitter initialized")
    
    def _setup_default_relays(self) -> None:
        """Setup default relay configurations"""
        self.relay_configs = {
            "flashbots": RelayEndpoint(
                name="flashbots",
                relay_type=RelayType.FLASHBOTS,
                url="https://relay.flashbots.net",
                priority=1
            ),
            "flashbots_goerli": RelayEndpoint(
                name="flashbots_goerli",
                relay_type=RelayType.FLASHBOTS,
                url="https://relay-goerli.flashbots.net",
                priority=2
            ),
            "builder_0x69": RelayEndpoint(
                name="builder_0x69",
                relay_type=RelayType.BUILDER_0X69,
                url="https://rpc.builder0x69.io",
                priority=3
            )
        }
    
    async def start(self) -> None:
        """Start all relay clients"""
        for name, config in self.relay_configs.items():
            if config.relay_type == RelayType.FLASHBOTS:
                client = FlashbotsRelay(config, self.private_key, self.explain)
            elif config.relay_type == RelayType.MEV_SHARE:
                client = MEVShareRelay(config, self.private_key, self.explain)
            else:
                # Generic relay client
                client = FlashbotsRelay(config, self.private_key, self.explain)  # Fallback
            
            await client.start()
            self.relays[name] = client
            
            # Initialize performance tracking
            self.metrics['relay_performance'][name] = {
                'submissions': 0,
                'successes': 0,
                'failures': 0,
                'avg_response_time': 0.0
            }
        
        self.logger.info(f"Started {len(self.relays)} relay clients")
    
    async def stop(self) -> None:
        """Stop all relay clients"""
        for client in self.relays.values():
            await client.stop()
        
        self.relays.clear()
        self.logger.info("Stopped all relay clients")
    
    async def submit_bundle(
        self, 
        bundle: BundleRequest,
        bundle_id: str,
        preferred_relays: Optional[List[str]] = None
    ) -> List[BundleSubmissionResult]:
        """
        Submit bundle to multiple relays
        
        Args:
            bundle: Bundle to submit
            bundle_id: Unique bundle identifier
            preferred_relays: List of preferred relay names
            
        Returns:
            List of submission results
        """
        try:
            if self.explain:
                self.logger.info(f"Submitting bundle {bundle_id} to relays")
            
            # Select relays to use
            selected_relays = await self._select_relays(preferred_relays)
            
            # Submit to selected relays concurrently
            submission_tasks = []
            for relay_name in selected_relays:
                if relay_name in self.relays:
                    task = asyncio.create_task(
                        self.relays[relay_name].submit_bundle(bundle, bundle_id)
                    )
                    submission_tasks.append(task)
            
            # Wait for all submissions
            results = await asyncio.gather(*submission_tasks, return_exceptions=True)
            
            # Process results
            submission_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    self.logger.error(f"Relay submission failed: {result}")
                    # Create error result
                    submission_results.append(BundleSubmissionResult(
                        bundle_id=bundle_id,
                        relay_name=selected_relays[i],
                        status=BundleStatus.FAILED,
                        block_number=bundle.block_number,
                        submitted_at=time.time(),
                        error=str(result)
                    ))
                else:
                    submission_results.append(result)
                    
                    # Update relay performance
                    relay_name = result.relay_name
                    perf = self.metrics['relay_performance'][relay_name]
                    perf['submissions'] += 1
                    
                    if result.status == BundleStatus.SUBMITTED:
                        perf['successes'] += 1
                    else:
                        perf['failures'] += 1
            
            # Store active submissions
            self.active_submissions[bundle_id] = submission_results
            self.submission_history.extend(submission_results)
            
            self.metrics['bundles_submitted'] += 1
            
            if self.explain:
                successful_submissions = sum(1 for r in submission_results if r.status == BundleStatus.SUBMITTED)
                self.logger.info(
                    f"Bundle {bundle_id}: {successful_submissions}/{len(submission_results)} "
                    f"successful submissions"
                )
            
            return submission_results
            
        except Exception as e:
            self.logger.error(f"Error submitting bundle: {e}")
            return []
    
    async def check_bundle_inclusion(self, bundle_id: str) -> List[BundleSubmissionResult]:
        """
        Check if bundle was included in any relay
        
        Args:
            bundle_id: Bundle identifier
            
        Returns:
            Updated submission results
        """
        try:
            if bundle_id not in self.active_submissions:
                return []
            
            # Check status with all relays
            check_tasks = []
            original_results = self.active_submissions[bundle_id]
            
            for result in original_results:
                if result.relay_name in self.relays:
                    task = asyncio.create_task(
                        self.relays[result.relay_name].check_bundle_status(bundle_id)
                    )
                    check_tasks.append(task)
            
            # Wait for status checks
            updated_results = await asyncio.gather(*check_tasks, return_exceptions=True)
            
            # Process updated results
            final_results = []
            for i, result in enumerate(updated_results):
                if isinstance(result, Exception):
                    # Keep original result if check failed
                    final_results.append(original_results[i])
                else:
                    final_results.append(result)
                    
                    # Update metrics if included
                    if result.included and not original_results[i].included:
                        self.metrics['bundles_included'] += 1
                        if result.profit_wei:
                            self.metrics['total_profit_wei'] += result.profit_wei
                        if result.gas_used:
                            self.metrics['total_gas_used'] += result.gas_used
            
            # Update active submissions
            self.active_submissions[bundle_id] = final_results
            
            return final_results
            
        except Exception as e:
            self.logger.error(f"Error checking bundle inclusion: {e}")
            return self.active_submissions.get(bundle_id, [])
    
    async def _select_relays(self, preferred_relays: Optional[List[str]] = None) -> List[str]:
        """
        Select optimal relays for bundle submission
        
        Args:
            preferred_relays: Preferred relay names
            
        Returns:
            List of selected relay names
        """
        if preferred_relays:
            # Use preferred relays if specified
            return [name for name in preferred_relays if name in self.relays]
        
        # Select relays based on performance and priority
        available_relays = []
        for name, config in self.relay_configs.items():
            if name in self.relays:
                perf = self.metrics['relay_performance'][name]
                success_rate = perf['successes'] / max(perf['submissions'], 1)
                
                available_relays.append((name, config.priority, success_rate))
        
        # Sort by priority (lower = better) and success rate
        available_relays.sort(key=lambda x: (x[1], -x[2]))
        
        # Select top 3 relays
        return [name for name, _, _ in available_relays[:3]]
    
    def get_submission_stats(self) -> Dict[str, Any]:
        """Get bundle submission statistics"""
        total_submissions = len(self.submission_history)
        included_count = sum(1 for r in self.submission_history if r.included)
        
        return {
            'total_bundles_submitted': self.metrics['bundles_submitted'],
            'total_bundles_included': self.metrics['bundles_included'],
            'inclusion_rate': included_count / max(total_submissions, 1),
            'total_profit_wei': self.metrics['total_profit_wei'],
            'total_profit_eth': self.metrics['total_profit_wei'] / 10**18,
            'total_gas_used': self.metrics['total_gas_used'],
            'relay_performance': self.metrics['relay_performance'],
            'active_submissions': len(self.active_submissions)
        }
