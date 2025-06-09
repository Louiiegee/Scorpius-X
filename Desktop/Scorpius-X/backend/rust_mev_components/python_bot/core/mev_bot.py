#!/usr/bin/env python3

import os
import json
import asyncio
import logging
import sqlite3
import argparse
import signal
import sys
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Set
from collections import defaultdict
import numpy as np
import multiprocessing
import queue
import subprocess  # === NEW === for calling Rust

from web3.providers.websocket import WebSocketProvider  # Capital "S"
from web3.types import TxParams, Wei, HexBytes, TxReceipt
from web3.exceptions import TransactionNotFound, ContractLogicError
from eth_typing import HexStr, Address, ChecksumAddress

from eth_abi import encode as encode_abi

# flashbots python: https://github.com/flashbots/flashbots-py
from flashbots import Flashbots

# Remove duplicate import:
from eth_account import Account
from eth_account.signers.local import LocalAccount

# LiquidationMonitor import
from liquidation_monitor import LiquidationMonitor

from tenacity import RetryError

try:
    from config import load_config
    CONFIG = load_config()
    logger = logging.getLogger("MEVBotApp")
    if not logger.hasHandlers():
        logging.basicConfig(
            level=CONFIG.get("LOG_LEVEL", "INFO"),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        logger = logging.getLogger("MEVBotApp")
except ImportError as e:
    print(f"ERROR: Import core modules failed: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Config loading failed: {e}", file=sys.stderr)
    sys.exit(1)

# ---- Additional Modules ----
try:
    from provider_manager import ProviderManager
    from retry_helper import with_retry_async
    from arbitrage_math import (
        get_token, get_dex_config, estimate_gas_cost_in_base_token,
        get_eth_price, get_base_token_price, Token, simulate_swap_step,
    )
    from oracle_monitor import OracleMonitor
    from performance import get_performance_tracker
    from ml_client import MLClient
    from risk_engine import RiskEngine
except ImportError as e:
    logger.critical(f"ERROR: Import custom module failed: {e}", exc_info=True)
    sys.exit(1)

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

_ABI_CACHE = {}
def load_abi(filename: str) -> Optional[List[Dict]]:
    if filename in _ABI_CACHE:
        return _ABI_CACHE[filename]

    script_dir = os.path.dirname(__file__)
    paths = [
        os.path.join(script_dir, "abis", filename),
        filename
    ]
    for fpath in paths:
        abs_path = os.path.abspath(fpath)
        if os.path.exists(abs_path):
            try:
                logger.debug(f"Loading ABI from: {abs_path}")
                with open(abs_path, "r") as f:
                    raw = json.load(f)
                abi = raw.get("abi") if isinstance(raw, dict) and "abi" in raw else raw
                if isinstance(abi, list):
                    _ABI_CACHE[filename] = abi
                    return abi
                else:
                    logger.error(f"Invalid ABI format in {abs_path}.")
            except Exception as ex:
                logger.error(f"Error loading ABI {abs_path}: {ex}")
    logger.error(f"Cannot find ABI file: {filename}")
    _ABI_CACHE[filename] = None
    return None

class GasOptimizer:
    def __init__(self, w3=None):
        self.w3 = w3
    # Implement any advanced logic as needed

# Stub for FlashbotsKeystoreSigner if needed:
try:
    from flashbots import FlashbotsKeystoreSigner
except ImportError:
    class FlashbotsKeystoreSigner:
        def __init__(self, acct):
            pass

class MEVBot:
    """
    Main orchestrator for scanning and executing MEV strategies.
    """
    def __init__(self):
        logger.info("Initializing MEVBot...")
        self.config = CONFIG
        self.running = False
        self._main_loop_task: Optional[asyncio.Task] = None
        self._nonce = -1
        self._initialized_flag = False
        self._abort_signal_received = False

        self.provider_manager = ProviderManager()

        try:
            pk = os.environ.get("PRIVATE_KEY")  # example
            if not pk:
                raise ValueError("Missing private key")
            self.account: LocalAccount = Account.from_key(pk)  # Use Account.from_key
            logger.info(f"Loaded wallet: {self.account.address}")
        except Exception as e:
            logger.critical(f"Invalid Private Key: {e}")
            raise ValueError("Account init error") from e

        self.w3: Optional[Web3] = None
        self.flashloan_contract_instance = None
        self.flashbots: Optional[Flashbots] = None
        self.pending_txs: Set[str] = set()

        try:
            self.flashloan_contract_address = Web3.to_checksum_address(
                self.config["FLASHLOAN_CONTRACT_ADDRESS"]
            )
            artifact_path_rel = self.config.get("ARB_CONTRACT_ARTIFACT_PATH")
            if not artifact_path_rel:
                raise ValueError("Missing ARB_CONTRACT_ARTIFACT_PATH in config.")
            artifact_abs = os.path.abspath(os.path.join(os.path.dirname(__file__), artifact_path_rel))
            self.flashloan_contract_abi = load_abi(artifact_abs)
            if not self.flashloan_contract_abi:
                raise ValueError("Contract ABI load failed")
        except Exception as e:
            logger.critical(f"Contract config error: {e}")
            raise ValueError("Contract init error") from e

        # Additional modules
        self.risk_engine = RiskEngine()
        self.ml_client = MLClient()
        self.performance_tracker = get_performance_tracker()
        self.gas_optimizer = GasOptimizer(None)

        self.liquidation_monitor: Optional[LiquidationMonitor] = None
        self.oracle_monitor: Optional[OracleMonitor] = None

        base_symbol = self.config.get("BASE_TOKEN_SYMBOL", "WETH")
        self._base_token = get_token(base_symbol)
        if not self._base_token:
            logger.critical("Base token cannot be loaded!")
            raise ValueError("Base token error")

        self.performance_tracker.base_token_decimals = self._base_token.decimals
        self.performance_tracker.base_token_price_usd_cache = 1.0

        logger.info("MEVBot constructor done.")

    async def initialize(self):
        if self._initialized_flag:
            logger.info("MEV Bot already initialized.")
            return
        logger.info("Initializing MEV Bot async components...")

        try:
            self.w3 = await self.provider_manager.get_provider()
            if not self.w3:
                logger.error("No Web3 provider.")
                return

            if hasattr(self.w3.provider, '_request_func'):  # Async provider
                connected = await self.w3.is_connected()
            else:
                connected = self.w3.is_connected()

            if not connected:
                raise ConnectionError("Web3 provider not connected.")

            self.gas_optimizer.w3 = self.w3
            self.flashloan_contract_instance = self.w3.eth.contract(
                address=self.flashloan_contract_address,
                abi=self.flashloan_contract_abi
            )

            if self.config.get("MONITOR_LIQUIDATIONS"):
                self.liquidation_monitor = LiquidationMonitor(self.w3.provider)
                await self.liquidation_monitor.initialize()
            if self.config.get("ORACLE_MONITOR", {}).get("ENABLED"):
                self.oracle_monitor = OracleMonitor(self.w3.provider)
                await self.oracle_monitor.initialize()
                self.oracle_monitor.start_monitoring()

            if self.config.get("USE_FLASHBOTS"):
                try:
                    fb_signer = FlashbotsKeystoreSigner(self.account)
                    self.flashbots = Flashbots(
                        fb_signer,
                        self.w3.provider,
                        self.config.get("FLASHBOTS_RELAYS", ["https://relay.flashbots.net"])[0]
                    )
                    logger.info("Flashbots ready.")
                except Exception as fe:
                    logger.error(f"Flashbots init failed: {fe}. Disabling.")
                    self.config["USE_FLASHBOTS"] = False
                    self.flashbots = None

            await self._update_nonce(force=True)
            self.performance_tracker.base_token_price_usd_cache = await get_base_token_price(self._base_token, self.w3)

            self._initialized_flag = True
            logger.info("MEV Bot async init complete.")

        except Exception as e:
            logger.critical(f"Bot async init failure: {e}", exc_info=True)
            self._initialized_flag = False
            raise

    def is_initialized(self) -> bool:
        return self._initialized_flag

    async def _update_nonce(self, force=False):
        """Refresh local nonce from chain."""
        if not self.w3:
            return
        self._nonce = await asyncio.to_thread(lambda: self.w3.eth.get_transaction_count(self.account.address))

    def _get_and_increment_nonce(self) -> int:
        """Return current nonce and increment."""
        val = self._nonce
        self._nonce += 1
        return val

    def _decrement_nonce(self):
        """Decrement if tx fails pre-broadcast."""
        self._nonce -= 1

    # === NEW ===: Subprocess call to Rust
    async def _call_rust_scanner(self) -> List[Dict]:
        """
        Invokes the Rust MEV scanner at .\\rusty\\mev_rust_core\\target\\release\\mev_rust_core.exe
        capturing JSON output. Adjust chain, max-hops, etc. as needed.
        """
        # Hard-coded for your environment:
        rust_exe = r".\rusty\mev_rust_core\target\release\mev_rust_core.exe"
        chain = self.config.get("RUST_CHAIN", "mainnet")
        max_hops = self.config.get("RUST_MAX_HOPS", 3)

        cmd = [
            rust_exe,
            "--chain", chain,
            "--max-hops", str(max_hops)
        ]
        logger.info(f"Calling Rust: {' '.join(cmd)}")

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout_data, stderr_data = await proc.communicate()

            if proc.returncode != 0:
                logger.error(f"Rust exit code={proc.returncode}, stderr={stderr_data.decode(errors='ignore')}")
                return []

            out_str = stdout_data.decode(errors='ignore').strip()
            if not out_str:
                logger.warning("Rust produced no stdout.")
                return []

            try:
                data = json.loads(out_str)
                if isinstance(data, list):
                    logger.info(f"Rust returned {len(data)} ops.")
                    return data
                else:
                    logger.warning("Rust output wasn't a JSON list.")
                    return []
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from Rust: {e}")
                return []

        except Exception as e:
            logger.exception(f"Subprocess call to Rust failed: {e}")
            return []

    def _validate_rust_ops(self, raw_ops: List[Dict]) -> List[Dict]:
        """
        Optional function to filter or parse numeric strings.
        """
        # For now, pass them as-is
        return raw_ops

    async def run_main_loop(self):
        """
        Example main loop that calls the Rust scanner, does liq monitor, etc.
        """
        self.running = True
        logger.info("MEVBot main loop started.")
        while self.running:
            try:
                # Use the new Rust scanning approach
                raw_ops = await self._call_rust_scanner()
                validated = self._validate_rust_ops(raw_ops)

                logger.debug(f"Got {len(validated)} validated ops from Rust.")
                # Possibly do further logic: ML filter, finalize execution, etc.

                if self.liquidation_monitor and self.config.get("MONITOR_LIQUIDATIONS"):
                    liqs = await self.liquidation_monitor.find_liquidatable_positions()
                    logger.debug(f"Liquidation monitor => {len(liqs)} ops found.")
                    # Possibly combine or handle them

                await asyncio.sleep(self.config.get("SCAN_INTERVAL_S", 5))
            except asyncio.CancelledError:
                logger.info("Main loop cancelled.")
                break
            except Exception as e:
                logger.exception(f"Main loop error: {e}")
                await asyncio.sleep(10)

        logger.info("MEVBot main loop finished.")

    def stop(self):
        self.running = False
        if self._main_loop_task and not self._main_loop_task.done():
            self._main_loop_task.cancel()

def main():
    bot = MEVBot()

    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(bot.initialize())
        if bot.is_initialized():
            bot._main_loop_task = loop.create_task(bot.run_main_loop())
            loop.run_forever()
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt => stopping bot.")
    except Exception as e:
        logger.exception(f"Fatal error in main: {e}")
    finally:
        bot.stop()
        if bot._main_loop_task:
            loop.run_until_complete(bot._main_loop_task)
        loop.close()

if __name__ == "__main__":
    main()
