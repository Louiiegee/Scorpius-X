"""
Elite Mempool System - Main Launcher
This is the primary entry point for the Elite Mempool System.
"""
import asyncio
import logging
import signal
import sys
import time
from typing import Dict, Any, Optional
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from web3 import AsyncWeb3
from web3.providers import AsyncHTTPProvider, WebsocketProviderV2

# Import configuration
from config import load_config

# Import core components
from core.session_manager import SessionManager
from core.enhanced_mempool_monitor import EnhancedMempoolMonitor

# Import analysis components
from mev_analysis.mev_detector import MEVDetector

# Import execution components
from execution.execution_engine import ExecutionEngine

# Import models
from models.mempool_event import MempoolEvent
from models.mev_opportunity import MEVOpportunity

logger = logging.getLogger(__name__)

class EliteMempoolSystem:
    """
    Main system orchestrator for the Elite Mempool System.
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize the Elite Mempool System.
        
        Args:
            config_path: Path to configuration directory
        """
        self.config = load_config(config_path)
        self.is_running = False
        self.shutdown_event = asyncio.Event()
        
        # Core components
        self.session_manager: Optional[SessionManager] = None
        self.web3_instances: Dict[str, AsyncWeb3] = {}
        self.mempool_monitors: Dict[str, EnhancedMempoolMonitor] = {}
        self.mev_detectors: Dict[str, MEVDetector] = {}
        self.execution_engines: Dict[str, ExecutionEngine] = {}
        
        # FastAPI application
        self.app: Optional[FastAPI] = None
        
        # Statistics
        self.system_stats = {
            "start_time": 0.0,
            "uptime_seconds": 0.0,
            "opportunities_detected": 0,
            "opportunities_executed": 0,
            "total_profit_eth": 0.0,
            "active_networks": 0
        }
        
        self._setup_logging()
        
    def _setup_logging(self) -> None:
        """Setup system logging configuration."""
        log_level = self.config.get("log_level", "INFO")
        
        logging.basicConfig(
            level=getattr(logging, log_level),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('elite_mempool_system.log')
            ]
        )
        
        # Set specific logger levels
        logging.getLogger("aiohttp").setLevel(logging.WARNING)
        logging.getLogger("websockets").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        
        logger.info(f"Logging configured at {log_level} level")

    async def initialize(self) -> None:
        """Initialize all system components."""
        try:
            logger.info("Initializing Elite Mempool System...")
            
            # Initialize session manager
            self.session_manager = SessionManager(timeout_seconds=30)
            logger.info("Session manager initialized")
            
            # Initialize Web3 instances for each active network
            await self._initialize_web3_instances()
            
            # Initialize mempool monitors
            await self._initialize_mempool_monitors()
            
            # Initialize MEV detectors
            await self._initialize_mev_detectors()
            
            # Initialize execution engines
            await self._initialize_execution_engines()
            
            # Initialize FastAPI application
            self._initialize_fastapi()
            
            logger.info("System initialization completed successfully")
            
        except Exception as e:
            logger.error(f"System initialization failed: {e}", exc_info=True)
            raise

    async def _initialize_web3_instances(self) -> None:
        """Initialize Web3 instances for configured networks."""
        networks_config = self.config.get("networks", {})
        
        for network_name, network_config in networks_config.items():
            if not network_config.get("is_active", False):
                logger.info(f"Skipping inactive network: {network_name}")
                continue
                
            try:
                rpc_urls = network_config.get("rpc_urls", [])
                if not rpc_urls:
                    logger.warning(f"No RPC URLs configured for {network_name}")
                    continue
                
                # Use first HTTP RPC URL for general operations
                http_rpc = network_config.get("http_rpc_for_sync")
                if not http_rpc and rpc_urls:
                    http_rpc = next((url for url in rpc_urls if url.startswith("http")), rpc_urls[0])
                
                if http_rpc:
                    provider = AsyncHTTPProvider(http_rpc)
                    web3_instance = AsyncWeb3(provider)
                    
                    # Test connection
                    chain_id = await web3_instance.eth.chain_id
                    expected_chain_id = network_config.get("chain_id")
                    
                    if chain_id == expected_chain_id:
                        self.web3_instances[network_name] = web3_instance
                        logger.info(f"Web3 instance initialized for {network_name} (chain_id: {chain_id})")
                    else:
                        logger.error(f"Chain ID mismatch for {network_name}: expected {expected_chain_id}, got {chain_id}")
                
            except Exception as e:
                logger.error(f"Failed to initialize Web3 for {network_name}: {e}")

    async def _initialize_mempool_monitors(self) -> None:
        """Initialize mempool monitors for active networks."""
        networks_config = self.config.get("networks", {})
        mempool_config = self.config.get("mempool_monitor", {})
        
        for network_name, network_config in networks_config.items():
            if not network_config.get("is_active", False):
                continue
                
            if network_name not in self.web3_instances:
                logger.warning(f"No Web3 instance for {network_name}, skipping mempool monitor")
                continue
                
            try:
                chain_id = network_config.get("chain_id")
                rpc_urls = network_config.get("rpc_urls", [])
                
                monitor = EnhancedMempoolMonitor(
                    chain_id=chain_id,
                    rpc_urls=rpc_urls,
                    session_manager=self.session_manager,
                    max_stored_txs=mempool_config.get("max_stored_txs", 10000),
                    poll_interval=mempool_config.get("poll_interval_seconds", 0.1),
                    cleanup_interval=mempool_config.get("cleanup_interval_seconds", 60.0),
                    reconnect_delay=mempool_config.get("reconnect_delay_seconds", 5.0),
                    request_timeout=mempool_config.get("request_timeout_seconds", 10.0)
                )
                
                # Set up callback to MEV detector
                monitor.add_async_callback(self._handle_mempool_event)
                
                # Apply default filters
                min_tx_value = mempool_config.get("default_min_tx_value_eth", 0.001)
                monitor.set_min_value(min_tx_value)
                
                self.mempool_monitors[network_name] = monitor
                logger.info(f"Mempool monitor initialized for {network_name}")
                
            except Exception as e:
                logger.error(f"Failed to initialize mempool monitor for {network_name}: {e}")

    async def _initialize_mev_detectors(self) -> None:
        """Initialize MEV detectors for active networks."""
        mev_config = self.config.get("mev_detector", {})
        
        for network_name, web3_instance in self.web3_instances.items():
            try:
                networks_config = self.config.get("networks", {})
                network_config = networks_config.get(network_name, {})
                chain_id = network_config.get("chain_id")
                
                detector = MEVDetector(
                    web3=web3_instance,
                    network_id=chain_id,
                    config=mev_config
                )
                
                self.mev_detectors[network_name] = detector
                logger.info(f"MEV detector initialized for {network_name}")
                
            except Exception as e:
                logger.error(f"Failed to initialize MEV detector for {network_name}: {e}")

    async def _initialize_execution_engines(self) -> None:
        """Initialize execution engines for active networks."""
        execution_config = self.config.get("execution_engine", {})
        
        for network_name, web3_instance in self.web3_instances.items():
            try:
                networks_config = self.config.get("networks", {})
                network_config = networks_config.get(network_name, {})
                chain_id = network_config.get("chain_id")
                
                # Merge network-specific config with execution config
                engine_config = {**execution_config}
                if "flashbots_rpc_url" in network_config:
                    engine_config["flashbots_rpc_url"] = network_config["flashbots_rpc_url"]
                
                engine = ExecutionEngine(
                    web3=web3_instance,
                    network_id=chain_id,
                    config=engine_config,
                    session_manager=self.session_manager
                )
                
                self.execution_engines[network_name] = engine
                logger.info(f"Execution engine initialized for {network_name}")
                
            except Exception as e:
                logger.error(f"Failed to initialize execution engine for {network_name}: {e}")

    def _initialize_fastapi(self) -> None:
        """Initialize FastAPI application with routes."""
        self.app = FastAPI(
            title="Elite Mempool System API",
            description="Advanced MEV detection and execution system",
            version="1.0.0"
        )
        
        # Add basic health check endpoint
        @self.app.get("/health")
        async def health_check():
            return {
                "status": "healthy",
                "uptime": time.time() - self.system_stats["start_time"],
                "active_networks": len(self.web3_instances)
            }
        
        # Add system status endpoint
        @self.app.get("/api/v1/status")
        async def system_status():
            return await self._get_system_status()
        
        # Add stats endpoint
        @self.app.get("/api/v1/stats")
        async def system_stats():
            return await self._get_system_stats()
        
        logger.info("FastAPI application initialized")

    async def _handle_mempool_event(self, event: MempoolEvent) -> None:
        """
        Handle mempool events by running MEV detection.
        
        Args:
            event: The mempool event to analyze
        """
        try:
            # Find the appropriate MEV detector for this network
            network_name = None
            for name, web3_instance in self.web3_instances.items():
                if await web3_instance.eth.chain_id == event.network_id:
                    network_name = name
                    break
            
            if not network_name or network_name not in self.mev_detectors:
                logger.debug(f"No MEV detector found for network {event.network_id}")
                return
            
            detector = self.mev_detectors[network_name]
            opportunities = await detector.analyze_mempool_event(event)
            
            if opportunities:
                self.system_stats["opportunities_detected"] += len(opportunities)
                logger.info(f"Detected {len(opportunities)} MEV opportunities from tx {event.tx_hash}")
                
                # Execute opportunities if configured
                await self._handle_mev_opportunities(network_name, opportunities)
                
        except Exception as e:
            logger.error(f"Error handling mempool event {event.tx_hash}: {e}")

    async def _handle_mev_opportunities(
        self,
        network_name: str,
        opportunities: list[MEVOpportunity]
    ) -> None:
        """
        Handle detected MEV opportunities.
        
        Args:
            network_name: Name of the network
            opportunities: List of detected opportunities
        """
        try:
            if network_name not in self.execution_engines:
                logger.warning(f"No execution engine for {network_name}")
                return
            
            execution_engine = self.execution_engines[network_name]
            opportunity_config = self.config.get("opportunity_manager", {})
            min_profit_usd = opportunity_config.get("min_execution_profit_usd", 5.0)
            
            for opportunity in opportunities:
                # Check if opportunity meets execution criteria
                if opportunity.estimated_profit_usd < min_profit_usd:
                    logger.debug(f"Opportunity {opportunity.opportunity_id} below minimum profit threshold")
                    continue
                
                # Execute the opportunity
                logger.info(f"Executing opportunity {opportunity.opportunity_id}")
                result = await execution_engine.execute_opportunity(opportunity)
                
                if result.success:
                    self.system_stats["opportunities_executed"] += 1
                    if result.profit_realized:
                        self.system_stats["total_profit_eth"] += result.profit_realized
                    logger.info(f"Opportunity executed successfully: {opportunity.opportunity_id}")
                else:
                    logger.warning(f"Opportunity execution failed: {opportunity.opportunity_id}, error: {result.error_message}")
                
        except Exception as e:
            logger.error(f"Error handling MEV opportunities: {e}")

    async def start(self) -> None:
        """Start the Elite Mempool System."""
        try:
            if self.is_running:
                logger.warning("System is already running")
                return
            
            logger.info("Starting Elite Mempool System...")
            self.system_stats["start_time"] = time.time()
            self.is_running = True
            
            # Start mempool monitors
            for network_name, monitor in self.mempool_monitors.items():
                await monitor.start()
                logger.info(f"Started mempool monitor for {network_name}")
            
            self.system_stats["active_networks"] = len(self.mempool_monitors)
            
            # Start periodic tasks
            asyncio.create_task(self._periodic_stats_logger())
            asyncio.create_task(self._periodic_cleanup())
            
            logger.info("Elite Mempool System started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start system: {e}", exc_info=True)
            await self.stop()
            raise

    async def stop(self) -> None:
        """Stop the Elite Mempool System."""
        try:
            if not self.is_running:
                logger.warning("System is not running")
                return
            
            logger.info("Stopping Elite Mempool System...")
            self.is_running = False
            self.shutdown_event.set()
            
            # Stop mempool monitors
            for network_name, monitor in self.mempool_monitors.items():
                await monitor.stop()
                logger.info(f"Stopped mempool monitor for {network_name}")
            
            # Cleanup execution engines
            for network_name, engine in self.execution_engines.items():
                await engine.cleanup()
                logger.info(f"Cleaned up execution engine for {network_name}")
            
            # Close session manager
            if self.session_manager:
                await self.session_manager.close_all()
                logger.info("Session manager closed")
            
            logger.info("Elite Mempool System stopped")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}", exc_info=True)

    async def _periodic_stats_logger(self) -> None:
        """Log system statistics periodically."""
        while self.is_running and not self.shutdown_event.is_set():
            try:
                await asyncio.sleep(60)  # Log every minute
                
                stats = await self._get_system_stats()
                logger.info(f"System Stats: {stats}")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic stats logger: {e}")

    async def _periodic_cleanup(self) -> None:
        """Perform periodic cleanup tasks."""
        while self.is_running and not self.shutdown_event.is_set():
            try:
                await asyncio.sleep(300)  # Cleanup every 5 minutes
                
                # Cleanup MEV detectors
                for detector in self.mev_detectors.values():
                    await detector.cleanup_expired_data()
                
                logger.debug("Periodic cleanup completed")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")

    async def _get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status."""
        status = {
            "system": {
                "is_running": self.is_running,
                "uptime_seconds": time.time() - self.system_stats["start_time"] if self.is_running else 0,
                "active_networks": len(self.mempool_monitors)
            },
            "networks": {},
            "components": {
                "session_manager": self.session_manager is not None,
                "mempool_monitors": len(self.mempool_monitors),
                "mev_detectors": len(self.mev_detectors),
                "execution_engines": len(self.execution_engines)
            }
        }
        
        # Get network-specific status
        for network_name, monitor in self.mempool_monitors.items():
            monitor_stats = monitor.get_stats()
            detector_stats = self.mev_detectors.get(network_name, {}).get_stats() if network_name in self.mev_detectors else {}
            engine_stats = self.execution_engines.get(network_name, {}).get_stats() if network_name in self.execution_engines else {}
            
            status["networks"][network_name] = {
                "monitor": monitor_stats,
                "detector": detector_stats,
                "engine": engine_stats
            }
        
        return status

    async def _get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics."""
        stats = self.system_stats.copy()
        stats["uptime_seconds"] = time.time() - stats["start_time"] if self.is_running else 0
        
        # Aggregate stats from components
        total_txs_processed = 0
        total_opportunities = 0
        
        for monitor in self.mempool_monitors.values():
            monitor_stats = monitor.get_stats()
            total_txs_processed += monitor_stats.get("txs_processed_for_callbacks", 0)
        
        for detector in self.mev_detectors.values():
            detector_stats = detector.get_stats()
            total_opportunities += detector_stats.get("opportunities_detected", 0)
        
        stats.update({
            "total_txs_processed": total_txs_processed,
            "total_opportunities_detected": total_opportunities
        })
        
        return stats

    async def run_server(self) -> None:
        """Run the FastAPI server."""
        if not self.app:
            raise RuntimeError("FastAPI app not initialized")
        
        api_config = self.config.get("api", {})
        host = api_config.get("host", "127.0.0.1")
        port = api_config.get("port", 8000)
        
        config = uvicorn.Config(
            app=self.app,
            host=host,
            port=port,
            log_level="info"
        )
        
        server = uvicorn.Server(config)
        await server.serve()

async def main():
    """Main entry point for the Elite Mempool System."""
    system = None
    
    def signal_handler(signum, frame):
        """Handle shutdown signals."""
        logger.info(f"Received signal {signum}, initiating shutdown...")
        if system:
            asyncio.create_task(system.stop())
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Initialize and start the system
        system = EliteMempoolSystem()
        await system.initialize()
        await system.start()
        
        # Run the FastAPI server
        await system.run_server()
        
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"System error: {e}", exc_info=True)
    finally:
        if system:
            await system.stop()

if __name__ == "__main__":
    asyncio.run(main())
