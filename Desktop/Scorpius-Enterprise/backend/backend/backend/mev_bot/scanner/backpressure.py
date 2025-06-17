"""
Adaptive Back-Pressure Management for High-Speed Transaction Processing
Prevents queue overflow and maintains optimal throughput
"""

import asyncio
import time
import logging
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from enum import Enum


class BackPressureState(Enum):
    """Back-pressure states"""
    NORMAL = "normal"
    WARNING = "warning"  
    THROTTLE = "throttle"
    CRITICAL = "critical"


@dataclass
class BackPressureMetrics:
    """Metrics for back-pressure management"""
    current_state: BackPressureState = BackPressureState.NORMAL
    queue_utilization: float = 0.0
    throttle_events: int = 0
    drop_events: int = 0
    state_changes: int = 0
    last_state_change: Optional[float] = None
    processing_rate_smoothed: float = 0.0
    input_rate_smoothed: float = 0.0
    
    @property
    def backlog_ratio(self) -> float:
        """Ratio of input rate to processing rate"""
        if self.processing_rate_smoothed == 0:
            return float('inf')
        return self.input_rate_smoothed / self.processing_rate_smoothed


class BackPressureManager:
    """
    Adaptive back-pressure manager for transaction processing
    
    Features:
    - Queue utilization monitoring
    - Rate-based throttling
    - Adaptive thresholds
    - Performance metrics
    """
    
    def __init__(
        self,
        max_queue_size: int,
        threshold: float = 0.8,
        critical_threshold: float = 0.95,
        smoothing_factor: float = 0.1
    ):
        """
        Initialize back-pressure manager
        
        Args:
            max_queue_size: Maximum queue size
            threshold: Utilization threshold to start throttling (0.0-1.0)
            critical_threshold: Critical threshold for dropping items
            smoothing_factor: Exponential smoothing factor for rate calculations
        """
        self.max_queue_size = max_queue_size
        self.threshold = threshold
        self.critical_threshold = critical_threshold
        self.smoothing_factor = smoothing_factor
        
        self.logger = logging.getLogger("BackPressureManager")
        self.metrics = BackPressureMetrics()
        
        # Internal state
        self._current_queue_size = 0
        self._last_update_time = time.time()
        self._input_count = 0
        self._processed_count = 0
        self._last_metrics_time = time.time()
        
        # Rate tracking
        self._input_timestamps: List[float] = []
        self._processed_timestamps: List[float] = []
        
        # Callbacks
        self._state_change_callbacks: List[Callable[[BackPressureState], None]] = []
        
        self.logger.info(
            f"BackPressure manager initialized: max_size={max_queue_size}, "
            f"threshold={threshold}, critical={critical_threshold}"
        )
    
    def update_queue_size(self, current_size: int) -> None:
        """
        Update current queue size
        
        Args:
            current_size: Current queue size
        """
        self._current_queue_size = current_size
        self.metrics.queue_utilization = current_size / self.max_queue_size
        
        # Update state based on utilization
        self._update_state()
    
    def record_input(self) -> None:
        """Record an input event (item added to queue)"""
        current_time = time.time()
        self._input_timestamps.append(current_time)
        self._input_count += 1
        
        # Keep only recent timestamps (last 5 seconds)
        cutoff_time = current_time - 5.0
        self._input_timestamps = [ts for ts in self._input_timestamps if ts > cutoff_time]
        
        # Update smoothed input rate
        instant_rate = len(self._input_timestamps) / 5.0  # Items per second over 5s window
        if self.metrics.input_rate_smoothed == 0:
            self.metrics.input_rate_smoothed = instant_rate
        else:
            self.metrics.input_rate_smoothed = (
                self.smoothing_factor * instant_rate +
                (1 - self.smoothing_factor) * self.metrics.input_rate_smoothed
            )
    
    def record_processed(self) -> None:
        """Record a processing event (item removed from queue)"""
        current_time = time.time()
        self._processed_timestamps.append(current_time)
        self._processed_count += 1
        
        # Keep only recent timestamps
        cutoff_time = current_time - 5.0
        self._processed_timestamps = [ts for ts in self._processed_timestamps if ts > cutoff_time]
        
        # Update smoothed processing rate
        instant_rate = len(self._processed_timestamps) / 5.0
        if self.metrics.processing_rate_smoothed == 0:
            self.metrics.processing_rate_smoothed = instant_rate
        else:
            self.metrics.processing_rate_smoothed = (
                self.smoothing_factor * instant_rate +
                (1 - self.smoothing_factor) * self.metrics.processing_rate_smoothed
            )
    
    def should_throttle(self) -> bool:
        """
        Check if input should be throttled
        
        Returns:
            True if input should be throttled
        """
        if self.metrics.current_state in [BackPressureState.THROTTLE, BackPressureState.CRITICAL]:
            self.metrics.throttle_events += 1
            return True
        return False
    
    def should_drop(self) -> bool:
        """
        Check if input should be dropped
        
        Returns:
            True if input should be dropped
        """
        if self.metrics.current_state == BackPressureState.CRITICAL:
            self.metrics.drop_events += 1
            return True
        return False
    
    def _update_state(self) -> None:
        """Update back-pressure state based on current conditions"""
        old_state = self.metrics.current_state
        new_state = self._calculate_state()
        
        if new_state != old_state:
            self.metrics.current_state = new_state
            self.metrics.state_changes += 1
            self.metrics.last_state_change = time.time()
            
            self.logger.info(f"BackPressure state changed: {old_state.value} -> {new_state.value}")
            
            # Notify callbacks
            for callback in self._state_change_callbacks:
                try:
                    callback(new_state)
                except Exception as e:
                    self.logger.error(f"Error in state change callback: {e}")
    
    def _calculate_state(self) -> BackPressureState:
        """Calculate appropriate back-pressure state"""
        utilization = self.metrics.queue_utilization
        backlog_ratio = self.metrics.backlog_ratio
        
        # Critical state - queue almost full
        if utilization >= self.critical_threshold:
            return BackPressureState.CRITICAL
        
        # Throttle state - high utilization or input rate exceeding processing
        if utilization >= self.threshold or backlog_ratio > 1.5:
            return BackPressureState.THROTTLE
        
        # Warning state - moderate utilization
        if utilization >= self.threshold * 0.7 or backlog_ratio > 1.2:
            return BackPressureState.WARNING
        
        # Normal state
        return BackPressureState.NORMAL
    
    def add_state_change_callback(self, callback: Callable[[BackPressureState], None]) -> None:
        """
        Add callback for state changes
        
        Args:
            callback: Function to call on state changes
        """
        self._state_change_callbacks.append(callback)
    
    def remove_state_change_callback(self, callback: Callable[[BackPressureState], None]) -> None:
        """
        Remove state change callback
        
        Args:
            callback: Callback to remove
        """
        if callback in self._state_change_callbacks:
            self._state_change_callbacks.remove(callback)
    
    def get_throttle_delay(self) -> float:
        """
        Get recommended throttle delay in seconds
        
        Returns:
            Delay in seconds (0 for no throttling)
        """
        if self.metrics.current_state == BackPressureState.NORMAL:
            return 0.0
        elif self.metrics.current_state == BackPressureState.WARNING:
            return 0.001  # 1ms delay
        elif self.metrics.current_state == BackPressureState.THROTTLE:
            # Adaptive delay based on backlog
            base_delay = 0.01  # 10ms base
            backlog_multiplier = min(self.metrics.backlog_ratio, 5.0)
            return base_delay * backlog_multiplier
        else:  # CRITICAL
            return 0.1  # 100ms delay
    
    def get_drop_probability(self) -> float:
        """
        Get probability of dropping new inputs (0.0-1.0)
        
        Returns:
            Drop probability
        """
        if self.metrics.current_state != BackPressureState.CRITICAL:
            return 0.0
        
        # Progressive dropping based on utilization
        excess_utilization = self.metrics.queue_utilization - self.critical_threshold
        max_excess = 1.0 - self.critical_threshold
        
        if max_excess <= 0:
            return 1.0
        
        drop_prob = min(excess_utilization / max_excess, 1.0)
        return drop_prob
    
    def suggest_batch_size(self, default_batch_size: int) -> int:
        """
        Suggest optimal batch size based on current state
        
        Args:
            default_batch_size: Default batch size
            
        Returns:
            Suggested batch size
        """
        if self.metrics.current_state == BackPressureState.NORMAL:
            return default_batch_size
        elif self.metrics.current_state == BackPressureState.WARNING:
            return max(1, int(default_batch_size * 0.8))
        elif self.metrics.current_state == BackPressureState.THROTTLE:
            return max(1, int(default_batch_size * 0.5))
        else:  # CRITICAL
            return 1  # Process one at a time
    
    def reset_metrics(self) -> None:
        """Reset performance metrics"""
        self.metrics = BackPressureMetrics()
        self._input_count = 0
        self._processed_count = 0
        self._input_timestamps.clear()
        self._processed_timestamps.clear()
        self.logger.info("BackPressure metrics reset")
    
    def get_metrics(self) -> Dict[str, any]:
        """Get comprehensive back-pressure metrics"""
        return {
            'current_state': self.metrics.current_state.value,
            'queue_utilization': self.metrics.queue_utilization,
            'queue_size': self._current_queue_size,
            'max_queue_size': self.max_queue_size,
            'throttle_events': self.metrics.throttle_events,
            'drop_events': self.metrics.drop_events,
            'state_changes': self.metrics.state_changes,
            'last_state_change': self.metrics.last_state_change,
            'input_rate_smoothed': self.metrics.input_rate_smoothed,
            'processing_rate_smoothed': self.metrics.processing_rate_smoothed,
            'backlog_ratio': self.metrics.backlog_ratio,
            'throttle_delay_seconds': self.get_throttle_delay(),
            'drop_probability': self.get_drop_probability(),
            'thresholds': {
                'warning': self.threshold * 0.7,
                'throttle': self.threshold,
                'critical': self.critical_threshold,
            }
        }
    
    def is_healthy(self) -> bool:
        """
        Check if back-pressure system is healthy
        
        Returns:
            True if system is healthy
        """
        # Healthy if not in critical state and utilization is reasonable
        return (
            self.metrics.current_state != BackPressureState.CRITICAL and
            self.metrics.queue_utilization < 0.9 and
            self.metrics.backlog_ratio < 3.0
        )
