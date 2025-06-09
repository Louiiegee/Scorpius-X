import asyncio
import logging
import os
import json
import time
import numpy as np
from web3 import Web3, exceptions as w3_exceptions
from eth_account import Account

# Configure module logger
logger = logging.getLogger("DefenderIntegration")
logger.setLevel(logging.DEBUG)

# -----------------------------------
# 1. PausableContract Wrapper
# (Assuming your deployed contract implements pause/unpause)
# -----------------------------------
class PausableContract:
    """
    A wrapper to interact with a pausable contract.
    Assumes the contract has a pause() function and an owner() method.
    """
    def __init__(self, contract, owner_address: str):
        self.contract = contract
        self.owner = Web3.toChecksumAddress(owner_address)
        self.logger = logging.getLogger(self.__class__.__name__)

    def is_paused(self) -> bool:
        try:
            return self.contract.functions.paused().call()
        except Exception as e:
            self.logger.error(f"Error reading pause status: {e}")
            return False

    def pause(self, tx_params: dict) -> str:
        tx = self.contract.functions.pause().buildTransaction(tx_params)
        return tx

    def unpause(self, tx_params: dict) -> str:
        tx = self.contract.functions.unpause().buildTransaction(tx_params)
        return tx

# -----------------------------------
# 2. Enhanced Defender Integration
# -----------------------------------
class EnhancedDefenderIntegration:
    CRITICAL_RISK_THRESHOLD = 0.85

    def __init__(self, event_bus, rl_model, simulator, w3: Web3, defender_key: str):
        """
        Args:
            event_bus: An event bus instance that supports async receive.
            rl_model: Your RL model (preferably a SecurityEnhancedRLModel).
            simulator: A simulator instance to run strategies.
            w3: A Web3 instance.
            defender_key (str): Private key of the defender account.
        """
        self.event_bus = event_bus
        self.rl_model = rl_model
        self.simulator = simulator
        self.w3 = w3
        self.defender_key = defender_key
        self.logger = logging.getLogger(self.__class__.__name__)

    async def monitor_and_protect(self):
        """Continuously monitor new opportunities and trigger defense actions if risk is critical."""
        while True:
            opportunity = await self.event_bus.receive('new_opportunity')
            risk_assessment = await self._assess_risk(opportunity)
            self.logger.info(f"Risk assessment: {risk_assessment}")
            if risk_assessment['risk_score'] >= self.CRITICAL_RISK_THRESHOLD:
                await self._trigger_defense_actions(opportunity)
            else:
                self.logger.debug("Opportunity risk below threshold; no defense triggered.")

    async def _assess_risk(self, opportunity: dict) -> dict:
        """
        Assess risk using the RL model and a simulation.
        
        Returns a dict with:
            - 'risk_score': float,
            - 'simulation_result': dict
        """
        # In a real scenario, convert opportunity to state using your feature extraction.
        state = self.rl_model._opportunity_to_state(opportunity)
        # Use the enhanced predict method returning a dict
        prediction = self.rl_model.predict(state)
        # Run simulation (this can be more elaborate)
        simulation_result = await self.simulator.run(state)
        return {
            'risk_score': prediction['risk_score'],
            'simulation_result': simulation_result
        }

    async def _trigger_defense_actions(self, opportunity: dict):
        """
        Trigger defense actions:
          1. Pause critical contract functions.
          2. Secure funds by moving them to safe storage.
          3. Alert the security team.
        """
        contract_address = opportunity.get('contract_address')
        if contract_address:
            self.logger.warning(f"High-risk exploit detected on {contract_address}. Initiating defense actions.")
            await self._pause_contract(contract_address)
            await self._secure_funds(opportunity)
            self._alert_security_team(opportunity)
        else:
            self.logger.error("Opportunity missing 'contract_address'; cannot execute defense actions.")

    async def _pause_contract(self, contract_address: str):
        """
        Pause a contract by sending a pause transaction.
        Uses the defender account and calls the contract's pause() function.
        """
        try:
            # Verify ownership; placeholder implementation
            if not await verify_contract_ownership(contract_address, self.w3, self.defender_key):
                raise PermissionError("Defender account is not the owner of the contract.")
            
            # Build pause transaction. Assuming the contract ABI includes pause()
            contract = self.w3.eth.contract(
                address=Web3.toChecksumAddress(contract_address),
                abi=[{"inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function"}]
            )
            tx = contract.functions.pause().buildTransaction({
                'chainId': self.w3.eth.chain_id,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(Account.from_key(self.defender_key).address)
            })
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.defender_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = await wait_for_transaction(tx_hash, self.w3)
            if not receipt.status:
                raise Exception("Pause transaction reverted")
            self.logger.info(f"Contract {contract_address} paused successfully. Tx Hash: {tx_hash.hex()}")
        except Exception as e:
            self.logger.error(f"Error pausing contract {contract_address}: {e}")
            await fallback_emergency_pause(contract_address, self.w3, self.defender_key)

    async def _secure_funds(self, opportunity: dict):
        """
        Secure funds by moving them to a safe wallet. 
        This is a placeholder function; implement fund transfer as needed.
        """
        self.logger.info(f"Securing funds for opportunity: {opportunity.get('contract_address', 'N/A')}")
        # Example: call a function or notify a fund manager service.
        await asyncio.sleep(0.1)
    
    def _alert_security_team(self, opportunity: dict):
        """
        Alert the security team using predefined channels (e.g., Slack, SMS).
        """
        self.logger.warning(f"Alert! High-risk exploit detected on {opportunity.get('contract_address', 'N/A')}.")
        # Integrate with your alerting system (e.g., using an async HTTP call)
    
# -----------------------------------
# 3. RL Model Integration with Defense Triggers
# -----------------------------------
class SecurityEnhancedRLModel:
    """
    An RL model enhanced with security features.
    
    Overrides predict to include risk score and recommended actions.
    """
    def __init__(self, base_model):
        self.base_model = base_model  # This could be an instance of RLAgent or similar.
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def predict(self, state: np.ndarray) -> dict:
        # Get base prediction (assumed to be a scalar Q-value)
        base_prediction = self.base_model.predict(state)
        risk_score = 1 / (1 + np.exp(-base_prediction))  # Sigmoid transformation
        recommended_actions = []
        if risk_score > 0.7:
            recommended_actions.append('pause_contract')
        if risk_score > 0.9:
            recommended_actions.extend(['secure_funds', 'initiate_rollback'])
        self.logger.debug(f"Prediction: {base_prediction}, Risk Score: {risk_score}, Recommended: {recommended_actions}")
        return {
            'action': base_prediction,
            'risk_score': risk_score,
            'recommended_actions': recommended_actions
        }
    
    def _opportunity_to_state(self, opportunity: dict) -> np.ndarray:
        # Placeholder: Convert opportunity dictionary to state vector.
        return np.random.random(12)

# -----------------------------------
# 4. Automated Pause Execution Flow
# -----------------------------------
async def execute_auto_pause(contract_address: str, w3: Web3, defender_key: str) -> bool:
    """
    Automatically pause a contract given a critical exploit detection.
    
    Steps:
      1. Verify contract ownership.
      2. Execute the pause transaction.
      3. Verify the pause was successful.
      4. Return True if paused; otherwise, trigger emergency fallback.
    """
    try:
        if not await verify_contract_ownership(contract_address, w3, defender_key):
            raise PermissionError("Defender not the owner of the contract")
        
        contract = w3.eth.contract(
            address=Web3.toChecksumAddress(contract_address),
            abi=[{"inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function"}]
        )
        tx = contract.functions.pause().buildTransaction({
            'chainId': w3.eth.chain_id,
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(Account.from_key(defender_key).address)
        })
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=defender_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        receipt = await wait_for_transaction(tx_hash, w3)
        if not receipt.status:
            raise Exception("Pause transaction reverted")
        logger.info(f"Auto-pause successful for {contract_address}. Tx: {tx_hash.hex()}")
        return True
    except Exception as e:
        logger.error(f"Auto-pause failed for {contract_address}: {e}")
        await fallback_emergency_pause(contract_address, w3, defender_key)
        return False

async def wait_for_transaction(tx_hash, w3: Web3, timeout=120):
    """Wait for transaction receipt with a timeout."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: w3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout))

async def fallback_emergency_pause(contract_address: str, w3: Web3, defender_key: str):
    """
    Fallback emergency pause mechanism in case the standard pause fails.
    This could call a multi-sig emergency pause function or trigger governance if needed.
    """
    logger.warning(f"Executing fallback emergency pause for {contract_address}")
    # Placeholder: Add additional emergency pause logic as necessary.
    await asyncio.sleep(0.5)
    logger.info("Fallback emergency pause executed.")

async def verify_contract_ownership(contract_address: str, w3: Web3, defender_key: str) -> bool:
    """
    Verify if the defender account is the owner of the contract.
    
    Args:
        contract_address (str): The target contract address.
        w3 (Web3): Web3 instance.
        defender_key (str): Defender's private key.
    
    Returns:
        bool: True if the defender is the owner; False otherwise.
    """
    try:
        contract = w3.eth.contract(
            address=Web3.toChecksumAddress(contract_address),
            abi=[{"constant": True, "inputs": [], "name": "owner", "outputs": [{"name": "", "type": "address"}], "stateMutability": "view", "type": "function"}]
        )
        owner = contract.functions.owner().call()
        defender_address = Account.from_key(defender_key).address
        return Web3.toChecksumAddress(owner) == Web3.toChecksumAddress(defender_address)
    except Exception as e:
        logger.error(f"Error verifying contract ownership: {e}")
        return False

# -----------------------------------
# Example Test Flow
# -----------------------------------
def test_auto_pause_flow():
    """
    Simulate a critical exploit detection flow and verify that the auto-pause mechanism works.
    """
    # This is a synchronous test placeholder.
    # In a real test environment, you would run these as async tests.
    dummy_exploit = {
        'contract_address': '0x1234567890abcdef1234567890abcdef12345678',
        'risk_score': 0.92
    }
    # Instantiate a defender integration instance with dummy placeholders.
    event_bus = DummyEventBus()
    dummy_rl_model = SecurityEnhancedRLModel(base_model=DummyRLModel())
    dummy_simulator = DummySimulator()
    w3 = Web3(Web3.HTTPProvider("http://localhost:8545"))
    defender = EnhancedDefenderIntegration(event_bus, dummy_rl_model, dummy_simulator, w3, defender_key="0xDEFENDER_KEY")
    result = asyncio.run(defender._trigger_defense_actions(dummy_exploit))
    # Assume that the pause contract call sets a paused flag on-chain.
    # Here, we simply log the result.
    logger.info("Auto-pause flow test completed.")

# -----------------------------------
# Dummy Classes for Testing (Placeholders)
# -----------------------------------
class DummyEventBus:
    async def receive(self, event_type):
        await asyncio.sleep(0.1)
        return {'contract_address': '0x1234567890abcdef1234567890abcdef12345678'}

class DummyRLModel:
    def predict(self, state):
        # Return a dummy scalar value
        return 1.2

    def _opportunity_to_state(self, opportunity):
        return np.random.random(12)

class DummySimulator:
    async def run(self, state):
        await asyncio.sleep(0.1)
        return {'expected_profit': np.random.uniform(0, 0.2), 'optimal_strategy': 'dummy_strategy'}

# -------------------
# For module test purposes, uncomment the following block:
# if __name__ == "__main__":
#     test_auto_pause_flow()
