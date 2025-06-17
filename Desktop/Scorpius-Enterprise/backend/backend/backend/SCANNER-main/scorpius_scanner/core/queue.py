import asyncio
import json
from typing import Any, Dict, Callable, Optional

from redis import from_url as redis_from_url
from rq import Queue, Worker, Connection
from rq.job import Job

from .config import settings
from .logging import get_logger

logger = get_logger(__name__)

# Establish a connection to Redis
try:
    redis_conn = redis_from_url(settings.redis.url)
    redis_conn.ping()
    logger.info("Successfully connected to Redis.")
except Exception as e:
    logger.error(f"Failed to connect to Redis at {settings.redis.url}. Please ensure Redis is running. Error: {e}")
    # Allow the app to start but queueing will fail.
    redis_conn = None

# Create the scan queue if Redis connection is successful
scan_queue = Queue(settings.queue_name, connection=redis_conn) if redis_conn else None


async def enqueue_scan(scan_id: str, target: str, options: Dict[str, Any]) -> str:
    """
    Add a scan job to the RQ queue.

    Args:
        scan_id: The unique ID for this scan.
        target: The contract address or code to be scanned.
        options: A dictionary of options for the orchestrator.

    Returns:
        The job ID from RQ.
    """
    if not scan_queue:
        raise ConnectionError("Cannot enqueue scan: Redis connection not available.")

    logger.info(f"Enqueuing scan {scan_id} for target {target}")
    # The job will call the 'execute_scan_job' function located in the orchestrator module.
    job = scan_queue.enqueue(
        'scorpius_scanner.core.orchestrator.execute_scan_job',
        kwargs={
            "scan_id": scan_id,
            "target": target,
            "options": options,
        },
        job_id=scan_id, # Use our scan_id as the job_id for easy tracking
        job_timeout=settings.worker_timeout
    )
    return job.id

def start_worker():
    """Starts an RQ worker to process jobs from the queue."""
    if not redis_conn:
        logger.error("Cannot start worker: Redis connection not available.")
        return

    logger.info(f"Starting RQ worker for queue: '{settings.queue_name}'")
    with Connection(redis_conn):
        worker = Worker([scan_queue], connection=redis_conn)
        worker.work()