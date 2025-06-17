import subprocess
import json
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

def run_rust_scanner(binary_path: str = "./arbscanner", block: Optional[int] = None) -> List[Dict]:
    """
    Executes the Rust arbitrage scanner binary and parses the JSON output.
    
    :param binary_path: Path to compiled Rust binary.
    :param block: Optional block number to simulate.
    :return: List of arbitrage opportunities.
    """
    args = [binary_path]
    if block is not None:
        args.extend(["--block", str(block)])

    try:
        logger.info(f"Running Rust scanner: {' '.join(args)}")
        result = subprocess.run(args, capture_output=True, text=True, check=True)
        logger.debug(f"Rust stdout: {result.stdout.strip()}")
        output = json.loads(result.stdout.strip())
        return output if isinstance(output, list) else []
    except subprocess.CalledProcessError as e:
        logger.error(f"Rust scanner failed with code {e.returncode}: {e.stderr}")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Rust scanner output: {e}")
    except Exception as e:
        logger.error(f"Unexpected error running Rust scanner: {e}")

    return []