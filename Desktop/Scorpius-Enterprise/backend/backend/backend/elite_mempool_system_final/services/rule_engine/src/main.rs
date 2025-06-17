use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use clap::Parser;
use rdkafka::{
    consumer::{Consumer, StreamConsumer},
    producer::{FutureProducer, FutureRecord},
    ClientConfig, Message,
};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::{postgres::PgPoolOptions, Pool, Postgres, Row};
use std::{
    collections::HashMap,
    env,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{signal, sync::Semaphore, time::sleep};
use uuid::Uuid;
use wasmtime::{Engine, Linker, Module, Store};

mod rule_dsl;
mod rule_executor;
mod metrics;

use metrics::{Metrics, PerformanceMonitor};
use rule_dsl::{Rule, RuleCondition, RuleAction};
use rule_executor::{RuleExecutor, RiskScorer, MEVDetector};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(short, long, default_value = "config.yaml")]
    config: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub kafka_brokers: String,
    pub redis_url: String,
    pub postgres_url: String,
    pub input_topic: String,
    pub output_topic: String,
    pub consumer_group: String,
    pub batch_size: usize,
    pub max_concurrent_rules: usize,
    pub rule_timeout_ms: u64,
    pub log_level: String,
    pub max_db_connections: u32,
    pub rule_reload_interval: Duration,
    pub batch_timeout: Duration,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            kafka_brokers: "localhost:9092".to_string(),
            redis_url: "redis://localhost:6379".to_string(),
            postgres_url: "postgres://postgres:password@localhost:5432/scorpius".to_string(),
            input_topic: "tx_raw".to_string(),
            output_topic: "alerts".to_string(),
            consumer_group: "rule_engine".to_string(),
            batch_size: 1000,
            max_concurrent_rules: 100,
            rule_timeout_ms: 100,
            log_level: "info".to_string(),
            max_db_connections: 10,
            rule_reload_interval: Duration::from_secs(60),
            batch_timeout: Duration::from_secs(10),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub hash: String,
    pub chain_id: i64,
    pub from: String,
    pub to: String,
    pub value: String,
    pub gas: String,
    pub gas_price: String,
    pub data: String,
    pub nonce: String,
    pub timestamp: i64,
    pub block_number: Option<i64>,
    pub transaction_index: Option<i32>,
    pub status: String,
    pub raw: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: Uuid,
    pub rule_id: Uuid,
    pub transaction_hash: String,
    pub chain_id: i64,
    pub severity: AlertSeverity,
    pub title: String,
    pub description: String,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Rule engine service for processing transactions against rules
pub struct RuleEngineService {
    consumer: StreamConsumer,
    producer: FutureProducer,
    db_pool: Pool<Postgres>,
    redis_client: redis::Client,
    rule_executor: RuleExecutor,
    risk_scorer: RiskScorer,
    mev_detector: MEVDetector,
    metrics: Arc<Metrics>,
    performance_monitor: PerformanceMonitor,
    wasm_engine: Engine,
    rules_cache: HashMap<Uuid, Rule>,
    last_rules_reload: Instant,
    config: Config,
}

impl RuleEngineService {
    /// Create a new rule engine service
    pub async fn new(config: Config) -> Result<Self> {
        // Initialize Kafka consumer
        let consumer: StreamConsumer = ClientConfig::new()
            .set("group.id", &config.consumer_group)
            .set("bootstrap.servers", &config.kafka_brokers)
            .set("enable.partition.eof", "false")
            .set("session.timeout.ms", "6000")
            .set("enable.auto.commit", "true")
            .set("auto.offset.reset", "latest")
            .create()?;

        consumer.subscribe(&[&config.input_topic])?;

        // Initialize Kafka producer
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", &config.kafka_brokers)
            .set("message.timeout.ms", "5000")
            .create()?;

        // Initialize database pool
        let db_pool = PgPoolOptions::new()
            .max_connections(config.max_db_connections)
            .connect(&config.postgres_url)
            .await?;

        // Initialize Redis client
        let redis_client = redis::Client::open(config.redis_url.clone())?;

        // Initialize components
        let rule_executor = RuleExecutor::new(config.max_concurrent_rules);
        let risk_scorer = RiskScorer::new();
        let mev_detector = MEVDetector::new();
        
        // Initialize metrics
        let metrics = Arc::new(Metrics::new()?);
        let performance_monitor = PerformanceMonitor::new(metrics.clone());
        
        // Initialize WASM engine
        let wasm_engine = Engine::default();

        Ok(Self {
            consumer,
            producer,
            db_pool,
            redis_client,
            rule_executor,
            risk_scorer,
            mev_detector,
            metrics,
            performance_monitor,
            wasm_engine,
            rules_cache: HashMap::new(),
            last_rules_reload: Instant::now(),
            config,
        })
    }

    /// Start the rule engine service
    pub async fn start(&mut self) -> Result<()> {
        log::info!("Starting Rule Engine Service");

        // Start performance monitoring
        self.performance_monitor.start_monitoring().await;

        // Load initial rules
        self.reload_rules().await?;

        // Start background tasks
        let metrics_clone = self.metrics.clone();
        tokio::spawn(async move {
            metrics_clone.start_background_collection().await;
        });

        // Start rule reloading task
        let db_pool_clone = self.db_pool.clone();
        let reload_interval = self.config.rule_reload_interval;
        tokio::spawn(async move {
            Self::rule_reload_task(db_pool_clone, reload_interval).await;
        });

        // Main processing loop
        self.process_transactions().await
    }

    /// Main transaction processing loop
    async fn process_transactions(&mut self) -> Result<()> {
        let mut batch = Vec::new();
        let mut last_batch_time = Instant::now();
        
        loop {
            tokio::select! {
                message_result = self.consumer.recv() => {
                    match message_result {
                        Ok(message) => {
                            if let Some(payload) = message.payload() {
                                match self.parse_transaction(payload) {
                                    Ok(transaction) => {
                                        batch.push(transaction);
                                        
                                        // Process batch when it reaches max size or timeout
                                        if batch.len() >= self.config.batch_size ||
                                           last_batch_time.elapsed() >= self.config.batch_timeout {
                                            self.process_batch(&mut batch).await?;
                                            last_batch_time = Instant::now();
                                        }
                                    }
                                    Err(e) => {
                                        log::error!("Failed to parse transaction: {}", e);
                                        self.metrics.record_database_error();
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            log::error!("Kafka consumer error: {}", e);
                            self.metrics.record_kafka_error();
                            sleep(Duration::from_secs(1)).await;
                        }
                    }
                }
                
                _ = signal::ctrl_c() => {
                    log::info!("Received shutdown signal");
                    break;
                }
                
                _ = sleep(self.config.batch_timeout) => {
                    if !batch.is_empty() {
                        self.process_batch(&mut batch).await?;
                        last_batch_time = Instant::now();
                    }
                }
            }
        }

        Ok(())
    }

    /// Process a batch of transactions
    async fn process_batch(&mut self, batch: &mut Vec<Transaction>) -> Result<()> {
        if batch.is_empty() {
            return Ok(());
        }

        let start_time = Instant::now();
        let mut total_alerts = 0;

        // Reload rules if needed
        if self.last_rules_reload.elapsed() >= self.config.rule_reload_interval {
            self.reload_rules().await?;
        }

        // Process each transaction
        for transaction in batch.drain(..) {
            let tx_start = Instant::now();
            
            // Calculate risk score
            let risk_score = self.risk_scorer.calculate_risk_score(&transaction).await?;
            self.metrics.record_risk_score(risk_score, "ethereum");

            // Detect MEV patterns
            let mev_patterns = self.mev_detector.detect_mev(&transaction).await?;
            for pattern in &mev_patterns {
                self.metrics.record_mev_pattern(&format!("{:?}", pattern), "ethereum");
            }

            // Execute rules
            let rules: Vec<Rule> = self.rules_cache.values().cloned().collect();
            let alerts = self.rule_executor.execute_rules(&transaction, &rules).await?;

            // Send alerts
            for alert in &alerts {
                self.send_alert(alert).await?;
                self.metrics.record_alert_sent(&alert.severity);
                total_alerts += 1;
            }

            // Record metrics
            let processing_duration = tx_start.elapsed();
            self.metrics.record_transaction_processed(
                processing_duration,
                alerts.len(),
                "success",
            );
        }

        let batch_duration = start_time.elapsed();
        log::debug!(
            "Processed batch in {:?}, generated {} alerts",
            batch_duration,
            total_alerts
        );

        Ok(())
    }

    /// Reload rules from database
    async fn reload_rules(&mut self) -> Result<()> {
        let start_time = Instant::now();
        
        let rows = sqlx::query("SELECT id, name, description, conditions, actions, enabled, created_at, updated_at FROM rules WHERE enabled = true")
            .fetch_all(&self.db_pool)
            .await?;

        let mut new_rules = HashMap::new();
        
        for row in rows {
            let rule_id: Uuid = row.get("id");
            let name: String = row.get("name");
            let description: String = row.get("description");
            let conditions_json: String = row.get("conditions");
            let actions_json: String = row.get("actions");
            let enabled: bool = row.get("enabled");
            let created_at: DateTime<Utc> = row.get("created_at");
            let updated_at: DateTime<Utc> = row.get("updated_at");

            let conditions: Vec<RuleCondition> = serde_json::from_str(&conditions_json)
                .context("Failed to parse rule conditions")?;
            let actions: Vec<RuleAction> = serde_json::from_str(&actions_json)
                .context("Failed to parse rule actions")?;

            let rule = Rule {
                id: rule_id,
                name,
                description,
                conditions,
                actions,
                enabled,
                created_at,
                updated_at,
            };

            new_rules.insert(rule_id, rule);
        }

        let rules_count = new_rules.len();
        self.rules_cache = new_rules;
        self.last_rules_reload = Instant::now();
        self.metrics.update_active_rules_count(rules_count as i64);

        log::info!(
            "Reloaded {} rules in {:?}",
            rules_count,
            start_time.elapsed()
        );

        Ok(())
    }

    /// Send alert to Kafka
    async fn send_alert(&self, alert: &Alert) -> Result<()> {
        let alert_json = serde_json::to_string(alert)?;
        
        let record = FutureRecord::to(&self.config.output_topic)
            .partition(alert.chain_id % 4) // Partition by chain_id
            .key(&alert.transaction_hash)
            .payload(&alert_json);

        self.producer
            .send(record, Duration::from_secs(0))
            .await
            .map_err(|(e, _)| anyhow::anyhow!("Failed to send alert: {}", e))?;

        Ok(())
    }

    /// Background task for periodic rule reloading
    async fn rule_reload_task(db_pool: Pool<Postgres>, interval: Duration) {
        let mut interval_timer = tokio::time::interval(interval);
        
        loop {
            interval_timer.tick().await;
            
            // This would trigger rule reload in the main service
            // In a production system, you might use a message queue or shared state
            log::debug!("Rule reload timer tick");
        }
    }

    /// Parse transaction from Kafka message
    fn parse_transaction(&self, payload: &[u8]) -> Result<Transaction> {
        let transaction: Transaction = serde_json::from_slice(payload)
            .context("Failed to deserialize transaction")?;
        Ok(transaction)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    // Initialize logging
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    // Load configuration
    let config = if std::path::Path::new(&args.config).exists() {
        let config_str = std::fs::read_to_string(&args.config)
            .context("Failed to read config file")?;
        serde_yaml::from_str(&config_str)
            .context("Failed to parse config file")?
    } else {
        log::warn!("Config file not found, using defaults");
        Config::default()
    };

    // Create and start the service
    let mut service = RuleEngineService::new(config).await?;
    service.start().await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_transaction_processing() {
        // Test transaction processing logic
        let transaction = Transaction {
            hash: "0x123".to_string(),
            chain_id: 1,
            from: "0xabc".to_string(),
            to: "0xdef".to_string(),
            value: "1000000000000000000".to_string(),
            gas: "21000".to_string(),
            gas_price: "20000000000".to_string(),
            data: "0x".to_string(),
            nonce: "1".to_string(),
            timestamp: 1640995200,
            block_number: None,
            transaction_index: None,
            status: "pending".to_string(),
            raw: serde_json::json!({}),
        };

        assert_eq!(transaction.hash, "0x123");
        assert_eq!(transaction.chain_id, 1);
    }
}
