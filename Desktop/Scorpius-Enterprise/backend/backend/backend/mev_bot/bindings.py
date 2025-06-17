#!/usr/bin/env python3
"""
Rust Engine Bindings for Elite MEV System
High-performance pathfinding and arbitrage detection using Rust core.
"""
import asyncio
import json
import logging
import subprocess
import tempfile
import os
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import time

logger = logging.getLogger(__name__)

@dataclass
class ArbitragePath:
    """Arbitrage opportunity path from Rust engine."""
    path_id: str
    chain_id: int
    tokens: List[str]
    exchanges: List[str]
    estimated_profit_usd: float
    estimated_gas_cost_usd: float
    confidence_score: float
    execution_time_ms: float
    slippage_tolerance: float
    min_liquidity_required: float

@dataclass
class RustEngineConfig:
    """Configuration for Rust engine."""
    rust_binary_path: str
    max_execution_time_seconds: int = 30
    max_concurrent_searches: int = 10
    min_profit_threshold_usd: float = 50.0
    max_gas_price_gwei: float = 100.0
    slippage_tolerance: float = 0.005  # 0.5%
    enable_cross_chain: bool = True
    log_level: str = "info"

class RustArbitrageEngine:
    """
    Python bindings for Rust pathfinding engine.
    Provides high-performance arbitrage detection and execution planning.
    """
    
    def __init__(self, config: RustEngineConfig):
        """
        Initialize Rust engine bindings.
        
        Args:
            config: Rust engine configuration
        """
        self.config = config
        self.binary_path = Path(config.rust_binary_path)
        self.temp_dir = Path(tempfile.gettempdir()) / "elite_mev_rust"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Performance metrics
        self.total_searches = 0
        self.successful_searches = 0
        self.average_search_time_ms = 0.0
        self.cache_hit_rate = 0.0
        
        # Cache for repeated searches
        self._path_cache: Dict[str, Tuple[List[ArbitragePath], float]] = {}
        self._cache_ttl_seconds = 60
        
        logger.info(f"Rust engine initialized with binary: {self.binary_path}")
    
    async def find_arbitrage_paths(
        self,
        chain_configs: Dict[str, Dict],
        token_pairs: List[Tuple[str, str]],
        min_profit_usd: Optional[float] = None,
        max_results: int = 100
    ) -> List[ArbitragePath]:
        """
        Find arbitrage opportunities using Rust engine.
        
        Args:
            chain_configs: Multi-chain configuration data
            token_pairs: List of (token_a, token_b) pairs to analyze
            min_profit_usd: Minimum profit threshold
            max_results: Maximum number of results to return
            
        Returns:
            List of arbitrage paths found
        """
        start_time = time.time()
        
        try:
            # Create cache key
            cache_key = self._create_cache_key(chain_configs, token_pairs, min_profit_usd)
            
            # Check cache first
            cached_result = self._get_cached_result(cache_key)
            if cached_result:
                logger.debug(f"Cache hit for arbitrage search")
                return cached_result
            
            # Prepare input data for Rust engine
            input_data = {
                "chains": chain_configs,
                "token_pairs": [{"token_a": a, "token_b": b} for a, b in token_pairs],
                "config": {
                    "min_profit_usd": min_profit_usd or self.config.min_profit_threshold_usd,
                    "max_gas_price_gwei": self.config.max_gas_price_gwei,
                    "slippage_tolerance": self.config.slippage_tolerance,
                    "enable_cross_chain": self.config.enable_cross_chain,
                    "max_results": max_results
                }
            }
            
            # Execute Rust engine
            paths = await self._execute_rust_engine(input_data, "find_arbitrage")
            
            # Cache results
            self._cache_result(cache_key, paths)
            
            # Update metrics
            execution_time_ms = (time.time() - start_time) * 1000
            self._update_metrics(execution_time_ms, success=True)
            
            logger.info(f"Found {len(paths)} arbitrage paths in {execution_time_ms:.2f}ms")
            return paths
            
        except Exception as e:
            logger.error(f"Error finding arbitrage paths: {e}")
            self._update_metrics((time.time() - start_time) * 1000, success=False)
            return []
    
    async def validate_arbitrage_path(
        self,
        path: ArbitragePath,
        current_prices: Dict[str, float],
        gas_price_gwei: float
    ) -> Dict[str, Any]:
        """
        Validate an arbitrage path with current market conditions.
        
        Args:
            path: Arbitrage path to validate
            current_prices: Current token prices
            gas_price_gwei: Current gas price
            
        Returns:
            Validation result with updated estimates
        """
        try:
            input_data = {
                "path": asdict(path),
                "current_prices": current_prices,
                "gas_price_gwei": gas_price_gwei,
                "config": {
                    "slippage_tolerance": self.config.slippage_tolerance
                }
            }
            
            result = await self._execute_rust_engine(input_data, "validate_path")
            
            if result and len(result) > 0:
                return result[0]  # Return first validation result
            else:
                return {
                    "valid": False,
                    "reason": "No validation result returned",
                    "updated_profit_usd": 0.0,
                    "updated_gas_cost_usd": 0.0
                }
                
        except Exception as e:
            logger.error(f"Error validating arbitrage path: {e}")
            return {
                "valid": False,
                "reason": f"Validation error: {str(e)}",
                "updated_profit_usd": 0.0,
                "updated_gas_cost_usd": 0.0
            }
    
    async def optimize_execution_order(
        self,
        paths: List[ArbitragePath],
        available_balance_usd: float,
        max_concurrent_executions: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Optimize execution order for multiple arbitrage paths.
        
        Args:
            paths: List of arbitrage paths
            available_balance_usd: Available balance for execution
            max_concurrent_executions: Maximum concurrent executions
            
        Returns:
            Optimized execution plan
        """
        try:
            input_data = {
                "paths": [asdict(path) for path in paths],
                "available_balance_usd": available_balance_usd,
                "max_concurrent_executions": max_concurrent_executions,
                "config": {
                    "optimization_strategy": "profit_maximization",
                    "risk_tolerance": "medium"
                }
            }
            
            result = await self._execute_rust_engine(input_data, "optimize_execution")
            return result if result else []
            
        except Exception as e:
            logger.error(f"Error optimizing execution order: {e}")
            return []
    
    async def _execute_rust_engine(
        self,
        input_data: Dict[str, Any],
        operation: str
    ) -> List[Any]:
        """
        Execute Rust engine with input data.
        
        Args:
            input_data: Input data for Rust engine
            operation: Operation to perform
            
        Returns:
            Parsed results from Rust engine
        """
        # Create temporary input file
        input_file = self.temp_dir / f"input_{operation}_{int(time.time() * 1000)}.json"
        output_file = self.temp_dir / f"output_{operation}_{int(time.time() * 1000)}.json"
        
        try:
            # Write input data
            with open(input_file, 'w') as f:
                json.dump(input_data, f)
            
            # Prepare command
            cmd = [
                str(self.binary_path),
                "--operation", operation,
                "--input", str(input_file),
                "--output", str(output_file),
                "--log-level", self.config.log_level
            ]
            
            # Execute with timeout
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.config.max_execution_time_seconds
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                raise Exception(f"Rust engine execution timed out after {self.config.max_execution_time_seconds}s")
            
            # Check return code
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                raise Exception(f"Rust engine failed with code {process.returncode}: {error_msg}")
            
            # Read output
            if output_file.exists():
                with open(output_file, 'r') as f:
                    output_data = json.load(f)
                
                # Parse results based on operation
                if operation == "find_arbitrage":
                    return [self._parse_arbitrage_path(path_data) for path_data in output_data.get("paths", [])]
                elif operation == "validate_path":
                    return output_data.get("validations", [])
                elif operation == "optimize_execution":
                    return output_data.get("execution_plan", [])
                else:
                    return output_data.get("results", [])
            else:
                logger.warning(f"No output file generated for operation: {operation}")
                return []
                
        finally:
            # Cleanup temporary files
            for temp_file in [input_file, output_file]:
                if temp_file.exists():
                    try:
                        temp_file.unlink()
                    except Exception as e:
                        logger.warning(f"Failed to cleanup temp file {temp_file}: {e}")
    
    def _parse_arbitrage_path(self, path_data: Dict[str, Any]) -> ArbitragePath:
        """Parse arbitrage path data from Rust engine."""
        return ArbitragePath(
            path_id=path_data.get("path_id", ""),
            chain_id=path_data.get("chain_id", 1),
            tokens=path_data.get("tokens", []),
            exchanges=path_data.get("exchanges", []),
            estimated_profit_usd=path_data.get("estimated_profit_usd", 0.0),
            estimated_gas_cost_usd=path_data.get("estimated_gas_cost_usd", 0.0),
            confidence_score=path_data.get("confidence_score", 0.0),
            execution_time_ms=path_data.get("execution_time_ms", 0.0),
            slippage_tolerance=path_data.get("slippage_tolerance", self.config.slippage_tolerance),
            min_liquidity_required=path_data.get("min_liquidity_required", 0.0)
        )
    
    def _create_cache_key(
        self,
        chain_configs: Dict[str, Dict],
        token_pairs: List[Tuple[str, str]],
        min_profit_usd: Optional[float]
    ) -> str:
        """Create cache key for search parameters."""
        import hashlib
        
        data = {
            "chains": sorted(chain_configs.keys()),
            "pairs": sorted(token_pairs),
            "min_profit": min_profit_usd or self.config.min_profit_threshold_usd
        }
        
        return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()
    
    def _get_cached_result(self, cache_key: str) -> Optional[List[ArbitragePath]]:
        """Get cached result if not expired."""
        if cache_key in self._path_cache:
            paths, timestamp = self._path_cache[cache_key]
            if time.time() - timestamp < self._cache_ttl_seconds:
                return paths
            else:
                del self._path_cache[cache_key]
        return None
    
    def _cache_result(self, cache_key: str, paths: List[ArbitragePath]) -> None:
        """Cache search result with timestamp."""
        self._path_cache[cache_key] = (paths, time.time())
        
        # Cleanup old cache entries
        if len(self._path_cache) > 100:
            oldest_key = min(self._path_cache.keys(), 
                           key=lambda k: self._path_cache[k][1])
            del self._path_cache[oldest_key]
    
    def _update_metrics(self, execution_time_ms: float, success: bool) -> None:
        """Update performance metrics."""
        self.total_searches += 1
        if success:
            self.successful_searches += 1
        
        # Update average execution time
        if self.total_searches == 1:
            self.average_search_time_ms = execution_time_ms
        else:
            self.average_search_time_ms = (
                (self.average_search_time_ms * (self.total_searches - 1) + execution_time_ms) 
                / self.total_searches
            )
        
        # Update cache hit rate
        cache_hits = len([k for k, (_, ts) in self._path_cache.items() 
                         if time.time() - ts < self._cache_ttl_seconds])
        self.cache_hit_rate = cache_hits / max(self.total_searches, 1)
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        success_rate = self.successful_searches / max(self.total_searches, 1)
        
        return {
            "total_searches": self.total_searches,
            "successful_searches": self.successful_searches,
            "success_rate": success_rate,
            "average_search_time_ms": self.average_search_time_ms,
            "cache_hit_rate": self.cache_hit_rate,
            "cached_entries": len(self._path_cache)
        }
    
    async def cleanup(self) -> None:
        """Cleanup resources and temporary files."""
        try:
            # Clear cache
            self._path_cache.clear()
            
            # Cleanup temp directory
            if self.temp_dir.exists():
                for temp_file in self.temp_dir.glob("*"):
                    temp_file.unlink()
                self.temp_dir.rmdir()
                
            logger.info("Rust engine cleanup completed")
        except Exception as e:
            logger.warning(f"Error during cleanup: {e}")

class RustEngineManager:
    """Manager for multiple Rust engine instances with load balancing."""
    
    def __init__(self, configs: List[RustEngineConfig]):
        """
        Initialize engine manager.
        
        Args:
            configs: List of engine configurations
        """
        self.engines = [RustArbitrageEngine(config) for config in configs]
        self.current_engine_index = 0
        
    async def find_arbitrage_paths(self, *args, **kwargs) -> List[ArbitragePath]:
        """Find arbitrage paths using load-balanced engines."""
        engine = self._get_next_engine()
        return await engine.find_arbitrage_paths(*args, **kwargs)
    
    async def validate_arbitrage_path(self, *args, **kwargs) -> Dict[str, Any]:
        """Validate arbitrage path using load-balanced engines."""
        engine = self._get_next_engine()
        return await engine.validate_arbitrage_path(*args, **kwargs)
    
    async def optimize_execution_order(self, *args, **kwargs) -> List[Dict[str, Any]]:
        """Optimize execution order using load-balanced engines."""
        engine = self._get_next_engine()
        return await engine.optimize_execution_order(*args, **kwargs)
    
    def _get_next_engine(self) -> RustArbitrageEngine:
        """Get next engine using round-robin load balancing."""
        engine = self.engines[self.current_engine_index]
        self.current_engine_index = (self.current_engine_index + 1) % len(self.engines)
        return engine
    
    def get_aggregate_metrics(self) -> Dict[str, Any]:
        """Get aggregated performance metrics from all engines."""
        total_searches = sum(engine.total_searches for engine in self.engines)
        total_successful = sum(engine.successful_searches for engine in self.engines)
        
        avg_search_time = sum(
            engine.average_search_time_ms * engine.total_searches 
            for engine in self.engines
        ) / max(total_searches, 1)
        
        avg_cache_hit_rate = sum(engine.cache_hit_rate for engine in self.engines) / len(self.engines)
        
        return {
            "total_engines": len(self.engines),
            "total_searches": total_searches,
            "total_successful_searches": total_successful,
            "success_rate": total_successful / max(total_searches, 1),
            "average_search_time_ms": avg_search_time,
            "average_cache_hit_rate": avg_cache_hit_rate,
            "engine_metrics": [engine.get_performance_metrics() for engine in self.engines]
        }
    
    async def cleanup(self) -> None:
        """Cleanup all engines."""
        for engine in self.engines:
            await engine.cleanup()
