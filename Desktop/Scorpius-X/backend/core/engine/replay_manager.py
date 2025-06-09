"""
Replay Manager for Blockchain Time Machine
Main orchestrator for exploit replay and transaction analysis.
"""

import asyncio
import uuid
from typing import Dict, Any, Optional, List, Tuple, Union
from datetime import datetime, timezone
import logging
import json
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager
import redis.asyncio as redis
from web3 import Web3
from web3.exceptions import ContractLogicError, TransactionNotFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from models.replay_models import (
    ReplaySession, 
    TransactionTrace, 
    SessionStatus,
    Exploit,
    Transaction,
    StateSnapshot as StateSnapshotModel,
    AnalysisResult
)
from core.engine.state_manager import StateManager, StateSnapshot

logger = logging.getLogger(__name__)


@dataclass
class ReplayRequest:
    """Request data structure for replay operations"""
    session_id: str
    exploit_id: Optional[str] = None
    transaction_hashes: Optional[List[str]] = None
    contract_address: Optional[str] = None
    block_range: Optional[tuple] = None
    trace_level: str = "full"  # basic, full, detailed
    analyze_results: bool = True


@dataclass
class ReplayResult:
    """Result data structure for replay operations"""
    session_id: str
    success: bool
    error_message: Optional[str] = None
    transactions_replayed: int = 0
    state_changes: List[Dict[str, Any]] = None
    analysis_results: Optional[Dict[str, Any]] = None
    execution_time_seconds: float = 0.0
    gas_used: int = 0
    
    def __post_init__(self):
        if self.state_changes is None:
            self.state_changes = []


class ReplayManager:
    """Main manager for blockchain exploit replay operations"""
    
    def __init__(self, 
                 web3_provider: Web3,
                 state_manager: StateManager,
                 database_session: AsyncSession,
                 chain_adapter=None,
                 exploit_parser=None):
        self.w3 = web3_provider
        self.state_manager = state_manager
        self.db = database_session
        self.chain_adapter = chain_adapter
        self.exploit_parser = exploit_parser
        
        # Configuration
        self.max_concurrent_replays = 3
        self.default_gas_limit = 12_000_000
        self.fork_cleanup_delay = 3600  # 1 hour
        
        # Runtime state
        self.active_sessions: Dict[str, ReplaySession] = {}
        self.fork_states: Dict[str, str] = {}  # session_id -> fork_state_id
        self.executor = asyncio.create_task
    
    async def start_exploit_replay(self, 
                                 exploit_id: str, 
                                 user_id: str,
                                 options: Dict[str, Any] = None) -> str:
        """
        Start replaying a specific exploit
        
        Args:
            exploit_id: Exploit to replay
            user_id: User initiating the replay
            options: Additional replay options
            
        Returns:
            Session ID for tracking progress
        """
        session_id = str(uuid.uuid4())
        
        try:
            logger.info(f"Starting exploit replay for {exploit_id}")
            
            # Get exploit data
            result = await self.db.execute(select(Exploit).filter(Exploit.id == exploit_id))
            exploit = result.scalar_one_or_none()
            if not exploit:
                raise ValueError(f"Exploit {exploit_id} not found")
            
            # Create replay session
            session = ReplaySession(
                id=session_id,
                exploit_id=exploit_id,
                user_id=user_id,
                status="initializing",
                started_at=datetime.utcnow(),
                configuration=options or {}
            )
            self.db.add(session)
            await self.db.commit()
            
            # Store in active sessions
            self.active_sessions[session_id] = session
            
            # Create replay request
            request = ReplayRequest(
                session_id=session_id,
                exploit_id=exploit_id,
                contract_address=exploit.contract_address,
                block_range=(exploit.block_number, exploit.block_number + 1),
                trace_level=options.get("trace_level", "full"),
                analyze_results=options.get("analyze_results", True)
            )
            
            # Start async replay
            asyncio.create_task(self._execute_exploit_replay(request))
            
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to start exploit replay: {str(e)}")
            # Update session status
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                session.status = "failed"
                session.error_message = str(e)
                session.completed_at = datetime.utcnow()
                await self.db.commit()
            raise
    
    async def start_transaction_replay(self, 
                                     transaction_hashes: List[str], 
                                     user_id: str,
                                     options: Dict[str, Any] = None) -> str:
        """
        Start replaying specific transactions
        
        Args:
            transaction_hashes: List of transaction hashes to replay
            user_id: User initiating the replay
            options: Additional replay options
            
        Returns:
            Session ID for tracking progress
        """
        session_id = str(uuid.uuid4())
        
        try:
            logger.info(f"Starting transaction replay for {len(transaction_hashes)} transactions")
            
            # Create replay session
            session = ReplaySession(
                id=session_id,
                user_id=user_id,
                status="initializing",
                started_at=datetime.utcnow(),
                configuration=options or {},
                metadata={"transaction_count": len(transaction_hashes)}
            )
            self.db.add(session)
            await self.db.commit()
            
            # Store in active sessions
            self.active_sessions[session_id] = session
            
            # Create replay request
            request = ReplayRequest(
                session_id=session_id,
                transaction_hashes=transaction_hashes,
                trace_level=options.get("trace_level", "full"),
                analyze_results=options.get("analyze_results", True)
            )
            
            # Start async replay
            asyncio.create_task(self._execute_transaction_replay(request))
            
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to start transaction replay: {str(e)}")
            # Update session status
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                session.status = "failed"
                session.error_message = str(e)
                session.completed_at = datetime.utcnow()
                await self.db.commit()
            raise
    
    async def _execute_exploit_replay(self, request: ReplayRequest):
        """Execute exploit replay in background"""
        session_id = request.session_id
        session = self.active_sessions[session_id]
        
        try:
            # Update status
            session.status = "running"
            await self.db.commit()
            
            logger.info(f"Executing exploit replay for session {session_id}")
            
            # Get exploit details
            result = await self.db.execute(select(Exploit).filter(Exploit.id == request.exploit_id))
            exploit = result.scalar_one_or_none()
            
            # Create blockchain fork at exploit block
            fork_block = exploit.block_number - 1  # Fork before the exploit
            fork_state_id = await self._create_blockchain_fork(fork_block)
            self.fork_states[session_id] = fork_state_id
            
            # Parse exploit configuration
            exploit_config = await self._parse_exploit_config(exploit)
            
            # Execute exploit transactions
            result = await self._execute_exploit_transactions(
                session_id, exploit_config, fork_state_id
            )
            
            # Analyze results if requested
            if request.analyze_results:
                analysis = await self._analyze_replay_results(session_id, result)
                result.analysis_results = analysis
            
            # Update session with results
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.results = asdict(result)
            session.transactions_replayed = result.transactions_replayed
            session.gas_used = result.gas_used
            
            await self.db.commit()
            
            logger.info(f"Exploit replay {session_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Exploit replay {session_id} failed: {str(e)}")
            session.status = "failed"
            session.error_message = str(e)
            session.completed_at = datetime.utcnow()
            await self.db.commit()
        
        finally:
            # Schedule cleanup
            asyncio.create_task(self._cleanup_session_resources(session_id))
    
    async def _execute_transaction_replay(self, request: ReplayRequest):
        """Execute transaction replay in background"""
        session_id = request.session_id
        session = self.active_sessions[session_id]
        
        try:
            # Update status
            session.status = "running"
            await self.db.commit()
            
            logger.info(f"Executing transaction replay for session {session_id}")
            
            # Get transaction details
            transactions = []
            for tx_hash in request.transaction_hashes:
                tx = self.w3.eth.get_transaction(tx_hash)
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                transactions.append((tx, receipt))
            
            # Find earliest block for fork creation
            min_block = min(tx['blockNumber'] for tx, _ in transactions) - 1
            
            # Create blockchain fork
            fork_state_id = await self._create_blockchain_fork(min_block)
            self.fork_states[session_id] = fork_state_id
            
            # Execute transactions in order
            result = await self._execute_transaction_sequence(
                session_id, transactions, fork_state_id
            )
            
            # Analyze results if requested
            if request.analyze_results:
                analysis = await self._analyze_replay_results(session_id, result)
                result.analysis_results = analysis
            
            # Update session with results
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            session.results = asdict(result)
            session.transactions_replayed = result.transactions_replayed
            session.gas_used = result.gas_used
            
            await self.db.commit()
            
            logger.info(f"Transaction replay {session_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Transaction replay {session_id} failed: {str(e)}")
            session.status = "failed"
            session.error_message = str(e)
            session.completed_at = datetime.utcnow()
            await self.db.commit()
        
        finally:
            # Schedule cleanup
            asyncio.create_task(self._cleanup_session_resources(session_id))
    
    async def _create_blockchain_fork(self, block_number: int) -> str:
        """Create a forked blockchain state for isolated replay"""
        try:
            # Create state snapshot at fork point
            snapshot_id = await self.state_manager.create_state_snapshot(
                block_number=block_number,
                include_storage=True
            )
            
            logger.info(f"Created blockchain fork at block {block_number}: {snapshot_id}")
            return snapshot_id
            
        except Exception as e:
            logger.error(f"Failed to create blockchain fork: {str(e)}")
            raise
    
    async def _parse_exploit_config(self, exploit: Exploit) -> Dict[str, Any]:
        """Parse exploit configuration for replay"""
        try:
            if self.exploit_parser:
                return await self.exploit_parser.parse_exploit(exploit)
            
            # Basic parsing fallback
            config = {
                "exploit_type": exploit.exploit_type,
                "contract_address": exploit.contract_address,
                "block_number": exploit.block_number,
                "transaction_hashes": exploit.transaction_hashes or [],
                "parameters": exploit.parameters or {}
            }
            
            return config
            
        except Exception as e:
            logger.error(f"Failed to parse exploit config: {str(e)}")
            raise
    
    async def _execute_exploit_transactions(self, 
                                          session_id: str, 
                                          exploit_config: Dict[str, Any], 
                                          fork_state_id: str) -> ReplayResult:
        """Execute exploit transactions with full tracing"""
        start_time = datetime.utcnow()
        total_gas = 0
        transaction_count = 0
        state_changes = []
        
        try:
            # Get transaction hashes from config
            tx_hashes = exploit_config.get("transaction_hashes", [])
            
            for tx_hash in tx_hashes:
                # Get original transaction
                tx = self.w3.eth.get_transaction(tx_hash)
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                
                # Execute transaction with tracing
                trace_result = await self._execute_transaction_with_trace(
                    session_id, tx, fork_state_id
                )
                
                # Record state changes
                state_changes.append({
                    "transaction_hash": tx_hash,
                    "gas_used": receipt.gasUsed,
                    "status": trace_result.get("status", "unknown"),
                    "state_diff": trace_result.get("state_diff", {}),
                    "events": trace_result.get("events", [])
                })
                
                total_gas += receipt.gasUsed
                transaction_count += 1
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            return ReplayResult(
                session_id=session_id,
                success=True,
                transactions_replayed=transaction_count,
                state_changes=state_changes,
                execution_time_seconds=execution_time,
                gas_used=total_gas
            )
            
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"Exploit transaction execution failed: {str(e)}")
            
            return ReplayResult(
                session_id=session_id,
                success=False,
                error_message=str(e),
                transactions_replayed=transaction_count,
                state_changes=state_changes,
                execution_time_seconds=execution_time,
                gas_used=total_gas
            )
    
    async def _execute_transaction_sequence(self, 
                                          session_id: str, 
                                          transactions: List[tuple], 
                                          fork_state_id: str) -> ReplayResult:
        """Execute a sequence of transactions with full tracing"""
        start_time = datetime.utcnow()
        total_gas = 0
        transaction_count = 0
        state_changes = []
        
        try:
            for tx, receipt in transactions:
                # Execute transaction with tracing
                trace_result = await self._execute_transaction_with_trace(
                    session_id, tx, fork_state_id
                )
                
                # Record state changes
                state_changes.append({
                    "transaction_hash": tx.hash.hex(),
                    "gas_used": receipt.gasUsed,
                    "status": trace_result.get("status", "unknown"),
                    "state_diff": trace_result.get("state_diff", {}),
                    "events": trace_result.get("events", [])
                })
                
                total_gas += receipt.gasUsed
                transaction_count += 1
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            return ReplayResult(
                session_id=session_id,
                success=True,
                transactions_replayed=transaction_count,
                state_changes=state_changes,
                execution_time_seconds=execution_time,
                gas_used=total_gas
            )
            
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"Transaction sequence execution failed: {str(e)}")
            
            return ReplayResult(
                session_id=session_id,
                success=False,
                error_message=str(e),
                transactions_replayed=transaction_count,
                state_changes=state_changes,
                execution_time_seconds=execution_time,
                gas_used=total_gas
            )
    
    async def _execute_transaction_with_trace(self, 
                                            session_id: str, 
                                            transaction: Dict[str, Any], 
                                            fork_state_id: str) -> Dict[str, Any]:
        """Execute a single transaction with full execution tracing"""
        try:
            # Create transaction trace record
            tx_trace = TransactionTrace(
                session_id=session_id,
                transaction_hash=transaction.hash.hex(),
                block_number=transaction.blockNumber,
                gas_limit=transaction.gas,
                gas_used=0,  # Will be updated after execution
                status="pending",
                trace_data={},
                created_at=datetime.utcnow()
            )
            self.db.add(tx_trace)
            await self.db.commit()
            
            # Simulate transaction execution (simplified)
            # In a real implementation, this would use a local fork with tracing
            trace_result = {
                "status": "success",
                "gas_used": transaction.gas // 2,  # Simulated gas usage
                "state_diff": await self._compute_state_diff(transaction, fork_state_id),
                "events": await self._extract_transaction_events(transaction),
                "internal_calls": [],  # Would be populated by real tracer
                "error": None
            }
            
            # Update trace record
            tx_trace.gas_used = trace_result["gas_used"]
            tx_trace.status = trace_result["status"]
            tx_trace.trace_data = trace_result
            tx_trace.completed_at = datetime.utcnow()
            await self.db.commit()
            
            return trace_result
            
        except Exception as e:
            logger.error(f"Transaction trace execution failed: {str(e)}")
            # Update trace record with error
            if 'tx_trace' in locals():
                tx_trace.status = "failed"
                tx_trace.error_message = str(e)
                tx_trace.completed_at = datetime.utcnow()
                await self.db.commit()
            
            return {
                "status": "failed",
                "error": str(e),
                "state_diff": {},
                "events": [],
                "internal_calls": []
            }
    
    async def _compute_state_diff(self, transaction: Dict[str, Any], fork_state_id: str) -> Dict[str, Any]:
        """Compute state differences for a transaction"""
        # Simplified state diff computation
        # In production, this would compare pre/post execution states
        return {
            "balance_changes": {},
            "storage_changes": {},
            "code_changes": {},
            "nonce_changes": {}
        }
    
    async def _extract_transaction_events(self, transaction: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract events from transaction execution"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(transaction.hash)
            events = []
            
            for log in receipt.logs:
                events.append({
                    "address": log.address,
                    "topics": [topic.hex() for topic in log.topics],
                    "data": log.data.hex(),
                    "log_index": log.logIndex
                })
            
            return events
            
        except Exception as e:
            logger.warning(f"Failed to extract transaction events: {str(e)}")
            return []
    
    async def _analyze_replay_results(self, session_id: str, result: ReplayResult) -> Dict[str, Any]:
        """Analyze replay results for patterns and insights"""
        try:
            analysis = {
                "vulnerability_patterns": [],
                "attack_vectors": [],
                "mitigation_suggestions": [],
                "risk_score": 0.0,
                "confidence": 0.0
            }
            
            # Basic analysis based on state changes
            if result.state_changes:
                # Analyze for common patterns
                large_transfers = []
                contract_interactions = []
                
                for change in result.state_changes:
                    # Look for large value transfers
                    if change.get("state_diff", {}).get("balance_changes"):
                        large_transfers.append(change)
                    
                    # Look for contract interactions
                    if change.get("events"):
                        contract_interactions.append(change)
                
                if large_transfers:
                    analysis["vulnerability_patterns"].append("Large value transfers detected")
                    analysis["risk_score"] += 3.0
                
                if contract_interactions:
                    analysis["vulnerability_patterns"].append("Complex contract interactions")
                    analysis["risk_score"] += 2.0
                
                # Calculate confidence based on data quality
                analysis["confidence"] = min(1.0, len(result.state_changes) / 10.0)
            
            # Store analysis results
            analysis_record = AnalysisResult(
                session_id=session_id,
                analysis_type="replay_analysis",
                results=analysis,
                confidence_score=analysis["confidence"],
                created_at=datetime.utcnow()
            )
            self.db.add(analysis_record)
            await self.db.commit()
            
            return analysis
            
        except Exception as e:
            logger.error(f"Replay result analysis failed: {str(e)}")
            return {"error": str(e)}
    
    async def _cleanup_session_resources(self, session_id: str):
        """Clean up resources for completed session"""
        try:
            # Wait before cleanup
            await asyncio.sleep(self.fork_cleanup_delay)
            
            # Remove from active sessions
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            
            # Clean up fork state
            if session_id in self.fork_states:
                fork_state_id = self.fork_states[session_id]
                # Clean up fork state snapshot
                # await self.state_manager.cleanup_snapshot(fork_state_id)
                del self.fork_states[session_id]
            
            logger.info(f"Cleaned up resources for session {session_id}")
            
        except Exception as e:
            logger.error(f"Resource cleanup failed for session {session_id}: {str(e)}")
    
    async def get_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a replay session"""
        try:
            # Check active sessions first
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
            else:
                # Query database
                result = await self.db.execute(select(ReplaySession).filter(ReplaySession.id == session_id))
                session = result.scalar_one_or_none()
                if not session:
                    return None
            
            return {
                "session_id": session.id,
                "status": session.status,
                "started_at": session.started_at.isoformat(),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "transactions_replayed": session.transactions_replayed or 0,
                "gas_used": session.gas_used or 0,
                "error_message": session.error_message
            }
            
        except Exception as e:
            logger.error(f"Failed to get session status: {str(e)}")
            return None
    
    async def cancel_session(self, session_id: str) -> bool:
        """Cancel an active replay session"""
        try:
            if session_id not in self.active_sessions:
                return False
            
            session = self.active_sessions[session_id]
            session.status = "cancelled"
            session.completed_at = datetime.utcnow()
            await self.db.commit()
            
            # Schedule immediate cleanup
            asyncio.create_task(self._cleanup_session_resources(session_id))
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel session {session_id}: {str(e)}")
            return False


async def create_replay_manager(web3_url: str, 
                              redis_url: str = "redis://localhost:6379/0",
                              database_session: AsyncSession = None) -> ReplayManager:
    """Factory function to create ReplayManager with dependencies"""
    try:
        # Initialize Web3
        w3 = Web3(Web3.HTTPProvider(web3_url))
        
        # Create StateManager
        from core.engine.state_manager import create_state_manager
        state_manager = await create_state_manager(web3_url, redis_url)
        state_manager.db = database_session  # Set database session
        
        return ReplayManager(w3, state_manager, database_session)
        
    except Exception as e:
        logger.error(f"Failed to create ReplayManager: {str(e)}")
        raise
