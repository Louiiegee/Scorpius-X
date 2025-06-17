#!/usr/bin/env python3
"""
Elite Database Module
Advanced database layer for MEV operations, liquidations, and performance metrics.
"""
import asyncio
import logging
import sqlite3
import aiosqlite
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json
import time
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class MEVOpportunityRecord:
    """MEV opportunity database record."""
    id: Optional[int] = None
    opportunity_id: str = ""
    chain_id: int = 0
    strategy_type: str = ""  # arbitrage, liquidation, sandwich
    token_pair: str = ""
    profit_usd: float = 0.0
    gas_cost_usd: float = 0.0
    net_profit_usd: float = 0.0
    confidence_score: float = 0.0
    execution_status: str = "pending"  # pending, executed, failed, expired
    block_number: int = 0
    transaction_hash: str = ""
    created_at: float = 0.0
    executed_at: Optional[float] = None
    metadata: str = "{}"  # JSON string for additional data

@dataclass
class PerformanceMetric:
    """Performance metric record."""
    id: Optional[int] = None
    metric_type: str = ""  # system, chain, strategy
    metric_name: str = ""
    metric_value: float = 0.0
    chain_id: Optional[int] = None
    strategy_name: Optional[str] = None
    timestamp: float = 0.0
    metadata: str = "{}"

@dataclass
class LiquidationRecord:
    """Liquidation opportunity record."""
    id: Optional[int] = None
    opportunity_id: str = ""
    chain_id: int = 0
    protocol: str = ""
    user_address: str = ""
    collateral_token: str = ""
    debt_token: str = ""
    collateral_amount: float = 0.0
    debt_amount: float = 0.0
    health_factor: float = 0.0
    liquidation_bonus: float = 0.0
    estimated_profit_usd: float = 0.0
    execution_status: str = "pending"
    created_at: float = 0.0
    executed_at: Optional[float] = None

@dataclass
class TrainingData:
    """Training data point for machine learning."""
    features: List[float]
    labels: Dict[str, float]  # Multiple targets: profit, success, risk
    metadata: Dict[str, Any]
    timestamp: float

class EliteDatabase:
    """
    Elite database management system for MEV operations.
    Uses SQLite with async support for performance.
    """
    
    def __init__(self, db_path: str = "elite_mev.db"):
        """
        Initialize database connection.
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = Path(db_path)
        self.connection_pool_size = 5
        self._initialized = False
        
        # Ensure database directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"EliteDatabase initialized with path: {self.db_path}")
    
    async def initialize(self) -> None:
        """Initialize database tables and indexes."""
        if self._initialized:
            return
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await self._create_tables(db)
                await self._create_indexes(db)
                await db.commit()
            
            self._initialized = True
            logger.info("Database initialization completed successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise
    
    async def _create_tables(self, db: aiosqlite.Connection) -> None:
        """Create all database tables."""
        
        # MEV opportunities table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS mev_opportunities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                opportunity_id TEXT UNIQUE NOT NULL,
                chain_id INTEGER NOT NULL,
                strategy_type TEXT NOT NULL,
                token_pair TEXT,
                profit_usd REAL DEFAULT 0.0,
                gas_cost_usd REAL DEFAULT 0.0,
                net_profit_usd REAL DEFAULT 0.0,
                confidence_score REAL DEFAULT 0.0,
                execution_status TEXT DEFAULT 'pending',
                block_number INTEGER DEFAULT 0,
                transaction_hash TEXT,
                created_at REAL NOT NULL,
                executed_at REAL,
                metadata TEXT DEFAULT '{}'
            )
        """)
        
        # Performance metrics table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_type TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                chain_id INTEGER,
                strategy_name TEXT,
                timestamp REAL NOT NULL,
                metadata TEXT DEFAULT '{}'
            )
        """)
        
        # Liquidation opportunities table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS liquidation_opportunities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                opportunity_id TEXT UNIQUE NOT NULL,
                chain_id INTEGER NOT NULL,
                protocol TEXT NOT NULL,
                user_address TEXT NOT NULL,
                collateral_token TEXT NOT NULL,
                debt_token TEXT NOT NULL,
                collateral_amount REAL DEFAULT 0.0,
                debt_amount REAL DEFAULT 0.0,
                health_factor REAL DEFAULT 0.0,
                liquidation_bonus REAL DEFAULT 0.0,
                estimated_profit_usd REAL DEFAULT 0.0,
                execution_status TEXT DEFAULT 'pending',
                created_at REAL NOT NULL,
                executed_at REAL
            )
        """)
        
        # Gas optimization history
        await db.execute("""
            CREATE TABLE IF NOT EXISTS gas_optimization_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chain_id INTEGER NOT NULL,
                block_number INTEGER NOT NULL,
                base_fee_gwei REAL NOT NULL,
                priority_fee_gwei REAL NOT NULL,
                gas_used INTEGER NOT NULL,
                gas_limit INTEGER NOT NULL,
                utilization REAL NOT NULL,
                timestamp REAL NOT NULL
            )
        """)
        
        # Transaction execution history
        await db.execute("""
            CREATE TABLE IF NOT EXISTS transaction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_hash TEXT UNIQUE NOT NULL,
                opportunity_id TEXT,
                chain_id INTEGER NOT NULL,
                strategy_type TEXT NOT NULL,
                gas_used INTEGER,
                gas_price_gwei REAL,
                execution_time_ms INTEGER,
                profit_usd REAL DEFAULT 0.0,
                status TEXT DEFAULT 'pending',
                block_number INTEGER,
                timestamp REAL NOT NULL,
                error_message TEXT
            )
        """)
        
        # System alerts table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS system_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                chain_id INTEGER,
                strategy_name TEXT,
                resolved BOOLEAN DEFAULT FALSE,
                created_at REAL NOT NULL,
                resolved_at REAL,
                metadata TEXT DEFAULT '{}'
            )
        """)
        
        logger.debug("Database tables created successfully")
    
    async def _create_indexes(self, db: aiosqlite.Connection) -> None:
        """Create database indexes for performance."""
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_mev_chain_id ON mev_opportunities(chain_id)",
            "CREATE INDEX IF NOT EXISTS idx_mev_strategy ON mev_opportunities(strategy_type)",
            "CREATE INDEX IF NOT EXISTS idx_mev_created_at ON mev_opportunities(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_mev_status ON mev_opportunities(execution_status)",
            
            "CREATE INDEX IF NOT EXISTS idx_metrics_type ON performance_metrics(metric_type)",
            "CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON performance_metrics(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_metrics_chain ON performance_metrics(chain_id)",
            
            "CREATE INDEX IF NOT EXISTS idx_liq_chain_id ON liquidation_opportunities(chain_id)",
            "CREATE INDEX IF NOT EXISTS idx_liq_protocol ON liquidation_opportunities(protocol)",
            "CREATE INDEX IF NOT EXISTS idx_liq_status ON liquidation_opportunities(execution_status)",
            "CREATE INDEX IF NOT EXISTS idx_liq_created_at ON liquidation_opportunities(created_at)",
            
            "CREATE INDEX IF NOT EXISTS idx_gas_chain_block ON gas_optimization_history(chain_id, block_number)",
            "CREATE INDEX IF NOT EXISTS idx_gas_timestamp ON gas_optimization_history(timestamp)",
            
            "CREATE INDEX IF NOT EXISTS idx_tx_hash ON transaction_history(transaction_hash)",
            "CREATE INDEX IF NOT EXISTS idx_tx_chain ON transaction_history(chain_id)",
            "CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transaction_history(timestamp)",
            
            "CREATE INDEX IF NOT EXISTS idx_alerts_type ON system_alerts(alert_type)",
            "CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity)",
            "CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON system_alerts(resolved)"
        ]
        
        for index_sql in indexes:
            await db.execute(index_sql)
        
        logger.debug("Database indexes created successfully")
    
    # MEV Opportunities methods
    async def save_mev_opportunity(self, opportunity: MEVOpportunityRecord) -> int:
        """
        Save MEV opportunity to database.
        
        Args:
            opportunity: MEV opportunity record
            
        Returns:
            Database ID of saved record
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute("""
                    INSERT OR REPLACE INTO mev_opportunities (
                        opportunity_id, chain_id, strategy_type, token_pair,
                        profit_usd, gas_cost_usd, net_profit_usd, confidence_score,
                        execution_status, block_number, transaction_hash,
                        created_at, executed_at, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    opportunity.opportunity_id,
                    opportunity.chain_id,
                    opportunity.strategy_type,
                    opportunity.token_pair,
                    opportunity.profit_usd,
                    opportunity.gas_cost_usd,
                    opportunity.net_profit_usd,
                    opportunity.confidence_score,
                    opportunity.execution_status,
                    opportunity.block_number,
                    opportunity.transaction_hash,
                    opportunity.created_at,
                    opportunity.executed_at,
                    opportunity.metadata
                ))
                
                await db.commit()
                return cursor.lastrowid
                
        except Exception as e:
            logger.error(f"Error saving MEV opportunity: {e}")
            raise
    
    async def update_mev_opportunity_status(
        self,
        opportunity_id: str,
        status: str,
        transaction_hash: Optional[str] = None,
        executed_at: Optional[float] = None
    ) -> bool:
        """
        Update MEV opportunity execution status.
        
        Args:
            opportunity_id: Opportunity ID
            status: New status
            transaction_hash: Transaction hash if executed
            executed_at: Execution timestamp
            
        Returns:
            True if updated successfully
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    UPDATE mev_opportunities 
                    SET execution_status = ?, transaction_hash = ?, executed_at = ?
                    WHERE opportunity_id = ?
                """, (status, transaction_hash, executed_at, opportunity_id))
                
                await db.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error updating MEV opportunity status: {e}")
            return False
    
    async def get_mev_opportunities(
        self,
        chain_id: Optional[int] = None,
        strategy_type: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[MEVOpportunityRecord]:
        """
        Get MEV opportunities with filtering.
        
        Args:
            chain_id: Filter by chain ID
            strategy_type: Filter by strategy type
            status: Filter by execution status
            limit: Maximum records to return
            offset: Number of records to skip
            
        Returns:
            List of MEV opportunity records
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            conditions = []
            params = []
            
            if chain_id is not None:
                conditions.append("chain_id = ?")
                params.append(chain_id)
            
            if strategy_type:
                conditions.append("strategy_type = ?")
                params.append(strategy_type)
            
            if status:
                conditions.append("execution_status = ?")
                params.append(status)
            
            where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
            
            query = f"""
                SELECT * FROM mev_opportunities
                {where_clause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """
            
            params.extend([limit, offset])
            
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(query, params)
                rows = await cursor.fetchall()
                
                return [
                    MEVOpportunityRecord(
                        id=row['id'],
                        opportunity_id=row['opportunity_id'],
                        chain_id=row['chain_id'],
                        strategy_type=row['strategy_type'],
                        token_pair=row['token_pair'],
                        profit_usd=row['profit_usd'],
                        gas_cost_usd=row['gas_cost_usd'],
                        net_profit_usd=row['net_profit_usd'],
                        confidence_score=row['confidence_score'],
                        execution_status=row['execution_status'],
                        block_number=row['block_number'],
                        transaction_hash=row['transaction_hash'],
                        created_at=row['created_at'],
                        executed_at=row['executed_at'],
                        metadata=row['metadata']
                    )
                    for row in rows
                ]
                
        except Exception as e:
            logger.error(f"Error getting MEV opportunities: {e}")
            return []
    
    # Performance Metrics methods
    async def save_performance_metric(self, metric: PerformanceMetric) -> int:
        """Save performance metric to database."""
        if not self._initialized:
            await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute("""
                    INSERT INTO performance_metrics (
                        metric_type, metric_name, metric_value,
                        chain_id, strategy_name, timestamp, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    metric.metric_type,
                    metric.metric_name,
                    metric.metric_value,
                    metric.chain_id,
                    metric.strategy_name,
                    metric.timestamp,
                    metric.metadata
                ))
                
                await db.commit()
                return cursor.lastrowid
                
        except Exception as e:
            logger.error(f"Error saving performance metric: {e}")
            raise
    
    async def get_performance_metrics(
        self,
        metric_type: Optional[str] = None,
        metric_name: Optional[str] = None,
        chain_id: Optional[int] = None,
        hours_back: int = 24
    ) -> List[PerformanceMetric]:
        """Get performance metrics with filtering."""
        if not self._initialized:
            await self.initialize()
        
        try:
            conditions = ["timestamp > ?"]
            params = [time.time() - (hours_back * 3600)]
            
            if metric_type:
                conditions.append("metric_type = ?")
                params.append(metric_type)
            
            if metric_name:
                conditions.append("metric_name = ?")
                params.append(metric_name)
            
            if chain_id is not None:
                conditions.append("chain_id = ?")
                params.append(chain_id)
            
            where_clause = " WHERE " + " AND ".join(conditions)
            
            query = f"""
                SELECT * FROM performance_metrics
                {where_clause}
                ORDER BY timestamp DESC
            """
            
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(query, params)
                rows = await cursor.fetchall()
                
                return [
                    PerformanceMetric(
                        id=row['id'],
                        metric_type=row['metric_type'],
                        metric_name=row['metric_name'],
                        metric_value=row['metric_value'],
                        chain_id=row['chain_id'],
                        strategy_name=row['strategy_name'],
                        timestamp=row['timestamp'],
                        metadata=row['metadata']
                    )
                    for row in rows
                ]
                
        except Exception as e:
            logger.error(f"Error getting performance metrics: {e}")
            return []
    
    # Liquidation methods
    async def save_liquidation_opportunity(self, liquidation: LiquidationRecord) -> int:
        """Save liquidation opportunity to database."""
        if not self._initialized:
            await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute("""
                    INSERT OR REPLACE INTO liquidation_opportunities (
                        opportunity_id, chain_id, protocol, user_address,
                        collateral_token, debt_token, collateral_amount,
                        debt_amount, health_factor, liquidation_bonus,
                        estimated_profit_usd, execution_status, created_at, executed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    liquidation.opportunity_id,
                    liquidation.chain_id,
                    liquidation.protocol,
                    liquidation.user_address,
                    liquidation.collateral_token,
                    liquidation.debt_token,
                    liquidation.collateral_amount,
                    liquidation.debt_amount,
                    liquidation.health_factor,
                    liquidation.liquidation_bonus,
                    liquidation.estimated_profit_usd,
                    liquidation.execution_status,
                    liquidation.created_at,
                    liquidation.executed_at
                ))
                
                await db.commit()
                return cursor.lastrowid
                
        except Exception as e:
            logger.error(f"Error saving liquidation opportunity: {e}")
            raise
    
    # Gas optimization methods
    async def save_gas_data(
        self,
        chain_id: int,
        block_number: int,
        base_fee_gwei: float,
        priority_fee_gwei: float,
        gas_used: int,
        gas_limit: int,
        utilization: float,
        timestamp: float
    ) -> None:
        """Save gas optimization data."""
        if not self._initialized:
            await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO gas_optimization_history (
                        chain_id, block_number, base_fee_gwei, priority_fee_gwei,
                        gas_used, gas_limit, utilization, timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    chain_id, block_number, base_fee_gwei, priority_fee_gwei,
                    gas_used, gas_limit, utilization, timestamp
                ))
                
                await db.commit()
                
        except Exception as e:
            logger.error(f"Error saving gas data: {e}")
    
    # Analytics methods
    async def get_profitability_stats(
        self,
        chain_id: Optional[int] = None,
        strategy_type: Optional[str] = None,
        days_back: int = 7
    ) -> Dict[str, Any]:
        """Get profitability statistics."""
        if not self._initialized:
            await self.initialize()
        
        try:
            conditions = ["created_at > ?"]
            params = [time.time() - (days_back * 24 * 3600)]
            
            if chain_id is not None:
                conditions.append("chain_id = ?")
                params.append(chain_id)
            
            if strategy_type:
                conditions.append("strategy_type = ?")
                params.append(strategy_type)
            
            where_clause = " WHERE " + " AND ".join(conditions)
            
            async with aiosqlite.connect(self.db_path) as db:
                # Total opportunities
                cursor = await db.execute(f"""
                    SELECT COUNT(*) as total_opportunities,
                           SUM(CASE WHEN execution_status = 'executed' THEN 1 ELSE 0 END) as executed,
                           SUM(CASE WHEN execution_status = 'executed' THEN net_profit_usd ELSE 0 END) as total_profit,
                           AVG(CASE WHEN execution_status = 'executed' THEN net_profit_usd ELSE NULL END) as avg_profit,
                           MAX(net_profit_usd) as max_profit
                    FROM mev_opportunities {where_clause}
                """, params)
                
                row = await cursor.fetchone()
                
                return {
                    "total_opportunities": row[0] or 0,
                    "executed_opportunities": row[1] or 0,
                    "success_rate": (row[1] or 0) / max(row[0] or 1, 1),
                    "total_profit_usd": row[2] or 0.0,
                    "average_profit_usd": row[3] or 0.0,
                    "max_profit_usd": row[4] or 0.0,
                    "days_analyzed": days_back
                }
                
        except Exception as e:
            logger.error(f"Error getting profitability stats: {e}")
            return {}
    
    async def cleanup_old_data(self, days_to_keep: int = 30) -> None:
        """Clean up old data to manage database size."""
        if not self._initialized:
            await self.initialize()
        
        cutoff_timestamp = time.time() - (days_to_keep * 24 * 3600)
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Clean old metrics
                await db.execute("""
                    DELETE FROM performance_metrics 
                    WHERE timestamp < ?
                """, (cutoff_timestamp,))
                
                # Clean old gas data
                await db.execute("""
                    DELETE FROM gas_optimization_history 
                    WHERE timestamp < ?
                """, (cutoff_timestamp,))
                
                # Clean old resolved alerts
                await db.execute("""
                    DELETE FROM system_alerts 
                    WHERE resolved = TRUE AND created_at < ?
                """, (cutoff_timestamp,))
                
                await db.commit()
                
                logger.info(f"Cleaned up data older than {days_to_keep} days")
                
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        if not self._initialized:
            await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                stats = {}
                
                # Table sizes
                tables = [
                    'mev_opportunities',
                    'performance_metrics',
                    'liquidation_opportunities',
                    'gas_optimization_history',
                    'transaction_history',
                    'system_alerts'
                ]
                
                for table in tables:
                    cursor = await db.execute(f"SELECT COUNT(*) FROM {table}")
                    count = await cursor.fetchone()
                    stats[f"{table}_count"] = count[0] if count else 0
                
                # Database file size
                stats["database_size_mb"] = self.db_path.stat().st_size / (1024 * 1024)
                
                return stats
                
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {}
    
    async def close(self) -> None:
        """Close database connections."""
        # In aiosqlite, connections are automatically closed
        logger.info("Database connections closed")
