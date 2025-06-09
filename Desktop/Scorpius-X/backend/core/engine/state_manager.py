"""
State Manager for Blockchain Time Machine
Handles blockchain state snapshots, restoration, and comparison.
"""

import asyncio
import json
import redis
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from web3 import Web3
from sqlalchemy.orm import Session
import logging
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import gzip
import base64

logger = logging.getLogger(__name__)


@dataclass
class StateSnapshot:
    """State snapshot data structure"""
    snapshot_id: str
    block_number: int
    block_hash: str
    timestamp: datetime
    addresses: List[str]
    state_data: Dict[str, Any]
    metadata: Dict[str, Any]


@dataclass
class StateDifference:
    """State difference between two snapshots"""
    address: str
    field: str  # balance, nonce, code, storage
    before_value: Any
    after_value: Any
    change_amount: Optional[float] = None


class StateManager:
    """Manages blockchain state snapshots and restoration"""
    
    def __init__(self, 
                 web3_provider: Web3, 
                 redis_client: redis.Redis,
                 database_session: Session):
        self.w3 = web3_provider
        self.redis = redis_client
        self.db = database_session
        self.snapshot_cache = {}
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Configuration
        self.snapshot_ttl = timedelta(hours=24)  # Default TTL for snapshots
        self.max_storage_slots = 1000  # Limit storage slots per contract
        
    async def create_state_snapshot(self, 
                                  block_number: int, 
                                  addresses: Optional[List[str]] = None,
                                  include_storage: bool = True) -> str:
        """
        Create a comprehensive state snapshot at specific block
        
        Args:
            block_number: Block number to snapshot
            addresses: Specific addresses to include (None = auto-detect from block)
            include_storage: Whether to include contract storage
            
        Returns:
            Snapshot ID for later restoration
        """
        snapshot_id = f"snapshot_{block_number}_{int(datetime.now().timestamp())}"
        
        try:
            logger.info(f"Creating state snapshot at block {block_number}")
            
            # Get block data
            block = await self._get_block_data(block_number)
            
            # Extract addresses if not provided
            if addresses is None:
                addresses = await self._extract_addresses_from_block(block)
            
            logger.info(f"Capturing state for {len(addresses)} addresses")
            
            # Capture state for all addresses
            state_data = {}
            tasks = []
            
            # Process addresses in batches to avoid overwhelming RPC
            batch_size = 10
            for i in range(0, len(addresses), batch_size):
                batch = addresses[i:i + batch_size]
                task = self._capture_batch_state(batch, block_number, include_storage)
                tasks.append(task)
            
            # Execute all batch tasks
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results
            for result in batch_results:
                if isinstance(result, dict):
                    state_data.update(result)
                else:
                    logger.error(f"Batch processing error: {result}")
            
            # Create snapshot object
            snapshot = StateSnapshot(
                snapshot_id=snapshot_id,
                block_number=block_number,
                block_hash=block['hash'].hex(),
                timestamp=datetime.utcnow(),
                addresses=addresses,
                state_data=state_data,
                metadata={
                    "total_addresses": len(addresses),
                    "block_timestamp": block['timestamp'],
                    "include_storage": include_storage,
                    "chain_id": await self._get_chain_id()
                }
            )
            
            # Store snapshot
            await self._store_snapshot(snapshot)
            
            logger.info(f"State snapshot {snapshot_id} created successfully")
            return snapshot_id
            
        except Exception as e:
            logger.error(f"Failed to create state snapshot: {str(e)}")
            raise Exception(f"State snapshot creation failed: {str(e)}")
    
    async def _capture_batch_state(self, 
                                 addresses: List[str], 
                                 block_number: int, 
                                 include_storage: bool) -> Dict[str, Any]:
        """Capture state for a batch of addresses"""
        batch_state = {}
        
        for address in addresses:
            try:
                state = await self._capture_address_state(address, block_number, include_storage)
                batch_state[address] = state
            except Exception as e:
                logger.warning(f"Failed to capture state for {address}: {str(e)}")
                batch_state[address] = {"error": str(e)}
        
        return batch_state
    
    async def _capture_address_state(self, 
                                   address: str, 
                                   block_number: int, 
                                   include_storage: bool) -> Dict[str, Any]:
        """Capture complete state for a specific address"""
        try:
            # Basic state
            state = {
                "balance": str(self.w3.eth.get_balance(address, block_number)),
                "nonce": self.w3.eth.get_transaction_count(address, block_number),
                "code": None,
                "storage": {}
            }
            
            # Check if address is a contract
            code = self.w3.eth.get_code(address, block_number)
            if code and code != b'':
                state["code"] = code.hex()
                
                # Get contract storage if requested
                if include_storage:
                    storage = await self._get_contract_storage(address, block_number)
                    state["storage"] = storage
            
            return state
            
        except Exception as e:
            logger.error(f"Error capturing state for {address}: {str(e)}")
            return {"error": str(e)}
    
    async def _get_contract_storage(self, address: str, block_number: int) -> Dict[str, str]:
        """
        Get contract storage slots (limited to prevent excessive data)
        Note: This is a simplified implementation. Production would need more sophisticated storage discovery.
        """
        storage = {}
        
        try:
            # Get common storage slots (0-99)
            # In production, you'd want storage slot discovery from transaction traces
            for slot in range(min(100, self.max_storage_slots)):
                slot_hex = f"0x{slot:064x}"
                try:
                    value = self.w3.eth.get_storage_at(address, slot, block_number)
                    if value != b'\x00' * 32:  # Only store non-zero values
                        storage[slot_hex] = value.hex()
                except Exception:
                    continue  # Skip failed storage reads
            
            return storage
            
        except Exception as e:
            logger.warning(f"Storage retrieval failed for {address}: {str(e)}")
            return {}
    
    async def restore_state_snapshot(self, snapshot_id: str) -> StateSnapshot:
        """Restore blockchain state from snapshot"""
        try:
            # Try cache first
            if snapshot_id in self.snapshot_cache:
                return self.snapshot_cache[snapshot_id]
            
            # Try Redis
            snapshot_data = self.redis.get(f"snapshot:{snapshot_id}")
            if snapshot_data:
                data = json.loads(snapshot_data)
                snapshot = StateSnapshot(**data)
                
                # Cache for quick access
                self.snapshot_cache[snapshot_id] = snapshot
                return snapshot
            
            raise ValueError(f"Snapshot {snapshot_id} not found")
            
        except Exception as e:
            logger.error(f"Failed to restore snapshot {snapshot_id}: {str(e)}")
            raise
    
    async def diff_state_snapshots(self, 
                                 before_snapshot_id: str, 
                                 after_snapshot_id: str) -> List[StateDifference]:
        """Compare two state snapshots and return differences"""
        try:
            before_state = await self.restore_state_snapshot(before_snapshot_id)
            after_state = await self.restore_state_snapshot(after_snapshot_id)
            
            differences = []
            
            # Get all addresses from both snapshots
            all_addresses = set(before_state.addresses) | set(after_state.addresses)
            
            for address in all_addresses:
                before_addr_state = before_state.state_data.get(address, {})
                after_addr_state = after_state.state_data.get(address, {})
                
                # Compare balance
                before_balance = int(before_addr_state.get("balance", "0"))
                after_balance = int(after_addr_state.get("balance", "0"))
                if before_balance != after_balance:
                    differences.append(StateDifference(
                        address=address,
                        field="balance",
                        before_value=before_balance,
                        after_value=after_balance,
                        change_amount=float(after_balance - before_balance) / 1e18  # Convert to ETH
                    ))
                
                # Compare nonce
                before_nonce = before_addr_state.get("nonce", 0)
                after_nonce = after_addr_state.get("nonce", 0)
                if before_nonce != after_nonce:
                    differences.append(StateDifference(
                        address=address,
                        field="nonce",
                        before_value=before_nonce,
                        after_value=after_nonce,
                        change_amount=after_nonce - before_nonce
                    ))
                
                # Compare code
                before_code = before_addr_state.get("code")
                after_code = after_addr_state.get("code")
                if before_code != after_code:
                    differences.append(StateDifference(
                        address=address,
                        field="code",
                        before_value=before_code,
                        after_value=after_code
                    ))
                
                # Compare storage
                before_storage = before_addr_state.get("storage", {})
                after_storage = after_addr_state.get("storage", {})
                storage_diffs = self._compare_storage(before_storage, after_storage)
                for slot, (before_val, after_val) in storage_diffs.items():
                    differences.append(StateDifference(
                        address=address,
                        field=f"storage[{slot}]",
                        before_value=before_val,
                        after_value=after_val
                    ))
            
            return differences
            
        except Exception as e:
            logger.error(f"Failed to diff snapshots: {str(e)}")
            raise
    
    def _compare_storage(self, before: Dict[str, str], after: Dict[str, str]) -> Dict[str, tuple]:
        """Compare storage mappings and return differences"""
        differences = {}
        all_slots = set(before.keys()) | set(after.keys())
        
        for slot in all_slots:
            before_val = before.get(slot, "0x" + "00" * 32)
            after_val = after.get(slot, "0x" + "00" * 32)
            
            if before_val != after_val:
                differences[slot] = (before_val, after_val)
        
        return differences
    
    async def _store_snapshot(self, snapshot: StateSnapshot):
        """Store snapshot in Redis with compression"""
        try:
            # Serialize snapshot data
            snapshot_dict = {
                "snapshot_id": snapshot.snapshot_id,
                "block_number": snapshot.block_number,
                "block_hash": snapshot.block_hash,
                "timestamp": snapshot.timestamp.isoformat(),
                "addresses": snapshot.addresses,
                "state_data": snapshot.state_data,
                "metadata": snapshot.metadata
            }
            
            # Compress large snapshots
            serialized = json.dumps(snapshot_dict, default=str)
            if len(serialized) > 1024 * 1024:  # 1MB threshold
                compressed = gzip.compress(serialized.encode())
                encoded = base64.b64encode(compressed).decode()
                snapshot_dict["_compressed"] = True
                snapshot_dict["_data"] = encoded
                # Clear large data from main object
                snapshot_dict["state_data"] = {}
            
            # Store in Redis with TTL
            self.redis.setex(
                f"snapshot:{snapshot.snapshot_id}",
                self.snapshot_ttl,
                json.dumps(snapshot_dict, default=str)
            )
            
            # Cache in memory
            self.snapshot_cache[snapshot.snapshot_id] = snapshot
            
        except Exception as e:
            logger.error(f"Failed to store snapshot: {str(e)}")
            raise
    
    async def _get_block_data(self, block_number: int) -> Dict[str, Any]:
        """Get block data with full transactions"""
        try:
            block = self.w3.eth.get_block(block_number, full_transactions=True)
            return block
        except Exception as e:
            logger.error(f"Failed to get block {block_number}: {str(e)}")
            raise
    
    async def _extract_addresses_from_block(self, block: Dict[str, Any]) -> List[str]:
        """Extract all unique addresses from a block"""
        addresses = set()
        
        # Add addresses from transactions
        for tx in block.get('transactions', []):
            if isinstance(tx, dict):
                if tx.get('from'):
                    addresses.add(tx['from'])
                if tx.get('to'):
                    addresses.add(tx['to'])
        
        return list(addresses)
    
    async def _get_chain_id(self) -> int:
        """Get chain ID from web3 provider"""
        try:
            return self.w3.eth.chain_id
        except Exception:
            return 1  # Default to mainnet
    
    async def cleanup_old_snapshots(self, max_age_hours: int = 24):
        """Clean up old snapshots from Redis and memory cache"""
        try:
            # Get all snapshot keys
            pattern = "snapshot:*"
            keys = self.redis.keys(pattern)
            
            current_time = datetime.utcnow()
            cleaned_count = 0
            
            for key in keys:
                try:
                    # Check snapshot age
                    snapshot_data = self.redis.get(key)
                    if snapshot_data:
                        data = json.loads(snapshot_data)
                        timestamp = datetime.fromisoformat(data.get('timestamp', ''))
                        
                        if (current_time - timestamp).total_seconds() > max_age_hours * 3600:
                            self.redis.delete(key)
                            
                            # Remove from memory cache
                            snapshot_id = data.get('snapshot_id')
                            if snapshot_id in self.snapshot_cache:
                                del self.snapshot_cache[snapshot_id]
                            
                            cleaned_count += 1
                            
                except Exception as e:
                    logger.warning(f"Error cleaning snapshot {key}: {str(e)}")
                    continue
            
            logger.info(f"Cleaned up {cleaned_count} old snapshots")
            
        except Exception as e:
            logger.error(f"Snapshot cleanup failed: {str(e)}")


async def create_state_manager(web3_url: str, redis_url: str = "redis://localhost:6379/0") -> StateManager:
    """Factory function to create StateManager with proper connections"""
    try:
        # Initialize Web3
        w3 = Web3(Web3.HTTPProvider(web3_url))
        
        # Initialize Redis
        redis_client = redis.from_url(redis_url)
        
        # Test connections
        if not w3.is_connected():
            raise Exception("Failed to connect to Web3 provider")
        
        redis_client.ping()
        
        # Note: database_session should be provided by the caller
        # This is just for connection testing
        return StateManager(w3, redis_client, None)
        
    except Exception as e:
        logger.error(f"Failed to create StateManager: {str(e)}")
        raise
