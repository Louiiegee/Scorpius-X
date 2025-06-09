#!/usr/bin/env python3
"""
Time Machine System Startup Script
Starts both the API server and Celery workers for the Time Machine blockchain exploit replay system.
"""

import os
import sys
import subprocess
import time
import signal
import threading
from typing import List, Optional
import argparse
import logging

# Add project root to path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Configuration
DEFAULT_CONFIG = {
    "api_host": "0.0.0.0",
    "api_port": 8010,
    "redis_url": "redis://localhost:6379/0",
    "workers": 2,
    "log_level": "INFO",
    "dev_mode": False
}

# Global process tracking
processes: List[subprocess.Popen] = []
shutdown_event = threading.Event()

def setup_logging(log_level: str = "INFO"):
    """Setup logging configuration"""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('time_machine_startup.log'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

def check_redis_connection(redis_url: str) -> bool:
    """Check if Redis is available"""
    try:
        import redis
        client = redis.from_url(redis_url)
        client.ping()
        return True
    except Exception:
        return False

def start_celery_worker(
    worker_name: str,
    queues: List[str],
    redis_url: str,
    log_level: str = "INFO"
) -> subprocess.Popen:
    """Start a Celery worker process"""
    cmd = [
        sys.executable, "-m", "celery", "worker",
        "-A", "celery_app",
        "-n", f"{worker_name}@%h",
        "-Q", ",".join(queues),
        "--loglevel", log_level.upper(),
        "--without-gossip",
        "--without-mingle",
        "--without-heartbeat"
    ]
    
    env = os.environ.copy()
    env["CELERY_BROKER_URL"] = redis_url
    env["CELERY_RESULT_BACKEND"] = redis_url
    
    return subprocess.Popen(
        cmd,
        cwd=project_root,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )

def start_api_server(
    host: str = "0.0.0.0",
    port: int = 8010,
    redis_url: str = "redis://localhost:6379/0",
    dev_mode: bool = False,
    log_level: str = "INFO"
) -> subprocess.Popen:
    """Start the FastAPI server"""
    cmd = [
        sys.executable, "-m", "uvicorn",
        "time_machine_api_server:app",
        "--host", host,
        "--port", str(port),
        "--log-level", log_level.lower()
    ]
    
    if dev_mode:
        cmd.extend(["--reload", "--reload-dir", project_root])
    
    env = os.environ.copy()
    env["TIME_MACHINE_HOST"] = host
    env["TIME_MACHINE_PORT"] = str(port)
    env["CELERY_BROKER_URL"] = redis_url
    env["CELERY_RESULT_BACKEND"] = redis_url
    env["DEBUG"] = "true" if dev_mode else "false"
    env["RELOAD"] = "true" if dev_mode else "false"
    
    return subprocess.Popen(
        cmd,
        cwd=project_root,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )

def monitor_process(process: subprocess.Popen, name: str, logger):
    """Monitor a process and log its output"""
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                logger.info(f"[{name}] {line.strip()}")
            if shutdown_event.is_set():
                break
    except Exception as e:
        logger.error(f"Error monitoring {name}: {str(e)}")

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger = logging.getLogger(__name__)
    logger.info(f"Received signal {signum}, shutting down...")
    shutdown_event.set()
    
    # Terminate all processes
    for process in processes:
        try:
            process.terminate()
        except Exception as e:
            logger.error(f"Error terminating process: {str(e)}")
    
    # Wait for processes to finish
    for process in processes:
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            logger.warning("Process didn't terminate gracefully, killing...")
            process.kill()
    
    sys.exit(0)

def main():
    """Main startup function"""
    parser = argparse.ArgumentParser(description="Start Time Machine system")
    parser.add_argument("--host", default=DEFAULT_CONFIG["api_host"], help="API server host")
    parser.add_argument("--port", type=int, default=DEFAULT_CONFIG["api_port"], help="API server port")
    parser.add_argument("--redis-url", default=DEFAULT_CONFIG["redis_url"], help="Redis connection URL")
    parser.add_argument("--workers", type=int, default=DEFAULT_CONFIG["workers"], help="Number of Celery workers")
    parser.add_argument("--log-level", default=DEFAULT_CONFIG["log_level"], help="Log level")
    parser.add_argument("--dev", action="store_true", help="Enable development mode")
    parser.add_argument("--api-only", action="store_true", help="Start only API server")
    parser.add_argument("--workers-only", action="store_true", help="Start only Celery workers")
    
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging(args.log_level)
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info("Starting Time Machine system...")
    logger.info(f"Configuration: host={args.host}, port={args.port}, workers={args.workers}")
    
    # Check Redis connection
    if not check_redis_connection(args.redis_url):
        logger.error(f"Cannot connect to Redis at {args.redis_url}")
        logger.error("Please ensure Redis is running and accessible")
        sys.exit(1)
    else:
        logger.info(f"Redis connection successful: {args.redis_url}")
    
    try:
        # Start Celery workers (unless api-only mode)
        worker_threads = []
        if not args.api_only:
            logger.info(f"Starting {args.workers} Celery workers...")
            
            # Worker configurations
            worker_configs = [
                {"name": "replay_worker", "queues": ["replay", "default"]},
                {"name": "analysis_worker", "queues": ["analysis", "default"]},
                {"name": "cleanup_worker", "queues": ["cleanup", "default"]}
            ]
            
            # Start workers based on requested count
            for i in range(min(args.workers, len(worker_configs))):
                config = worker_configs[i]
                logger.info(f"Starting worker: {config['name']} (queues: {config['queues']})")
                
                worker_process = start_celery_worker(
                    worker_name=config["name"],
                    queues=config["queues"],
                    redis_url=args.redis_url,
                    log_level=args.log_level
                )
                
                processes.append(worker_process)
                
                # Start monitoring thread
                monitor_thread = threading.Thread(
                    target=monitor_process,
                    args=(worker_process, config["name"], logger),
                    daemon=True
                )
                monitor_thread.start()
                worker_threads.append(monitor_thread)
                
                time.sleep(2)  # Stagger worker startup
        
        # Start API server (unless workers-only mode)
        if not args.workers_only:
            logger.info(f"Starting API server on {args.host}:{args.port}")
            
            api_process = start_api_server(
                host=args.host,
                port=args.port,
                redis_url=args.redis_url,
                dev_mode=args.dev,
                log_level=args.log_level
            )
            
            processes.append(api_process)
            
            # Start API monitoring thread
            api_monitor_thread = threading.Thread(
                target=monitor_process,
                args=(api_process, "API", logger),
                daemon=True
            )
            api_monitor_thread.start()
        
        logger.info("Time Machine system started successfully!")
        logger.info("Available endpoints:")
        logger.info(f"  - API Documentation: http://{args.host}:{args.port}/docs")
        logger.info(f"  - Health Check: http://{args.host}:{args.port}/api/system/health")
        logger.info(f"  - Time Machine API: http://{args.host}:{args.port}/api/time-machine/")
        logger.info("Press Ctrl+C to stop all services")
        
        # Wait for shutdown signal
        while not shutdown_event.is_set():
            # Check if any process has died
            for i, process in enumerate(processes):
                if process.poll() is not None:
                    logger.error(f"Process {i} has died with return code {process.returncode}")
                    shutdown_event.set()
                    break
            time.sleep(1)
        
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    except Exception as e:
        logger.error(f"Error starting system: {str(e)}")
        sys.exit(1)
    finally:
        signal_handler(signal.SIGTERM, None)

if __name__ == "__main__":
    main()
