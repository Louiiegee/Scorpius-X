"""
Advanced Nonce Management System
Handles transaction ordering and parallel execution with conflict resolution
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import threading

from web3 import Web3
from web3.types import TxParams


class NonceState(Enum):
    """Nonce states for tracking"""
    AVAILABLE = "available"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"


@dataclass
class NonceReservation:
    """Nonce reservation for transaction"""
    nonce: int
    account: str
    reserved_at: float
    expires_at: float
    transaction_id: Optional[str] = None
    gas_price: int = 0
    
    @property
    def is_expired(self) -> bool:
        """Check if reservation has expired"""
        return time.time() > self.expires_at
    
    @property
    def age_seconds(self) -> float:
        """Age of reservation in seconds"""
        return time.time() - self.reserved_at


@dataclass
class NonceTracker:
    """Track nonce state for an account"""
    account: str
    current_nonce: int = 0
    pending_nonces: Set[int] = field(default_factory=set)
    confirmed_nonces: Set[int] = field(default_factory=set)
    failed_nonces: Set[int] = field(default_factory=set)
    last_update: float = field(default_factory=time.time)
    
    def get_next_available_nonce(self) -> int:
        """Get next available nonce for this account"""
        nonce = self.current_nonce
        while nonce in self.pending_nonces:
            nonce += 1
        return nonce
    
    def reserve_nonce(self, nonce: int) -> bool:
        """Reserve a nonce if available"""
        if nonce in self.pending_nonces:
            return False
        self.pending_nonces.add(nonce)
        return True
    
    def release_nonce(self, nonce: int, confirmed: bool = False) -> None:
        """Release a nonce (confirmed or failed)"""
        self.pending_nonces.discard(nonce)
        if confirmed:
            self.confirmed_nonces.add(nonce)
            # Update current nonce if this completes a sequence
            if nonce == self.current_nonce:
                while self.current_nonce in self.confirmed_nonces:
                    self.current_nonce += 1
        else:
            self.failed_nonces.add(nonce)


class NonceManager:
    """
    Advanced nonce management with parallel execution support
    
    Features:
    - Multi-account nonce tracking
    - Automatic nonce gap detection
    - Transaction replacement support
    - Conflict resolution
    - Performance metrics
    """
    
    def __init__(self, web3: Web3, explain: bool = False):
        """
        Initialize nonce manager
        
        Args:
            web3: Web3 instance
            explain: Enable explanations
        """
        self.web3 = web3
        self.explain = explain
        self.logger = logging.getLogger("NonceManager")
        
        # Account tracking
        self._account_trackers: Dict[str, NonceTracker] = {}
        self._account_locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        
        # Nonce reservations
        self._reservations: Dict[str, NonceReservation] = {}  # tx_id -> reservation
        self._reservation_queue: deque = deque()  # For cleanup
        
        # Configuration
        self.reservation_timeout = 300  # 5 minutes
        self.nonce_sync_interval = 30  # 30 seconds
        self.max_nonce_gap = 10  # Maximum gap before forcing sync
        
        # Performance metrics
        self.metrics = {
            'nonces_reserved': 0,
            'nonces_confirmed': 0,
            'nonces_failed': 0,
            'conflicts_resolved': 0,
            'sync_operations': 0,
            'replacement_transactions': 0
        }
        
        # Background tasks
        self._cleanup_task: Optional[asyncio.Task] = None
        self._sync_task: Optional[asyncio.Task] = None
        self._running = False
        
        self.logger.info("Nonce manager initialized")
    
    async def start(self) -> None:
        """Start background nonce management tasks"""
        if self._running:
            return
        
        self._running = True
        self._cleanup_task = asyncio.create_task(self._cleanup_expired_reservations())
        self._sync_task = asyncio.create_task(self._periodic_nonce_sync())
        
        self.logger.info("Nonce manager started")
    
    async def stop(self) -> None:
        """Stop background tasks"""
        self._running = False
        
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        if self._sync_task:
            self._sync_task.cancel()
            try:
                await self._sync_task
            except asyncio.CancelledError:
                pass
        
        self.logger.info("Nonce manager stopped")
    
    async def reserve_nonce(
        self, 
        account: str, 
        transaction_id: str,
        gas_price: int = 0,
        timeout: Optional[float] = None
    ) -> Optional[NonceReservation]:
        """
        Reserve a nonce for transaction
        
        Args:
            account: Account address
            transaction_id: Unique transaction identifier
            gas_price: Gas price for potential replacement
            timeout: Reservation timeout in seconds
            
        Returns:
            Nonce reservation if successful
        """
        try:
            account = Web3.toChecksumAddress(account)
            timeout = timeout or self.reservation_timeout
            
            async with self._account_locks[account]:
                # Ensure we have tracker for this account
                await self._ensure_account_tracker(account)
                tracker = self._account_trackers[account]
                
                # Get next available nonce
                nonce = tracker.get_next_available_nonce()
                
                # Reserve the nonce
                if not tracker.reserve_nonce(nonce):
                    if self.explain:
                        self.logger.warning(f"Nonce {nonce} already reserved for {account}")
                    return None
                
                # Create reservation
                reservation = NonceReservation(
                    nonce=nonce,
                    account=account,
                    reserved_at=time.time(),
                    expires_at=time.time() + timeout,
                    transaction_id=transaction_id,
                    gas_price=gas_price
                )
                
                # Store reservation
                self._reservations[transaction_id] = reservation
                self._reservation_queue.append(transaction_id)
                
                self.metrics['nonces_reserved'] += 1
                
                if self.explain:
                    self.logger.info(
                        f"Reserved nonce {nonce} for {account} (tx: {transaction_id[:10]}...)"
                    )
                
                return reservation
                
        except Exception as e:
            self.logger.error(f"Error reserving nonce: {e}")
            return None
    
    async def confirm_nonce(self, transaction_id: str, success: bool = True) -> bool:
        """
        Confirm nonce usage (transaction completed)
        
        Args:
            transaction_id: Transaction identifier
            success: Whether transaction was successful
            
        Returns:
            True if confirmed successfully
        """
        try:
            if transaction_id not in self._reservations:
                self.logger.warning(f"No reservation found for transaction {transaction_id}")
                return False
            
            reservation = self._reservations[transaction_id]
            account = reservation.account
            nonce = reservation.nonce
            
            async with self._account_locks[account]:
                tracker = self._account_trackers.get(account)
                if not tracker:
                    self.logger.error(f"No tracker found for account {account}")
                    return False
                
                # Release the nonce
                tracker.release_nonce(nonce, confirmed=success)
                
                # Remove reservation
                del self._reservations[transaction_id]
                
                if success:
                    self.metrics['nonces_confirmed'] += 1
                else:
                    self.metrics['nonces_failed'] += 1
                
                if self.explain:
                    status = "confirmed" if success else "failed"
                    self.logger.info(
                        f"Nonce {nonce} {status} for {account} (tx: {transaction_id[:10]}...)"
                    )
                
                return True
                
        except Exception as e:
            self.logger.error(f"Error confirming nonce: {e}")
            return False
    
    async def get_replacement_nonce(
        self, 
        original_transaction_id: str,
        new_transaction_id: str,
        new_gas_price: int
    ) -> Optional[NonceReservation]:
        """
        Get nonce for replacement transaction (higher gas price)
        
        Args:
            original_transaction_id: Original transaction ID
            new_transaction_id: New transaction ID
            new_gas_price: New gas price (must be higher)
            
        Returns:
            Nonce reservation for replacement transaction
        """
        try:
            if original_transaction_id not in self._reservations:
                self.logger.error(f"Original transaction {original_transaction_id} not found")
                return None
            
            original_reservation = self._reservations[original_transaction_id]
            
            # Verify gas price is higher
            if new_gas_price <= original_reservation.gas_price:
                self.logger.error("Replacement gas price must be higher than original")
                return None
            
            account = original_reservation.account
            nonce = original_reservation.nonce
            
            async with self._account_locks[account]:
                # Create new reservation with same nonce
                replacement_reservation = NonceReservation(
                    nonce=nonce,
                    account=account,
                    reserved_at=time.time(),
                    expires_at=time.time() + self.reservation_timeout,
                    transaction_id=new_transaction_id,
                    gas_price=new_gas_price
                )
                
                # Replace old reservation
                del self._reservations[original_transaction_id]
                self._reservations[new_transaction_id] = replacement_reservation
                
                self.metrics['replacement_transactions'] += 1
                
                if self.explain:
                    self.logger.info(
                        f"Created replacement transaction for nonce {nonce} "
                        f"with gas price {new_gas_price/10**9:.2f} gwei"
                    )
                
                return replacement_reservation
                
        except Exception as e:
            self.logger.error(f"Error creating replacement transaction: {e}")
            return None
    
    async def sync_account_nonce(self, account: str) -> bool:
        """
        Synchronize account nonce with blockchain
        
        Args:
            account: Account address to sync
            
        Returns:
            True if sync successful
        """
        try:
            account = Web3.toChecksumAddress(account)
            
            # Get current nonce from blockchain
            current_nonce = await asyncio.to_thread(
                self.web3.eth.get_transaction_count, 
                account, 
                'pending'
            )
            
            async with self._account_locks[account]:
                tracker = self._account_trackers.get(account)
                if not tracker:
                    # Create new tracker
                    tracker = NonceTracker(
                        account=account,
                        current_nonce=current_nonce,
                        last_update=time.time()
                    )
                    self._account_trackers[account] = tracker
                else:
                    # Update existing tracker
                    old_nonce = tracker.current_nonce
                    tracker.current_nonce = current_nonce
                    tracker.last_update = time.time()
                    
                    # Clear old confirmed nonces
                    tracker.confirmed_nonces = {n for n in tracker.confirmed_nonces if n >= current_nonce}
                    
                    if self.explain and old_nonce != current_nonce:
                        self.logger.info(
                            f"Synced nonce for {account}: {old_nonce} -> {current_nonce}"
                        )
                
                self.metrics['sync_operations'] += 1
                return True
                
        except Exception as e:
            self.logger.error(f"Error syncing account nonce: {e}")
            return False
    
    async def detect_nonce_gaps(self, account: str) -> List[int]:
        """
        Detect gaps in nonce sequence that may indicate stuck transactions
        
        Args:
            account: Account address
            
        Returns:
            List of missing nonces
        """
        try:
            account = Web3.toChecksumAddress(account)
            
            async with self._account_locks[account]:
                tracker = self._account_trackers.get(account)
                if not tracker:
                    return []
                
                gaps = []
                current = tracker.current_nonce
                
                # Check for gaps in pending nonces
                for nonce in range(current, current + self.max_nonce_gap):
                    if (nonce not in tracker.pending_nonces and 
                        nonce not in tracker.confirmed_nonces and
                        nonce not in tracker.failed_nonces):
                        gaps.append(nonce)
                
                if gaps and self.explain:
                    self.logger.warning(f"Detected nonce gaps for {account}: {gaps}")
                
                return gaps
                
        except Exception as e:
            self.logger.error(f"Error detecting nonce gaps: {e}")
            return []
    
    async def _ensure_account_tracker(self, account: str) -> None:
        """Ensure account tracker exists and is up to date"""
        if account not in self._account_trackers:
            await self.sync_account_nonce(account)
        else:
            # Check if sync is needed
            tracker = self._account_trackers[account]
            if time.time() - tracker.last_update > self.nonce_sync_interval:
                await self.sync_account_nonce(account)
    
    async def _cleanup_expired_reservations(self) -> None:
        """Background task to clean up expired reservations"""
        while self._running:
            try:
                current_time = time.time()
                expired_transactions = []
                
                # Find expired reservations
                for tx_id, reservation in self._reservations.items():
                    if reservation.is_expired:
                        expired_transactions.append(tx_id)
                
                # Clean up expired reservations
                for tx_id in expired_transactions:
                    reservation = self._reservations[tx_id]
                    account = reservation.account
                    nonce = reservation.nonce
                    
                    async with self._account_locks[account]:
                        tracker = self._account_trackers.get(account)
                        if tracker:
                            tracker.pending_nonces.discard(nonce)
                        
                        del self._reservations[tx_id]
                    
                    if self.explain:
                        self.logger.warning(
                            f"Cleaned up expired reservation: nonce {nonce} "
                            f"for {account} (tx: {tx_id[:10]}...)"
                        )
                
                await asyncio.sleep(60)  # Clean up every minute
                
            except Exception as e:
                self.logger.error(f"Error in reservation cleanup: {e}")
                await asyncio.sleep(60)
    
    async def _periodic_nonce_sync(self) -> None:
        """Background task for periodic nonce synchronization"""
        while self._running:
            try:
                # Sync all tracked accounts
                for account in list(self._account_trackers.keys()):
                    await self.sync_account_nonce(account)
                    
                    # Check for gaps
                    gaps = await self.detect_nonce_gaps(account)
                    if gaps:
                        self.logger.warning(f"Account {account} has nonce gaps: {gaps}")
                
                await asyncio.sleep(self.nonce_sync_interval)
                
            except Exception as e:
                self.logger.error(f"Error in periodic nonce sync: {e}")
                await asyncio.sleep(self.nonce_sync_interval)
    
    def get_account_status(self, account: str) -> Dict[str, Any]:
        """
        Get detailed status for account
        
        Args:
            account: Account address
            
        Returns:
            Account status information
        """
        try:
            account = Web3.toChecksumAddress(account)
            tracker = self._account_trackers.get(account)
            
            if not tracker:
                return {'error': 'Account not tracked'}
            
            # Get reservations for this account
            account_reservations = [
                {
                    'transaction_id': tx_id,
                    'nonce': res.nonce,
                    'age_seconds': res.age_seconds,
                    'expires_in': res.expires_at - time.time(),
                    'gas_price_gwei': res.gas_price / 10**9
                }
                for tx_id, res in self._reservations.items()
                if res.account == account
            ]
            
            return {
                'account': account,
                'current_nonce': tracker.current_nonce,
                'pending_nonces': sorted(list(tracker.pending_nonces)),
                'confirmed_nonces': len(tracker.confirmed_nonces),
                'failed_nonces': len(tracker.failed_nonces),
                'last_update': tracker.last_update,
                'next_available_nonce': tracker.get_next_available_nonce(),
                'active_reservations': account_reservations,
                'reservation_count': len(account_reservations)
            }
            
        except Exception as e:
            self.logger.error(f"Error getting account status: {e}")
            return {'error': str(e)}
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get nonce manager performance metrics"""
        return {
            **self.metrics,
            'tracked_accounts': len(self._account_trackers),
            'active_reservations': len(self._reservations),
            'reservation_queue_size': len(self._reservation_queue)
        }
