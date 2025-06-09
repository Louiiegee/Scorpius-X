# mevbot.py

import asyncio
import json
import logging
import os
import time
from web3 import Web3
from eth_account import Account
# --- Use Central Config ---
from config import config_manager  # Import the instance
config = config_manager.config  # Use the loaded config

# --- Import Renamed/Consolidated Modules ---
from chain_registry import ChainRegistry, ProtocolRegistry, MultiChainMonitor
from vulnerability_scanner import EnhancedVulnerabilityScanner  # Renamed
from static_analysis import StaticAnalysisIntegration  # Renamed
from arb_simulator import ArbitrageSimulator  # Main simulator interface
from flash_loan_executor import FlashLoanArbitrageExecutor  # Renamed
from mev_protection import EnhancedMEVProtection  # Renamed
from reinforcement_learning import EnhancedOpportunityClassifier  # Consolidated ML
from defender_integration import DefenderIntegration
# from gas_optimizer import SmartGasPredictor  # Import if needed directly

# --- Supporting Components (Stubs or Imports) ---
# Assume EventBus is implemented or imported - basic example:
class EventBus:
    def __init__(self): self.subscribers = {}
    def subscribe(self, event_type, handler):
        if event_type not in self.subscribers: self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
    def publish(self, event_type, data):
        if event_type in self.subscribers:
            for handler in self.subscribers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        asyncio.create_task(handler(data))
                    else:
                        handler(data)
                except Exception as e:
                    logging.error(f"Error in event handler for {event_type}: {e}")

class AlertSystem:
    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger('AlertSystem')
        self.channels = []
        if config.get('SLACK_WEBHOOK_URL'):
            self.channels.append(('slack', config['SLACK_WEBHOOK_URL']))
        if config.get('TELEGRAM_BOT_TOKEN') and config.get('TELEGRAM_CHAT_ID'):
             self.channels.append(('telegram', (config['TELEGRAM_BOT_TOKEN'], config['TELEGRAM_CHAT_ID'])))

    async def trigger_alert(self, alert_type, data):
        message = f"ALERT [{alert_type}]: {json.dumps(data)}"
        self.logger.warning(message)
        for channel_type, channel_config in self.channels:
             await self._send_alert(channel_type, channel_config, message)

    async def _send_alert(self, channel_type, channel_config, message):
         print(f"Sending alert via {channel_type}: {message}")
         await asyncio.sleep(0.01)

class AttackPatternRecognition:
    def __init__(self, web3_list, alert_system):
        self.w3 = web3_list[0]
        self.alert_system = alert_system
        self.logger = logging.getLogger('AttackPatternRecognition')
    async def start(self):
        self.logger.info("Attack Pattern Recognition started (stub).")
    async def analyze_tx_for_patterns(self, tx):
        return None

# Strategy classes stubs
class OracleManipulationStrategy:
    def get_sequence(self): return [{'action': 'placeholder_swap'}]
class GovernanceAttackStrategy:
     def get_sequence(self): return [{'action': 'placeholder_vote'}]
class LiquidityDrainStrategy:
     def get_sequence(self): return [{'action': 'placeholder_rug'}]

class FlashLoanArbitrageBot:
    def __init__(self):
        self.config = config
        self._setup_logging()
        self.event_bus = EventBus()
        self._initialize_components()
        self.running = False
        self.stats = {
            'start_time': None,
            'opportunities_detected': 0,
            'opportunities_processed': 0,
            'simulations_run': 0,
            'simulations_profitable': 0,
            'transactions_executed': 0,
            'successful_transactions': 0,
            'failed_transactions': 0,
            'total_profit_gross_eth': 0,
            'gas_spent_total_eth': 0,
            'errors': 0
        }
        self.active_tasks = []

    def _setup_logging(self):
        log_level_str = self.config.get('LOG_LEVEL', 'INFO').upper()
        log_level = getattr(logging, log_level_str, logging.INFO)
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        log_file = self.config.get('LOG_FILE')
        logging.basicConfig(level=log_level, format=log_format, filename=log_file, filemode='a' if log_file else None)
        if not log_file:
             console_handler = logging.StreamHandler()
             console_handler.setLevel(log_level)
             formatter = logging.Formatter(log_format)
             console_handler.setFormatter(formatter)
             root_logger = logging.getLogger()
             if not any(isinstance(h, logging.StreamHandler) for h in root_logger.handlers):
                  root_logger.addHandler(console_handler)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"Logging setup complete. Level: {log_level_str}, File: {log_file}")

    def _initialize_components(self):
        self.logger.info("Initializing components...")
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.config['RPC_URL']))
            if not self.w3.isConnected():
                 self.logger.error(f"Failed to connect to primary RPC: {self.config['RPC_URL']}")
            self.logger.info(f"Primary RPC connected: {self.config['RPC_URL']}")
            if self.config.get('PRIVATE_KEY'):
                self.account = Account.from_key(self.config['PRIVATE_KEY'])
                self.account_address = self.account.address
                self.logger.info(f"Using account: {self.account_address}")
            else:
                self.account = None
                self.account_address = None
                self.logger.warning("No private key provided. Bot will run in read-only/simulation mode.")
            self.alert_system = AlertSystem(self.config)
            rpc_urls = self.config.get('RPC_URLS', {})
            if not isinstance(rpc_urls, dict):
                 self.logger.warning("RPC_URLS in config is not a dictionary. Using primary RPC only for scanner.")
                 scanner_rpcs = [self.config['RPC_URL']]
            else:
                 scanner_rpcs = list(rpc_urls.values())
                 scanner_rpcs = [url for url in scanner_rpcs if url]
                 if not scanner_rpcs:
                     self.logger.warning("No valid RPC URLs found in RPC_URLS config. Using primary RPC for scanner.")
                     scanner_rpcs = [self.config['RPC_URL']]
            self.vulnerability_scanner = EnhancedVulnerabilityScanner(scanner_rpcs, self.config.get('SIMULATION_CACHE_SIZE', 1000))
            self.static_analyzer = StaticAnalysisIntegration(self.config)
            self.pattern_recognition = AttackPatternRecognition([self.w3], self.alert_system)
            self.mev_protection = EnhancedMEVProtection(self.config, self.w3)
            from arb_simulator import ArbitrageSimulator
            self.simulator = ArbitrageSimulator(self.config)
            if self.account:
                from flash_loan_executor import FlashLoanArbitrageExecutor
                self.executor = FlashLoanArbitrageExecutor(self.config)
                self.logger.info("Flash loan executor initialized.")
            else:
                self.executor = None
                self.logger.info("Flash loan executor disabled (no private key).")
            from reinforcement_learning import EnhancedOpportunityClassifier
            self.classifier = EnhancedOpportunityClassifier(self.config)
            self.opportunity_queue = asyncio.Queue(maxsize=self.config.get('OPPORTUNITY_QUEUE_SIZE', 1000))
            from defender_integration import DefenderIntegration
            self.defender = DefenderIntegration(self.config, self.event_bus)
            from chain_registry import ChainRegistry, ProtocolRegistry
            self.chain_registry = ChainRegistry()
            self.protocol_registry = ProtocolRegistry()
            self.multi_chain_monitor = None
            if self.config.get('ENABLE_MULTI_CHAIN', False):
                 enabled_chains = self.config.get('ENABLED_CHAINS', [])
                 if not isinstance(enabled_chains, list):
                     self.logger.warning("ENABLED_CHAINS in config is not a list. Multi-chain monitoring disabled.")
                 elif not enabled_chains:
                      self.logger.warning("ENABLE_MULTI_CHAIN is true, but ENABLED_CHAINS list is empty.")
                 else:
                       from chain_registry import MultiChainMonitor
                       self.multi_chain_monitor = MultiChainMonitor(self.config)
                       self.logger.info(f"Multi-chain monitoring enabled for chains: {enabled_chains}")
            else:
                 self.logger.info("Multi-chain monitoring disabled.")
            self.logger.info("Component initialization complete.")
        except KeyError as e:
            self.logger.critical(f"Configuration key missing: {e}. Bot cannot start.", exc_info=True)
            raise ValueError(f"Missing configuration key: {e}") from e
        except Exception as e:
            self.logger.critical(f"Failed to initialize components: {e}", exc_info=True)
            raise RuntimeError(f"Component initialization failed: {e}") from e

    async def start(self):
        if self.running:
            self.logger.warning("Bot is already running")
            return
        self.running = True
        self.stats['start_time'] = time.time()
        self.logger.info("========================================")
        self.logger.info(" Starting Flash Loan Arbitrage Bot")
        self.logger.info("========================================")
        self.logger.info(f"Using config file: {config_manager.config_path}")
        self.logger.info(f"Monitored Protocols: {self.config.get('MONITORED_PROTOCOLS')}")
        try:
            await self.defender.initialize()
            await self.static_analyzer.initialize()
            if self.multi_chain_monitor:
                self.logger.info("Initializing multi-chain monitors...")
                await self.multi_chain_monitor.initialize(self.event_bus, self.classifier)
            else:
                 self.logger.info("Multi-chain monitoring disabled. No default single-chain monitor implemented.")
            await self.pattern_recognition.start()
            self.logger.info("Starting opportunity processing task.")
            processing_task = asyncio.create_task(self._opportunity_processor())
            self.active_tasks.append(processing_task)
            self.event_bus.subscribe("opportunity_detected", self.handle_detected_opportunity)
            self.logger.info("Subscribed opportunity handler to EventBus.")
            self.logger.info("Flash Loan Arbitrage Bot started successfully.")
            self.logger.info("Waiting for opportunities...")
        except Exception as e:
            self.logger.critical(f"Bot failed to start: {e}", exc_info=True)
            self.running = False
            await self.stop()

    async def stop(self):
        if not self.running and not self.active_tasks:
            self.logger.warning("Bot is not running or already stopped.")
            return
        self.logger.info("========================================")
        self.logger.info(" Stopping Flash Loan Arbitrage Bot")
        self.logger.info("========================================")
        self.running = False
        if self.multi_chain_monitor:
            self.logger.info("Stopping multi-chain monitors...")
            await self.multi_chain_monitor.stop_all()
        self.logger.info(f"Cancelling {len(self.active_tasks)} active bot tasks...")
        for task in self.active_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                self.logger.debug("Task successfully cancelled.")
            except Exception as e:
                self.logger.error(f"Error during task cancellation: {e}", exc_info=True)
        self.active_tasks = []
        uptime = (time.time() - self.stats['start_time']) if self.stats['start_time'] else 0
        self.logger.info(f"Bot stopped after {uptime:.2f} seconds.")
        self.log_final_stats()
        self.logger.info("========================================")

    async def handle_detected_opportunity(self, opportunity_data):
         self.logger.debug(f"Received opportunity from event bus: {opportunity_data}")
         opportunity = {
             'tx_hash': getattr(opportunity_data, 'tx_hash', 'N/A'),
             'contract_address': getattr(opportunity_data, 'protocols', ['Unknown'])[0],
             'timestamp': getattr(opportunity_data, 'timestamp', time.time()),
             'estimated_profit': getattr(opportunity_data, 'estimated_profit', 0),
             'simulation_result': getattr(opportunity_data, 'simulation_result', {}),
             'vulnerability_type': 'generic_arbitrage',
             'source': 'mempool_monitor',
             'raw_data': opportunity_data
         }
         await self.opportunity_queue.put(opportunity)
         self.stats['opportunities_detected'] += 1

    async def _opportunity_processor(self):
        self.logger.info("Opportunity processor task started.")
        while self.running or not self.opportunity_queue.empty():
            try:
                opportunity = await asyncio.wait_for(self.opportunity_queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                if not self.running:
                    break
                continue
            except asyncio.CancelledError:
                 self.logger.info("Opportunity processor task cancelled.")
                 break

            self.stats['opportunities_processed'] += 1
            tx_hash = opportunity.get('tx_hash', 'N/A')
            self.logger.info(f"Processing opportunity: Tx {tx_hash[:10]}..., Profit Est: {opportunity.get('estimated_profit', 0):.4f}")
            if not self.executor:
                 self.logger.warning(f"Skipping execution for opportunity {tx_hash[:10]}... - No executor.")
                 self.opportunity_queue.task_done()
                 continue
            if opportunity.get('estimated_profit', 0) < self.config.get('MIN_PROFIT_THRESHOLD', 0.1):
                  self.logger.info(f"Skipping opportunity {tx_hash[:10]}... - Profit below threshold.")
                  self.opportunity_queue.task_done()
                  continue
            try:
                self.logger.debug(f"Simulating exploitation for opportunity {tx_hash[:10]}...")
                strategy, sim_params = self._prepare_simulation_strategy(opportunity)
                if not strategy:
                     self.logger.warning(f"No simulation strategy for {tx_hash[:10]}..., skipping.")
                     self.opportunity_queue.task_done()
                     continue
                sim_results = await self.simulator.simulate_flashloan_arbitrage(strategy, sim_params)
                self.stats['simulations_run'] += 1
                self.logger.info(f"Simulation for {tx_hash[:10]}...: Success={sim_results.get('success')}, Profit={sim_results.get('profit', 0):.6f} ETH")
                if sim_results.get('success') and sim_results.get('profit', 0) > self.config.get('MIN_PROFIT_THRESHOLD', 0.1):
                    self.stats['simulations_profitable'] += 1
                    self.logger.info(f"Profitable simulation for {tx_hash[:10]}... Attempting execution.")
                    features = self._extract_features(opportunity, sim_results=sim_results)
                    prediction = self.classifier.predict_opportunity({'features': features})
                    self.logger.debug(f"ML Prediction Score for {tx_hash[:10]}...: {prediction:.4f}")
                    if prediction < self.config.get('MIN_PREDICTION_THRESHOLD', 0.7):
                         self.logger.info(f"Skipping execution for {tx_hash[:10]}... - Low ML score ({prediction:.4f}).")
                         self.opportunity_queue.task_done()
                         continue
                    execution_success, execution_details = await self._execute_arbitrage(opportunity, sim_results)
                    self.stats['transactions_executed'] += 1
                    if execution_success:
                        self.stats['successful_transactions'] += 1
                        profit = execution_details.get('profit', 0)
                        gas_cost = execution_details.get('gas_cost_eth', 0)
                        self.stats['total_profit_gross_eth'] += profit
                        self.stats['total_gas_spent_eth'] += gas_cost
                        self.logger.info(f"SUCCESS! Tx: {execution_details.get('tx_hash')}, Profit: {profit:.6f} ETH, Gas: {gas_cost:.6f} ETH, Net: {(profit - gas_cost):.6f} ETH")
                        await self.alert_system.trigger_alert('ARB_SUCCESS', execution_details)
                    else:
                        self.stats['failed_transactions'] += 1
                        self.logger.warning(f"FAILED execution for {tx_hash[:10]}... Reason: {execution_details}")
                        await self.alert_system.trigger_alert('ARB_FAILURE', {'opportunity': opportunity, 'reason': execution_details})
                    if self.config.get('RL_ENABLED'):
                         try:
                             tx_hash_executed = execution_details.get('tx_hash') if execution_success else None
                             profit_achieved = execution_details.get('profit', 0) if execution_success else 0
                             update_results = self.classifier.update_from_execution(
                                 features, prediction, profit_achieved, execution_success
                             )
                             self.logger.info(f"ML/RL model update status: {update_results.get('status', 'unknown')}")
                         except Exception as ml_update_e:
                             self.logger.error(f"Error updating ML/RL model: {ml_update_e}", exc_info=True)
                else:
                    self.logger.info(f"Simulation not profitable or failed for {tx_hash[:10]}... Skipping execution.")
            except Exception as e:
                self.stats['errors'] += 1
                self.logger.error(f"Error processing opportunity {tx_hash[:10]}...: {e}", exc_info=True)
            finally:
                 self.opportunity_queue.task_done()
        self.logger.info("Opportunity processor task finished.")

    def _prepare_simulation_strategy(self, opportunity):
        sim_res = opportunity.get('simulation_result', {})
        if sim_res and 'swap_route' in sim_res:
             class SpecificRouteStrategy:
                 def __init__(self, route): self.route = route
                 def get_sequence(self): return self.route
             strategy = SpecificRouteStrategy(sim_res['swap_route'])
             params = {
                 'token_address': sim_res.get('token_in') or self._get_main_token(opportunity),
                 'loan_amount': sim_res.get('amount_in') or self._calculate_optimal_loan(opportunity),
                 'target_contracts': self._get_involved_contracts(sim_res['swap_route']),
                 'flashloan_provider': self.config.get('DEFAULT_FLASHLOAN_PROVIDER', 'aave')
             }
             return strategy, params
        elif opportunity.get('vulnerability_type') == 'oracle_manipulation':
             strategy = OracleManipulationStrategy()
        elif opportunity.get('vulnerability_type') == 'governance_attack':
             strategy = GovernanceAttackStrategy()
        elif opportunity.get('vulnerability_type') == 'liquidity_drain':
             strategy = LiquidityDrainStrategy()
        else:
             self.logger.warning(f"Unknown opportunity type for {opportunity.get('tx_hash')}. Using default strategy.")
             class DefaultArbitrageStrategy:
                  def get_sequence(self): return [{'action': 'find_arb_path'}]
             strategy = DefaultArbitrageStrategy()
        params = {
             'token_address': self._get_main_token(opportunity),
             'loan_amount': self._calculate_optimal_loan(opportunity),
             'target_contracts': [opportunity.get('contract_address')] if opportunity.get('contract_address') else [],
             'flashloan_provider': self.config.get('DEFAULT_FLASHLOAN_PROVIDER', 'aave')
         }
        return strategy, params

    def _get_involved_contracts(self, route):
          addresses = set()
          for step in route:
               if 'pool' in step: addresses.add(step['pool'])
               if 'contract' in step: addresses.add(step['contract'])
          return list(addresses)

    async def _execute_arbitrage(self, opportunity, sim_results):
        if not self.executor:
            return False, "Executor not available"
        try:
            exec_opportunity = {
                'token_address': sim_results.get('token_in', self._get_main_token(opportunity)),
                'loan_amount': sim_results.get('amount_in', self._calculate_optimal_loan(opportunity)),
                'target_contract': opportunity.get('contract_address', sim_results.get('target_contracts', [])[0]),
                'vulnerability_type': opportunity.get('vulnerability_type', 'arbitrage'),
                'estimated_profit': sim_results.get('profit', 0),
                'simulation_results': sim_results,
                'strategy_sequence': sim_results.get('attack_sequence', []),
                'gas_limit': self.config.get('GAS_LIMIT', 500000),
            }
            success, results = await self.executor.execute_arbitrage(exec_opportunity)
            if success:
                self.logger.info(f"Executor successful: {results}")
            else:
                self.logger.warning(f"Executor failed: {results}")
            return success, results
        except Exception as e:
            self.logger.error(f"Error during arbitrage execution: {e}", exc_info=True)
            self.stats['errors'] += 1
            return False, f"Execution exception: {str(e)}"

    def _get_watchlist(self):
        self.logger.warning("_get_watchlist is deprecated. Using ProtocolRegistry instead.")
        primary_chain_id = 1
        protocols_on_chain = self.protocol_registry.get_protocols_for_chain(primary_chain_id)
        addresses = []
        for name, data in protocols_on_chain.items():
             addresses.extend(data.get('contract_addresses', []))
        return addresses

    def _determine_vulnerability_type(self, results):
        if results.get('vulnerability_type'):
             return results['vulnerability_type']
        if any('oracle' in str(v).lower() for v in results.get('price_oracle_risks', [])):
            return 'oracle_manipulation'
        return 'generic_vulnerability'

    async def _estimate_profit(self, contract_address, results):
        self.logger.warning("_estimate_profit is a placeholder. Rely on simulation for profit estimates.")
        risk_score = results.get('risk_score', 0)
        return max(0, (risk_score - 50) / 100.0 * 0.5)

    def _extract_features(self, opportunity, analysis_results=None, sim_results=None):
        features = {}
        features['time_since_detection'] = time.time() - opportunity.get('timestamp', time.time())
        features['source'] = hash(opportunity.get('source', 'unknown'))
        if analysis_results:
             features['risk_score'] = analysis_results.get('risk_score', 0) / 100.0
             features['vulnerability_count'] = len(analysis_results.get('static_analysis', [])) + \
                                             len(analysis_results.get('price_oracle_risks', []))
        if sim_results:
            features['sim_success'] = 1.0 if sim_results.get('success') else 0.0
            features['sim_profit'] = sim_results.get('profit', 0)
            features['sim_gas_used'] = sim_results.get('gas_used', 0)
            features['sim_gas_used_normalized'] = features.get('sim_gas_used', 0) / 300000.0
            features['sim_pool_impact'] = sim_results.get('pool_impact', 0)
            features['sim_slippage'] = sim_results.get('slippage', 0)
            features['sim_protocols_count'] = len(sim_results.get('protocols', []))
        expected_feature_keys = self.config.get('ML_FEATURE_KEYS', ['sim_profit', 'sim_gas_used_normalized', 'risk_score'])
        final_features = {k: features.get(k, 0.0) for k in expected_feature_keys}
        feature_vector = [final_features[k] for k in expected_feature_keys]
        self.logger.debug(f"Extracted features: {dict(zip(expected_feature_keys, feature_vector))}")
        return feature_vector

    def _get_main_token(self, opportunity):
        return self.config.get('DEFAULT_LOAN_TOKEN', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    def _calculate_optimal_loan(self, opportunity):
        self.logger.warning("Using placeholder optimal loan amount.")
        return Web3.toWei(self.config.get('DEFAULT_LOAN_AMOUNT_ETH', 100), 'ether')

    def get_stats(self):
        run_time = time.time() - self.stats['start_time'] if self.stats['start_time'] else 0
        ops_per_hour = (self.stats['opportunities_detected'] / run_time * 3600) if run_time > 0 else 0
        success_rate = (self.stats['successful_transactions'] / self.stats['transactions_executed'] * 100) if self.stats['transactions_executed'] > 0 else 0
        avg_profit = (self.stats['total_profit_gross_eth'] / self.stats['successful_transactions']) if self.stats['successful_transactions'] > 0 else 0
        avg_gas = (self.stats['total_gas_spent_eth'] / self.stats['successful_transactions']) if self.stats['successful_transactions'] > 0 else 0
        net_profit = self.stats['total_profit_gross_eth'] - self.stats['total_gas_spent_eth']
        return {
            'running': self.running,
            'uptime_seconds': run_time,
            'opportunities_detected': self.stats['opportunities_detected'],
            'opportunities_processed': self.stats['opportunities_processed'],
            'current_queue_size': self.opportunity_queue.qsize(),
            'opportunities_per_hour': ops_per_hour,
            'simulations_run': self.stats['simulations_run'],
            'simulations_profitable': self.stats['simulations_profitable'],
            'transactions_executed': self.stats['transactions_executed'],
            'successful_transactions': self.stats['successful_transactions'],
            'failed_transactions': self.stats['failed_transactions'],
            'tx_success_rate_percent': success_rate,
            'total_profit_gross_eth': self.stats['total_profit_gross_eth'],
            'total_gas_spent_eth': self.stats['total_gas_spent_eth'],
            'total_profit_net_eth': net_profit,
            'average_profit_gross_eth': avg_profit,
            'average_gas_spent_eth': avg_gas,
            'errors': self.stats['errors'],
            'ml_model_episodes': self.classifier.rl_model.metrics.get('episodes', 0) if hasattr(self.classifier, 'rl_model') else 'N/A',
        }

    def log_final_stats(self):
        final_stats = self.get_stats()
        self.logger.info("----- Final Bot Statistics -----")
        for key, value in final_stats.items():
             if isinstance(value, float):
                 self.logger.info(f"{key}: {value:.6f}")
             else:
                  self.logger.info(f"{key}: {value}")
        self.logger.info("-------------------------------")

async def main():
    bot = FlashLoanArbitrageBot()
    await bot.start()
    last_stat_time = time.time()
    while bot.running:
        await asyncio.sleep(1)
        current_time = time.time()
        if current_time - last_stat_time >= 60:
            stats = bot.get_stats()
            print(f"--- Bot Stats @ {time.strftime('%Y-%m-%d %H:%M:%S')} ---")
            print(f"Uptime: {stats['uptime_seconds']:.2f}s | Queue: {stats['current_queue_size']} | Detected: {stats['opportunities_detected']} | Processed: {stats['opportunities_processed']}")
            print(f"Executed: {stats['transactions_executed']} | Success: {stats['successful_transactions']} ({stats['tx_success_rate_percent']:.2f}%) | Failed: {stats['failed_transactions']}")
            print(f"Gross Profit: {stats['total_profit_gross_eth']:.4f} ETH | Gas Spent: {stats['total_gas_spent_eth']:.4f} ETH | Net Profit: {stats['total_profit_net_eth']:.4f} ETH")
            print(f"Errors: {stats['errors']}")
            print(f"-------------------------------------")
            last_stat_time = current_time

if __name__ == "__main__":
    asyncio.run(main())
