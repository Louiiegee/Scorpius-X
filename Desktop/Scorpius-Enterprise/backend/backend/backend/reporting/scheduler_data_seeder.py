"""
Scheduler System Data Seeder
Seeds the database with sample scheduled jobs, executions, metrics, and clusters
"""

import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import engine, get_db
from models.scheduler_models import (
    ScheduledJob, JobExecution, SystemMetrics, ComputeCluster, ResourceUsage,
    JobType, JobStatus, JobPriority, ExecutionStatus, ClusterStatus, Base
)


async def create_sample_clusters() -> List[ComputeCluster]:
    """Create sample compute clusters"""
    clusters = [
        ComputeCluster(
            id="cluster-scanner",
            name="Scanner Cluster",
            region="US-East",
            node_count=8,
            node_type="c5.4xlarge",
            cpu_cores=128,
            memory_gb=256,
            storage_gb=2000,
            status=ClusterStatus.ONLINE,
            utilization=67.0,
            active_jobs=3,
            uptime=99.97,
            cost_per_hour=45.20
        ),
        ComputeCluster(
            id="cluster-mev",
            name="MEV Cluster",
            region="EU-West",
            node_count=12,
            node_type="c5.8xlarge",
            cpu_cores=192,
            memory_gb=384,
            storage_gb=3000,
            status=ClusterStatus.ONLINE,
            utilization=89.0,
            active_jobs=5,
            uptime=99.95,
            cost_per_hour=78.90
        ),
        ComputeCluster(
            id="cluster-ai",
            name="AI Analysis Cluster",
            region="Asia-Pacific",
            node_count=6,
            node_type="p3.8xlarge",
            cpu_cores=96,
            memory_gb=244,
            storage_gb=1500,
            status=ClusterStatus.DEGRADED,
            utilization=45.0,
            active_jobs=1,
            uptime=98.76,
            cost_per_hour=67.40
        ),
        ComputeCluster(
            id="cluster-backup",
            name="Backup Cluster",
            region="Multi-Region",
            node_count=4,
            node_type="m5.2xlarge",
            cpu_cores=32,
            memory_gb=128,
            storage_gb=5000,
            status=ClusterStatus.MAINTENANCE,
            utilization=12.0,
            active_jobs=0,
            uptime=97.23,
            cost_per_hour=23.50
        )
    ]
    return clusters


async def create_sample_jobs() -> List[ScheduledJob]:
    """Create sample scheduled jobs"""
    now = datetime.now(timezone.utc)
    
    jobs = [
        ScheduledJob(
            id="JOB-001",
            name="Daily Smart Contract Scan",
            description="Comprehensive daily scan of registered smart contracts for vulnerabilities",
            job_type=JobType.SCAN,
            category="Security",
            schedule="0 2 * * *",  # Daily at 2 AM
            priority=JobPriority.HIGH,
            status=JobStatus.ACTIVE,
            resource="cluster-scanner",
            estimated_cost=12.40,
            timeout_minutes=60,
            targets=156,
            success_rate=98.5,
            average_duration=1470.0,  # 24.5 minutes in seconds
            next_run=now + timedelta(hours=2),
            last_run=now - timedelta(hours=22),
            config={
                "scan_types": ["reentrancy", "overflow", "access_control"],
                "depth": "comprehensive",
                "ai_analysis": True
            },
            environment_vars={
                "SCAN_TIMEOUT": "3600",
                "MAX_CONTRACTS": "200",
                "ANALYSIS_MODEL": "claude-3-opus"
            }
        ),
        ScheduledJob(
            id="JOB-002",
            name="MEV Monitor Continuous",
            description="Continuous monitoring of MEV opportunities and threat detection",
            job_type=JobType.MONITOR,
            category="MEV",
            schedule="* * * * *",  # Every minute
            priority=JobPriority.CRITICAL,
            status=JobStatus.ACTIVE,
            resource="cluster-mev",
            estimated_cost=45.80,
            timeout_minutes=5,
            targets=0,
            success_rate=99.9,
            average_duration=45.0,  # 45 seconds
            next_run=now + timedelta(seconds=30),
            last_run=now - timedelta(seconds=30),
            config={
                "mempool_sources": ["ethereum", "bsc", "polygon"],
                "detection_algorithms": ["sandwich", "arbitrage", "liquidation"],
                "alert_threshold": 10000
            },
            environment_vars={
                "WEB3_PROVIDER": "infura",
                "MEMPOOL_REFRESH": "1000",
                "ALERT_WEBHOOK": "https://alerts.example.com"
            }
        ),
        ScheduledJob(
            id="JOB-003",
            name="Weekly Executive Report",
            description="Generate comprehensive weekly executive dashboard report",
            job_type=JobType.REPORT,
            category="Reports",
            schedule="0 9 * * 1",  # Monday at 9 AM
            priority=JobPriority.NORMAL,
            status=JobStatus.ACTIVE,
            resource="cluster-scanner",
            estimated_cost=2.15,
            timeout_minutes=30,
            targets=12,
            success_rate=100.0,
            average_duration=225.0,  # 3 minutes 45 seconds
            next_run=now + timedelta(days=3),
            last_run=now - timedelta(days=4),
            config={
                "report_sections": ["summary", "vulnerabilities", "costs", "trends"],
                "recipients": ["ceo@company.com", "cto@company.com"],
                "format": "pdf"
            },
            environment_vars={
                "SMTP_SERVER": "smtp.company.com",
                "REPORT_TEMPLATE": "executive_v2",
                "TIMEZONE": "UTC"
            }
        ),
        ScheduledJob(
            id="JOB-004",
            name="Database Backup",
            description="Full database backup to secure cloud storage",
            job_type=JobType.BACKUP,
            category="Infrastructure",
            schedule="0 1 * * *",  # Daily at 1 AM
            priority=JobPriority.HIGH,
            status=JobStatus.PAUSED,
            resource="cluster-backup",
            estimated_cost=8.90,
            timeout_minutes=120,
            targets=0,
            success_rate=97.2,
            average_duration=492.0,  # 8 minutes 12 seconds
            next_run=now + timedelta(hours=6),
            last_run=now - timedelta(hours=18),
            config={
                "backup_type": "full",
                "compression": "gzip",
                "encryption": "aes256",
                "retention_days": 30
            },
            environment_vars={
                "S3_BUCKET": "cybersec-backups",
                "AWS_REGION": "us-east-1",
                "ENCRYPTION_KEY": "backup_key_v1"
            }
        ),
        ScheduledJob(
            id="JOB-005",
            name="Threat Intelligence Analysis",
            description="AI-powered analysis of global threat intelligence feeds",
            job_type=JobType.ANALYSIS,
            category="Analysis",
            schedule="0 */6 * * *",  # Every 6 hours
            priority=JobPriority.NORMAL,
            status=JobStatus.FAILED,
            resource="cluster-ai",
            estimated_cost=23.50,
            timeout_minutes=45,
            targets=45,
            success_rate=89.3,
            average_duration=738.0,  # 12 minutes 18 seconds
            next_run=now + timedelta(hours=4),
            last_run=now - timedelta(hours=2),
            config={
                "feeds": ["cisa", "mitre", "circl", "malware_bazaar"],
                "analysis_depth": "comprehensive",
                "output_format": "json"
            },
            environment_vars={
                "API_KEYS": "threat_intel_keys",
                "MODEL_VERSION": "v2.1",
                "OUTPUT_BUCKET": "threat-intel-results"
            }
        ),
        ScheduledJob(
            id="JOB-006",
            name="System Health Check",
            description="Comprehensive system health and performance monitoring",
            job_type=JobType.MONITOR,
            category="Infrastructure",
            schedule="*/5 * * * *",  # Every 5 minutes
            priority=JobPriority.HIGH,
            status=JobStatus.ACTIVE,
            resource="cluster-scanner",
            estimated_cost=1.20,
            timeout_minutes=10,
            targets=0,
            success_rate=99.8,
            average_duration=30.0,  # 30 seconds
            next_run=now + timedelta(minutes=5),
            last_run=now - timedelta(minutes=5),
            config={
                "checks": ["cpu", "memory", "disk", "network", "services"],
                "thresholds": {"cpu": 80, "memory": 85, "disk": 90},
                "alert_on_failure": True
            },
            environment_vars={
                "ALERT_CHANNEL": "slack_ops",
                "CHECK_INTERVAL": "300",
                "RETENTION_HOURS": "72"
            }
        )
    ]
    return jobs


async def create_sample_executions(jobs: List[ScheduledJob]) -> List[JobExecution]:
    """Create sample job execution history"""
    executions = []
    now = datetime.now(timezone.utc)
    
    # Create execution history for each job
    for job in jobs:
        for i in range(5):  # 5 executions per job
            execution_time = now - timedelta(hours=i * 6 + 1)
            duration = job.average_duration + (i - 2) * 30  # Some variation
            
            execution = JobExecution(
                id=f"EXEC-{str(uuid.uuid4())[:8].upper()}",
                job_id=job.id,
                status=ExecutionStatus.COMPLETED if i < 4 else (ExecutionStatus.FAILED if job.status == JobStatus.FAILED else ExecutionStatus.COMPLETED),
                start_time=execution_time,
                end_time=execution_time + timedelta(seconds=duration),
                duration_seconds=duration,
                items_processed=job.targets if job.targets > 0 else 100 + i * 20,
                items_failed=2 if i == 4 and job.status == JobStatus.FAILED else 0,
                errors=["Timeout connecting to external API", "Rate limit exceeded"] if i == 4 and job.status == JobStatus.FAILED else [],
                cpu_usage=30.0 + i * 5,
                memory_usage=1.5 + i * 0.3,
                disk_io=50.0 + i * 10,
                network_io=25.0 + i * 5,
                actual_cost=job.estimated_cost * (0.8 + i * 0.1),
                efficiency=95.0 - i * 2 if i < 4 else 45.0,
                cluster_node=f"node-{(i % 4) + 1:02d}",
                environment="production",
                version="v1.2.3"
            )
            executions.append(execution)
    
    return executions


async def create_sample_metrics() -> List[SystemMetrics]:
    """Create sample system metrics over time"""
    metrics = []
    now = datetime.now(timezone.utc)
    
    # Create metrics for last 24 hours (every hour)
    for i in range(24):
        timestamp = now - timedelta(hours=i)
        
        metric = SystemMetrics(
            id=f"METRIC-{timestamp.strftime('%Y%m%d%H')}",
            timestamp=timestamp,
            active_jobs=20 + i % 8,  # Varies between 20-27
            queue_depth=5 + i % 10,  # Varies between 5-14
            success_rate=96.0 + (i % 5),  # Varies between 96-100
            avg_runtime=8.0 + (i % 6) * 0.5,  # Varies between 8-10.5
            cpu_usage=30.0 + (i % 15) * 2,  # Varies between 30-58
            memory_usage=2.0 + (i % 8) * 0.3,  # Varies between 2-4.1
            disk_io=80.0 + (i % 20) * 5,  # Varies between 80-175
            network_io=40.0 + (i % 12) * 3,  # Varies between 40-73
            hourly_cost=45.0 + (i % 10) * 2,  # Varies between 45-63
            daily_cost=1080.0 + (i % 20) * 50,  # Varies between 1080-2030
            monthly_cost=32400.0 + (i % 30) * 1500  # Varies between 32400-77400
        )
        metrics.append(metric)
    
    return metrics


async def create_sample_resource_usage(clusters: List[ComputeCluster]) -> List[ResourceUsage]:
    """Create sample resource usage data"""
    resource_usage = []
    now = datetime.now(timezone.utc)
    resource_types = ["CPU", "Memory", "Disk I/O", "Network"]
    
    for cluster in clusters:
        for resource_type in resource_types:
            # Create usage data for last 12 hours (every hour)
            for i in range(12):
                timestamp = now - timedelta(hours=i)
                
                # Base values vary by resource type
                if resource_type == "CPU":
                    current = cluster.utilization + (i % 10) - 5
                    average = cluster.utilization - 5
                    peak = cluster.utilization + 20
                    unit = "%"
                    total_capacity = 100.0
                elif resource_type == "Memory":
                    current = 2.0 + (i % 6) * 0.3
                    average = 2.1
                    peak = 4.2
                    unit = "GB"
                    total_capacity = cluster.memory_gb
                elif resource_type == "Disk I/O":
                    current = 90 + (i % 15) * 5
                    average = 98
                    peak = 245
                    unit = "MB/s"
                    total_capacity = 500.0
                else:  # Network
                    current = 35 + (i % 20) * 2
                    average = 38
                    peak = 89
                    unit = "MB/s"
                    total_capacity = 1000.0
                
                usage = ResourceUsage(
                    id=f"USAGE-{cluster.id}-{resource_type.replace(' ', '')}-{timestamp.strftime('%Y%m%d%H')}",
                    timestamp=timestamp,
                    cluster_id=cluster.id,
                    resource_type=resource_type,
                    current_usage=max(0, current),
                    average_usage=average,
                    peak_usage=peak,
                    unit=unit,
                    total_capacity=total_capacity,
                    available_capacity=total_capacity - max(0, current),
                    trend="up" if i % 3 == 0 else "down" if i % 3 == 1 else "stable"
                )
                resource_usage.append(usage)
    
    return resource_usage


async def seed_scheduler_data():
    """
    Seed the database with comprehensive scheduler system data
    """
    print("🔄 Starting Scheduler System Data Seeding...")
    
    # Create tables
    async with engine.begin() as conn:
        # Drop existing tables if they exist
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created")
    
    # Get database session
    async for db in get_db():
        try:
            # Create sample data
            print("📊 Creating sample compute clusters...")
            clusters = await create_sample_clusters()
            for cluster in clusters:
                db.add(cluster)
            
            print("⚙️ Creating sample scheduled jobs...")
            jobs = await create_sample_jobs()
            for job in jobs:
                db.add(job)
            
            print("📈 Creating sample system metrics...")
            metrics = await create_sample_metrics()
            for metric in metrics:
                db.add(metric)
            
            # Commit clusters, jobs, and metrics first
            await db.commit()
            
            print("🏃 Creating sample job executions...")
            executions = await create_sample_executions(jobs)
            for execution in executions:
                db.add(execution)
            
            print("💾 Creating sample resource usage data...")
            resource_usage = await create_sample_resource_usage(clusters)
            for usage in resource_usage:
                db.add(usage)
            
            # Final commit
            await db.commit()
            
            print("\n🎉 Scheduler System Data Seeding Completed Successfully!")
            print(f"📊 Created: {len(clusters)} clusters")
            print(f"⚙️ Created: {len(jobs)} scheduled jobs")
            print(f"🏃 Created: {len(executions)} job executions")
            print(f"📈 Created: {len(metrics)} system metrics records")
            print(f"💾 Created: {len(resource_usage)} resource usage records")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error seeding data: {e}")
            raise
        finally:
            await db.close()
        break


if __name__ == "__main__":
    asyncio.run(seed_scheduler_data())
