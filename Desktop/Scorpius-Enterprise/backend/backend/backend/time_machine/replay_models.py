"""
Time Machine Database Models for Exploit Replay System
Defines all database models for blockchain exploit replay functionality.
"""

from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, DECIMAL, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum

Base = declarative_base()


class SessionStatus(str, Enum):
    """Replay session status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TimestampMixin:
    """Mixin for adding timestamp fields to models"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Exploit(Base, TimestampMixin):
    """Historical exploits database model"""
    __tablename__ = 'exploits'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    chain = Column(String(50), nullable=False, index=True)
    block_number = Column(Integer, nullable=False, index=True)
    transaction_hashes = Column(Text, nullable=False)  # JSON string of transaction hashes
    vulnerability_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False)  # critical, high, medium, low
    description = Column(Text)
    affected_contracts = Column(Text)  # JSON string of contract addresses
    attack_vector = Column(Text)
    financial_impact = Column(DECIMAL(20, 8))  # Loss amount in ETH/native token
    tags = Column(Text)  # JSON string of searchable tags
    exploit_metadata = Column(Text)  # JSON string of additional exploit-specific data
    
    # Relationships
    replay_sessions = relationship("ReplaySession", back_populates="exploit")


class Transaction(Base, TimestampMixin):
    """Blockchain transactions model"""
    __tablename__ = 'transactions'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hash = Column(String(66), nullable=False, unique=True, index=True)
    block_number = Column(Integer, nullable=False, index=True)
    block_hash = Column(String(66), nullable=False)
    from_address = Column(String(42), nullable=False, index=True)
    to_address = Column(String(42), index=True)
    value = Column(DECIMAL(30, 18), nullable=False)
    gas_limit = Column(Integer, nullable=False)
    gas_used = Column(Integer)
    gas_price = Column(DECIMAL(30, 18))
    nonce = Column(Integer, nullable=False)
    input_data = Column(Text)
    status = Column(Boolean)
    chain = Column(String(50), nullable=False, index=True)
    raw_transaction = Column(Text)  # JSON string of complete transaction object
    
    # Relationships
    transaction_traces = relationship("TransactionTrace", back_populates="transaction")


class ReplaySession(Base, TimestampMixin):
    """Replay sessions for tracking exploit replays"""
    __tablename__ = 'replay_sessions'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exploit_id = Column(String(36), ForeignKey('exploits.id'), nullable=True)
    session_type = Column(String(50), nullable=False)  # exploit, transaction, custom, batch
    fork_block = Column(Integer, nullable=False)
    chain = Column(String(50), nullable=False)
    status = Column(String(50), default=SessionStatus.PENDING)  # pending, running, completed, failed
    parameters = Column(Text)  # JSON string of session configuration parameters
    results = Column(Text)  # JSON string of replay results and analysis
    error_message = Column(Text)
    execution_time = Column(Integer)  # Execution time in seconds
    user_id = Column(String(255), nullable=True)  # User who initiated the session
    
    # Relationships
    exploit = relationship("Exploit", back_populates="replay_sessions")
    transaction_traces = relationship("TransactionTrace", back_populates="session")


class TransactionTrace(Base, TimestampMixin):
    """Transaction execution traces"""
    __tablename__ = 'transaction_traces'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey('replay_sessions.id'), nullable=False, index=True)
    transaction_hash = Column(String(66), ForeignKey('transactions.hash'), nullable=False, index=True)
    execution_order = Column(Integer, nullable=False)
    trace_data = Column(Text, nullable=False)  # JSON string of complete execution trace
    opcodes = Column(Text)  # JSON string of EVM opcodes executed
    gas_usage = Column(Text)  # JSON string of gas usage breakdown
    state_changes = Column(Text)  # JSON string of storage state changes
    events = Column(Text)  # JSON string of emitted events
    internal_calls = Column(Text)  # JSON string of internal contract calls
    
    # Relationships
    session = relationship("ReplaySession", back_populates="transaction_traces")
    transaction = relationship("Transaction", back_populates="transaction_traces")


class StateSnapshot(Base, TimestampMixin):
    """Blockchain state snapshots"""
    __tablename__ = 'state_snapshots'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    snapshot_id = Column(String(255), nullable=False, unique=True, index=True)
    block_number = Column(Integer, nullable=False, index=True)
    block_hash = Column(String(66), nullable=False)
    chain = Column(String(50), nullable=False)
    addresses = Column(Text)  # JSON string of addresses included in snapshot
    state_data = Column(Text)  # JSON string of compressed state data
    snapshot_metadata = Column(Text)  # JSON string of additional snapshot metadata
    storage_location = Column(String(500))  # Redis key or file path for large data
    
    
class AnalysisResult(Base, TimestampMixin):
    """Analysis results from exploit replays"""
    __tablename__ = 'analysis_results'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey('replay_sessions.id'), nullable=False)
    analysis_type = Column(String(100), nullable=False)  # vulnerability, pattern, mitigation
    severity = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    recommendations = Column(Text)  # JSON string of mitigation recommendations
    affected_functions = Column(Text)  # JSON string of function signatures affected
    code_patterns = Column(Text)  # JSON string of identified code patterns
    confidence_score = Column(DECIMAL(5, 2))  # 0-100 confidence score
    
    
# Model utility functions
def create_exploit_record(
    name: str,
    chain: str,
    block_number: int,
    transaction_hashes: list,
    vulnerability_type: str,
    severity: str,
    **kwargs
) -> Dict[str, Any]:
    """Create exploit record data"""
    return {
        "name": name,
        "chain": chain,
        "block_number": block_number,
        "transaction_hashes": transaction_hashes,
        "vulnerability_type": vulnerability_type,
        "severity": severity,
        **kwargs
    }


def create_replay_session_record(
    session_type: str,
    fork_block: int,
    chain: str,
    parameters: Dict[str, Any],
    exploit_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create replay session record data"""
    return {
        "exploit_id": exploit_id,
        "session_type": session_type,
        "fork_block": fork_block,
        "chain": chain,
        "parameters": parameters,
        "user_id": user_id,
        "status": SessionStatus.PENDING
    }


# Known historical exploits database
HISTORICAL_EXPLOITS = {
    "dao_hack_2016": {
        "name": "The DAO Hack",
        "chain": "ethereum",
        "block_number": 1718497,
        "transaction_hashes": [
            "0x0ec3f2488a93839524add10ea229e773f6bc891b4eb4794c3337d4495263790b"
        ],
        "vulnerability_type": "reentrancy",
        "severity": "critical",
        "description": "The DAO hack that led to Ethereum Classic fork",
        "affected_contracts": ["0xbb9bc244d798123fde783fcc1c72d3bb8c189413"],
        "attack_vector": "Recursive call exploitation via withdrawBalance",
        "financial_impact": 3600000.0,  # 3.6M ETH
        "tags": ["reentrancy", "dao", "historic", "hard_fork"]
    },
    "parity_wallet_hack_2017": {
        "name": "Parity Wallet Hack",
        "chain": "ethereum", 
        "block_number": 4041179,
        "transaction_hashes": [
            "0x9dbf0326a03a2a3719c27be4fa69aacc9857fd231a8d9dcaede4bb083def75ec"
        ],
        "vulnerability_type": "access_control",
        "severity": "critical",
        "description": "Parity multisig wallet vulnerability",
        "affected_contracts": ["0x863df6bfa4469f3ead0be8f9f2aae51c91a907b4"],
        "financial_impact": 153000.0,  # 153K ETH
        "tags": ["multisig", "parity", "access_control"]
    },
    "bzx_flashloan_2020": {
        "name": "bZx Flash Loan Attack",
        "chain": "ethereum",
        "block_number": 9484688,
        "transaction_hashes": [
            "0xb5c8bd9430b6cc87a0e2fe110ece6bf527fa4f170a4bc8cd032f768fc5219838"
        ],
        "vulnerability_type": "flashloan_manipulation",
        "severity": "high",
        "description": "Flash loan price manipulation attack on bZx",
        "financial_impact": 1193.0,  # $954K at the time
        "tags": ["flashloan", "defi", "oracle_manipulation", "bzx"]
    }
}
