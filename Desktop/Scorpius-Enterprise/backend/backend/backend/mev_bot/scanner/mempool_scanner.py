"""
High-Performance Mempool Scanner
Sustains 3k+ tx/s with adaptive back-pressure and WebSocket connections
"""

import asyncio
import json
import logging
import time
import websockets
from typing import Dict, List, Optional, Callable, Set, Any
from datetime import datetime
from dataclasses import dataclass, field
import aiohttp
from web3 import Web3
from websockets.exceptions import ConnectionClosed, ConnectionClosedError

from ..core.types import TransactionData, NetworkConfig
from .filter_engine import FilterEngine
from .backpressure import BackPressureManager


@dataclass
class ScannerMetrics:
    """Metrics for mempool scanner performance"""
    transactions_received: int = 0
    transactions_filtered: int = 0
    transactions_processed: int = 0
    connections_active: int = 0
    connections_failed: int = 0
    avg_processing_time_ms: float = 0.0
    peak_tx_per_second: float = 0.0
    current_tx_per_second: float = 0.0
    backpressure_events: int = 0
    start_time: Optional[datetime] = None
    
    @property
    def uptime_seconds(self) -> float:
        """Calculate uptime in seconds"""
        if not self.start_time:
            return 0.0
        return (datetime.now() - self.start_time).total_seconds()
    
    @property
    def filter_efficiency(self) -> float:
        """Calculate filter efficiency percentage"""
        if self.transactions_received == 0:
            return 0.0
        return (self.transactions_filtered / self.transactions_received) * 100


class MempoolScanner:
    """
    High-performance mempool scanner with WebSocket connections
    
    Features:
    - Multi-network support (Ethereum, Arbitrum, etc.)
    - Adaptive back-pressure management
    - Real-time filtering with compiled expressions
    - Performance monitoring and alerting
    - Automatic reconnection and failover
    """
    
    def __init__(
        self,
        networks: Dict[str, NetworkConfig],
        filter_engine: FilterEngine,
        on_transaction: Callable[[TransactionData], None],
        max_tx_per_second: int = 3000,
        queue_size: int = 10000
    ):
        """
        Initialize mempool scanner
        
        Args:
            networks: Network configurations
            filter_engine: Filter engine for transaction filtering
            on_transaction: Callback for processed transactions
            max_tx_per_second: Maximum transactions per second to process
            queue_size: Internal queue size for buffering
        """
        self.networks = networks
        self.filter_engine = filter_engine
        self.on_transaction = on_transaction
        self.max_tx_per_second = max_tx_per_second
        self.queue_size = queue_size
        
        self.logger = logging.getLogger("MempoolScanner")
        self.metrics = ScannerMetrics()
        self.backpressure = BackPressureManager(
            max_queue_size=queue_size,
            threshold=0.8  # Start backpressure at 80% capacity
        )
        
        # Internal state
        self._running = False
        self._connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self._tx_queue: asyncio.Queue[TransactionData] = asyncio.Queue(maxsize=queue_size)
        self._tasks: List[asyncio.Task] = []
        
        # Rate limiting
        self._tx_timestamps: List[float] = []
        self._processing_times: List[float] = []
        
        self.logger.info(f"Scanner initialized for {len(networks)} networks")
    
    async def start(self) -> None:
        """Start the mempool scanner"""
        if self._running:
            self.logger.warning("Scanner already running")
            return
        
        self._running = True
        self.metrics.start_time = datetime.now()
        
        self.logger.info("Starting mempool scanner...")
        
        # Start WebSocket connections for each network
        for network_name, network_config in self.networks.items():
            if network_config.ws_url:
                task = asyncio.create_task(
                    self._maintain_websocket_connection(network_name, network_config)
                )
                self._tasks.append(task)
        
        # Start transaction processing loop
        self._tasks.append(asyncio.create_task(self._process_transactions()))
        
        # Start metrics and monitoring
        self._tasks.append(asyncio.create_task(self._update_metrics()))
        self._tasks.append(asyncio.create_task(self._monitor_performance()))
        
        self.logger.info("Mempool scanner started successfully")
    
    async def stop(self) -> None:
        """Stop the mempool scanner"""
        if not self._running:
            return
        
        self.logger.info("Stopping mempool scanner...")
        self._running = False
        
        # Close all WebSocket connections
        for network_name, ws in self._connections.items():
            try:
                await ws.close()
                self.logger.info(f"Closed WebSocket for {network_name}")
            except Exception as e:
                self.logger.error(f"Error closing WebSocket for {network_name}: {e}")
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self._tasks, return_exceptions=True)
        
        self.logger.info("Mempool scanner stopped")
    
    async def _maintain_websocket_connection(self, network_name: str, network_config: NetworkConfig) -> None:
        """
        Maintain WebSocket connection for a network with auto-reconnection
        
        Args:
            network_name: Name of the network
            network_config: Network configuration
        """
        while self._running:
            try:
                self.logger.info(f"Connecting to {network_name} WebSocket: {network_config.ws_url}")
                
                async with websockets.connect(
                    network_config.ws_url,
                    ping_interval=20,
                    ping_timeout=10,
                    close_timeout=10
                ) as websocket:
                    self._connections[network_name] = websocket
                    self.metrics.connections_active += 1
                    
                    # Subscribe to pending transactions
                    subscribe_msg = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "eth_subscribe",
                        "params": ["newPendingTransactions"]
                    }
                    await websocket.send(json.dumps(subscribe_msg))
                    
                    self.logger.info(f"Subscribed to {network_name} pending transactions")
                    
                    # Listen for messages
                    async for message in websocket:
                        if not self._running:
                            break
                        
                        await self._handle_websocket_message(network_name, network_config, message)
                        
            except (ConnectionClosed, ConnectionClosedError) as e:
                self.logger.warning(f"WebSocket connection lost for {network_name}: {e}")
                self.metrics.connections_failed += 1
                
            except Exception as e:
                self.logger.error(f"WebSocket error for {network_name}: {e}")
                self.metrics.connections_failed += 1
            
            finally:
                if network_name in self._connections:
                    del self._connections[network_name]
                    self.metrics.connections_active = max(0, self.metrics.connections_active - 1)
            
            # Wait before reconnecting
            if self._running:
                self.logger.info(f"Reconnecting to {network_name} in 5 seconds...")
                await asyncio.sleep(5)
    
    async def _handle_websocket_message(
        self, 
        network_name: str, 
        network_config: NetworkConfig, 
        message: str
    ) -> None:
        """
        Handle incoming WebSocket message
        
        Args:
            network_name: Network name
            network_config: Network configuration
            message: WebSocket message
        """
        try:
            data = json.loads(message)
            
            # Check if it's a transaction notification
            if "params" in data and "result" in data["params"]:
                tx_hash = data["params"]["result"]
                
                # Fetch full transaction data
                await self._fetch_transaction(network_name, network_config, tx_hash)
                
        except Exception as e:
            self.logger.error(f"Error handling WebSocket message: {e}")
    
    async def _fetch_transaction(
        self, 
        network_name: str, 
        network_config: NetworkConfig, 
        tx_hash: str
    ) -> None:
        """
        Fetch full transaction data and queue for processing
        
        Args:
            network_name: Network name
            network_config: Network configuration  
            tx_hash: Transaction hash
        """
        try:
            # Check backpressure before fetching
            if self.backpressure.should_throttle():
                self.metrics.backpressure_events += 1
                return
            
            # Fetch transaction data via HTTP RPC
            async with aiohttp.ClientSession() as session:
                rpc_data = {
                    "jsonrpc": "2.0",
                    "method": "eth_getTransactionByHash",
                    "params": [tx_hash],
                    "id": 1
                }
                
                async with session.post(network_config.rpc_url, json=rpc_data) as response:
                    result = await response.json()
                    
                    if "result" in result and result["result"]:
                        tx_data = result["result"]
                        
                        # Parse transaction data
                        transaction = self._parse_transaction(network_config.chain_id, tx_data)
                        
                        if transaction:
                            # Apply filters
                            if self.filter_engine.passes_filters(transaction):
                                self.metrics.transactions_filtered += 1
                                
                                # Queue for processing
                                try:
                                    self._tx_queue.put_nowait(transaction)
                                    self.backpressure.update_queue_size(self._tx_queue.qsize())
                                except asyncio.QueueFull:
                                    self.logger.warning("Transaction queue full - dropping transaction")
                                    self.metrics.backpressure_events += 1
                        
                        self.metrics.transactions_received += 1
                        
        except Exception as e:
            self.logger.error(f"Error fetching transaction {tx_hash}: {e}")
    
    def _parse_transaction(self, chain_id: int, tx_data: Dict[str, Any]) -> Optional[TransactionData]:
        """
        Parse raw transaction data
        
        Args:
            chain_id: Blockchain chain ID
            tx_data: Raw transaction data from RPC
            
        Returns:
            Parsed transaction data or None if invalid
        """
        try:
            # Parse hex values
            value = int(tx_data.get("value", "0x0"), 16)
            gas_price = int(tx_data.get("gasPrice", "0x0"), 16)
            gas_limit = int(tx_data.get("gas", "0x0"), 16)
            nonce = int(tx_data.get("nonce", "0x0"), 16)
            
            # Handle EIP-1559 fields
            priority_fee = None
            max_fee = None
            if "maxPriorityFeePerGas" in tx_data:
                priority_fee = int(tx_data["maxPriorityFeePerGas"], 16)
            if "maxFeePerGas" in tx_data:
                max_fee = int(tx_data["maxFeePerGas"], 16)
            
            return TransactionData(
                hash=tx_data["hash"],
                from_address=tx_data["from"],
                to_address=tx_data.get("to"),
                value=value,
                gas_price=gas_price,
                gas_limit=gas_limit,
                data=tx_data.get("input", "0x"),
                nonce=nonce,
                timestamp=datetime.now(),
                priority_fee=priority_fee,
                max_fee=max_fee
            )
            
        except Exception as e:
            self.logger.error(f"Error parsing transaction: {e}")
            return None
    
    async def _process_transactions(self) -> None:
        """Main transaction processing loop"""
        while self._running:
            try:
                # Get transaction with timeout
                transaction = await asyncio.wait_for(self._tx_queue.get(), timeout=1.0)
                
                start_time = time.time()
                
                # Rate limiting check
                current_time = time.time()
                self._tx_timestamps.append(current_time)
                
                # Keep only timestamps from last second
                cutoff_time = current_time - 1.0
                self._tx_timestamps = [ts for ts in self._tx_timestamps if ts > cutoff_time]
                
                # Check if we're exceeding rate limit
                if len(self._tx_timestamps) > self.max_tx_per_second:
                    # Skip processing this transaction
                    continue
                
                # Process transaction
                await self._process_single_transaction(transaction)
                
                # Track processing time
                processing_time = (time.time() - start_time) * 1000
                self._processing_times.append(processing_time)
                
                # Keep only recent processing times
                if len(self._processing_times) > 1000:
                    self._processing_times = self._processing_times[-1000:]
                
                self.metrics.transactions_processed += 1
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.logger.error(f"Error processing transaction: {e}")
    
    async def _process_single_transaction(self, transaction: TransactionData) -> None:
        """
        Process a single transaction
        
        Args:
            transaction: Transaction to process
        """
        try:
            # Call the registered callback
            if asyncio.iscoroutinefunction(self.on_transaction):
                await self.on_transaction(transaction)
            else:
                self.on_transaction(transaction)
                
        except Exception as e:
            self.logger.error(f"Error in transaction callback: {e}")
    
    async def _update_metrics(self) -> None:
        """Update performance metrics"""
        while self._running:
            try:
                # Update current TPS
                current_time = time.time()
                recent_timestamps = [ts for ts in self._tx_timestamps if ts > current_time - 1.0]
                self.metrics.current_tx_per_second = len(recent_timestamps)
                
                # Update peak TPS
                if self.metrics.current_tx_per_second > self.metrics.peak_tx_per_second:
                    self.metrics.peak_tx_per_second = self.metrics.current_tx_per_second
                
                # Update average processing time
                if self._processing_times:
                    self.metrics.avg_processing_time_ms = sum(self._processing_times) / len(self._processing_times)
                
                await asyncio.sleep(1)  # Update every second
                
            except Exception as e:
                self.logger.error(f"Error updating metrics: {e}")
    
    async def _monitor_performance(self) -> None:
        """Monitor performance and log warnings"""
        while self._running:
            try:
                # Check processing time
                if self.metrics.avg_processing_time_ms > 50:  # 50ms threshold
                    self.logger.warning(
                        f"High transaction processing time: {self.metrics.avg_processing_time_ms:.2f}ms"
                    )
                
                # Check queue size
                queue_utilization = self._tx_queue.qsize() / self.queue_size * 100
                if queue_utilization > 80:
                    self.logger.warning(
                        f"High queue utilization: {queue_utilization:.1f}%"
                    )
                
                # Check connection health
                if self.metrics.connections_active < len(self.networks):
                    missing = len(self.networks) - self.metrics.connections_active
                    self.logger.warning(f"{missing} network connections down")
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Error monitoring performance: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive scanner metrics"""
        return {
            'uptime_seconds': self.metrics.uptime_seconds,
            'transactions_received': self.metrics.transactions_received,
            'transactions_filtered': self.metrics.transactions_filtered,
            'transactions_processed': self.metrics.transactions_processed,
            'filter_efficiency': self.metrics.filter_efficiency,
            'current_tx_per_second': self.metrics.current_tx_per_second,
            'peak_tx_per_second': self.metrics.peak_tx_per_second,
            'avg_processing_time_ms': self.metrics.avg_processing_time_ms,
            'connections_active': self.metrics.connections_active,
            'connections_failed': self.metrics.connections_failed,
            'backpressure_events': self.metrics.backpressure_events,
            'queue_size': self._tx_queue.qsize(),
            'queue_capacity': self.queue_size,
            'queue_utilization': (self._tx_queue.qsize() / self.queue_size) * 100,
        }
    
    def is_healthy(self) -> bool:
        """Check if scanner is healthy"""
        if not self._running:
            return False
        
        # Check if we have active connections
        if self.metrics.connections_active == 0:
            return False
        
        # Check processing performance
        if self.metrics.avg_processing_time_ms > 100:  # 100ms threshold
            return False
        
        # Check queue health
        queue_utilization = self._tx_queue.qsize() / self.queue_size
        if queue_utilization > 0.9:  # 90% threshold
            return False
        
        return True
