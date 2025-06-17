"""
Scheduler System API Routes
Provides REST API endpoints for job scheduling, execution monitoring, and resource management
"""

import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload

from core.db import get_db
from models.scheduler_models import (
    # Database models
    ScheduledJob, JobExecution, SystemMetrics, ComputeCluster, ResourceUsage,
    # Pydantic models  
    JobCreate, JobUpdate, JobResponse, ExecutionResponse, SystemMetricsResponse,
    ClusterResponse, ResourceUsageResponse, SchedulerHealthResponse,
    # Enums
    JobType, JobStatus, JobPriority, ExecutionStatus, ClusterStatus
)

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


# ─── Health Check ───────────────────────────────────────────────────────────


@router.get("/health", response_model=SchedulerHealthResponse)
async def get_scheduler_health(db: AsyncSession = Depends(get_db)) -> SchedulerHealthResponse:
    """
    Get scheduler system health status and metrics
    """
    try:
        # Get active job count
        active_jobs_result = await db.execute(
            select(func.count(ScheduledJob.id))
            .filter(ScheduledJob.status == JobStatus.ACTIVE)
        )
        active_jobs = active_jobs_result.scalar() or 0
        
        # Get online clusters count
        clusters_result = await db.execute(
            select(func.count(ComputeCluster.id))
            .filter(ComputeCluster.status == ClusterStatus.ONLINE)
        )
        clusters_online = clusters_result.scalar() or 0
        
        # Get today's executions count
        today = datetime.now(timezone.utc).date()
        executions_result = await db.execute(
            select(func.count(JobExecution.id))
            .filter(func.date(JobExecution.start_time) == today)
        )
        total_executions_today = executions_result.scalar() or 0
        
        return SchedulerHealthResponse(
            active_jobs=active_jobs,
            clusters_online=clusters_online,
            total_executions_today=total_executions_today,
            timestamp=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


# ─── Scheduled Jobs ─────────────────────────────────────────────────────────


@router.get("/jobs", response_model=List[JobResponse])
async def get_scheduled_jobs(
    status: Optional[JobStatus] = Query(None, description="Filter by job status"),
    job_type: Optional[JobType] = Query(None, description="Filter by job type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, le=100, description="Maximum number of jobs to return"),
    offset: int = Query(0, ge=0, description="Number of jobs to skip"),
    db: AsyncSession = Depends(get_db)
) -> List[JobResponse]:
    """
    Get list of scheduled jobs with optional filtering
    """
    try:
        query = select(ScheduledJob).order_by(desc(ScheduledJob.created_at))
        
        # Apply filters
        if status:
            query = query.filter(ScheduledJob.status == status)
        if job_type:
            query = query.filter(ScheduledJob.job_type == job_type)
        if category:
            query = query.filter(ScheduledJob.category.ilike(f"%{category}%"))
            
        # Apply pagination
        query = query.offset(offset).limit(limit)
        
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        return [JobResponse.model_validate(job) for job in jobs]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch jobs: {str(e)}")


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_scheduled_job(
    job_id: str = Path(..., description="Job ID"),
    db: AsyncSession = Depends(get_db)
) -> JobResponse:
    """
    Get specific scheduled job by ID
    """
    try:
        result = await db.execute(
            select(ScheduledJob).filter(ScheduledJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
            
        return JobResponse.model_validate(job)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch job: {str(e)}")


@router.post("/jobs", response_model=JobResponse)
async def create_scheduled_job(
    job_data: JobCreate,
    db: AsyncSession = Depends(get_db)
) -> JobResponse:
    """
    Create a new scheduled job
    """
    try:
        job_id = f"JOB-{str(uuid.uuid4())[:8].upper()}"
        
        new_job = ScheduledJob(
            id=job_id,
            name=job_data.name,
            description=job_data.description,
            job_type=job_data.job_type,
            category=job_data.category,
            schedule=job_data.schedule,
            priority=job_data.priority,
            resource=job_data.resource,
            estimated_cost=job_data.estimated_cost,
            timeout_minutes=job_data.timeout_minutes,
            targets=job_data.targets,
            config=job_data.config or {},
            environment_vars=job_data.environment_vars or {}
        )
        
        db.add(new_job)
        await db.commit()
        await db.refresh(new_job)
        
        return JobResponse.model_validate(new_job)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@router.put("/jobs/{job_id}", response_model=JobResponse)
async def update_scheduled_job(
    job_id: str = Path(..., description="Job ID"),
    job_data: JobUpdate = None,
    db: AsyncSession = Depends(get_db)
) -> JobResponse:
    """
    Update an existing scheduled job
    """
    try:
        result = await db.execute(
            select(ScheduledJob).filter(ScheduledJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        
        # Update fields if provided
        update_data = job_data.model_dump(exclude_unset=True) if job_data else {}
        for field, value in update_data.items():
            setattr(job, field, value)
        
        job.updated_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(job)
        
        return JobResponse.model_validate(job)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update job: {str(e)}")


@router.delete("/jobs/{job_id}")
async def delete_scheduled_job(
    job_id: str = Path(..., description="Job ID"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    Delete a scheduled job
    """
    try:
        result = await db.execute(
            select(ScheduledJob).filter(ScheduledJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        
        await db.delete(job)
        await db.commit()
        
        return {"message": f"Job {job_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {str(e)}")


@router.post("/jobs/{job_id}/trigger")
async def trigger_job_execution(
    job_id: str = Path(..., description="Job ID"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    Manually trigger job execution
    """
    try:
        result = await db.execute(
            select(ScheduledJob).filter(ScheduledJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        
        if job.status != JobStatus.ACTIVE:
            raise HTTPException(status_code=400, detail=f"Job {job_id} is not active")
        
        # Create new execution record
        execution_id = f"EXEC-{str(uuid.uuid4())[:8].upper()}"
        
        execution = JobExecution(
            id=execution_id,
            job_id=job_id,
            status=ExecutionStatus.PENDING,
            start_time=datetime.now(timezone.utc)
        )
        
        db.add(execution)
        
        # Update job last run time
        job.last_run = datetime.now(timezone.utc)
        
        await db.commit()
        
        # Here you would typically trigger the actual job execution
        # For now, we'll simulate it with a background task
        asyncio.create_task(_simulate_job_execution(execution_id, db))
        
        return {"message": f"Job {job_id} execution triggered", "execution_id": execution_id}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to trigger job: {str(e)}")


# ─── Job Executions ─────────────────────────────────────────────────────────


@router.get("/executions", response_model=List[ExecutionResponse])
async def get_job_executions(
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    status: Optional[ExecutionStatus] = Query(None, description="Filter by execution status"),
    limit: int = Query(50, le=100, description="Maximum number of executions to return"),
    offset: int = Query(0, ge=0, description="Number of executions to skip"),
    db: AsyncSession = Depends(get_db)
) -> List[ExecutionResponse]:
    """
    Get job execution history with optional filtering
    """
    try:
        query = select(JobExecution).order_by(desc(JobExecution.start_time))
        
        # Apply filters
        if job_id:
            query = query.filter(JobExecution.job_id == job_id)
        if status:
            query = query.filter(JobExecution.status == status)
            
        # Apply pagination
        query = query.offset(offset).limit(limit)
        
        result = await db.execute(query)
        executions = result.scalars().all()
        
        return [ExecutionResponse.model_validate(execution) for execution in executions]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch executions: {str(e)}")


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_job_execution(
    execution_id: str = Path(..., description="Execution ID"),
    db: AsyncSession = Depends(get_db)
) -> ExecutionResponse:
    """
    Get specific job execution by ID
    """
    try:
        result = await db.execute(
            select(JobExecution).filter(JobExecution.id == execution_id)
        )
        execution = result.scalar_one_or_none()
        
        if not execution:
            raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
            
        return ExecutionResponse.model_validate(execution)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch execution: {str(e)}")


# ─── System Metrics ─────────────────────────────────────────────────────────


@router.get("/metrics", response_model=SystemMetricsResponse)
async def get_system_metrics(
    db: AsyncSession = Depends(get_db)
) -> SystemMetricsResponse:
    """
    Get current system metrics and resource usage
    """
    try:
        # Get latest metrics record
        result = await db.execute(
            select(SystemMetrics)
            .order_by(desc(SystemMetrics.timestamp))
            .limit(1)
        )
        metrics = result.scalar_one_or_none()
        
        if not metrics:
            # Return default metrics if none exist
            return SystemMetricsResponse(
                active_jobs=0,
                queue_depth=0,
                success_rate=0.0,
                avg_runtime=0.0,
                cpu_usage=0.0,
                memory_usage=0.0,
                disk_io=0.0,
                network_io=0.0,
                hourly_cost=0.0,
                daily_cost=0.0,
                monthly_cost=0.0,
                timestamp=datetime.now(timezone.utc)
            )
            
        return SystemMetricsResponse.model_validate(metrics)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")


# ─── Compute Clusters ───────────────────────────────────────────────────────


@router.get("/clusters", response_model=List[ClusterResponse])
async def get_compute_clusters(
    status: Optional[ClusterStatus] = Query(None, description="Filter by cluster status"),
    region: Optional[str] = Query(None, description="Filter by region"),
    db: AsyncSession = Depends(get_db)
) -> List[ClusterResponse]:
    """
    Get list of compute clusters
    """
    try:
        query = select(ComputeCluster).order_by(ComputeCluster.name)
        
        # Apply filters
        if status:
            query = query.filter(ComputeCluster.status == status)
        if region:
            query = query.filter(ComputeCluster.region.ilike(f"%{region}%"))
        
        result = await db.execute(query)
        clusters = result.scalars().all()
        
        return [ClusterResponse.model_validate(cluster) for cluster in clusters]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch clusters: {str(e)}")


@router.get("/clusters/{cluster_id}", response_model=ClusterResponse)
async def get_compute_cluster(
    cluster_id: str = Path(..., description="Cluster ID"),
    db: AsyncSession = Depends(get_db)
) -> ClusterResponse:
    """
    Get specific compute cluster by ID
    """
    try:
        result = await db.execute(
            select(ComputeCluster).filter(ComputeCluster.id == cluster_id)
        )
        cluster = result.scalar_one_or_none()
        
        if not cluster:
            raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found")
            
        return ClusterResponse.model_validate(cluster)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cluster: {str(e)}")


# ─── Resource Usage ─────────────────────────────────────────────────────────


@router.get("/resources", response_model=List[ResourceUsageResponse])
async def get_resource_usage(
    cluster_id: Optional[str] = Query(None, description="Filter by cluster ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    hours: int = Query(24, le=168, description="Hours of data to return"),
    db: AsyncSession = Depends(get_db)
) -> List[ResourceUsageResponse]:
    """
    Get resource usage data for monitoring
    """
    try:
        # Calculate time range
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        query = (
            select(ResourceUsage)
            .filter(ResourceUsage.timestamp >= since)
            .order_by(desc(ResourceUsage.timestamp))
        )
        
        # Apply filters
        if cluster_id:
            query = query.filter(ResourceUsage.cluster_id == cluster_id)
        if resource_type:
            query = query.filter(ResourceUsage.resource_type.ilike(f"%{resource_type}%"))
        
        result = await db.execute(query)
        resources = result.scalars().all()
        
        return [ResourceUsageResponse.model_validate(resource) for resource in resources]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch resource usage: {str(e)}")


# ─── Helper Functions ───────────────────────────────────────────────────────


async def _simulate_job_execution(execution_id: str, db: AsyncSession) -> None:
    """
    Simulate job execution for testing purposes
    """
    try:
        # Wait a bit before starting
        await asyncio.sleep(2)
        
        # Update to running status
        result = await db.execute(
            select(JobExecution).filter(JobExecution.id == execution_id)
        )
        execution = result.scalar_one_or_none()
        
        if execution:
            execution.status = ExecutionStatus.RUNNING
            execution.start_time = datetime.now(timezone.utc)
            await db.commit()
            
            # Simulate execution time
            await asyncio.sleep(10)
            
            # Update to completed status
            execution.status = ExecutionStatus.COMPLETED
            execution.end_time = datetime.now(timezone.utc)
            execution.duration_seconds = (execution.end_time - execution.start_time).total_seconds()
            execution.items_processed = 100
            execution.items_failed = 0
            execution.cpu_usage = 45.2
            execution.memory_usage = 2.1
            execution.disk_io = 127.5
            execution.network_io = 89.3
            execution.actual_cost = 5.50
            execution.efficiency = 95.0
            execution.cluster_node = "node-01"
            execution.environment = "production"
            
            await db.commit()
            
    except Exception as e:
        print(f"Error in simulated execution: {e}")
