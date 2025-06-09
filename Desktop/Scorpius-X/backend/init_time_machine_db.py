#!/usr/bin/env python3
"""
Initialize Time Machine Database with sample data
"""
import asyncio
import uuid
import json
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from models.replay_models import Base, Exploit, ReplaySession, Transaction, TransactionTrace, SessionStatus
from database.database import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_tables():
    """Create all database tables"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database tables created successfully")
    await engine.dispose()


async def create_sample_data():
    """Create sample exploit and replay data"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Create sample exploits
        now = datetime.utcnow()
        
        exploits = [
            Exploit(
                id=str(uuid.uuid4()),
                name="Flash Loan Attack on DeFi Protocol",
                chain="ethereum",
                block_number=18500000,
                transaction_hashes=json.dumps(["0x1234...abcd", "0x5678...efgh"]),
                vulnerability_type="flash_loan",
                severity="critical",
                description="Sophisticated flash loan attack exploiting price oracle manipulation",
                affected_contracts=json.dumps(["0xDEF123...789", "0xABC456...012"]),
                attack_vector="price_oracle",
                financial_impact=2500000.0,
                tags=json.dumps(["flash_loan", "oracle", "defi"]),
                exploit_metadata=json.dumps({"value": 2500000, "tokens": ["USDC", "ETH"]}),
                created_at=now - timedelta(hours=2),
                updated_at=now - timedelta(hours=2)
            ),
            Exploit(
                id=str(uuid.uuid4()),
                name="Reentrancy Attack on DEX",
                chain="ethereum", 
                block_number=18495000,
                transaction_hashes=json.dumps(["0x9999...1111"]),
                vulnerability_type="reentrancy",
                severity="high",
                description="Classic reentrancy attack on decentralized exchange",
                affected_contracts=json.dumps(["0x111...222"]),
                attack_vector="reentrancy",
                financial_impact=850000.0,
                tags=json.dumps(["reentrancy", "dex"]),
                exploit_metadata=json.dumps({"value": 850000, "tokens": ["WETH", "DAI"]}),
                created_at=now - timedelta(hours=6),
                updated_at=now - timedelta(hours=6)
            ),
            Exploit(
                id=str(uuid.uuid4()),
                name="Bridge Exploit - Cross Chain",
                chain="polygon",
                block_number=48000000,
                transaction_hashes=json.dumps(["0xaaaa...bbbb", "0xcccc...dddd"]),
                vulnerability_type="bridge_exploit",
                severity="critical",
                description="Cross-chain bridge vulnerability leading to fund drainage",
                affected_contracts=json.dumps(["0x333...444", "0x555...666"]),
                attack_vector="bridge_validation",
                financial_impact=5200000.0,
                tags=json.dumps(["bridge", "cross_chain", "validation"]),
                exploit_metadata=json.dumps({"value": 5200000, "chains": ["ethereum", "polygon"]}),
                created_at=now - timedelta(hours=12),
                updated_at=now - timedelta(hours=12)
            ),
            Exploit(
                id=str(uuid.uuid4()),
                name="NFT Marketplace Bug",
                chain="ethereum",
                block_number=18480000,
                transaction_hashes=json.dumps(["0xeeee...ffff"]),
                vulnerability_type="logic_error",
                severity="medium",
                description="Logic error in NFT marketplace allowing free mints",
                affected_contracts=json.dumps(["0x777...888"]),
                attack_vector="logic_error",
                financial_impact=125000.0,
                tags=json.dumps(["nft", "marketplace", "logic"]),
                exploit_metadata=json.dumps({"value": 125000, "nfts_affected": 50}),
                created_at=now - timedelta(days=1),
                updated_at=now - timedelta(days=1)
            ),
            Exploit(
                id=str(uuid.uuid4()),
                name="Governance Token Manipulation",
                chain="arbitrum",
                block_number=145000000,
                transaction_hashes=json.dumps(["0x1111...2222", "0x3333...4444"]),
                vulnerability_type="governance_attack",
                severity="high",
                description="Governance token manipulation to drain treasury",
                affected_contracts=json.dumps(["0x999...000"]),
                attack_vector="governance",
                financial_impact=1750000.0,
                tags=json.dumps(["governance", "dao", "treasury"]),
                exploit_metadata=json.dumps({"value": 1750000, "proposal_id": "42"}),
                created_at=now - timedelta(days=2),
                updated_at=now - timedelta(days=2)
            ),
            Exploit(
                id=str(uuid.uuid4()),
                name="Sandwich Attack MEV",
                chain="ethereum",
                block_number=18520000,
                transaction_hashes=json.dumps(["0x5555...6666"]),
                vulnerability_type="mev_attack",
                severity="low",
                description="Sandwich attack on large DEX transaction",
                affected_contracts=json.dumps(["0xaaa...bbb"]),
                attack_vector="mev",
                financial_impact=45000.0,
                tags=json.dumps(["mev", "sandwich", "frontrun"]),
                exploit_metadata=json.dumps({"value": 45000, "victim_tx": "0x7777...8888"}),
                created_at=now - timedelta(hours=1),
                updated_at=now - timedelta(hours=1)
            )
        ]
        
        for exploit in exploits:
            session.add(exploit)
        
        # Create sample replay sessions
        replay_sessions = [
            ReplaySession(
                id=str(uuid.uuid4()),
                exploit_id=exploits[0].id,
                session_type="exploit_replay",
                status=SessionStatus.COMPLETED,
                fork_block=18499900,
                chain="ethereum",
                parameters=json.dumps({"trace_level": "full", "analyze": True, "end_block": 18500100, "target_contracts": ["0xDEF123...789"]}),
                results=json.dumps({"success": True, "transactions_replayed": 15, "gas_used": 2500000}),
                execution_time=45,
                created_at=now - timedelta(hours=1, minutes=30),
                updated_at=now - timedelta(hours=1, minutes=15)
            ),
            ReplaySession(
                id=str(uuid.uuid4()),
                exploit_id=exploits[1].id,
                session_type="exploit_replay", 
                status=SessionStatus.RUNNING,
                fork_block=18494900,
                chain="ethereum",
                parameters=json.dumps({"trace_level": "basic", "analyze": False, "end_block": 18495100, "target_contracts": ["0x111...222"]}),
                results=json.dumps({}),
                created_at=now - timedelta(minutes=30),
                updated_at=now - timedelta(minutes=5)
            )
        ]
        
        for replay_session in replay_sessions:
            session.add(replay_session)
        
        await session.commit()
        logger.info(f"Created {len(exploits)} sample exploits and {len(replay_sessions)} replay sessions")
    
    await engine.dispose()


async def main():
    """Main initialization function"""
    logger.info("Initializing Time Machine Database...")
    
    # Create tables
    await create_tables()
    
    # Create sample data
    await create_sample_data()
    
    logger.info("Time Machine Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())
