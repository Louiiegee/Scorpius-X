# flash_loan_executor.py

import asyncio
import json
import logging
import os
import time

import aiohttp
from eth_abi import encode_abi
from web3 import Web3, exceptions as w3_exceptions
from eth_account import Account

# Assume that SmartGasPredictor and MEVProtectionManager will be used.
from gas_optimizer import SmartGasPredictor

# ------------------------------------------------
# MEV Protection Manager
# ------------------------------------------------
class MEVProtectionManager:
    """
    Manage MEV protection submission via various providers.
    Currently supports Flashbots and Eden via HTTP APIs.
    """
    PROVIDERS = {
        'flashbots': {
            'rpc_url': 'https://rpc.flashbots.net/fast',
            'headers': {'X-Flashbots-Simulation': 'true'}
        },
        'eden': {
            'api': 'https://api.edennetwork.io/v1/protect',
            'auth': 'Bearer YOUR_API_KEY'  # Replace with real key or load from config
        }
    }

    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

    def _select_optimal_provider(self) -> str:
        """
        For now, simply return 'flashbots' as the optimal provider.
        In production, this selection can be based on performance and history.
        """
        return 'flashbots'

    async def protect_transaction(self, tx_data: dict) -> dict:
        """
        Route the transaction through a selected MEV protection service.

        Args:
            tx_data (dict): The complete transaction parameters.

        Returns:
            dict: Result containing success flag, tx_hash, service used, etc.
        """
        provider = self._select_optimal_provider()
        if provider == 'flashbots':
            return await self._submit_flashbots(tx_data)
        elif provider == 'eden':
            return await self._submit_eden(tx_data)
        else:
            raise ValueError(f"Unsupported MEV provider: {provider}")

    async def _submit_flashbots(self, tx_data: dict) -> dict:
        async with aiohttp.ClientSession() as session:
            payload = {
                "jsonrpc": "2.0",
                "method": "eth_sendPrivateTransaction",
                "params": [{
                    "tx": tx_data,
                    "preferences": {
                        "fast": True,
                        "allowedBuilders": ["flashbots", "bloxroute"]
                    }
                }],
                "id": 1
            }
            async with session.post(
                self.PROVIDERS['flashbots']['rpc_url'],
                json=payload,
                headers=self.PROVIDERS['flashbots']['headers']
            ) as response:
                result = await response.json()
                return {
                    'success': 'error' not in result,
                    'tx_hash': result.get('result'),
                    'service': 'flashbots'
                }

    async def _submit_eden(self, tx_data: dict) -> dict:
        async with aiohttp.ClientSession() as session:
            payload = {"tx": tx_data}
            async with session.post(
                self.PROVIDERS['eden']['api'],
                json=payload,
                headers={"Authorization": self.PROVIDERS['eden']['auth']}
            ) as response:
                result = await response.json()
                return {
                    'success': result.get('success', False),
                    'tx_hash': result.get('tx_hash'),
                    'service': 'eden'
                }

# ------------------------------------------------
# Flash Loan Arbitrage Executor
# ------------------------------------------------
class FlashLoanArbitrageExecutor:
    DEFAULT_GAS_LIMIT = 1_500_000
    GAS_LIMIT_MULTIPLIER = 1.2

    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.w3 = Web3(Web3.HTTPProvider(config['RPC_URL']))
        if not config.get('PRIVATE_KEY'):
            raise ValueError("PRIVATE_KEY is required in config for FlashLoanArbitrageExecutor")
        self.account = Account.from_key(config['PRIVATE_KEY'])
        self.address = self.account.address
        self.logger.info(f"Executor initialized for account: {self.address}")

        # Initialize MEV protection; use MEVProtectionManager
        self.mev_protection_manager = MEVProtectionManager(config)
        # Initialize gas optimizer
        self.gas_optimizer = SmartGasPredictor(self.w3)

        # Standard ABIs are assumed to be stored in the abis/ directory.
        self.abis = {
            "flash_loan_aggregator": self._load_abi('flash_loan_aggregator_abi.json'),
            "erc20": self._load_abi('erc20_abi.json')
        }
        self.aggregator_contract_address = config.get('ARBITRAGE_CONTRACT')
        if not self.aggregator_contract_address:
            raise ValueError("ARBITRAGE_CONTRACT address is required in config")
        try:
            self.aggregator_contract_address = Web3.toChecksumAddress(self.aggregator_contract_address)
        except ValueError:
            raise ValueError(f"Invalid ARBITRAGE_CONTRACT address format: {self.aggregator_contract_address}")
        self.aggregator_contract = self.w3.eth.contract(
            address=self.aggregator_contract_address,
            abi=self.abis['flash_loan_aggregator']
        )
        self.logger.info(f"Executor configured for aggregator contract: {self.aggregator_contract_address}")
        # Flash Loan Providers configuration (provider IDs, fees, etc.)
        self.flash_loan_providers = {
            'aave': {'id': 0, 'fee_bps': 9},
            'maker': {'id': 1, 'fee_bps': 0},
            'dydx': {'id': 2, 'fee_bps': 0},
            'balancer': {'id': 3, 'fee_bps': 0},
        }
        self.execution_stats = {
            'attempts': 0,
            'successes': 0,
            'failures': 0,
            'profit_total_eth': 0,
            'gas_spent_total_eth': 0,
            'last_execution_time': None,
            'last_tx_hash': None
        }

    def _load_abi(self, filename):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        abi_path = os.path.join(base_dir, 'abis', filename)
        try:
            with open(abi_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.error(f"ABI file not found: {abi_path}")
            if 'erc20' in filename.lower():
                return [{
                    "constant": True,
                    "inputs": [{"name": "_owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "payable": False,
                    "stateMutability": "view",
                    "type": "function"
                }, {
                    "constant": False,
                    "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
                    "name": "transfer",
                    "outputs": [{"name": "", "type": "bool"}],
                    "payable": False,
                    "stateMutability": "nonpayable",
                    "type": "function"
                }]
            raise
        except Exception as e:
            self.logger.error(f"Error loading ABI file {abi_path}: {e}")
            raise

    def _encode_aggregator_call(self, provider_id: int, loan_token: str,
                                  loan_amount: int, strategy_sequence: list) -> str:
        """
        Encode the flash loan execution call with structured encoding.

        Args:
            provider_id (int): The provider identifier (e.g., for Aave).
            loan_token (str): Address of the token to be borrowed.
            loan_amount (int): Loan amount in Wei.
            strategy_sequence (list): List of action dicts. Each dict should have a 'type' field.
                - For "swap": expected keys: 'pool', 'token_in', 'token_out', 'amount_in'
                - For "call": expected keys: 'target', 'data'
        
        Returns:
            str: Encoded calldata as a hex string.
        """
        action_struct = []
        for action in strategy_sequence:
            if action.get('type') == 'swap':
                # Structure: (pool, token_in, token_out, amount_in)
                encoded_action = (
                    Web3.toChecksumAddress(action['pool']),
                    Web3.toChecksumAddress(action['token_in']),
                    Web3.toChecksumAddress(action['token_out']),
                    action['amount_in']
                )
            elif action.get('type') == 'call':
                # Structure: (target, data)
                encoded_action = (
                    Web3.toChecksumAddress(action['target']),
                    action['data']
                )
            else:
                # Unsupported action: Skip it (or optionally raise error)
                self.logger.warning(f"Unsupported action type in strategy: {action.get('type')}")
                continue
            action_struct.append(encoded_action)
        # Use eth_abi to encode the struct array
        # For example, if your contract expects an array of structs of type:
        # struct Action {
        #     address poolOrTarget; // Depending on type
        #     address token_in;       // For swaps (set to 0 for calls)
        #     address token_out;      // For swaps (set to 0 for calls)
        #     uint256 amount;         // For swaps or 0 for calls
        #     bytes callData;         // For calls
        # }
        #
        # Here, we assume that swap actions are encoded as (address, address, address, uint256)
        # and call actions as (address, bytes).
        #
        # We now call the contract’s encodeABI using our structured parameter.
        return self.aggregator_contract.encodeABI(
            fn_name='executeFlashLoan',
            args=[
                provider_id,
                Web3.toChecksumAddress(loan_token),
                loan_amount,
                action_struct
            ]
        )

    async def _estimate_gas_with_fallback(self, tx_params: dict) -> int:
        """
        Estimate gas using a hybrid approach.
        First, attempt to estimate gas via Tenderly simulation, scaling the result.
        If that fails, fall back to Web3's native estimate_gas.

        Args:
            tx_params (dict): Transaction parameters.

        Returns:
            int: Estimated gas limit.
        """
        try:
            tenderly_estimate = await self._tenderly_gas_simulate(tx_params)
            if tenderly_estimate:
                return int(tenderly_estimate * 1.2)
        except Exception as e:
            self.logger.warning(f"Tenderly gas estimation failed: {e}")

        try:
            return await asyncio.to_thread(self.w3.eth.estimate_gas, tx_params)
        except Exception:
            return self.DEFAULT_GAS_LIMIT

    async def _tenderly_gas_simulate(self, tx_params: dict) -> Optional[int]:
        """
        Use Tenderly's simulation API for accurate gas estimation.

        Args:
            tx_params (dict): Transaction parameters.

        Returns:
            Optional[int]: Gas used as simulated by Tenderly, or None on failure.
        """
        async with aiohttp.ClientSession() as session:
            payload = {
                "network_id": str(self.w3.eth.chain_id),
                "from": tx_params['from'],
                "to": tx_params['to'],
                "input": tx_params.get('data', '0x'),
                "gas": hex(tx_params.get('gas', self.DEFAULT_GAS_LIMIT)),
                "gas_price": hex(tx_params.get('gasPrice', 0)),
                "value": hex(tx_params.get('value', 0))
            }
            try:
                async with session.post(
                    "https://api.tenderly.co/api/v1/simulate",
                    json=payload,
                    headers={"X-Access-Key": self.config['TENDERLY_KEY']}
                ) as response:
                    data = await response.json()
                    return data['transaction']['gas_used']
            except Exception as e:
                self.logger.error(f"Tenderly simulation error: {e}")
                return None

    async def execute_arbitrage(self, opportunity: dict):
        """
        Execute the flash loan arbitrage opportunity with enhanced error handling.

        Args:
            opportunity (dict): Contains keys such as:
                - token_address (str)
                - loan_amount (int)
                - strategy_sequence (list)
                - (Optionally) flashloan_provider, gas_limit, etc.

        Returns:
            tuple: (bool, dict or str) indicating success and details or error message.
        """
        self.execution_stats['attempts'] += 1
        start_time = time.time()
        tx_hash = None

        self.logger.info(f"Executing arbitrage. Estimated Profit: {opportunity.get('estimated_profit', 0):.6f} ETH")
        try:
            provider_name = opportunity.get('flashloan_provider')
            if not provider_name or provider_name not in self.flash_loan_providers:
                provider_name = 'aave'  # Default to Aave if none specified
            provider_id = self.flash_loan_providers[provider_name]['id']
            self.logger.info(f"Selected flash loan provider: {provider_name} (ID: {provider_id})")
            
            gas_settings = await asyncio.to_thread(self.gas_optimizer.estimate_optimal_gas_eip1559)
            self.logger.info(f"Gas Settings: MaxFeePerGas={gas_settings['maxFeePerGas']/1e9:.2f} Gwei, " +
                             f"MaxPriorityFeePerGas={gas_settings['maxPriorityFeePerGas']/1e9:.2f} Gwei")
            
            tx_calldata = self._encode_aggregator_call(provider_id, opportunity['token_address'],
                                                       opportunity['loan_amount'], opportunity['strategy_sequence'])
            
            tx_params_for_estimate = {
                'from': self.address,
                'to': self.aggregator_contract_address,
                'value': 0,
                'data': tx_calldata,
                **gas_settings
            }
            try:
                estimated_gas = await self._estimate_gas_with_fallback(tx_params_for_estimate)
                gas_limit = int(estimated_gas)
                self.logger.info(f"Estimated Gas: {estimated_gas}")
            except Exception as estimate_e:
                self.logger.warning(f"Gas estimation failed: {estimate_e}. Using default gas limit.")
                gas_limit = self.DEFAULT_GAS_LIMIT

            nonce = await asyncio.to_thread(self.w3.eth.get_transaction_count, self.address)
            base_tx = {
                'from': self.address,
                'to': self.aggregator_contract_address,
                'value': 0,
                'chainId': self.w3.eth.chain_id,
                'nonce': nonce,
                'gas': gas_limit,
                'data': tx_calldata,
            }
            full_tx = {**base_tx, **gas_settings}
            self.logger.debug(f"Transaction parameters: {full_tx}")
            signed_tx = self.account.sign_transaction(full_tx)
            self.logger.info("Transaction signed. Submitting via MEV protection.")
            protection_result = await self.mev_protection_manager.protect_transaction(full_tx)
            if not protection_result or not protection_result.get('success'):
                self.logger.error(f"MEV protection submission failed: {protection_result.get('error', 'Unknown')}")
                self.execution_stats['failures'] += 1
                return False, f"MEV submission failed: {protection_result.get('error', 'Unknown')}"
            tx_hash = protection_result.get('tx_hash')
            service_used = protection_result.get('service', 'unknown')
            self.logger.info(f"Tx submitted via {service_used}. Tx Hash: {tx_hash}")
            self.execution_stats['last_tx_hash'] = tx_hash
            receipt = await self._wait_for_transaction_receipt(tx_hash)
            if receipt and receipt.status == 1:
                end_time = time.time()
                gas_used = receipt.gasUsed
                gas_cost_wei = gas_used * receipt.effectiveGasPrice
                gas_cost_eth = Web3.fromWei(gas_cost_wei, 'ether')
                actual_profit_eth = self._parse_profit_from_logs(receipt.logs)
                net_profit_eth = actual_profit_eth - gas_cost_eth
                self.logger.info(f"Tx Confirmed! Gas Used: {gas_used}, Gas Cost: {gas_cost_eth:.6f} ETH, Profit: {actual_profit_eth:.6f} ETH, Net: {net_profit_eth:.6f} ETH")
                self.execution_stats['successes'] += 1
                self.execution_stats['profit_total_eth'] += actual_profit_eth
                self.execution_stats['gas_spent_total_eth'] += gas_cost_eth
                self.execution_stats['last_execution_time'] = end_time
                result_data = {
                    'tx_hash': tx_hash,
                    'profit_eth': actual_profit_eth,
                    'gas_cost_eth': gas_cost_eth,
                    'net_profit_eth': net_profit_eth,
                    'gas_used': gas_used,
                    'block_number': receipt.blockNumber,
                    'execution_time_ms': int((end_time - start_time) * 1000),
                    'mev_protection_service': service_used
                }
                return True, result_data
            else:
                fail_reason = f"Transaction reverted or status is 0." if receipt else f"Receipt timeout for tx {tx_hash}."
                self.logger.warning(f"Tx Failed. Reason: {fail_reason}")
                self.execution_stats['failures'] += 1
                return False, fail_reason

        except w3_exceptions.ContractLogicError as cle:
            revert_reason = self._parse_revert_reason(cle)
            self.logger.error(f"Contract logic error: {revert_reason}")
            return False, f"REVERT: {revert_reason}"
        except asyncio.TimeoutError:
            self.logger.warning("Transaction confirmation timeout")
            return False, "TX_TIMEOUT"
        except Exception as e:
            self.logger.critical(f"Critical error during arbitrage execution: {e}", exc_info=True)
            return False, f"Critical error: {e}"

    async def _wait_for_transaction_receipt(self, tx_hash, timeout=120, poll_latency=1):
        self.logger.info(f"Waiting for receipt for tx {tx_hash} (timeout={timeout}s)...")
        try:
            receipt = await asyncio.to_thread(
                self.w3.eth.wait_for_transaction_receipt,
                tx_hash,
                timeout=timeout,
                poll_latency=poll_latency
            )
            self.logger.info(f"Receipt received for tx {tx_hash}. Status: {receipt.status}")
            return receipt
        except asyncio.CancelledError:
            self.logger.warning(f"Receipt wait cancelled for tx {tx_hash}.")
            raise
        except Exception as e:
            self.logger.warning(f"Error or timeout waiting for receipt for tx {tx_hash}: {e}")
            return None

    def _parse_profit_from_logs(self, logs: list) -> float:
        """
        Parse logs to extract actual profit.

        This function expects that the aggregator contract emits an event like:
            event ProfitReported(address indexed token, uint256 profitAmount);
        """
        profit_wei = 0
        profit_event_signature = Web3.keccak(text="ProfitReported(address,uint256)").hex()
        for log in logs:
            if log.address == self.aggregator_contract_address and log.topics[0].hex() == profit_event_signature:
                try:
                    profit_wei = Web3.toInt(hexstr=log.data.hex())
                    self.logger.info(f"ProfitReported event found. Profit (Wei): {profit_wei}")
                    break
                except Exception as e:
                    self.logger.error(f"Error decoding ProfitReported event: {e}.")
        return Web3.fromWei(profit_wei, 'ether')

    def _parse_revert_reason(self, error: Exception) -> str:
        """
        Attempt to decode and return the revert reason from a ContractLogicError.

        Args:
            error (Exception): The exception raised.

        Returns:
            str: A human-readable revert reason.
        """
        try:
            # Extract hex data from error message (this may depend on your provider)
            hex_data = error.args[0].get('data', '')[2:]
            decoded = self.aggregator_contract.decode_function_input("0x" + hex_data)
            return decoded[0].fn_name
        except Exception:
            return "UNKNOWN_ERROR"

    async def _handle_failed_tx(self, tx_hash: str):
        """
        Analyze a failed transaction using Tenderly.

        Args:
            tx_hash (str): The transaction hash.

        Returns:
            dict: Analysis of the failure (trace information).
        """
        async with aiohttp.ClientSession() as session:
            try:
                response = await session.get(
                    f"https://api.tenderly.co/api/v1/tx/{self.config['NETWORK_ID']}/{tx_hash}",
                    headers={"X-Access-Key": self.config['TENDERLY_KEY']}
                )
                trace = await response.json()
                return self._analyze_trace(trace.get('debug', {}))
            except Exception as e:
                self.logger.error(f"Failed to analyze failed tx {tx_hash}: {e}")
                return {"error": str(e)}

    def _analyze_trace(self, trace: dict) -> dict:
        """
        Analyze a transaction trace from Tenderly for insights.

        Args:
            trace (dict): Debug trace from Tenderly.

        Returns:
            dict: Analysis result.
        """
        # Placeholder implementation; extend as needed.
        return {"analysis": "Trace analysis placeholder", "trace": trace}

# ----------------------------------
# Testnet Validation Framework
# ----------------------------------
async def testnet_validation(executor, testnet: str = 'sepolia'):
    """
    Run a comprehensive testnet validation suite for the FlashLoanArbitrageExecutor.

    Args:
        executor (FlashLoanArbitrageExecutor): The executor instance.
        testnet (str, optional): Testnet identifier (e.g., 'sepolia'). Defaults to 'sepolia'.

    Returns:
        None: Prints out test results.
    """
    # Create a copy of config and override with testnet parameters.
    test_config = executor.config.copy()
    test_config.update({
        'RPC_URL': f"https://{testnet}.infura.io/v3/{test_config['INFURA_KEY']}",
        'CHAIN_ID': 11155111 if testnet == 'sepolia' else 5
    })
    # Create a new executor for testing (on a testnet)
    test_executor = FlashLoanArbitrageExecutor(test_config)
    scenarios = [
        {'type': 'simple_swap', 'amount': 100e18},
        {'type': 'complex_arb', 'steps': 3},
        {'type': 'failed_tx', 'expected_revert': 'INSUFFICIENT_OUTPUT'}
    ]
    for scenario in scenarios:
        result = await _run_test_scenario(test_executor, scenario)
        _log_test_result(scenario, result)

async def _run_test_scenario(executor, scenario):
    """
    Execute an individual test scenario.

    Args:
        executor (FlashLoanArbitrageExecutor): The executor instance.
        scenario (dict): A test scenario description.

    Returns:
        dict: Results of the test scenario.
    """
    try:
        # Placeholder: Get testnet funds (simulate faucet)
        await _get_testnet_funds(executor.config['RPC_URL'])
        tx_result = await executor.execute_arbitrage(scenario)
        receipt = await executor.w3.eth.wait_for_transaction_receipt(tx_result[1].get('tx_hash'))
        return {
            'success': receipt.status == 1,
            'gas_used': receipt.gasUsed,
            'events': executor._parse_profit_from_logs(receipt.logs)
        }
    except Exception as e:
        return {'error': str(e), 'success': False}

def _log_test_result(scenario, result):
    """
    Log the results of a test scenario.

    Args:
        scenario (dict): The scenario description.
        result (dict): The test result.
    """
    logger.info(f"Test Scenario {scenario['type']}: {result}")

async def _get_testnet_funds(rpc_url: str):
    """
    Dummy function to simulate fetching testnet funds from a faucet.

    Args:
        rpc_url (str): RPC endpoint.
    """
    # This is a placeholder—integrate with an actual faucet if needed.
    await asyncio.sleep(0.5)
    logger.info("Testnet funds obtained (placeholder).")
