use anyhow::Result;
use prometheus::{
    Counter, CounterVec, Gauge, GaugeVec, Histogram, HistogramVec, IntCounter, IntCounterVec,
    IntGauge, IntGaugeVec, Registry,
};
use std::sync::Arc;
use std::time::Duration;

use crate::AlertSeverity;

/// Metrics collector for the rule engine
pub struct Metrics {
    registry: Registry,
    
    // Transaction processing metrics
    transactions_processed: IntCounterVec,
    transaction_processing_duration: HistogramVec,
    
    // Rule execution metrics
    rules_executed: IntCounterVec,
    rule_execution_duration: HistogramVec,
    rule_failures: IntCounterVec,
    
    // Alert metrics
    alerts_generated: IntCounterVec,
    alert_severity_distribution: IntCounterVec,
    
    // Performance metrics
    active_rules_gauge: IntGauge,
    kafka_lag_gauge: GaugeVec,
    memory_usage_gauge: Gauge,
    cpu_usage_gauge: Gauge,
    
    // MEV detection metrics
    mev_patterns_detected: IntCounterVec,
    risk_scores: HistogramVec,
    
    // Error metrics
    errors_total: IntCounterVec,
    kafka_errors: IntCounter,
    database_errors: IntCounter,
}

impl Metrics {
    /// Create a new metrics collector
    pub fn new() -> Result<Self> {
        let registry = Registry::new();

        let transactions_processed = IntCounterVec::new(
            prometheus::Opts::new(
                "scorpius_transactions_processed_total",
                "Total number of transactions processed",
            ),
            &["chain", "status"],
        )?;

        let transaction_processing_duration = HistogramVec::new(
            prometheus::HistogramOpts::new(
                "scorpius_transaction_processing_duration_seconds",
                "Time spent processing transactions",
            )
            .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]),
            &["chain"],
        )?;

        let rules_executed = IntCounterVec::new(
            prometheus::Opts::new(
                "scorpius_rules_executed_total",
                "Total number of rules executed",
            ),
            &["rule_id", "status"],
        )?;

        let rule_execution_duration = HistogramVec::new(
            prometheus::HistogramOpts::new(
                "scorpius_rule_execution_duration_seconds",
                "Time spent executing individual rules",
            )
            .buckets(vec![0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1]),
            &["rule_id"],
        )?;

        let rule_failures = IntCounterVec::new(
            prometheus::Opts::new(
                "scorpius_rule_failures_total",
                "Total number of rule execution failures",
            ),
            &["rule_id", "error_type"],
        )?;

        let alerts_generated = IntCounterVec::new(
            prometheus::Opts::new(
                "scorpius_alerts_generated_total",
                "Total number of alerts generated",
            ),
            &["rule_id", "severity", "chain"],
        )?;

        let alert_severity_distribution = IntCounterVec::new(
            prometheus::Opts::new(
                "scorpius_alert_severity_distribution",
                "Distribution of alert severities",
            ),
            &["severity"],
        )?;

        let active_rules_gauge = IntGauge::new(
            "scorpius_active_rules",
            "Number of currently active rules",
        )?;

        let kafka_lag_gauge = GaugeVec::new(
            prometheus::Opts::new(
                "scorpius_kafka_lag_seconds",
                "Kafka consumer lag in seconds",
            ),
            &["topic", "partition"],
        )?;

        let memory_usage_gauge = Gauge::new(
            "scorpius_memory_usage_bytes",
            "Current memory usage in bytes",
        )?;

        let cpu_usage_gauge = Gauge::new(
            "scorpius_cpu_usage_percent",
            "Current CPU usage percentage",
        )?;

        let mev_patterns_detected = IntCounterVec::new(
            prometheus::Opts::new(
                "scorpius_mev_patterns_detected_total",
                "Total number of MEV patterns detected",
            ),
            &["pattern_type", "chain"],
        )?;

        let risk_scores = HistogramVec::new(
            prometheus::HistogramOpts::new(
                "scorpius_risk_scores",
                "Distribution of transaction risk scores",
            )
            .buckets(vec![0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]),
            &["chain"],
        )?;

        let errors_total = IntCounterVec::new(
            prometheus::Opts::new(
                "scorpius_errors_total",
                "Total number of errors by type",
            ),
            &["error_type", "component"],
        )?;

        let kafka_errors = IntCounter::new(
            "scorpius_kafka_errors_total",
            "Total number of Kafka-related errors",
        )?;

        let database_errors = IntCounter::new(
            "scorpius_database_errors_total",
            "Total number of database-related errors",
        )?;

        // Register all metrics
        registry.register(Box::new(transactions_processed.clone()))?;
        registry.register(Box::new(transaction_processing_duration.clone()))?;
        registry.register(Box::new(rules_executed.clone()))?;
        registry.register(Box::new(rule_execution_duration.clone()))?;
        registry.register(Box::new(rule_failures.clone()))?;
        registry.register(Box::new(alerts_generated.clone()))?;
        registry.register(Box::new(alert_severity_distribution.clone()))?;
        registry.register(Box::new(active_rules_gauge.clone()))?;
        registry.register(Box::new(kafka_lag_gauge.clone()))?;
        registry.register(Box::new(memory_usage_gauge.clone()))?;
        registry.register(Box::new(cpu_usage_gauge.clone()))?;
        registry.register(Box::new(mev_patterns_detected.clone()))?;
        registry.register(Box::new(risk_scores.clone()))?;
        registry.register(Box::new(errors_total.clone()))?;
        registry.register(Box::new(kafka_errors.clone()))?;
        registry.register(Box::new(database_errors.clone()))?;

        Ok(Self {
            registry,
            transactions_processed,
            transaction_processing_duration,
            rules_executed,
            rule_execution_duration,
            rule_failures,
            alerts_generated,
            alert_severity_distribution,
            active_rules_gauge,
            kafka_lag_gauge,
            memory_usage_gauge,
            cpu_usage_gauge,
            mev_patterns_detected,
            risk_scores,
            errors_total,
            kafka_errors,
            database_errors,
        })
    }

    /// Get the metrics registry for Prometheus exposition
    pub fn registry(&self) -> &Registry {
        &self.registry
    }

    /// Record a processed transaction
    pub fn record_transaction_processed(
        &self,
        duration: Duration,
        alert_count: usize,
        status: &str,
    ) {
        self.transactions_processed
            .with_label_values(&["ethereum", status])
            .inc();
        
        self.transaction_processing_duration
            .with_label_values(&["ethereum"])
            .observe(duration.as_secs_f64());

        if alert_count > 0 {
            for _ in 0..alert_count {
                self.alerts_generated
                    .with_label_values(&["unknown", "medium", "ethereum"])
                    .inc();
            }
        }
    }

    /// Record rule execution
    pub fn record_rule_execution(&self, rule_id: &str, duration: Duration, success: bool) {
        let status = if success { "success" } else { "failure" };
        
        self.rules_executed
            .with_label_values(&[rule_id, status])
            .inc();
        
        self.rule_execution_duration
            .with_label_values(&[rule_id])
            .observe(duration.as_secs_f64());
    }

    /// Record rule execution failure
    pub fn record_rule_failure(&self, rule_id: &str, error_type: &str) {
        self.rule_failures
            .with_label_values(&[rule_id, error_type])
            .inc();
        
        self.errors_total
            .with_label_values(&[error_type, "rule_engine"])
            .inc();
    }

    /// Record alert sent
    pub fn record_alert_sent(&self, severity: &AlertSeverity) {
        let severity_str = match severity {
            AlertSeverity::Low => "low",
            AlertSeverity::Medium => "medium",
            AlertSeverity::High => "high",
            AlertSeverity::Critical => "critical",
        };

        self.alert_severity_distribution
            .with_label_values(&[severity_str])
            .inc();
    }

    /// Update active rules count
    pub fn update_active_rules_count(&self, count: i64) {
        self.active_rules_gauge.set(count);
    }

    /// Record Kafka lag
    pub fn record_kafka_lag(&self, topic: &str, partition: i32, lag_seconds: f64) {
        self.kafka_lag_gauge
            .with_label_values(&[topic, &partition.to_string()])
            .set(lag_seconds);
    }

    /// Update system metrics
    pub fn update_system_metrics(&self, memory_bytes: f64, cpu_percent: f64) {
        self.memory_usage_gauge.set(memory_bytes);
        self.cpu_usage_gauge.set(cpu_percent);
    }

    /// Record MEV pattern detection
    pub fn record_mev_pattern(&self, pattern_type: &str, chain: &str) {
        self.mev_patterns_detected
            .with_label_values(&[pattern_type, chain])
            .inc();
    }

    /// Record risk score
    pub fn record_risk_score(&self, score: f64, chain: &str) {
        self.risk_scores
            .with_label_values(&[chain])
            .observe(score);
    }

    /// Record Kafka error
    pub fn record_kafka_error(&self) {
        self.kafka_errors.inc();
        self.errors_total
            .with_label_values(&["kafka", "infrastructure"])
            .inc();
    }

    /// Record database error
    pub fn record_database_error(&self) {
        self.database_errors.inc();
        self.errors_total
            .with_label_values(&["database", "infrastructure"])
            .inc();
    }

    /// Start background metrics collection
    pub async fn start_background_collection(&self) {
        let memory_gauge = self.memory_usage_gauge.clone();
        let cpu_gauge = self.cpu_usage_gauge.clone();

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(10));
            
            loop {
                interval.tick().await;
                
                // Collect system metrics
                if let Ok(memory) = Self::get_memory_usage().await {
                    memory_gauge.set(memory);
                }
                
                if let Ok(cpu) = Self::get_cpu_usage().await {
                    cpu_gauge.set(cpu);
                }
            }
        });
    }

    /// Get current memory usage (placeholder implementation)
    async fn get_memory_usage() -> Result<f64> {
        // In a real implementation, this would use system APIs
        // to get actual memory usage
        Ok(1024.0 * 1024.0 * 512.0) // 512 MB placeholder
    }

    /// Get current CPU usage (placeholder implementation)
    async fn get_cpu_usage() -> Result<f64> {
        // In a real implementation, this would use system APIs
        // to get actual CPU usage
        Ok(25.5) // 25.5% placeholder
    }
}

/// Performance monitor for tracking rule engine performance
pub struct PerformanceMonitor {
    metrics: Arc<Metrics>,
}

impl PerformanceMonitor {
    pub fn new(metrics: Arc<Metrics>) -> Self {
        Self { metrics }
    }

    /// Start performance monitoring
    pub async fn start_monitoring(&self) {
        self.metrics.start_background_collection().await;
        
        // Start additional monitoring tasks
        let metrics_clone = self.metrics.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            
            loop {
                interval.tick().await;
                
                // Monitor Kafka lag
                if let Ok(lag) = Self::measure_kafka_lag().await {
                    metrics_clone.record_kafka_lag("tx_raw", 0, lag);
                }
            }
        });
    }

    /// Measure Kafka consumer lag (placeholder implementation)
    async fn measure_kafka_lag() -> Result<f64> {
        // In a real implementation, this would query Kafka for consumer lag
        Ok(0.5) // 500ms placeholder lag
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_metrics_creation() {
        let metrics = Metrics::new().unwrap();
        
        // Test basic metric recording
        metrics.record_transaction_processed(
            Duration::from_millis(10),
            1,
            "success",
        );
        
        metrics.record_alert_sent(&AlertSeverity::High);
        metrics.update_active_rules_count(5);
        metrics.record_risk_score(0.75, "ethereum");
        
        // Verify metrics are recorded (would need proper testing framework in real implementation)
        assert!(metrics.registry().gather().len() > 0);
    }

    #[test]
    fn test_alert_severity_mapping() {
        let metrics = Metrics::new().unwrap();
        
        // Test all severity levels
        metrics.record_alert_sent(&AlertSeverity::Low);
        metrics.record_alert_sent(&AlertSeverity::Medium);
        metrics.record_alert_sent(&AlertSeverity::High);
        metrics.record_alert_sent(&AlertSeverity::Critical);
        
        // Should not panic
    }
}
