# scorpius_scanner/core/audit.py
import hashlib
import json
import time
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, DateTime, Integer
from .database import Base, AsyncSessionLocal
from .logging import get_logger

logger = get_logger(__name__)

class AuditEntry(Base):
    __tablename__ = "audit_log"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_type: Mapped[str] = mapped_column(String(100))
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    resource_type: Mapped[str] = mapped_column(String(50))
    resource_id: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(50))
    _details: Mapped[str] = mapped_column("details", Text)  # Store as JSON string
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    hash_chain: Mapped[str] = mapped_column(String(64))  # SHA-256 hash
    
    @property
    def details(self) -> Dict[str, Any]:
        """Convert JSON string to dict transparently"""
        try:
            return json.loads(self._details) if self._details else {}
        except Exception:
            return {}
    
    @details.setter
    def details(self, value: Dict[str, Any]):
        """Convert dict to JSON string transparently"""
        self._details = json.dumps(value) if value else "{}"

class TamperEvidentAuditLog:
    """Merkle-chain style audit log for tamper detection"""
    
    def __init__(self):
        self.last_hash = "genesis"
    
    async def log_event(
        self,
        event_type: str,
        action: str,
        resource_type: str,
        resource_id: str,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log an auditable event with hash chaining"""
        try:
            # Get the last hash from database
            await self._initialize_last_hash()
            
            # Add nonce to prevent hash collisions
            nonce = datetime.utcnow().timestamp()
            
            # Create audit entry
            entry_data = {
                "event_type": event_type,
                "user_id": user_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "action": action,
                "details": details or {},
                "timestamp": datetime.utcnow().isoformat(),
                "prev_hash": self.last_hash,
                "nonce": nonce  # Prevent hash collisions
            }
            
            # Calculate hash of this entry
            entry_string = json.dumps(entry_data, sort_keys=True)
            current_hash = hashlib.sha256(entry_string.encode()).hexdigest()
            
            # Store in database
            async with AsyncSessionLocal() as session:
                audit_entry = AuditEntry(
                    event_type=event_type,
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    action=action,
                    details=details or {},
                    hash_chain=current_hash
                )
                session.add(audit_entry)
                await session.commit()
                
                self.last_hash = current_hash
                logger.info(f"Audit event logged: {event_type}.{action} for {resource_type}:{resource_id}")
                
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
    
    async def _initialize_last_hash(self):
        """Get the last hash from the audit log"""
        try:
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select, desc
                result = await session.execute(
                    select(AuditEntry.hash_chain)
                    .order_by(desc(AuditEntry.id))
                    .limit(1)
                )
                last_entry = result.scalar_one_or_none()
                if last_entry:
                    self.last_hash = last_entry
        except Exception as e:
            logger.warning(f"Could not retrieve last audit hash: {e}")
    
    async def verify_integrity(self) -> bool:
        """Verify the integrity of the audit log chain"""
        try:
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                result = await session.execute(
                    select(AuditEntry).order_by(AuditEntry.id)
                )
                entries = result.scalars().all()
                
                prev_hash = "genesis"
                for entry in entries:
                    # Reconstruct the entry data with nonce
                    entry_data = {
                        "event_type": entry.event_type,
                        "user_id": entry.user_id,
                        "resource_type": entry.resource_type,
                        "resource_id": entry.resource_id,
                        "action": entry.action,
                        "details": entry.details,
                        "timestamp": entry.timestamp.isoformat(),
                        "prev_hash": prev_hash,
                        "nonce": entry.timestamp.timestamp()  # Use timestamp as nonce
                    }
                    
                    # Calculate expected hash
                    entry_string = json.dumps(entry_data, sort_keys=True)
                    expected_hash = hashlib.sha256(entry_string.encode()).hexdigest()
                    
                    if expected_hash != entry.hash_chain:
                        logger.error(f"Audit log integrity violation at entry {entry.id}")
                        return False
                    
                    prev_hash = entry.hash_chain
                
                return True
                
        except Exception as e:
            logger.error(f"Failed to verify audit log integrity: {e}")
            return False

# Global audit logger
audit_log = TamperEvidentAuditLog()
