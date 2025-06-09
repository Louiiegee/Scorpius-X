#!/usr/bin/env python3
"""
Ultimate MEV API Server
Combines sophisticated MEV strategies with comprehensive API endpoints
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from mev_config import config_manager
from mev_strategies import (
    StrategyType, MEVOpportunity, StrategyStats,
    FlashLoanArbitrageStrategy, SandwichAttackStrategy, LiquidationBotStrategy,
    CrossChainArbitrageStrategy, OracleManipulationStrategy, GovernanceAttackStrategy
)

# Pydantic Models for API
class MEVBotStatus(BaseModel):
    """MEV Bot Status Model"""
    is_running: bool
    active_strategies: List[str]
    total_profit: float
    total_opportunities: int
    uptime_seconds: float
    rust_engine_status: bool

class StrategyToggleRequest(BaseModel):
    """Strategy Toggle Request Model"""
    strategy_type: str
    enabled: bool

class OpportunityResponse(BaseModel):
    """Opportunity Response Model"""
    strategy_type: str
    estimated_profit: float
    gas_estimate: int
    confidence_score: float
    execution_data: Dict[str, Any]
    timestamp: float
    block_number: Optional[int] = None

class ExecutionResult(BaseModel):
    """Execution Result Model"""
    success: bool
    transaction_hash: Optional[str] = None
    profit_realized: Optional[float] = None
    gas_used: Optional[int] = None
    error_message: Optional[str] = None

class UltimateMEVBot:
    """Ultimate MEV Bot combining Python and Rust capabilities"""
    
    def __init__(self):
        self.config = config_manager.config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.is_running = False
        self.start_time: Optional[float] = None
        
        # Initialize all strategies
        self.strategies: Dict[StrategyType, Any] = {
            StrategyType.FLASHLOAN_ARBITRAGE: FlashLoanArbitrageStrategy(),
            StrategyType.SANDWICH_ATTACK: SandwichAttackStrategy(),
            StrategyType.LIQUIDATION_BOT: LiquidationBotStrategy(),
            StrategyType.CROSS_CHAIN_ARBITRAGE: CrossChainArbitrageStrategy(),
            StrategyType.ORACLE_MANIPULATION: OracleManipulationStrategy(),
            StrategyType.GOVERNANCE_ATTACK: GovernanceAttackStrategy()
        }
        
        # Strategy monitoring tasks
        self.strategy_tasks: Dict[StrategyType, Optional[asyncio.Task]] = {
            strategy_type: None for strategy_type in self.strategies.keys()
        }
        
        # Opportunity storage
        self.recent_opportunities: List[MEVOpportunity] = []
        self.recent_executions: List[Dict[str, Any]] = []
        self.max_history_size = 1000
        
        # WebSocket connections
        self.websocket_connections: List[WebSocket] = []
        
        self.logger.info("Ultimate MEV Bot initialized with 6 strategies")
    
    async def start_bot(self) -> None:
        """Start the MEV bot and all active strategies"""
        if self.is_running:
            self.logger.warning("MEV Bot is already running")
            return
        
        self.is_running = True
        self.start_time = time.time()
        self.logger.info("🚀 Starting Ultimate MEV Bot...")
        
        # Start opportunity processing task
        asyncio.create_task(self._process_opportunities())
        
        # Start WebSocket broadcast task
        asyncio.create_task(self._broadcast_updates())
        
        self.logger.info("✅ Ultimate MEV Bot started successfully")
    
    async def stop_bot(self) -> None:
        """Stop the MEV bot and all strategies"""
        if not self.is_running:
            self.logger.warning("MEV Bot is not running")
            return
        
        self.is_running = False
        self.logger.info("🛑 Stopping Ultimate MEV Bot...")
        
        # Stop all strategy monitoring
        for strategy_type in self.strategies:
            await self.stop_strategy(strategy_type)
        
        # Cancel all tasks
        for task in self.strategy_tasks.values():
            if task and not task.done():
                task.cancel()
        
        self.logger.info("✅ Ultimate MEV Bot stopped successfully")
    
    async def start_strategy(self, strategy_type: StrategyType) -> bool:
        """Start monitoring for a specific strategy"""
        try:
            if strategy_type not in self.strategies:
                self.logger.error(f"Unknown strategy type: {strategy_type}")
                return False
            
            strategy = self.strategies[strategy_type]
            
            if self.strategy_tasks[strategy_type] is not None:
                self.logger.warning(f"Strategy {strategy_type.value} is already running")
                return True
            
            # Start strategy monitoring
            task = asyncio.create_task(strategy.start_monitoring())
            self.strategy_tasks[strategy_type] = task
            
            self.logger.info(f"✅ Started strategy: {strategy_type.value}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to start strategy {strategy_type.value}: {e}")
            return False
    
    async def stop_strategy(self, strategy_type: StrategyType) -> bool:
        """Stop monitoring for a specific strategy"""
        try:
            if strategy_type not in self.strategies:
                self.logger.error(f"Unknown strategy type: {strategy_type}")
                return False
            
            strategy = self.strategies[strategy_type]
            await strategy.stop_monitoring()
            
            # Cancel monitoring task
            task = self.strategy_tasks[strategy_type]
            if task and not task.done():
                task.cancel()
                self.strategy_tasks[strategy_type] = None
            
            self.logger.info(f"🛑 Stopped strategy: {strategy_type.value}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to stop strategy {strategy_type.value}: {e}")
            return False
    
    async def _process_opportunities(self) -> None:
        """Process opportunities from all strategies"""
        while self.is_running:
            try:
                # Collect opportunities from all active strategies
                for strategy_type, strategy in self.strategies.items():
                    if strategy.is_active and not strategy._opportunity_queue.empty():
                        try:
                            opportunity = await asyncio.wait_for(
                                strategy._opportunity_queue.get(), timeout=0.1
                            )
                            
                            # Add to recent opportunities
                            self.recent_opportunities.append(opportunity)
                            if len(self.recent_opportunities) > self.max_history_size:
                                self.recent_opportunities.pop(0)
                            
                            # Execute if profitable enough
                            if opportunity.estimated_profit > self.config.profit_threshold:
                                asyncio.create_task(self._execute_opportunity(opportunity))
                                
                        except asyncio.TimeoutError:
                            continue
                
                await asyncio.sleep(0.1)
                
            except Exception as e:
                self.logger.error(f"Error processing opportunities: {e}")
                await asyncio.sleep(1)
    
    async def _execute_opportunity(self, opportunity: MEVOpportunity) -> None:
        """Execute an MEV opportunity"""
        try:
            strategy = self.strategies[opportunity.strategy_type]
            
            self.logger.info(f"🎯 Executing {opportunity.strategy_type.value} opportunity: "
                           f"{opportunity.estimated_profit:.4f} ETH profit")
            
            start_time = time.time()
            success = await strategy.execute_opportunity(opportunity)
            execution_time = time.time() - start_time
            
            # Record execution result
            execution_result = {
                'strategy_type': opportunity.strategy_type.value,
                'success': success,
                'estimated_profit': opportunity.estimated_profit,
                'execution_time': execution_time,
                'timestamp': time.time(),
                'confidence_score': opportunity.confidence_score
            }
            
            self.recent_executions.append(execution_result)
            if len(self.recent_executions) > self.max_history_size:
                self.recent_executions.pop(0)
            
            if success:
                self.logger.info(f"✅ Successfully executed {opportunity.strategy_type.value}")
            else:
                self.logger.warning(f"❌ Failed to execute {opportunity.strategy_type.value}")
            
        except Exception as e:
            self.logger.error(f"Error executing opportunity: {e}")
    
    async def _broadcast_updates(self) -> None:
        """Broadcast real-time updates to WebSocket clients"""
        while self.is_running:
            try:
                if self.websocket_connections:
                    update_data = {
                        'type': 'status_update',
                        'timestamp': time.time(),
                        'status': self.get_bot_status().dict(),
                        'recent_opportunities': len(self.recent_opportunities),
                        'recent_executions': len(self.recent_executions)
                    }
                    
                    # Broadcast to all connected clients
                    disconnected_clients = []
                    for websocket in self.websocket_connections:
                        try:
                            await websocket.send_text(json.dumps(update_data))
                        except Exception:
                            disconnected_clients.append(websocket)
                    
                    # Remove disconnected clients
                    for client in disconnected_clients:
                        self.websocket_connections.remove(client)
                
                await asyncio.sleep(2)  # Broadcast every 2 seconds
                
            except Exception as e:
                self.logger.error(f"Error broadcasting updates: {e}")
                await asyncio.sleep(5)
    
    def get_bot_status(self) -> MEVBotStatus:
        """Get current bot status"""
        active_strategies = [
            strategy_type.value for strategy_type, strategy in self.strategies.items()
            if strategy.is_active
        ]
        
        total_profit = sum(
            strategy.stats.total_profit for strategy in self.strategies.values()
        )
        
        total_opportunities = sum(
            strategy.stats.total_opportunities for strategy in self.strategies.values()
        )
        
        uptime = time.time() - self.start_time if self.start_time else 0
        
        return MEVBotStatus(
            is_running=self.is_running,
            active_strategies=active_strategies,
            total_profit=total_profit,
            total_opportunities=total_opportunities,
            uptime_seconds=uptime,
            rust_engine_status=config_manager.config.rust_enabled
        )
    
    def get_strategy_stats(self, strategy_type: StrategyType) -> StrategyStats:
        """Get statistics for a specific strategy"""
        if strategy_type in self.strategies:
            return self.strategies[strategy_type].stats
        else:
            return StrategyStats()

# Global MEV Bot instance
mev_bot = UltimateMEVBot()

# FastAPI application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    await mev_bot.start_bot()
    yield
    # Shutdown
    await mev_bot.stop_bot()

app = FastAPI(
    title="Ultimate MEV Bot API",
    description="Sophisticated MEV bot with 6 strategies including Rust acceleration",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints

@app.get("/status", response_model=MEVBotStatus)
async def get_status():
    """Get MEV bot status"""
    return mev_bot.get_bot_status()

@app.post("/start")
async def start_bot():
    """Start the MEV bot"""
    await mev_bot.start_bot()
    return {"message": "MEV bot started successfully"}

@app.post("/stop")
async def stop_bot():
    """Stop the MEV bot"""
    await mev_bot.stop_bot()
    return {"message": "MEV bot stopped successfully"}

@app.post("/strategy/toggle")
async def toggle_strategy(request: StrategyToggleRequest):
    """Toggle a specific strategy on/off"""
    try:
        strategy_type = StrategyType(request.strategy_type)
        
        if request.enabled:
            success = await mev_bot.start_strategy(strategy_type)
            message = f"Strategy {request.strategy_type} started"
        else:
            success = await mev_bot.stop_strategy(strategy_type)
            message = f"Strategy {request.strategy_type} stopped"
        
        if success:
            return {"message": message, "success": True}
        else:
            raise HTTPException(status_code=400, detail=f"Failed to toggle strategy {request.strategy_type}")
            
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid strategy type: {request.strategy_type}")

@app.get("/strategies")
async def get_strategies():
    """Get all available strategies and their status"""
    strategies = {}
    for strategy_type in StrategyType:
        strategy = mev_bot.strategies[strategy_type]
        strategies[strategy_type.value] = {
            "name": strategy_type.value.replace("_", " ").title(),
            "is_active": strategy.is_active,
            "stats": strategy.stats.to_dict(),
            "config": strategy.config
        }
    return strategies

@app.get("/strategy/{strategy_type}/stats")
async def get_strategy_stats(strategy_type: str):
    """Get statistics for a specific strategy"""
    try:
        strategy_enum = StrategyType(strategy_type)
        stats = mev_bot.get_strategy_stats(strategy_enum)
        return stats.to_dict()
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid strategy type: {strategy_type}")

@app.get("/opportunities")
async def get_recent_opportunities(limit: int = 50):
    """Get recent MEV opportunities"""
    opportunities = mev_bot.recent_opportunities[-limit:]
    return [opp.to_dict() for opp in opportunities]

@app.get("/executions")
async def get_recent_executions(limit: int = 50):
    """Get recent execution results"""
    executions = mev_bot.recent_executions[-limit:]
    return executions

@app.get("/performance")
async def get_performance_metrics():
    """Get overall performance metrics"""
    total_profit = sum(strategy.stats.total_profit for strategy in mev_bot.strategies.values())
    total_opportunities = sum(strategy.stats.total_opportunities for strategy in mev_bot.strategies.values())
    total_executions = sum(strategy.stats.successful_executions + strategy.stats.failed_executions 
                          for strategy in mev_bot.strategies.values())
    success_rate = 0
    if total_executions > 0:
        successful_executions = sum(strategy.stats.successful_executions for strategy in mev_bot.strategies.values())
        success_rate = successful_executions / total_executions
    
    return {
        "total_profit_eth": total_profit,
        "total_opportunities": total_opportunities,
        "total_executions": total_executions,
        "success_rate": success_rate,
        "uptime_hours": (time.time() - mev_bot.start_time) / 3600 if mev_bot.start_time else 0,
        "strategies_active": len([s for s in mev_bot.strategies.values() if s.is_active])
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    mev_bot.websocket_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        mev_bot.websocket_connections.remove(websocket)

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.environ.get("MEV_PORT", 8003))
    
    uvicorn.run(
        "mev_api_server:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        reload=False
    )
