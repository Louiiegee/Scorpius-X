#!/usr/bin/env python3
"""
MEV Pattern Recognition System
Advanced pattern detection and analysis for MEV opportunities.
"""
import asyncio
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import time
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

@dataclass
class Pattern:
    """Represents a detected MEV pattern."""
    pattern_id: str
    pattern_type: str
    confidence: float
    frequency: int
    profit_potential: float
    metadata: Dict[str, Any]

class MEVPatternRecognizer:
    """
    Advanced pattern recognition for MEV opportunities.
    Analyzes historical data to identify recurring profitable patterns.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize pattern recognizer.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.patterns_detected = 0
        self.pattern_history = deque(maxlen=1000)  # Store last 1000 patterns
        self.pattern_stats = defaultdict(lambda: {"count": 0, "total_profit": 0.0})
        
        # Pattern detection parameters
        self.time_window_seconds = config.get("time_window_seconds", 300)  # 5 minutes
        self.confidence_threshold = config.get("confidence_threshold", 0.7)
        self.min_pattern_frequency = config.get("min_pattern_frequency", 3)
        
        logger.info("MEVPatternRecognizer initialized")
    
    async def analyze_patterns(self, historical_data: List[Dict[str, Any]]) -> List[Pattern]:
        """
        Analyze historical MEV data for patterns.
        
        Args:
            historical_data: List of historical MEV opportunities
            
        Returns:
            List of detected patterns
        """
        patterns = []
        
        try:
            # Analyze arbitrage patterns
            arbitrage_patterns = await self._analyze_arbitrage_patterns(historical_data)
            patterns.extend(arbitrage_patterns)
            
            # Analyze timing patterns  
            timing_patterns = await self._analyze_timing_patterns(historical_data)
            patterns.extend(timing_patterns)
            
            # Analyze market correlation patterns
            correlation_patterns = await self._analyze_correlation_patterns(historical_data)
            patterns.extend(correlation_patterns)
            
            self.patterns_detected += len(patterns)
            
            # Update pattern history
            for pattern in patterns:
                self.pattern_history.append({
                    "timestamp": time.time(),
                    "pattern": pattern,
                    "data_size": len(historical_data)
                })
            
            logger.info(f"Detected {len(patterns)} patterns from {len(historical_data)} data points")
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error analyzing patterns: {e}")
            return []
    
    async def _analyze_arbitrage_patterns(self, data: List[Dict[str, Any]]) -> List[Pattern]:
        """Analyze arbitrage opportunity patterns."""
        patterns = []
        
        # Group opportunities by token pairs
        token_pair_groups = defaultdict(list)
        for opportunity in data:
            if opportunity.get("strategy_type") == "arbitrage":
                tokens = tuple(sorted(opportunity.get("tokens", [])))
                token_pair_groups[tokens].append(opportunity)
        
        # Detect patterns in each token pair group
        for tokens, opportunities in token_pair_groups.items():
            if len(opportunities) >= self.min_pattern_frequency:
                avg_profit = sum(opp.get("profit_usd", 0) for opp in opportunities) / len(opportunities)
                
                pattern = Pattern(
                    pattern_id=f"arbitrage_{tokens[0]}_{tokens[1]}_{int(time.time())}",
                    pattern_type="arbitrage",
                    confidence=min(len(opportunities) / 10.0, 1.0),  # More frequent = higher confidence
                    frequency=len(opportunities),
                    profit_potential=avg_profit,
                    metadata={
                        "tokens": tokens,
                        "avg_profit": avg_profit,
                        "frequency": len(opportunities),
                        "dexes": list(set(dex for opp in opportunities for dex in opp.get("dexes", [])))
                    }
                )
                patterns.append(pattern)
        
        return patterns
    
    async def _analyze_timing_patterns(self, data: List[Dict[str, Any]]) -> List[Pattern]:
        """Analyze timing-based patterns."""
        patterns = []
        
        # Analyze opportunities by hour of day
        hourly_stats = defaultdict(lambda: {"count": 0, "total_profit": 0.0})
        
        for opportunity in data:
            timestamp = opportunity.get("timestamp", time.time())
            hour = int(time.gmtime(timestamp).tm_hour)
            hourly_stats[hour]["count"] += 1
            hourly_stats[hour]["total_profit"] += opportunity.get("profit_usd", 0)
        
        # Find peak hours
        best_hours = []
        for hour, stats in hourly_stats.items():
            if stats["count"] >= self.min_pattern_frequency:
                avg_profit = stats["total_profit"] / stats["count"]
                if avg_profit > 50:  # Threshold for significant profit
                    best_hours.append((hour, stats, avg_profit))
        
        if best_hours:
            best_hours.sort(key=lambda x: x[2], reverse=True)  # Sort by avg profit
            top_hour, stats, avg_profit = best_hours[0]
            
            pattern = Pattern(
                pattern_id=f"timing_hour_{top_hour}_{int(time.time())}",
                pattern_type="timing",
                confidence=min(stats["count"] / 20.0, 1.0),
                frequency=stats["count"],
                profit_potential=avg_profit,
                metadata={
                    "peak_hour": top_hour,
                    "avg_profit": avg_profit,
                    "frequency": stats["count"],
                    "all_hour_stats": dict(hourly_stats)
                }
            )
            patterns.append(pattern)
        
        return patterns
    
    async def _analyze_correlation_patterns(self, data: List[Dict[str, Any]]) -> List[Pattern]:
        """Analyze market correlation patterns."""
        patterns = []
        
        # Analyze gas price correlation with opportunities
        gas_profit_correlation = []
        
        for opportunity in data:
            gas_estimate = opportunity.get("gas_estimate", 0)
            profit = opportunity.get("profit_usd", 0)
            if gas_estimate > 0 and profit > 0:
                gas_profit_correlation.append((gas_estimate, profit))
        
        if len(gas_profit_correlation) >= self.min_pattern_frequency:
            # Simple correlation analysis
            avg_gas = sum(x[0] for x in gas_profit_correlation) / len(gas_profit_correlation)
            avg_profit = sum(x[1] for x in gas_profit_correlation) / len(gas_profit_correlation)
            
            # Check if higher gas correlates with higher profit
            high_gas_profits = [profit for gas, profit in gas_profit_correlation if gas > avg_gas]
            low_gas_profits = [profit for gas, profit in gas_profit_correlation if gas <= avg_gas]
            
            if high_gas_profits and low_gas_profits:
                high_gas_avg = sum(high_gas_profits) / len(high_gas_profits)
                low_gas_avg = sum(low_gas_profits) / len(low_gas_profits)
                
                if high_gas_avg > low_gas_avg * 1.2:  # 20% higher profit for higher gas
                    pattern = Pattern(
                        pattern_id=f"gas_correlation_{int(time.time())}",
                        pattern_type="correlation",
                        confidence=0.8,
                        frequency=len(gas_profit_correlation),
                        profit_potential=high_gas_avg,
                        metadata={
                            "correlation_type": "gas_price_profit",
                            "high_gas_avg_profit": high_gas_avg,
                            "low_gas_avg_profit": low_gas_avg,
                            "threshold_gas": avg_gas
                        }
                    )
                    patterns.append(pattern)
        
        return patterns
    
    async def predict_opportunity(self, current_conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Predict MEV opportunity based on current conditions and learned patterns.
        
        Args:
            current_conditions: Current market/network conditions
            
        Returns:
            Prediction dictionary if opportunity likely, None otherwise
        """
        try:
            predictions = []
            
            # Check against known patterns
            for pattern_entry in list(self.pattern_history)[-50:]:  # Check last 50 patterns
                pattern = pattern_entry["pattern"]
                
                # Simple pattern matching based on conditions
                if pattern.pattern_type == "timing":
                    current_hour = int(time.gmtime().tm_hour)
                    if current_hour == pattern.metadata.get("peak_hour"):
                        predictions.append({
                            "type": "timing_match",
                            "confidence": pattern.confidence,
                            "expected_profit": pattern.profit_potential,
                            "pattern_id": pattern.pattern_id
                        })
                
                elif pattern.pattern_type == "correlation":
                    current_gas = current_conditions.get("gas_price_gwei", 0)
                    threshold_gas = pattern.metadata.get("threshold_gas", 0)
                    if current_gas > threshold_gas:
                        predictions.append({
                            "type": "correlation_match", 
                            "confidence": pattern.confidence,
                            "expected_profit": pattern.profit_potential,
                            "pattern_id": pattern.pattern_id
                        })
            
            # Return best prediction if any
            if predictions:
                best_prediction = max(predictions, key=lambda x: x["confidence"])
                if best_prediction["confidence"] >= self.confidence_threshold:
                    return best_prediction
            
            return None
            
        except Exception as e:
            logger.error(f"Error predicting opportunity: {e}")
            return None
    
    def get_pattern_statistics(self) -> Dict[str, Any]:
        """Get pattern recognition statistics."""
        pattern_type_counts = defaultdict(int)
        total_confidence = 0.0
        total_profit_potential = 0.0
        
        for entry in self.pattern_history:
            pattern = entry["pattern"]
            pattern_type_counts[pattern.pattern_type] += 1
            total_confidence += pattern.confidence
            total_profit_potential += pattern.profit_potential
        
        num_patterns = len(self.pattern_history)
        
        return {
            "patterns_detected": self.patterns_detected,
            "patterns_in_history": num_patterns,
            "pattern_types": dict(pattern_type_counts),
            "avg_confidence": total_confidence / max(num_patterns, 1),
            "avg_profit_potential": total_profit_potential / max(num_patterns, 1),
            "config": {
                "time_window_seconds": self.time_window_seconds,
                "confidence_threshold": self.confidence_threshold,
                "min_pattern_frequency": self.min_pattern_frequency
            }
        }
    
    async def update_configuration(self, new_config: Dict[str, Any]) -> None:
        """Update pattern recognizer configuration."""
        self.config.update(new_config)
        self.time_window_seconds = self.config.get("time_window_seconds", 300)
        self.confidence_threshold = self.config.get("confidence_threshold", 0.7)
        self.min_pattern_frequency = self.config.get("min_pattern_frequency", 3)
        
        logger.info("Pattern recognizer configuration updated")
