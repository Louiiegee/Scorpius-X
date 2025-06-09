"""
Chain Adapter for Blockchain Time Machine
Abstracts blockchain RPC interactions and provides unified interface for different chains.
"""

import asyncio
import aiohttp
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from web3 import Web3
from web3.middleware import geth_poa_middleware
import logging
from dataclasses import dataclass
from abc import ABC, abstractmethod
import json

logger = logging.getLogger(__name__)


@dataclass
class ChainConfig:
    """Configuration for blockchain connection"""
    chain_id: int
    name: str
    rpc_url: str
    archive_url: Optional[str] = None
    ws_url: Optional[str] = None
    explorer_url: Optional[str] = None
    native_currency: str = "ETH"
    block_time: float = 12.0  # Average block time in seconds
    confirmations_required: int = 12
    supports_debug_trace: bool = False
    supports_archive: bool = True


@dataclass
class ForkConfig:
    """Configuration for blockchain fork creation"""
    fork_url: str
    block_number: int
    chain_id: int
    accounts: List[str] = None
    balance: str = "1000000000000000000000"  # 1000 ETH in wei
    gas_limit: int = 12000000
    gas_price: int = 20000000000  # 20 gwei
    
    def __post_init__(self):
        if self.accounts is None:
            self.accounts = []


class BaseChainAdapter(ABC):
    """Abstract base class for chain adapters"""
    
    @abstractmethod
    async def get_block(self, block_identifier: Union[int, str], full_transactions: bool = False) -> Dict[str, Any]:
        """Get block data"""
        pass
    
    @abstractmethod
    async def get_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction data"""
        pass
    
    @abstractmethod
    async def get_transaction_receipt(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction receipt"""
        pass
    
    @abstractmethod
    async def create_fork(self, config: ForkConfig) -> str:
        """Create blockchain fork"""
        pass
    
    @abstractmethod
    async def trace_transaction(self, tx_hash: str, tracer_config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Trace transaction execution"""
        pass


class EthereumAdapter(BaseChainAdapter):
    """Ethereum blockchain adapter"""
    
    def __init__(self, config: ChainConfig):
        self.config = config
        self.w3 = Web3(Web3.HTTPProvider(config.rpc_url))
        
        # Add PoA middleware if needed
        if config.chain_id in [56, 137, 250]:  # BSC, Polygon, Fantom
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Archive node connection
        self.archive_w3 = None
        if config.archive_url:
            self.archive_w3 = Web3(Web3.HTTPProvider(config.archive_url))
            if config.chain_id in [56, 137, 250]:
                self.archive_w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Session for HTTP requests
        self.session = None
        
        # Fork management
        self.active_forks: Dict[str, Dict[str, Any]] = {}
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def get_block(self, block_identifier: Union[int, str], full_transactions: bool = False) -> Dict[str, Any]:
        """Get block data from blockchain"""
        try:
            # Use archive node if available and block is old
            w3_instance = self._get_appropriate_w3(block_identifier)
            
            block = w3_instance.eth.get_block(block_identifier, full_transactions=full_transactions)
            
            # Convert to serializable format
            return self._serialize_block(block)
            
        except Exception as e:
            logger.error(f"Failed to get block {block_identifier}: {str(e)}")
            raise
    
    async def get_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction data"""
        try:
            tx = self.w3.eth.get_transaction(tx_hash)
            return self._serialize_transaction(tx)
            
        except Exception as e:
            logger.error(f"Failed to get transaction {tx_hash}: {str(e)}")
            raise
    
    async def get_transaction_receipt(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction receipt"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            return self._serialize_receipt(receipt)
            
        except Exception as e:
            logger.error(f"Failed to get receipt {tx_hash}: {str(e)}")
            raise
    
    async def get_account_state(self, address: str, block_identifier: Union[int, str] = "latest") -> Dict[str, Any]:
        """Get account state at specific block"""
        try:
            w3_instance = self._get_appropriate_w3(block_identifier)
            
            balance = w3_instance.eth.get_balance(address, block_identifier)
            nonce = w3_instance.eth.get_transaction_count(address, block_identifier)
            code = w3_instance.eth.get_code(address, block_identifier)
            
            return {
                "address": address,
                "balance": str(balance),
                "nonce": nonce,
                "code": code.hex() if code else "0x",
                "block": block_identifier
            }
            
        except Exception as e:
            logger.error(f"Failed to get account state for {address}: {str(e)}")
            raise
    
    async def get_storage_at(self, address: str, slot: str, block_identifier: Union[int, str] = "latest") -> str:
        """Get contract storage at specific slot"""
        try:
            w3_instance = self._get_appropriate_w3(block_identifier)
            
            storage_value = w3_instance.eth.get_storage_at(address, slot, block_identifier)
            return storage_value.hex()
            
        except Exception as e:
            logger.error(f"Failed to get storage for {address} at slot {slot}: {str(e)}")
            return "0x" + "00" * 32
    
    async def create_fork(self, config: ForkConfig) -> str:
        """Create blockchain fork for isolated execution"""
        try:
            fork_id = f"fork_{config.chain_id}_{config.block_number}_{int(datetime.now().timestamp())}"
            
            # In a real implementation, this would use Anvil, Hardhat, or Ganache
            # For now, we'll simulate fork creation
            fork_data = {
                "fork_id": fork_id,
                "chain_id": config.chain_id,
                "block_number": config.block_number,
                "fork_url": config.fork_url,
                "created_at": datetime.utcnow(),
                "accounts": config.accounts,
                "balance": config.balance,
                "gas_limit": config.gas_limit,
                "gas_price": config.gas_price,
                "status": "active"
            }
            
            self.active_forks[fork_id] = fork_data
            
            logger.info(f"Created fork {fork_id} at block {config.block_number}")
            return fork_id
            
        except Exception as e:
            logger.error(f"Failed to create fork: {str(e)}")
            raise
    
    async def get_fork_status(self, fork_id: str) -> Optional[Dict[str, Any]]:
        """Get fork status and information"""
        return self.active_forks.get(fork_id)
    
    async def destroy_fork(self, fork_id: str) -> bool:
        """Destroy a blockchain fork"""
        try:
            if fork_id in self.active_forks:
                del self.active_forks[fork_id]
                logger.info(f"Destroyed fork {fork_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to destroy fork {fork_id}: {str(e)}")
            return False
    
    async def trace_transaction(self, tx_hash: str, tracer_config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Trace transaction execution with debug_traceTransaction"""
        try:
            if not self.config.supports_debug_trace:
                return await self._simulate_trace(tx_hash)
            
            # Use debug_traceTransaction if available
            trace_config = tracer_config or {
                "tracer": "callTracer",
                "tracerConfig": {
                    "withLog": True
                }
            }
            
            # Make RPC call for tracing
            trace_result = await self._make_trace_rpc_call(tx_hash, trace_config)
            return trace_result
            
        except Exception as e:
            logger.warning(f"Transaction tracing failed, using simulation: {str(e)}")
            return await self._simulate_trace(tx_hash)
    
    async def batch_get_blocks(self, block_numbers: List[int]) -> List[Dict[str, Any]]:
        """Get multiple blocks in batch"""
        try:
            tasks = [self.get_block(block_num) for block_num in block_numbers]
            blocks = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out exceptions
            valid_blocks = []
            for i, block in enumerate(blocks):
                if isinstance(block, Exception):
                    logger.warning(f"Failed to get block {block_numbers[i]}: {str(block)}")
                else:
                    valid_blocks.append(block)
            
            return valid_blocks
            
        except Exception as e:
            logger.error(f"Batch block retrieval failed: {str(e)}")
            raise
    
    async def batch_get_transactions(self, tx_hashes: List[str]) -> List[Dict[str, Any]]:
        """Get multiple transactions in batch"""
        try:
            tasks = [self.get_transaction(tx_hash) for tx_hash in tx_hashes]
            transactions = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out exceptions
            valid_transactions = []
            for i, tx in enumerate(transactions):
                if isinstance(tx, Exception):
                    logger.warning(f"Failed to get transaction {tx_hashes[i]}: {str(tx)}")
                else:
                    valid_transactions.append(tx)
            
            return valid_transactions
            
        except Exception as e:
            logger.error(f"Batch transaction retrieval failed: {str(e)}")
            raise
    
    async def simulate_transaction(self, transaction: Dict[str, Any], block_identifier: Union[int, str] = "latest") -> Dict[str, Any]:
        """Simulate transaction execution without state changes"""
        try:
            w3_instance = self._get_appropriate_w3(block_identifier)
            
            # Use eth_call for simulation
            call_result = w3_instance.eth.call(transaction, block_identifier)
            
            return {
                "success": True,
                "return_value": call_result.hex(),
                "gas_used": transaction.get('gas', 21000) // 2,  # Estimate
                "error": None
            }
            
        except Exception as e:
            return {
                "success": False,
                "return_value": None,
                "gas_used": 0,
                "error": str(e)
            }
    
    def _get_appropriate_w3(self, block_identifier: Union[int, str]) -> Web3:
        """Get appropriate Web3 instance (archive vs regular)"""
        # If block identifier is a number and it's old, use archive node
        if isinstance(block_identifier, int):
            current_block = self.w3.eth.block_number
            if current_block - block_identifier > 128 and self.archive_w3:
                return self.archive_w3
        
        return self.w3
    
    def _serialize_block(self, block) -> Dict[str, Any]:
        """Convert Web3 block to serializable format"""
        return {
            "number": block.number,
            "hash": block.hash.hex(),
            "parentHash": block.parentHash.hex(),
            "timestamp": block.timestamp,
            "gasLimit": block.gasLimit,
            "gasUsed": block.gasUsed,
            "miner": block.miner,
            "difficulty": block.difficulty,
            "totalDifficulty": block.totalDifficulty,
            "size": block.size,
            "transactions": [tx.hex() if hasattr(tx, 'hex') else self._serialize_transaction(tx) for tx in block.transactions],
            "transactionsRoot": block.transactionsRoot.hex(),
            "stateRoot": block.stateRoot.hex(),
            "receiptsRoot": block.receiptsRoot.hex()
        }
    
    def _serialize_transaction(self, tx) -> Dict[str, Any]:
        """Convert Web3 transaction to serializable format"""
        return {
            "hash": tx.hash.hex(),
            "blockNumber": tx.blockNumber,
            "blockHash": tx.blockHash.hex() if tx.blockHash else None,
            "transactionIndex": tx.transactionIndex,
            "from": tx['from'],
            "to": tx.to,
            "value": tx.value,
            "gas": tx.gas,
            "gasPrice": tx.gasPrice,
            "nonce": tx.nonce,
            "input": tx.input.hex(),
            "type": getattr(tx, 'type', 0),
            "chainId": getattr(tx, 'chainId', self.config.chain_id)
        }
    
    def _serialize_receipt(self, receipt) -> Dict[str, Any]:
        """Convert Web3 receipt to serializable format"""
        return {
            "transactionHash": receipt.transactionHash.hex(),
            "transactionIndex": receipt.transactionIndex,
            "blockNumber": receipt.blockNumber,
            "blockHash": receipt.blockHash.hex(),
            "from": receipt['from'],
            "to": receipt.to,
            "gasUsed": receipt.gasUsed,
            "cumulativeGasUsed": receipt.cumulativeGasUsed,
            "effectiveGasPrice": getattr(receipt, 'effectiveGasPrice', receipt.gasUsed),
            "status": receipt.status,
            "logs": [self._serialize_log(log) for log in receipt.logs],
            "logsBloom": receipt.logsBloom.hex(),
            "type": getattr(receipt, 'type', 0)
        }
    
    def _serialize_log(self, log) -> Dict[str, Any]:
        """Convert Web3 log to serializable format"""
        return {
            "address": log.address,
            "topics": [topic.hex() for topic in log.topics],
            "data": log.data.hex(),
            "blockNumber": log.blockNumber,
            "transactionHash": log.transactionHash.hex(),
            "transactionIndex": log.transactionIndex,
            "blockHash": log.blockHash.hex(),
            "logIndex": log.logIndex
        }
    
    async def _make_trace_rpc_call(self, tx_hash: str, trace_config: Dict[str, Any]) -> Dict[str, Any]:
        """Make RPC call for transaction tracing"""
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            rpc_data = {
                "jsonrpc": "2.0",
                "method": "debug_traceTransaction",
                "params": [tx_hash, trace_config],
                "id": 1
            }
            
            async with self.session.post(
                self.config.rpc_url,
                json=rpc_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()
                
                if "error" in result:
                    raise Exception(f"RPC error: {result['error']}")
                
                return result.get("result", {})
                
        except Exception as e:
            logger.error(f"RPC trace call failed: {str(e)}")
            raise
    
    async def _simulate_trace(self, tx_hash: str) -> Dict[str, Any]:
        """Simulate transaction trace when debug_traceTransaction is not available"""
        try:
            # Get transaction and receipt
            tx = await self.get_transaction(tx_hash)
            receipt = await self.get_transaction_receipt(tx_hash)
            
            # Create simulated trace
            trace = {
                "type": "CALL",
                "from": tx["from"],
                "to": tx["to"],
                "value": tx["value"],
                "gas": tx["gas"],
                "gasUsed": receipt["gasUsed"],
                "input": tx["input"],
                "output": "0x1",  # Simulated output
                "calls": []  # Nested calls would be here
            }
            
            return trace
            
        except Exception as e:
            logger.error(f"Trace simulation failed: {str(e)}")
            return {}


class PolygonAdapter(EthereumAdapter):
    """Polygon blockchain adapter (inherits from Ethereum)"""
    
    def __init__(self, config: ChainConfig):
        super().__init__(config)
        # Polygon-specific configurations
        self.config.block_time = 2.0  # Faster blocks
        self.config.confirmations_required = 20


class BSCAdapter(EthereumAdapter):
    """Binance Smart Chain adapter (inherits from Ethereum)"""
    
    def __init__(self, config: ChainConfig):
        super().__init__(config)
        # BSC-specific configurations
        self.config.block_time = 3.0
        self.config.confirmations_required = 15


class ChainAdapterFactory:
    """Factory for creating chain adapters"""
    
    ADAPTERS = {
        1: EthereumAdapter,      # Ethereum mainnet
        137: PolygonAdapter,     # Polygon
        56: BSCAdapter,          # BSC
        250: EthereumAdapter,    # Fantom
        42161: EthereumAdapter,  # Arbitrum
        10: EthereumAdapter      # Optimism
    }
    
    @classmethod
    def create_adapter(cls, config: ChainConfig) -> BaseChainAdapter:
        """Create appropriate adapter for chain"""
        adapter_class = cls.ADAPTERS.get(config.chain_id, EthereumAdapter)
        return adapter_class(config)
    
    @classmethod
    def get_supported_chains(cls) -> List[int]:
        """Get list of supported chain IDs"""
        return list(cls.ADAPTERS.keys())


# Predefined chain configurations
CHAIN_CONFIGS = {
    1: ChainConfig(
        chain_id=1,
        name="Ethereum",
        rpc_url="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
        supports_debug_trace=True,
        supports_archive=True
    ),
    137: ChainConfig(
        chain_id=137,
        name="Polygon",
        rpc_url="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY",
        native_currency="MATIC",
        block_time=2.0,
        confirmations_required=20
    ),
    56: ChainConfig(
        chain_id=56,
        name="BSC",
        rpc_url="https://bsc-dataseed1.binance.org",
        native_currency="BNB",
        block_time=3.0,
        confirmations_required=15
    )
}


async def create_chain_adapter(chain_id: int, rpc_url: str = None) -> BaseChainAdapter:
    """Factory function to create chain adapter"""
    try:
        # Get predefined config or create new one
        if chain_id in CHAIN_CONFIGS:
            config = CHAIN_CONFIGS[chain_id]
            if rpc_url:
                config.rpc_url = rpc_url
        else:
            config = ChainConfig(
                chain_id=chain_id,
                name=f"Chain_{chain_id}",
                rpc_url=rpc_url or "http://localhost:8545"
            )
        
        return ChainAdapterFactory.create_adapter(config)
        
    except Exception as e:
        logger.error(f"Failed to create chain adapter: {str(e)}")
        raise
