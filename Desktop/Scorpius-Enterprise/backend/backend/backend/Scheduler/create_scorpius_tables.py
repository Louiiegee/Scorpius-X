"""
Create Scorpius database tables
"""
import asyncio
import sys
import os
from pathlib import Path
import uuid
import json
from datetime import datetime, timedelta

# Add backend directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from core.db import engine, AsyncSessionLocal
from models.scorpius_models import Base, ScorpiusScan, ScanStatus, ScanType
from sqlalchemy import text


async def create_scorpius_tables():
    """Create Scorpius scan tables using SQLAlchemy metadata"""
    async with engine.begin() as conn:
        # Drop existing table if any schema conflicts
        await conn.execute(text("DROP TABLE IF EXISTS scorpius_scans"))
        
        # Create all tables from models
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Scorpius tables created successfully")


async def insert_sample_data():
    """Insert sample scan data for testing"""
    async with AsyncSessionLocal() as session:
        try:
            # Create sample completed scan
            completed_scan = ScorpiusScan(
                id='sample-scan-001',
                contract_address='0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C',
                chain='ethereum',
                scan_type=ScanType.DEEP_ANALYSIS.value,
                status=ScanStatus.COMPLETED.value,
                vulnerabilities_found=3,
                critical_count=1,
                high_count=1,
                medium_count=1,
                low_count=0,
                findings=json.dumps([{
                    "vuln_type": "backdoor", 
                    "severity": "critical", 
                    "title": "Execute Backdoor Function", 
                    "description": "Contract contains execute() function that allows arbitrary code execution"
                }]),
                ai_analysis=json.dumps({
                    "model_used": "claude-3-opus", 
                    "confidence_score": 0.95, 
                    "risk_assessment": "CRITICAL", 
                    "attack_vectors": ["backdoor_exploitation"], 
                    "exploitation_complexity": "LOW", 
                    "business_impact": "CRITICAL"
                }),
                scan_duration=156.7,
                notes='Sample completed scan with backdoor vulnerability',
                created_at=datetime.utcnow(),
                started_at=datetime.utcnow() - timedelta(minutes=3),
                completed_at=datetime.utcnow()
            )
            
            # Create sample running scan
            running_scan = ScorpiusScan(
                id='sample-scan-002',
                contract_address='0x1234567890123456789012345678901234567890',
                chain='ethereum',
                scan_type=ScanType.QUICK_SCAN.value,
                status=ScanStatus.RUNNING.value,
                notes='Sample running scan for testing',
                created_at=datetime.utcnow(),
                started_at=datetime.utcnow() - timedelta(minutes=1)
            )
            
            # Add to session
            session.add(completed_scan)
            session.add(running_scan)
            
            # Commit the changes
            await session.commit()
            
            print("✅ Sample Scorpius data inserted")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error inserting sample data: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(create_scorpius_tables())
    asyncio.run(insert_sample_data())
