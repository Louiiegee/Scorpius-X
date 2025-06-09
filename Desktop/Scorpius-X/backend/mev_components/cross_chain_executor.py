import asyncio
import json
import logging
import os
import subprocess
import time
from typing import Dict

import aiohttp
import numpy as np
from web3 import Web3
from web3.exceptions import ContractLogicError

logger = logging.getLogger("EnhancedCrossChainExecutor")
logger.setLevel(logging.DEBUG)

class EnhancedCrossChainExecutor:
    """
    Enhanced Cross-Chain Executor

    This class integrates CCIP router contract interactions with:
      - Validated transaction message building
      - Accurate fee estimation using on-chain quoting plus safety buffer
      - Cross-chain transaction execution including funding checks
      
    Configuration requirements:
      - config['CCIP_ROUTERS']: a dict mapping chain id (as string) to router contract addresses.
      - config['CCIP_ROUTERS'] must be provided for each supported chain.
      - config should include any required keys for balance checks (if implemented).
      
    Assumes that you have a dictionary of Web3 providers for each supported chain available
    in self.w3_providers.
    """
    def __init__(self, config: dict, w3_providers: Dict[int, Web3]):
        self.config = config
        self.w3_providers = w3_providers  # e.g., { 1: Web3(provider_for_mainnet), 137: provider_for_polygon, ... }
        self.logger = logging.getLogger(self.__class__.__name__)
        # Load verified CCIP ABIs
        self.ccip_abis = {
            'router': self._load_abi('CCIPRouter.json'),
            'token_pool': self._load_abi('TokenPool.json')
        }
        # Predefined chain selectors (from Chainlink documentation, for example)
        self.chain_selectors = {
            1: 5009297550715157269,    # Ethereum
            137: 4051577828743386545,  # Polygon
            42161: 4949039107694359620 # Arbitrum
        }
        # This will be populated with contract instances per chain
        self.ccip_contracts = {}
        self._initialize_all_ccip_contracts()

    def _load_abi(self, filename: str) -> dict:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        abi_path = os.path.join(base_dir, "abis", filename)
        with open(abi_path, "r") as f:
            return json.load(f)

    def _initialize_all_ccip_contracts(self):
        """
        Initialize CCIP router contracts for all chains defined in config.
        Expects config['CCIP_ROUTERS'] to map chain id (as str) to router address.
        """
        for chain_id_str, router_address in self.config.get('CCIP_ROUTERS', {}).items():
            chain_id = int(chain_id_str)
            if chain_id in self.w3_providers:
                self.ccip_contracts[chain_id] = self.w3_providers[chain_id].eth.contract(
                    address=Web3.toChecksumAddress(router_address),
                    abi=self.ccip_abis['router']
                )
                self.logger.info(f"Initialized CCIP router for chain {chain_id} at {router_address}")
            else:
                self.logger.warning(f"No Web3 provider found for chain {chain_id}; skipping CCIP initialization.")

    def build_ccip_message(self, params: Dict) -> Dict:
        """
        Construct a CCIP message with validated structure.
        
        Args:
            params (dict): Dictionary containing:
                - 'receiver': destination address as hex string.
                - 'token': token address.
                - 'amount': amount (in token smallest units).
                - 'target_token': target token address.
                - 'min_output': minimum acceptable output.
                - Optionally, 'feeToken'.
                
        Returns:
            dict: CCIP message structure.
            
        Raises:
            ValueError: If receiver is invalid.
        """
        if not Web3.isAddress(params['receiver']):
            raise ValueError("Invalid receiver address")
        return {
            'receiver': Web3.toBytes(hexstr=params['receiver']),
            'data': self._encode_ccip_data(params),
            'tokenAmounts': [{
                'token': Web3.toBytes(hexstr=params['token']),
                'amount': params['amount']
            }],
            'feeToken': params.get('feeToken', '0x0000000000000000000000000000000000000000'),
            'extraArgs': Web3.toBytes(text='0x')
        }
    
    def _encode_ccip_data(self, params: Dict) -> bytes:
        """
        ABI-encode data for CCIP receiver contracts.
        
        Here we use solidity_keccak to generate a hash as a placeholder.
        In production, use a full ABI encoder (e.g. eth_abi.encode_abi) to encode 
        function parameters according to your contract’s expectations.
        """
        # For example, we assume the receiver expects a call to executeSwap(address,uint256,address,uint256)
        func_selector = Web3.keccak(text='executeSwap(address,uint256,address,uint256)')[:4]
        encoded = Web3.solidityKeccak(
            ['bytes4', 'address', 'uint256', 'address', 'uint256'],
            [
                func_selector,
                params['token'],
                params['amount'],
                params['target_token'],
                params['min_output']
            ]
        )
        return encoded

    async def estimate_ccip_fee(self, source_chain_id: int, dest_chain_id: int, message: Dict) -> int:
        """
        Estimate CCIP fees using on-chain quoting from the CCIP router.
        
        Args:
            source_chain_id (int): Source chain identifier.
            dest_chain_id (int): Destination chain identifier.
            message (dict): CCIP message structure.
        
        Returns:
            int: Estimated fee (in Wei) with a 10% buffer.
        """
        if source_chain_id not in self.ccip_contracts:
            raise ValueError(f"CCIP contract for chain {source_chain_id} not initialized.")
        router = self.ccip_contracts[source_chain_id]
        dest_selector = self.chain_selectors.get(dest_chain_id)
        if dest_selector is None:
            raise ValueError(f"No chain selector for destination chain {dest_chain_id}")
        try:
            fee = await asyncio.to_thread(
                router.functions.getFee(
                    dest_selector,
                    {
                        'receiver': message['receiver'],
                        'data': message['data'],
                        'tokenAmounts': message['tokenAmounts'],
                        'feeToken': message['feeToken'],
                        'extraArgs': message['extraArgs']
                    }
                ).call
            )
            return int(fee * 1.1)  # Apply 10% buffer
        except Exception as e:
            self.logger.error(f"Fee estimation failed: {e}")
            return Web3.toWei(0.01, 'ether')  # Fallback value

    async def execute_cross_chain_swap(self, params: Dict) -> Dict:
        """
        Full CCIP transaction lifecycle management:
          - Validate chain support.
          - Build CCIP message.
          - Estimate and fund fees.
          - Execute CCIP transaction.
        
        Args:
            params (dict): Must include:
                - 'source_chain_id'
                - 'dest_chain_id'
                - 'receiver'
                - 'token'
                - 'amount'
                - 'target_token'
                - 'min_output'
                - Optionally, 'feeToken'
        
        Returns:
            dict: Execution result including success flag, tx_hash, fee, and message id.
        """
        source_chain = params['source_chain_id']
        dest_chain = params['dest_chain_id']
        if not self._validate_chain_support(source_chain, dest_chain):
            return {'success': False, 'error': 'Unsupported chain pair'}
        
        message = self.build_ccip_message(params)
        fee = await self.estimate_ccip_fee(source_chain, dest_chain, message)
        await self._fund_transaction(source_chain, fee, message['feeToken'])
        
        tx_hash = await self._send_ccip_transaction(source_chain, dest_chain, message, fee)
        msg_id = await self._get_message_id(tx_hash)
        return {
            'success': True,
            'tx_hash': tx_hash.hex(),
            'fee_wei': fee,
            'message_id': msg_id
        }
    
    def _validate_chain_support(self, source: int, dest: int) -> bool:
        """
        Validate that the source-destination chain pair is supported.
        
        Returns:
            bool: True if supported, otherwise False.
        """
        supported_pairs = {
            1: [137, 42161],
            137: [1, 42161],
            42161: [1, 137]
        }
        return dest in supported_pairs.get(source, [])
    
    async def _fund_transaction(self, chain_id: int, fee: int, fee_token: str):
        """
        Ensure that the sender account has enough funds to cover the CCIP fee.
        If the fee token is not the native asset, also perform a token approval.
        """
        balance = await self._get_token_balance(chain_id, fee_token)
        if balance < fee:
            raise ValueError(f"Insufficient funds: required {fee}, available {balance}")
        if fee_token != '0x0000000000000000000000000000000000000000':
            await self._approve_token_spend(chain_id, fee_token, fee)
    
    async def _get_token_balance(self, chain_id: int, token: str) -> int:
        """
        Retrieve the balance of a token for the sender account on the given chain.
        Placeholder implementation; replace with your actual balance query.
        """
        provider = self.w3_providers[chain_id]
        # For native asset:
        if token == '0x0000000000000000000000000000000000000000':
            return provider.eth.get_balance(provider.eth.defaultAccount)
        # Otherwise, create a minimal ERC20 contract instance:
        erc20_abi = [
            {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}
        ]
        contract = provider.eth.contract(address=Web3.toChecksumAddress(token), abi=erc20_abi)
        return contract.functions.balanceOf(provider.eth.defaultAccount).call()
    
    async def _approve_token_spend(self, chain_id: int, token: str, amount: int):
        """
        Approve the CCIP router to spend tokens.
        Placeholder implementation; replace with your real approval logic.
        """
        self.logger.info(f"Approving token {token} spend of amount {amount} on chain {chain_id}")
        # Implement your token approval call here.
        await asyncio.sleep(0.1)
    
    async def _send_ccip_transaction(self, source_chain: int, dest_chain: int, message: Dict, fee: int) -> bytes:
        """
        Send the CCIP transaction via the router contract on the source chain.
        
        This function builds and sends the transaction.
        """
        router = self.ccip_contracts[source_chain]
        dest_selector = self.chain_selectors[dest_chain]
        tx = router.functions.ccipSend(dest_selector, message).buildTransaction({
            'from': self.w3_providers[source_chain].eth.defaultAccount,
            'value': fee if message['feeToken'] == '0x0000000000000000000000000000000000000000' else 0,
            'nonce': self.w3_providers[source_chain].eth.get_transaction_count(self.w3_providers[source_chain].eth.defaultAccount),
            'gasPrice': self.w3_providers[source_chain].eth.gas_price,
            'gas': self.config.get('CCIP_GAS_LIMIT', 500000)
        })
        signed_tx = self.w3_providers[source_chain].eth.account.sign_transaction(tx, private_key=self.config['PRIVATE_KEY'])
        tx_hash = self.w3_providers[source_chain].eth.send_raw_transaction(signed_tx.rawTransaction)
        self.logger.info(f"CCIP transaction sent. Tx Hash: {tx_hash.hex()}")
        return tx_hash

    async def _get_message_id(self, tx_hash: bytes) -> str:
        """
        Retrieve the CCIP message ID after transaction execution.
        
        Placeholder: Implement with event filtering or contract call.
        """
        await asyncio.sleep(1)  # Simulate waiting for event emission.
        return "dummy_message_id"

# -----------------------------
# End of EnhancedCrossChainExecutor Module
# -----------------------------
