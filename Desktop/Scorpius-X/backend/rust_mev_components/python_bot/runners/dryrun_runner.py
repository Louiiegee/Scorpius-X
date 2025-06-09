
import os
import json
import time
import asyncio
import logging
from web3 import Web3, HTTPProvider
from multiprocessing import Queue

from config import load_config
from scanworker import run_scan
from ml_client import MLClient
from retry_helper import with_retry_async

CONFIG = load_config()
logger = logging.getLogger("DryRunRunner")

logging.basicConfig(
    level=CONFIG.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(levelname)s - %(message)s"
)

DRY_RUN_BLOCKS = CONFIG.get("DRY_RUN_BLOCKS", 5)
START_BLOCK = CONFIG.get("START_BLOCK", 18000000)
RPC_URL = CONFIG["RPC_URL"]

async def process_opportunity(opportunity, ml_client):
    prediction = await ml_client.predict(opportunity)
    if prediction and prediction.get("execute"):
        confidence = prediction.get("confidence", 0.0)
        logger.info(f"[DryRun] ✅ Executable Opportunity | Conf: {confidence:.2f} | {json.dumps(opportunity)}")
    else:
        logger.info(f"[DryRun] ❌ Rejected by ML | {json.dumps(opportunity)}")

async def dry_run_loop():
    result_queue = Queue()
    ml_client = MLClient()

    for i in range(DRY_RUN_BLOCKS):
        logger.info(f"Scanning block offset {i}...")
        run_scan(RPC_URL, result_queue)
        result = result_queue.get()

        if not result["success"]:
            logger.error(f"Scan error: {result['error']}")
            continue

        ops = result["opportunities"]
        if not ops:
            logger.info("[DryRun] No opportunities found in this block.")
            continue

        await asyncio.gather(*(process_opportunity(op, ml_client) for op in ops))

if __name__ == "__main__":
    try:
        asyncio.run(dry_run_loop())
    except KeyboardInterrupt:
        logger.warning("Dry run interrupted by user.")
