import asyncio
import json
import logging
import os
import time

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware

from ml_client import MLClient
from scanworker import run_scan
from abi_loader import load_contract

from flashbots_helper import build_flashbots_bundle, simulate_bundle, send_flashbots_bundle
from gas_optimizer import estimate_gas_with_priority
from ml_logger import log_ml_prediction

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ENV Configuration
RPC_URL = os.getenv("MAINNET_RPC_URL", "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
FLASHLOAN_CONTRACT = "0x9ADDe67228630cDaC8112A5fcD62D42C5b2C2396"

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)
account = Account.from_key(PRIVATE_KEY)
logger.info(f"🔐 Using account: {account.address}")

# Load ABI for the flashloan contract
contract_abi = load_contract("AaveV3FlashLoanArbMultiHop.json")
contract = w3.eth.contract(address=FLASHLOAN_CONTRACT, abi=contract_abi)

# Instantiate the ML model
ml_client = MLClient("model_161.joblib")

async def main():
    latest_block = w3.eth.block_number
    logger.info(f"MLClient loaded model from model_161.joblib")
    logger.info(f"Starting flashloan bot at block {latest_block}...")

    while True:
        latest_block += 1
        logger.info(f"Scanning simulated block {latest_block}...")

        results = await run_scan(RPC_URL, None, offset=latest_block, ml_client=ml_client)

        if results and isinstance(results, list):
            for opp in results:
                profit = opp.get("estimated_profit", 0)
                if profit > 50:
                    logger.info(f"🚀 Triggering flashloan for {opp['pair']} | Profit: {profit}")
                    log_ml_prediction(opp, opp.get("confidence", 1.0), profit, block=latest_block)

                    try:
                        gas_params = estimate_gas_with_priority(w3)

                        tx = contract.functions.executeArb(
                            opp["token0"],
                            opp["token1"],
                            opp["amount_in"]
                        ).build_transaction({
                            "from": account.address,
                            "nonce": w3.eth.get_transaction_count(account.address),
                            **gas_params
                        })

                        bundle = build_flashbots_bundle(w3, tx, PRIVATE_KEY)
                        sim_result = simulate_bundle(w3, bundle, latest_block + 1)

                        if "result" in sim_result:
                            send_result = send_flashbots_bundle(w3, bundle, latest_block + 1)
                            logger.info(f"✅ Bundle submitted: {json.dumps(send_result)}")
                            tx_hash = bundle[0]["signed_transaction"].hex()
                            log_ml_prediction(opp, opp.get("confidence", 1.0), profit, tx_hash, latest_block + 1)
                        else:
                            logger.warning("⚠️ Simulation failed, skipping submission.")

                    except Exception as e:
                        logger.warning(f"⚠️ Error during bundle build/send: {e}")

        time.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())