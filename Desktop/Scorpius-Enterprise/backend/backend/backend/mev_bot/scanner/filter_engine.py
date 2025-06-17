"""
High-Performance Filter Engine with DSL Compilation
Compiles filter expressions to bytecode for sub-50μs evaluation
"""

import ast
import operator
import time
import logging
from typing import Dict, List, Optional, Any, Callable, Set, Union
from dataclasses import dataclass
from decimal import Decimal

from ..core.types import TransactionData


@dataclass
class FilterMetrics:
    """Metrics for filter performance"""
    total_evaluations: int = 0
    total_matches: int = 0
    total_time_microseconds: int = 0
    max_evaluation_time_microseconds: int = 0
    min_evaluation_time_microseconds: int = float('inf')
    
    @property
    def average_time_microseconds(self) -> float:
        """Calculate average evaluation time"""
        if self.total_evaluations == 0:
            return 0.0
        return self.total_time_microseconds / self.total_evaluations
    
    @property
    def match_rate(self) -> float:
        """Calculate match rate percentage"""
        if self.total_evaluations == 0:
            return 0.0
        return (self.total_matches / self.total_evaluations) * 100


class CompiledFilter:
    """
    Compiled filter expression for high-speed evaluation
    
    Supports expressions like:
    - (valueEth > 1.0) & (to in hotPairs) & (selector == swapExactETHForTokens)
    - (gasPrice < 200e9) | (value > 10e18)
    - from_address not in blacklist
    """
    
    def __init__(self, expression: str, hot_pairs: Set[str] = None, blacklist: Set[str] = None):
        """
        Initialize compiled filter
        
        Args:
            expression: Filter expression to compile
            hot_pairs: Set of hot pair addresses
            blacklist: Set of blacklisted addresses
        """
        self.expression = expression
        self.hot_pairs = hot_pairs or set()
        self.blacklist = blacklist or set()
        self.logger = logging.getLogger("CompiledFilter")
        self.metrics = FilterMetrics()
        
        # Compile the expression
        self._compiled_func = self._compile_expression(expression)
        
    def _compile_expression(self, expression: str) -> Callable[[TransactionData], bool]:
        """
        Compile expression to optimized Python function
        
        Args:
            expression: Expression to compile
            
        Returns:
            Compiled evaluation function
        """
        try:
            # Parse the expression into AST
            tree = ast.parse(expression, mode='eval')
            
            # Transform AST for optimization
            transformer = FilterTransformer(self.hot_pairs, self.blacklist)
            optimized_tree = transformer.visit(tree)
            
            # Compile to bytecode
            code = compile(optimized_tree, '<filter>', 'eval')
            
            # Create evaluation function
            def evaluate(tx: TransactionData) -> bool:
                # Create evaluation context
                context = {
                    # Transaction fields
                    'hash': tx.hash,
                    'from_address': tx.from_address,
                    'to_address': tx.to_address,
                    'to': tx.to_address,  # Alias
                    'value': tx.value,
                    'valueEth': float(tx.value_eth),
                    'gasPrice': tx.gas_price,
                    'gasPriceGwei': tx.gas_price / 1e9,
                    'gasLimit': tx.gas_limit,
                    'gas': tx.gas_limit,  # Alias
                    'data': tx.data,
                    'input': tx.data,  # Alias
                    'nonce': tx.nonce,
                    'selector': tx.selector,
                    'priorityFee': tx.priority_fee or 0,
                    'maxFee': tx.max_fee or 0,
                    
                    # Helper sets
                    'hotPairs': self.hot_pairs,
                    'blacklist': self.blacklist,
                    
                    # Helper functions
                    'len': len,
                    'abs': abs,
                    'min': min,
                    'max': max,
                    
                    # Operators
                    'and': operator.and_,
                    'or': operator.or_,
                    'not': operator.not_,
                    'in': operator.contains,
                }
                
                return eval(code, {"__builtins__": {}}, context)
            
            return evaluate
            
        except Exception as e:
            self.logger.error(f"Failed to compile filter '{expression}': {e}")
            # Return a function that always returns True as fallback
            return lambda tx: True
    
    def matches(self, tx: TransactionData) -> bool:
        """
        Evaluate if transaction matches filter
        
        Args:
            tx: Transaction to evaluate
            
        Returns:
            True if transaction matches filter
        """
        start_time = time.perf_counter_ns()
        
        try:
            result = self._compiled_func(tx)
            
            # Update metrics
            end_time = time.perf_counter_ns()
            evaluation_time_us = (end_time - start_time) // 1000
            
            self.metrics.total_evaluations += 1
            self.metrics.total_time_microseconds += evaluation_time_us
            
            if evaluation_time_us > self.metrics.max_evaluation_time_microseconds:
                self.metrics.max_evaluation_time_microseconds = evaluation_time_us
            
            if evaluation_time_us < self.metrics.min_evaluation_time_microseconds:
                self.metrics.min_evaluation_time_microseconds = evaluation_time_us
            
            if result:
                self.metrics.total_matches += 1
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error evaluating filter: {e}")
            return False
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get filter performance metrics"""
        return {
            'expression': self.expression,
            'total_evaluations': self.metrics.total_evaluations,
            'total_matches': self.metrics.total_matches,
            'match_rate': self.metrics.match_rate,
            'avg_time_microseconds': self.metrics.average_time_microseconds,
            'max_time_microseconds': self.metrics.max_evaluation_time_microseconds,
            'min_time_microseconds': self.metrics.min_evaluation_time_microseconds,
        }


class FilterTransformer(ast.NodeTransformer):
    """AST transformer for optimizing filter expressions"""
    
    def __init__(self, hot_pairs: Set[str], blacklist: Set[str]):
        self.hot_pairs = hot_pairs
        self.blacklist = blacklist
    
    def visit_Compare(self, node: ast.Compare) -> ast.AST:
        """Optimize comparison operations"""
        # Handle 'in' operations with sets
        if len(node.ops) == 1 and isinstance(node.ops[0], ast.In):
            # Check if comparing against hotPairs or blacklist
            if (isinstance(node.comparators[0], ast.Name) and 
                node.comparators[0].id in ['hotPairs', 'blacklist']):
                
                # This could be optimized further by pre-computing set lookups
                pass
        
        return self.generic_visit(node)
    
    def visit_Name(self, node: ast.Name) -> ast.AST:
        """Transform variable names for optimization"""
        # Map common aliases
        aliases = {
            'to': 'to_address',
            'input': 'data',
            'gas': 'gasLimit',
        }
        
        if node.id in aliases:
            node.id = aliases[node.id]
        
        return node


class FilterEngine:
    """
    High-performance filter engine for transaction filtering
    Manages multiple compiled filters and provides aggregated evaluation
    """
    
    def __init__(self, hot_pairs: List[str] = None, blacklist: List[str] = None):
        """
        Initialize filter engine
        
        Args:
            hot_pairs: List of hot pair addresses
            blacklist: List of blacklisted addresses
        """
        self.logger = logging.getLogger("FilterEngine")
        self.hot_pairs = set(hot_pairs or [])
        self.blacklist = set(blacklist or [])
        
        self._filters: List[CompiledFilter] = []
        self._global_metrics = FilterMetrics()
    
    def add_filter(self, expression: str) -> CompiledFilter:
        """
        Add a new filter expression
        
        Args:
            expression: Filter expression to add
            
        Returns:
            Compiled filter object
        """
        filter_obj = CompiledFilter(expression, self.hot_pairs, self.blacklist)
        self._filters.append(filter_obj)
        self.logger.info(f"Added filter: {expression}")
        return filter_obj
    
    def remove_filter(self, expression: str) -> bool:
        """
        Remove a filter by expression
        
        Args:
            expression: Expression to remove
            
        Returns:
            True if filter was removed
        """
        for i, filter_obj in enumerate(self._filters):
            if filter_obj.expression == expression:
                del self._filters[i]
                self.logger.info(f"Removed filter: {expression}")
                return True
        return False
    
    def update_hot_pairs(self, hot_pairs: List[str]) -> None:
        """
        Update hot pairs list
        
        Args:
            hot_pairs: New list of hot pair addresses
        """
        self.hot_pairs = set(hot_pairs)
        
        # Recompile all filters with new hot pairs
        for filter_obj in self._filters:
            filter_obj.hot_pairs = self.hot_pairs
            filter_obj._compiled_func = filter_obj._compile_expression(filter_obj.expression)
        
        self.logger.info(f"Updated {len(hot_pairs)} hot pairs")
    
    def update_blacklist(self, blacklist: List[str]) -> None:
        """
        Update blacklist
        
        Args:
            blacklist: New list of blacklisted addresses
        """
        self.blacklist = set(blacklist)
        
        # Recompile all filters with new blacklist
        for filter_obj in self._filters:
            filter_obj.blacklist = self.blacklist
            filter_obj._compiled_func = filter_obj._compile_expression(filter_obj.expression)
        
        self.logger.info(f"Updated {len(blacklist)} blacklisted addresses")
    
    def passes_filters(self, tx: TransactionData) -> bool:
        """
        Check if transaction passes all filters
        
        Args:
            tx: Transaction to evaluate
            
        Returns:
            True if transaction passes all filters
        """
        start_time = time.perf_counter_ns()
        
        try:
            # If no filters, pass all transactions
            if not self._filters:
                return True
            
            # All filters must pass (AND logic)
            for filter_obj in self._filters:
                if not filter_obj.matches(tx):
                    return False
            
            # Track global metrics
            end_time = time.perf_counter_ns()
            evaluation_time_us = (end_time - start_time) // 1000
            
            self._global_metrics.total_evaluations += 1
            self._global_metrics.total_time_microseconds += evaluation_time_us
            self._global_metrics.total_matches += 1
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error evaluating filters: {e}")
            return False
    
    def passes_any_filter(self, tx: TransactionData) -> bool:
        """
        Check if transaction passes any filter (OR logic)
        
        Args:
            tx: Transaction to evaluate
            
        Returns:
            True if transaction passes any filter
        """
        if not self._filters:
            return True
        
        for filter_obj in self._filters:
            if filter_obj.matches(tx):
                return True
        
        return False
    
    def get_filter_count(self) -> int:
        """Get number of active filters"""
        return len(self._filters)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive filter engine metrics"""
        filter_metrics = []
        for filter_obj in self._filters:
            filter_metrics.append(filter_obj.get_metrics())
        
        return {
            'total_filters': len(self._filters),
            'hot_pairs_count': len(self.hot_pairs),
            'blacklist_count': len(self.blacklist),
            'global_metrics': {
                'total_evaluations': self._global_metrics.total_evaluations,
                'total_matches': self._global_metrics.total_matches,
                'match_rate': self._global_metrics.match_rate,
                'avg_time_microseconds': self._global_metrics.average_time_microseconds,
            },
            'individual_filters': filter_metrics,
        }
    
    def benchmark_filter(self, expression: str, test_transactions: List[TransactionData]) -> Dict[str, Any]:
        """
        Benchmark a filter expression against test transactions
        
        Args:
            expression: Filter expression to benchmark
            test_transactions: List of test transactions
            
        Returns:
            Benchmark results
        """
        filter_obj = CompiledFilter(expression, self.hot_pairs, self.blacklist)
        
        start_time = time.perf_counter_ns()
        matches = 0
        
        for tx in test_transactions:
            if filter_obj.matches(tx):
                matches += 1
        
        end_time = time.perf_counter_ns()
        total_time_us = (end_time - start_time) // 1000
        
        return {
            'expression': expression,
            'test_transactions': len(test_transactions),
            'matches': matches,
            'match_rate': (matches / len(test_transactions)) * 100 if test_transactions else 0,
            'total_time_microseconds': total_time_us,
            'avg_time_per_tx_microseconds': total_time_us / len(test_transactions) if test_transactions else 0,
            'transactions_per_second': len(test_transactions) / (total_time_us / 1_000_000) if total_time_us > 0 else 0,
        }


# Predefined filter expressions for common use cases
COMMON_FILTERS = {
    'high_value': 'valueEth > 1.0',
    'dex_swaps': 'selector in ["0xa9059cbb", "0x095ea7b3", "0x7ff36ab5"]',  # transfer, approve, swapExactETHForTokens
    'low_gas': 'gasPriceGwei < 50',
    'hot_pairs_only': 'to in hotPairs',
    'exclude_blacklist': 'from_address not in blacklist',
    'large_transactions': 'valueEth > 10.0',
    'medium_gas': '(gasPriceGwei >= 20) and (gasPriceGwei <= 100)',
    'sandwich_targets': '(selector == "0x7ff36ab5") and (valueEth > 0.1)',  # swapExactETHForTokens with min value
    'arbitrage_opportunities': '(valueEth > 0.5) and (to in hotPairs)',
}


def create_default_filter_engine(hot_pairs: List[str] = None, blacklist: List[str] = None) -> FilterEngine:
    """
    Create filter engine with default filters
    
    Args:
        hot_pairs: List of hot pair addresses
        blacklist: List of blacklisted addresses
        
    Returns:
        Configured filter engine
    """
    engine = FilterEngine(hot_pairs, blacklist)
    
    # Add common filters
    engine.add_filter(COMMON_FILTERS['high_value'])
    engine.add_filter(COMMON_FILTERS['exclude_blacklist'])
    engine.add_filter(COMMON_FILTERS['medium_gas'])
    
    return engine
