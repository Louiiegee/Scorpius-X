from fastapi import APIRouter, HTTPException, FastAPI
from fastapi.responses import JSONResponse
from engine.engine import ScorpiusEngine
from mev_engine import get_mev_engine
from typing import List, Dict, Any
import asyncio
import time

router = APIRouter(prefix="/api")
engine = ScorpiusEngine()

@router.post("/scan/{contract_address}")
async def scan_contract(contract_address: str):
    """
    Kick off a new scan job for the given contract_address.
    Returns {"job_id": "<uuid>"}.
    """
    try:
        job_id = engine.submit_scan(contract_address)
        return JSONResponse({"job_id": job_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mev/opportunities")
async def get_mev_opportunities():
    """
    Get current MEV opportunities from all active strategies.
    Returns list of opportunities with strategy type, profit estimates, and execution data.
    """
    try:
        mev_engine = get_mev_engine()
        opportunities = await mev_engine.get_active_opportunities()
        
        # Convert opportunities to JSON-serializable format
        formatted_opportunities = []
        for opp in opportunities:
            formatted_opp = {
                "strategy_type": opp.strategy_type.value,
                "estimated_profit": opp.estimated_profit,
                "gas_estimate": opp.gas_estimate,
                "confidence_score": opp.confidence_score,
                "execution_data": opp.execution_data,
                "block_number": opp.block_number,
                "timestamp": opp.timestamp
            }
            formatted_opportunities.append(formatted_opp)
        
        return JSONResponse({
            "opportunities": formatted_opportunities,
            "total_count": len(formatted_opportunities),
            "timestamp": time.time()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch MEV opportunities: {str(e)}")

@router.get("/mev/strategies")
async def get_mev_strategies():
    """
    Get status and performance metrics for all MEV strategies.
    Returns strategy states, statistics, and configuration.
    """
    try:
        mev_engine = get_mev_engine()
        strategy_status = {}
        
        for strategy_type, strategy in mev_engine.strategies.items():
            strategy_status[strategy_type.value] = {
                "enabled": strategy.enabled,
                "total_scans": strategy.stats.total_scans,
                "successful_executions": strategy.stats.successful_executions,
                "failed_executions": strategy.stats.failed_executions,
                "total_profit": strategy.stats.total_profit,
                "total_errors": strategy.stats.total_errors,
                "last_scan_time": strategy.stats.last_scan_time,
                "last_execution": strategy.stats.last_execution,
                "success_rate": (
                    strategy.stats.successful_executions / 
                    max(1, strategy.stats.successful_executions + strategy.stats.failed_executions)
                ) * 100
            }
        
        return JSONResponse({
            "strategies": strategy_status,
            "engine_running": mev_engine.running,
            "total_active_opportunities": len(mev_engine.active_opportunities),
            "success_rate": strategy_status.get("flashloan_arbitrage", {}).get("success_rate", 0.0)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy status: {str(e)}")

@router.get("/mev/performance")
async def get_mev_performance():
    """
    Get overall MEV bot performance statistics and metrics.
    Returns profit, success rates, and execution stats.
    """
    try:
        mev_engine = get_mev_engine()
        stats = await mev_engine.get_performance_stats()
        return JSONResponse(stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch MEV performance: {str(e)}")

@router.post("/mev/strategies/{strategy_id}/pause")
async def pause_strategy(strategy_id: str):
    """
    Pause a specific MEV strategy.
    """
    try:
        mev_engine = get_mev_engine()
        # Convert strategy_id to StrategyType enum
        from mev_strategies import StrategyType
        
        strategy_type = None
        for st in StrategyType:
            if st.value == strategy_id:
                strategy_type = st
                break
        
        if not strategy_type or strategy_type not in mev_engine.strategies:
            raise HTTPException(status_code=404, detail=f"Strategy {strategy_id} not found")
        
        mev_engine.strategies[strategy_type].enabled = False
        
        return JSONResponse({
            "status": "success",
            "message": f"Strategy {strategy_id} paused",
            "strategy_id": strategy_id
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pause strategy: {str(e)}")

@router.post("/mev/strategies/{strategy_id}/stop")
async def stop_strategy(strategy_id: str):
    """
    Stop a specific MEV strategy.
    """
    try:
        mev_engine = get_mev_engine()
        # Convert strategy_id to StrategyType enum
        from mev_strategies import StrategyType
        
        strategy_type = None
        for st in StrategyType:
            if st.value == strategy_id:
                strategy_type = st
                break
        
        if not strategy_type or strategy_type not in mev_engine.strategies:
            raise HTTPException(status_code=404, detail=f"Strategy {strategy_id} not found")
        
        mev_engine.strategies[strategy_type].enabled = False
        
        return JSONResponse({
            "status": "success", 
            "message": f"Strategy {strategy_id} stopped",
            "strategy_id": strategy_id
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop strategy: {str(e)}")

@router.post("/mev/deploy-strategy")
async def deploy_strategy(request_data: dict):
    """
    Deploy a new MEV strategy with specified parameters.
    """
    try:
        strategy_type = request_data.get("strategy_type")
        parameters = request_data.get("parameters", {})
        
        mev_engine = get_mev_engine()
        
        # Convert strategy_type to StrategyType enum
        from mev_strategies import StrategyType
        
        strategy_enum = None
        for st in StrategyType:
            if st.value == strategy_type:
                strategy_enum = st
                break
        
        if not strategy_enum:
            raise HTTPException(status_code=400, detail=f"Invalid strategy type: {strategy_type}")
        
        if strategy_enum in mev_engine.strategies:
            # Enable existing strategy
            mev_engine.strategies[strategy_enum].enabled = True
            
            return JSONResponse({
                "status": "success",
                "message": f"Strategy {strategy_type} deployed and enabled",
                "strategy_type": strategy_type,
                "parameters": parameters
            })
        else:
            raise HTTPException(status_code=400, detail=f"Strategy {strategy_type} not available")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deploy strategy: {str(e)}")

@router.post("/mev/opportunities/{opportunity_id}/execute")
async def execute_mev_opportunity(opportunity_id: str):
    """
    Execute a specific MEV opportunity by ID.
    Returns execution result and transaction details.
    """
    try:
        mev_engine = get_mev_engine()
        result = await mev_engine.execute_opportunity_by_id(opportunity_id)
        
        if result is None:
            raise HTTPException(status_code=404, detail="Opportunity not found or already executed")
            
        return JSONResponse({
            "success": result.get("success", False),
            "transaction_hash": result.get("transaction_hash"),
            "profit_realized": result.get("profit_realized"),
            "gas_used": result.get("gas_used"),
            "execution_time": result.get("execution_time")
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute opportunity: {str(e)}")

@router.post("/mev/engine/start")
async def start_mev_engine():
    """
    Start the MEV engine for live trading.
    """
    try:
        mev_engine = get_mev_engine()
        
        if mev_engine.running:
            return JSONResponse({
                "status": "already_running",
                "message": "MEV engine is already running",
                "engine_running": True
            })
        
        await mev_engine.start_scanning()
        
        return JSONResponse({
            "status": "success",
            "message": "MEV engine started successfully",
            "engine_running": True,
            "timestamp": time.time()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start MEV engine: {str(e)}")

@router.post("/mev/engine/stop")
async def stop_mev_engine():
    """
    Stop the MEV engine and cancel all live trading.
    """
    try:
        mev_engine = get_mev_engine()
        
        if not mev_engine.running:
            return JSONResponse({
                "status": "already_stopped",
                "message": "MEV engine is already stopped",
                "engine_running": False
            })
        
        await mev_engine.stop_engine()
        
        return JSONResponse({
            "status": "success",
            "message": "MEV engine stopped successfully",
            "engine_running": False,
            "timestamp": time.time()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop MEV engine: {str(e)}")

@router.get("/mev/engine/status")
async def get_mev_engine_status():
    """
    Get current MEV engine status and basic info.
    """
    try:
        mev_engine = get_mev_engine()
        
        return JSONResponse({
            "engine_running": mev_engine.running,
            "total_strategies": len(mev_engine.strategies),
            "active_strategies": sum(1 for strategy in mev_engine.strategies.values() if strategy.enabled),
            "active_opportunities": len(mev_engine.active_opportunities),
            "scanning_tasks": len(mev_engine.scanning_tasks),
            "timestamp": time.time()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get engine status: {str(e)}")

# Keep the old endpoints for backward compatibility
@router.get("/opportunities")
async def get_opportunities_legacy():
    return await get_mev_opportunities()

@router.get("/strategies") 
async def get_strategies_legacy():
    return await get_mev_strategies()

@router.get("/stats")
async def get_stats_legacy():
    return await get_mev_performance()
