"""MEV Bot router extensions (strategies list)."""
from fastapi import APIRouter

router = APIRouter(prefix="/mev", tags=["MEV"])


@router.get("/strategies")
async def list_strategies():
    return [
        {"name": "Sandwich V2", "enabled": True},
        {"name": "Liquidation Aave", "enabled": False},
        {"name": "JIT Liquidity", "enabled": True},
    ]
