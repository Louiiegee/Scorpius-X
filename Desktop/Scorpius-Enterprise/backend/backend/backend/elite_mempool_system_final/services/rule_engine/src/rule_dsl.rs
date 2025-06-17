use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub conditions: Vec<RuleCondition>,
    pub actions: Vec<RuleAction>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RuleCondition {
    ValueComparison {
        field: String,
        operator: ComparisonOperator,
        value: serde_json::Value,
    },
    AddressMatch {
        field: String,
        addresses: Vec<String>,
    },
    ContractCall {
        contract_address: String,
        function_signature: String,
        parameters: Option<serde_json::Value>,
    },
    GasAnalysis {
        min_gas_price: Option<String>,
        max_gas_price: Option<String>,
        gas_limit_threshold: Option<String>,
    },
    ValueThreshold {
        field: String,
        min_value: Option<String>,
        max_value: Option<String>,
    },
    TimeWindow {
        start_time: Option<DateTime<Utc>>,
        end_time: Option<DateTime<Utc>>,
        duration_seconds: Option<i64>,
    },
    ChainFilter {
        chain_ids: Vec<i64>,
    },
    MEVDetection {
        sandwich_attack: bool,
        frontrun_detection: bool,
        backrun_detection: bool,
        arbitrage_detection: bool,
    },
    PatternMatch {
        field: String,
        pattern: String,
        regex: bool,
    },
    Custom {
        wasm_code: String,
        parameters: serde_json::Value,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComparisonOperator {
    Equal,
    NotEqual,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
    Contains,
    StartsWith,
    EndsWith,
    In,
    NotIn,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RuleAction {
    CreateAlert {
        severity: crate::AlertSeverity,
        title: String,
        description: String,
        tags: Vec<String>,
        metadata: serde_json::Value,
    },
    SendNotification {
        channels: Vec<NotificationChannel>,
        message: String,
        priority: NotificationPriority,
    },
    StoreInDatabase {
        table: String,
        data: serde_json::Value,
    },
    CallWebhook {
        url: String,
        method: String,
        headers: serde_json::Value,
        body: serde_json::Value,
    },
    UpdateWatchlist {
        action: WatchlistAction,
        addresses: Vec<String>,
    },
    Custom {
        wasm_code: String,
        parameters: serde_json::Value,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationChannel {
    Slack { webhook_url: String },
    Discord { webhook_url: String },
    Email { to: Vec<String> },
    Telegram { chat_id: String },
    Webhook { url: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationPriority {
    Low,
    Normal,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WatchlistAction {
    Add,
    Remove,
    Update,
}

impl Rule {
    /// Check if the rule should be applied to a transaction
    pub fn should_apply(&self, transaction: &crate::Transaction) -> bool {
        if !self.enabled {
            return false;
        }

        // Evaluate all conditions
        self.conditions.iter().all(|condition| {
            condition.evaluate(transaction)
        })
    }
}

impl RuleCondition {
    /// Evaluate a condition against a transaction
    pub fn evaluate(&self, transaction: &crate::Transaction) -> bool {
        match self {
            RuleCondition::ValueComparison { field, operator, value } => {
                self.evaluate_value_comparison(transaction, field, operator, value)
            }
            RuleCondition::AddressMatch { field, addresses } => {
                self.evaluate_address_match(transaction, field, addresses)
            }
            RuleCondition::ContractCall { contract_address, function_signature, parameters: _ } => {
                self.evaluate_contract_call(transaction, contract_address, function_signature)
            }
            RuleCondition::GasAnalysis { min_gas_price, max_gas_price, gas_limit_threshold } => {
                self.evaluate_gas_analysis(transaction, min_gas_price, max_gas_price, gas_limit_threshold)
            }
            RuleCondition::ValueThreshold { field, min_value, max_value } => {
                self.evaluate_value_threshold(transaction, field, min_value, max_value)
            }
            RuleCondition::TimeWindow { start_time, end_time, duration_seconds: _ } => {
                self.evaluate_time_window(transaction, start_time, end_time)
            }
            RuleCondition::ChainFilter { chain_ids } => {
                chain_ids.contains(&transaction.chain_id)
            }
            RuleCondition::MEVDetection { sandwich_attack: _, frontrun_detection: _, backrun_detection: _, arbitrage_detection: _ } => {
                // MEV detection logic would be implemented here
                // For now, return false as placeholder
                false
            }
            RuleCondition::PatternMatch { field, pattern, regex } => {
                self.evaluate_pattern_match(transaction, field, pattern, *regex)
            }
            RuleCondition::Custom { wasm_code: _, parameters: _ } => {
                // Custom WASM execution would be implemented here
                // For now, return false as placeholder
                false
            }
        }
    }

    fn evaluate_value_comparison(
        &self,
        transaction: &crate::Transaction,
        field: &str,
        operator: &ComparisonOperator,
        value: &serde_json::Value,
    ) -> bool {
        let field_value = self.get_field_value(transaction, field);
        
        match operator {
            ComparisonOperator::Equal => field_value == *value,
            ComparisonOperator::NotEqual => field_value != *value,
            ComparisonOperator::GreaterThan => {
                self.compare_numeric(&field_value, value, |a, b| a > b)
            }
            ComparisonOperator::LessThan => {
                self.compare_numeric(&field_value, value, |a, b| a < b)
            }
            ComparisonOperator::GreaterThanOrEqual => {
                self.compare_numeric(&field_value, value, |a, b| a >= b)
            }
            ComparisonOperator::LessThanOrEqual => {
                self.compare_numeric(&field_value, value, |a, b| a <= b)
            }
            ComparisonOperator::Contains => {
                if let (Some(haystack), Some(needle)) = (field_value.as_str(), value.as_str()) {
                    haystack.contains(needle)
                } else {
                    false
                }
            }
            ComparisonOperator::StartsWith => {
                if let (Some(haystack), Some(needle)) = (field_value.as_str(), value.as_str()) {
                    haystack.starts_with(needle)
                } else {
                    false
                }
            }
            ComparisonOperator::EndsWith => {
                if let (Some(haystack), Some(needle)) = (field_value.as_str(), value.as_str()) {
                    haystack.ends_with(needle)
                } else {
                    false
                }
            }
            ComparisonOperator::In => {
                if let Some(array) = value.as_array() {
                    array.contains(&field_value)
                } else {
                    false
                }
            }
            ComparisonOperator::NotIn => {
                if let Some(array) = value.as_array() {
                    !array.contains(&field_value)
                } else {
                    true
                }
            }
        }
    }

    fn evaluate_address_match(
        &self,
        transaction: &crate::Transaction,
        field: &str,
        addresses: &[String],
    ) -> bool {
        let field_value = self.get_field_value(transaction, field);
        
        if let Some(address) = field_value.as_str() {
            addresses.iter().any(|addr| {
                addr.to_lowercase() == address.to_lowercase()
            })
        } else {
            false
        }
    }

    fn evaluate_contract_call(
        &self,
        transaction: &crate::Transaction,
        contract_address: &str,
        function_signature: &str,
    ) -> bool {
        // Check if transaction is to the specified contract
        if transaction.to.to_lowercase() != contract_address.to_lowercase() {
            return false;
        }

        // Check if the transaction data starts with the function signature
        if transaction.data.len() >= 10 {
            let sig = &transaction.data[0..10];
            return sig == function_signature;
        }

        false
    }

    fn evaluate_gas_analysis(
        &self,
        transaction: &crate::Transaction,
        min_gas_price: &Option<String>,
        max_gas_price: &Option<String>,
        gas_limit_threshold: &Option<String>,
    ) -> bool {
        // Parse gas price
        let gas_price = if let Ok(price) = transaction.gas_price.parse::<u64>() {
            price
        } else {
            return false;
        };

        // Check minimum gas price
        if let Some(min_price_str) = min_gas_price {
            if let Ok(min_price) = min_price_str.parse::<u64>() {
                if gas_price < min_price {
                    return false;
                }
            }
        }

        // Check maximum gas price
        if let Some(max_price_str) = max_gas_price {
            if let Ok(max_price) = max_price_str.parse::<u64>() {
                if gas_price > max_price {
                    return false;
                }
            }
        }

        // Check gas limit threshold
        if let Some(threshold_str) = gas_limit_threshold {
            if let Ok(threshold) = threshold_str.parse::<u64>() {
                if let Ok(gas_limit) = transaction.gas.parse::<u64>() {
                    if gas_limit < threshold {
                        return false;
                    }
                }
            }
        }

        true
    }

    fn evaluate_value_threshold(
        &self,
        transaction: &crate::Transaction,
        field: &str,
        min_value: &Option<String>,
        max_value: &Option<String>,
    ) -> bool {
        let field_value = self.get_field_value(transaction, field);
        
        if let Some(value_str) = field_value.as_str() {
            if let Ok(value) = value_str.parse::<u128>() {
                if let Some(min_str) = min_value {
                    if let Ok(min) = min_str.parse::<u128>() {
                        if value < min {
                            return false;
                        }
                    }
                }

                if let Some(max_str) = max_value {
                    if let Ok(max) = max_str.parse::<u128>() {
                        if value > max {
                            return false;
                        }
                    }
                }

                return true;
            }
        }

        false
    }

    fn evaluate_time_window(
        &self,
        transaction: &crate::Transaction,
        start_time: &Option<DateTime<Utc>>,
        end_time: &Option<DateTime<Utc>>,
    ) -> bool {
        let tx_time = DateTime::<Utc>::from_timestamp(transaction.timestamp, 0);
        
        if let Some(tx_datetime) = tx_time {
            if let Some(start) = start_time {
                if tx_datetime < *start {
                    return false;
                }
            }

            if let Some(end) = end_time {
                if tx_datetime > *end {
                    return false;
                }
            }

            return true;
        }

        false
    }

    fn evaluate_pattern_match(
        &self,
        transaction: &crate::Transaction,
        field: &str,
        pattern: &str,
        is_regex: bool,
    ) -> bool {
        let field_value = self.get_field_value(transaction, field);
        
        if let Some(value_str) = field_value.as_str() {
            if is_regex {
                if let Ok(regex) = regex::Regex::new(pattern) {
                    return regex.is_match(value_str);
                }
            } else {
                return value_str.contains(pattern);
            }
        }

        false
    }

    fn get_field_value(&self, transaction: &crate::Transaction, field: &str) -> serde_json::Value {
        match field {
            "hash" => serde_json::Value::String(transaction.hash.clone()),
            "from" => serde_json::Value::String(transaction.from.clone()),
            "to" => serde_json::Value::String(transaction.to.clone()),
            "value" => serde_json::Value::String(transaction.value.clone()),
            "gas" => serde_json::Value::String(transaction.gas.clone()),
            "gas_price" => serde_json::Value::String(transaction.gas_price.clone()),
            "data" => serde_json::Value::String(transaction.data.clone()),
            "nonce" => serde_json::Value::String(transaction.nonce.clone()),
            "chain_id" => serde_json::Value::Number(transaction.chain_id.into()),
            "timestamp" => serde_json::Value::Number(transaction.timestamp.into()),
            "status" => serde_json::Value::String(transaction.status.clone()),
            _ => {
                // Try to get from raw data
                transaction.raw.get(field).cloned().unwrap_or(serde_json::Value::Null)
            }
        }
    }

    fn compare_numeric<F>(&self, a: &serde_json::Value, b: &serde_json::Value, op: F) -> bool
    where
        F: Fn(f64, f64) -> bool,
    {
        match (a.as_f64(), b.as_f64()) {
            (Some(a_num), Some(b_num)) => op(a_num, b_num),
            _ => {
                // Try string comparison for large numbers
                if let (Some(a_str), Some(b_str)) = (a.as_str(), b.as_str()) {
                    if let (Ok(a_big), Ok(b_big)) = (a_str.parse::<u128>(), b_str.parse::<u128>()) {
                        return op(a_big as f64, b_big as f64);
                    }
                }
                false
            }
        }
    }
}
