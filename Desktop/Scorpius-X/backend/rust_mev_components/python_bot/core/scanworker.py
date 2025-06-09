import logging
from rust_runner import run_rust_scanner

logger = logging.getLogger(__name__)

async def run_scan(rpc_url, result_queue=None, offset=None, ml_client=None):
    results = run_rust_scanner(binary_path="./arbscanner", block=offset)

    enriched = []
    for res in results:
        res["confidence"] = ml_client.predict(res) if ml_client else 1.0
        enriched.append(res)
        if result_queue:
            await result_queue.put(res)

    logger.info(f"[RustRunner] Returned {len(enriched)} opportunities.")
    return enriched