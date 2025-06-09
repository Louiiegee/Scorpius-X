"""
Transaction Executor for Blockchain Time Machine
Handles detailed transaction execution with full tracing and state capture.
"""

import asyncio
import json
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from web3 import Web3
from eth_account import Account
import logging
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


@dataclass
class ExecutionContext:
    """Execution context for transaction replay"""
    block_number: int
    timestamp: int
    gas_limit: int
    gas_price: int
    chain_id: int
    coinbase: str
    difficulty: int
    base_fee: Optional[int] = None


@dataclass
class TraceStep:
    """Individual step in transaction execution trace"""
    pc: int
    op: str
    gas: int
    gas_cost: int
    memory: Optional[List[str]] = None
    stack: Optional[List[str]] = None
    storage: Optional[Dict[str, str]] = None
    depth: int = 0
    error: Optional[str] = None


@dataclass
class ExecutionResult:
    """Result of transaction execution with full trace"""
    transaction_hash: str
    success: bool
    gas_used: int
    return_value: Optional[str] = None
    error: Optional[str] = None
    traces: List[TraceStep] = None
    state_changes: Dict[str, Any] = None
    events: List[Dict[str, Any]] = None
    internal_calls: List[Dict[str, Any]] = None
    execution_time: float = 0.0
    
    def __post_init__(self):
        if self.traces is None:
            self.traces = []
        if self.state_changes is None:
            self.state_changes = {}
        if self.events is None:
            self.events = []
        if self.internal_calls is None:
            self.internal_calls = []


class TransactionExecutor:
    """Executes transactions with comprehensive tracing and state capture"""
    
    def __init__(self, web3_provider: Web3, chain_adapter=None):
        self.w3 = web3_provider
        self.chain_adapter = chain_adapter
        
        # Configuration
        self.trace_memory = True
        self.trace_stack = True
        self.trace_storage = True
        self.max_trace_steps = 10000
        self.execution_timeout = 300  # 5 minutes
        
        # Runtime state
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.active_executions: Dict[str, Any] = {}
    
    async def execute_transaction(self, 
                                transaction: Dict[str, Any],
                                context: ExecutionContext,
                                trace_level: str = "full") -> ExecutionResult:
        """
        Execute a single transaction with comprehensive tracing
        
        Args:
            transaction: Transaction data to execute
            context: Execution context (block environment)
            trace_level: Level of tracing (basic, full, detailed)
            
        Returns:
            ExecutionResult with traces and state changes
        """
        start_time = datetime.utcnow()
        tx_hash = transaction.get('hash', 'unknown')
        
        try:
            logger.info(f"Executing transaction {tx_hash} with {trace_level} tracing")
            
            # Validate transaction
            self._validate_transaction(transaction, context)
            
            # Execute based on trace level
            if trace_level == "basic":
                result = await self._execute_basic(transaction, context)
            elif trace_level == "full":
                result = await self._execute_full_trace(transaction, context)
            elif trace_level == "detailed":
                result = await self._execute_detailed_trace(transaction, context)
            else:
                raise ValueError(f"Unknown trace level: {trace_level}")
            
            # Calculate execution time
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            result.execution_time = execution_time
            
            logger.info(f"Transaction {tx_hash} executed successfully in {execution_time:.2f}s")
            return result
            
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"Transaction execution failed: {str(e)}")
            
            return ExecutionResult(
                transaction_hash=tx_hash,
                success=False,
                gas_used=0,
                error=str(e),
                execution_time=execution_time
            )
    
    async def execute_transaction_sequence(self, 
                                         transactions: List[Dict[str, Any]],
                                         context: ExecutionContext,
                                         trace_level: str = "full") -> List[ExecutionResult]:
        """Execute a sequence of transactions in order"""
        results = []
        
        try:
            logger.info(f"Executing sequence of {len(transactions)} transactions")
            
            for i, transaction in enumerate(transactions):
                logger.info(f"Executing transaction {i+1}/{len(transactions)}")
                
                # Update context for subsequent transactions
                updated_context = self._update_context_after_transaction(context, transaction)
                
                # Execute transaction
                result = await self.execute_transaction(transaction, updated_context, trace_level)
                results.append(result)
                
                # Stop on failure if desired
                if not result.success:
                    logger.warning(f"Transaction {i+1} failed, continuing with sequence")
            
            return results
            
        except Exception as e:
            logger.error(f"Transaction sequence execution failed: {str(e)}")
            raise
    
    async def _execute_basic(self, 
                           transaction: Dict[str, Any], 
                           context: ExecutionContext) -> ExecutionResult:
        """Execute transaction with basic result capture"""
        try:
            # Simulate basic execution
            # In production, this would use actual EVM execution
            
            tx_hash = transaction.get('hash', 'unknown')
            gas_used = transaction.get('gas', 21000) // 2  # Simulate gas usage
            
            # Simulate success/failure
            success = transaction.get('status', 1) == 1
            
            # Basic state changes
            state_changes = {
                "balance_changes": self._simulate_balance_changes(transaction),
                "nonce_changes": self._simulate_nonce_changes(transaction)
            }
            
            # Extract events from receipt
            events = await self._extract_transaction_events(transaction)
            
            return ExecutionResult(
                transaction_hash=tx_hash,
                success=success,
                gas_used=gas_used,
                state_changes=state_changes,
                events=events
            )
            
        except Exception as e:
            logger.error(f"Basic execution failed: {str(e)}")
            raise
    
    async def _execute_full_trace(self, 
                                transaction: Dict[str, Any], 
                                context: ExecutionContext) -> ExecutionResult:
        """Execute transaction with full execution tracing"""
        try:
            # Start with basic execution
            result = await self._execute_basic(transaction, context)
            
            # Add execution traces
            traces = await self._generate_execution_traces(transaction, context)
            result.traces = traces
            
            # Add internal calls
            internal_calls = await self._extract_internal_calls(transaction)
            result.internal_calls = internal_calls
            
            # Enhanced state changes with storage
            enhanced_state = await self._capture_storage_changes(transaction, context)
            result.state_changes.update(enhanced_state)
            
            return result
            
        except Exception as e:
            logger.error(f"Full trace execution failed: {str(e)}")
            raise
    
    async def _execute_detailed_trace(self, 
                                    transaction: Dict[str, Any], 
                                    context: ExecutionContext) -> ExecutionResult:
        """Execute transaction with detailed step-by-step tracing"""
        try:
            # Start with full trace
            result = await self._execute_full_trace(transaction, context)
            
            # Add detailed memory and stack traces
            for trace in result.traces:
                if self.trace_memory:
                    trace.memory = await self._capture_memory_state(trace.pc, context)
                if self.trace_stack:
                    trace.stack = await self._capture_stack_state(trace.pc, context)
                if self.trace_storage:
                    trace.storage = await self._capture_storage_state(trace.pc, context)
            
            return result
            
        except Exception as e:
            logger.error(f"Detailed trace execution failed: {str(e)}")
            raise
    
    async def _generate_execution_traces(self, 
                                       transaction: Dict[str, Any], 
                                       context: ExecutionContext) -> List[TraceStep]:
        """Generate step-by-step execution traces"""
        traces = []
        
        try:
            # Simulate common opcode execution pattern
            opcodes = [
                ("PUSH1", 3), ("DUP1", 3), ("SLOAD", 200), ("PUSH1", 3),
                ("JUMPI", 10), ("PUSH1", 3), ("SSTORE", 5000), ("STOP", 0)
            ]
            
            pc = 0
            gas_remaining = context.gas_limit
            
            for op, gas_cost in opcodes:
                if gas_remaining < gas_cost:
                    break
                
                trace = TraceStep(
                    pc=pc,
                    op=op,
                    gas=gas_remaining,
                    gas_cost=gas_cost,
                    depth=0
                )
                
                traces.append(trace)
                gas_remaining -= gas_cost
                pc += 1
                
                # Limit trace steps
                if len(traces) >= self.max_trace_steps:
                    break
            
            return traces
            
        except Exception as e:
            logger.error(f"Trace generation failed: {str(e)}")
            return []
    
    async def _extract_transaction_events(self, transaction: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract events/logs from transaction execution"""
        try:
            events = []
            tx_hash = transaction.get('hash')
            
            if tx_hash:
                # Get transaction receipt
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                
                for log in receipt.logs:
                    event = {
                        "address": log.address,
                        "topics": [topic.hex() for topic in log.topics],
                        "data": log.data.hex(),
                        "log_index": log.logIndex,
                        "transaction_index": log.transactionIndex,
                        "block_number": log.blockNumber
                    }
                    events.append(event)
            
            return events
            
        except Exception as e:
            logger.warning(f"Event extraction failed: {str(e)}")
            return []
    
    async def _extract_internal_calls(self, transaction: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract internal contract calls from transaction"""
        try:
            # Simulate internal calls
            # In production, this would use debug_traceTransaction
            internal_calls = []
            
            # Simulate some common patterns
            tx_hash = transaction.get('hash', 'unknown')
            to_address = transaction.get('to')
            
            if to_address:
                # Simulate a delegatecall
                internal_calls.append({
                    "type": "DELEGATECALL",
                    "from": to_address,
                    "to": "0x" + "1" * 40,  # Simulate target
                    "input": "0x12345678",
                    "output": "0x1",
                    "gas": 5000,
                    "gas_used": 3000,
                    "value": "0"
                })
            
            return internal_calls
            
        except Exception as e:
            logger.warning(f"Internal call extraction failed: {str(e)}")
            return []
    
    async def _capture_storage_changes(self, 
                                     transaction: Dict[str, Any], 
                                     context: ExecutionContext) -> Dict[str, Any]:
        """Capture contract storage changes during execution"""
        try:
            storage_changes = {}
            
            # Simulate storage changes
            contract_address = transaction.get('to')
            if contract_address:
                storage_changes[contract_address] = {
                    "0x0000000000000000000000000000000000000000000000000000000000000000": {
                        "before": "0x0000000000000000000000000000000000000000000000000000000000000000",
                        "after": "0x0000000000000000000000000000000000000000000000000000000000000001"
                    }
                }
            
            return {"storage_changes": storage_changes}
            
        except Exception as e:
            logger.warning(f"Storage change capture failed: {str(e)}")
            return {}
    
    async def _capture_memory_state(self, pc: int, context: ExecutionContext) -> List[str]:
        """Capture EVM memory state at specific program counter"""
        try:
            # Simulate memory state
            # In production, this would capture actual EVM memory
            memory = []
            for i in range(8):  # 8 memory words
                memory.append(f"0x{i:064x}")
            return memory
            
        except Exception as e:
            logger.warning(f"Memory capture failed: {str(e)}")
            return []
    
    async def _capture_stack_state(self, pc: int, context: ExecutionContext) -> List[str]:
        """Capture EVM stack state at specific program counter"""
        try:
            # Simulate stack state
            # In production, this would capture actual EVM stack
            stack = []
            for i in range(5):  # 5 stack elements
                stack.append(f"0x{i * 100:x}")
            return stack
            
        except Exception as e:
            logger.warning(f"Stack capture failed: {str(e)}")
            return []
    
    async def _capture_storage_state(self, pc: int, context: ExecutionContext) -> Dict[str, str]:
        """Capture contract storage state at specific program counter"""
        try:
            # Simulate storage state
            storage = {
                "0x0": "0x1",
                "0x1": "0x2"
            }
            return storage
            
        except Exception as e:
            logger.warning(f"Storage capture failed: {str(e)}")
            return {}
    
    def _simulate_balance_changes(self, transaction: Dict[str, Any]) -> Dict[str, Dict[str, str]]:
        """Simulate balance changes from transaction"""
        changes = {}
        
        from_addr = transaction.get('from')
        to_addr = transaction.get('to')
        value = transaction.get('value', 0)
        
        if from_addr and value > 0:
            changes[from_addr] = {
                "before": str(value * 2),
                "after": str(value)
            }
        
        if to_addr and value > 0:
            changes[to_addr] = {
                "before": "0",
                "after": str(value)
            }
        
        return changes
    
    def _simulate_nonce_changes(self, transaction: Dict[str, Any]) -> Dict[str, Dict[str, int]]:
        """Simulate nonce changes from transaction"""
        changes = {}
        
        from_addr = transaction.get('from')
        nonce = transaction.get('nonce', 0)
        
        if from_addr:
            changes[from_addr] = {
                "before": nonce,
                "after": nonce + 1
            }
        
        return changes
    
    def _validate_transaction(self, transaction: Dict[str, Any], context: ExecutionContext):
        """Validate transaction before execution"""
        required_fields = ['from', 'gas']
        
        for field in required_fields:
            if field not in transaction:
                raise ValueError(f"Missing required field: {field}")
        
        if transaction['gas'] > context.gas_limit:
            raise ValueError("Transaction gas exceeds block gas limit")
    
    def _update_context_after_transaction(self, 
                                        context: ExecutionContext, 
                                        transaction: Dict[str, Any]) -> ExecutionContext:
        """Update execution context after transaction execution"""
        # Create updated context with reduced gas limit
        return ExecutionContext(
            block_number=context.block_number,
            timestamp=context.timestamp,
            gas_limit=context.gas_limit - transaction.get('gas', 21000),
            gas_price=context.gas_price,
            chain_id=context.chain_id,
            coinbase=context.coinbase,
            difficulty=context.difficulty,
            base_fee=context.base_fee
        )
    
    async def simulate_call(self, 
                          call_data: Dict[str, Any], 
                          context: ExecutionContext) -> Dict[str, Any]:
        """Simulate a contract call without state changes"""
        try:
            # Simulate call execution
            result = {
                "success": True,
                "return_value": "0x1",
                "gas_used": call_data.get('gas', 21000) // 3,
                "error": None
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Call simulation failed: {str(e)}")
            return {
                "success": False,
                "return_value": None,
                "gas_used": 0,
                "error": str(e)
            }
    
    async def batch_execute_transactions(self, 
                                       transactions: List[Dict[str, Any]],
                                       context: ExecutionContext,
                                       parallel: bool = False) -> List[ExecutionResult]:
        """Execute multiple transactions in batch"""
        try:
            if parallel and len(transactions) > 1:
                # Execute transactions in parallel (for independent transactions)
                tasks = [
                    self.execute_transaction(tx, context, "full") 
                    for tx in transactions
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Convert exceptions to error results
                processed_results = []
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        processed_results.append(ExecutionResult(
                            transaction_hash=transactions[i].get('hash', 'unknown'),
                            success=False,
                            gas_used=0,
                            error=str(result)
                        ))
                    else:
                        processed_results.append(result)
                
                return processed_results
            else:
                # Execute transactions sequentially
                return await self.execute_transaction_sequence(transactions, context)
                
        except Exception as e:
            logger.error(f"Batch execution failed: {str(e)}")
            raise


async def create_transaction_executor(web3_url: str, chain_adapter=None) -> TransactionExecutor:
    """Factory function to create TransactionExecutor"""
    try:
        w3 = Web3(Web3.HTTPProvider(web3_url))
        
        if not w3.is_connected():
            raise Exception("Failed to connect to Web3 provider")
        
        return TransactionExecutor(w3, chain_adapter)
        
    except Exception as e:
        logger.error(f"Failed to create TransactionExecutor: {str(e)}")
        raise
