"""
Celery Configuration for Time Machine Background Tasks
Handles asynchronous exploit replay and analysis tasks.
"""

import os
from typing import Dict, Any
from celery import Celery
from kombu import Queue
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

# Celery configuration
celery_app = Celery(
    "time_machine",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
    include=[
        "tasks.replay_tasks",
        "tasks.analysis_tasks",
        "tasks.cleanup_tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task routing
    task_routes={
        "tasks.replay_tasks.start_exploit_replay": {"queue": "replay"},
        "tasks.replay_tasks.start_transaction_replay": {"queue": "replay"},
        "tasks.analysis_tasks.analyze_exploit": {"queue": "analysis"},
        "tasks.analysis_tasks.generate_report": {"queue": "analysis"},
        "tasks.cleanup_tasks.cleanup_session": {"queue": "cleanup"},
        "tasks.cleanup_tasks.cleanup_old_sessions": {"queue": "cleanup"}
    },
    
    # Queue configuration
    task_default_queue="default",
    task_queues=(
        Queue("default"),
        Queue("replay", routing_key="replay"),
        Queue("analysis", routing_key="analysis"),
        Queue("cleanup", routing_key="cleanup"),
    ),
    
    # Task execution settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task timeout and retry settings
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,       # 10 minutes
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    result_persistent=True,
    
    # Monitoring and debugging
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        "cleanup-old-sessions": {
            "task": "tasks.cleanup_tasks.cleanup_old_sessions",
            "schedule": timedelta(hours=6),  # Every 6 hours
        },
        "cleanup-expired-forks": {
            "task": "tasks.cleanup_tasks.cleanup_expired_forks",
            "schedule": timedelta(hours=1),  # Every hour
        }
    }
)

# Configure logging for Celery
def setup_celery_logging():
    """Configure logging for Celery workers"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Reduce noise from some libraries
    logging.getLogger("web3").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)

# Call setup when module is imported
setup_celery_logging()

# Health check task
@celery_app.task(name="health_check")
def health_check() -> Dict[str, Any]:
    """
    Basic health check task for Celery workers
    
    Returns:
        Dict containing worker status and timestamp
    """
    from datetime import datetime
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "worker_id": os.getpid(),
        "message": "Celery worker is operational"
    }

if __name__ == "__main__":
    celery_app.start()
