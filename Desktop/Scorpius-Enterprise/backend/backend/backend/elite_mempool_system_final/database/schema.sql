-- Scorpius Mempool Elite Database Schema
-- PostgreSQL schema for all microservices

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===================================================================
-- CORE TABLES
-- ===================================================================

-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'analyst', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    api_key_hash VARCHAR(255)
);

-- API tokens for authentication
CREATE TABLE api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    expires_at TIMESTAMPTZ,
    last_used TIMESTAMPTZ,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Blockchain networks/chains
CREATE TABLE chains (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    rpc_url VARCHAR(500),
    ws_url VARCHAR(500),
    explorer_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    block_time_seconds INTEGER DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- TRANSACTION TABLES
-- ===================================================================

-- Raw transactions from mempool
CREATE TABLE transactions (
    hash VARCHAR(66) PRIMARY KEY,
    chain_id INTEGER NOT NULL REFERENCES chains(id),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value DECIMAL(78, 0) DEFAULT 0,
    gas BIGINT,
    gas_price DECIMAL(78, 0),
    max_fee_per_gas DECIMAL(78, 0),
    max_priority_fee_per_gas DECIMAL(78, 0),
    data TEXT,
    nonce BIGINT,
    type INTEGER DEFAULT 0,
    block_number BIGINT,
    block_hash VARCHAR(66),
    transaction_index INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'dropped')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    confirmation_time TIMESTAMPTZ
);

-- Create indexes for transactions table
CREATE INDEX idx_transactions_chain_timestamp ON transactions(chain_id, timestamp DESC);
CREATE INDEX idx_transactions_from_address ON transactions(from_address);
CREATE INDEX idx_transactions_to_address ON transactions(to_address);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_block_number ON transactions(block_number);

-- Transaction tags for categorization
CREATE TABLE transaction_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) NOT NULL REFERENCES transactions(hash) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    value VARCHAR(500),
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(transaction_hash, tag, source)
);

-- ===================================================================
-- RULE ENGINE TABLES
-- ===================================================================

-- Rule definitions
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    logic JSONB NOT NULL,
    wasm_code BYTEA,
    code_hash VARCHAR(64),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_executed TIMESTAMPTZ,
    execution_count BIGINT DEFAULT 0,
    match_count BIGINT DEFAULT 0,
    false_positive_count BIGINT DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}'
);

-- Create indexes for rules table
CREATE INDEX idx_rules_category ON rules(category);
CREATE INDEX idx_rules_severity ON rules(severity);
CREATE INDEX idx_rules_is_active ON rules(is_active);
CREATE INDEX idx_rules_created_at ON rules(created_at);

-- Rule conditions for complex logic
CREATE TABLE rule_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    field VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL CHECK (operator IN ('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'regex', 'in', 'not_in')),
    value TEXT NOT NULL,
    logic_operator VARCHAR(10) DEFAULT 'AND' CHECK (logic_operator IN ('AND', 'OR', 'NOT')),
    group_id INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0
);

-- Rule chains for complex workflows
CREATE TABLE rule_chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL, -- Array of rule IDs with execution order
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- ALERT TABLES
-- ===================================================================

-- Alerts generated by rules
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES rules(id),
    rule_chain_id UUID REFERENCES rule_chains(id),
    transaction_hash VARCHAR(66) NOT NULL REFERENCES transactions(hash),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    risk_score DECIMAL(4, 2) DEFAULT 0.0,
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for alerts table
CREATE INDEX idx_alerts_rule_id ON alerts(rule_id);
CREATE INDEX idx_alerts_transaction_hash ON alerts(transaction_hash);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_risk_score ON alerts(risk_score DESC);

-- Alert tags for categorization
CREATE TABLE alert_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    value VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(alert_id, tag)
);

-- ===================================================================
-- MEV DETECTION TABLES
-- ===================================================================

-- MEV opportunities detected
CREATE TABLE mev_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id INTEGER NOT NULL REFERENCES chains(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('arbitrage', 'sandwich', 'liquidation', 'frontrun', 'backrun')),
    profit_estimate DECIMAL(78, 0),
    gas_cost DECIMAL(78, 0),
    net_profit DECIMAL(78, 0),
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    block_number BIGINT,
    transaction_hashes TEXT[], -- Array of related transaction hashes
    mempool_position INTEGER,
    execution_window_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    executed BOOLEAN DEFAULT false,
    executed_at TIMESTAMPTZ
);

-- Create indexes for mev_opportunities table
CREATE INDEX idx_mev_opportunities_chain_detected ON mev_opportunities(chain_id, detected_at);
CREATE INDEX idx_mev_opportunities_type ON mev_opportunities(type);
CREATE INDEX idx_mev_opportunities_net_profit ON mev_opportunities(net_profit DESC);
CREATE INDEX idx_mev_opportunities_executed ON mev_opportunities(executed);

-- MEV bundle tracking
CREATE TABLE mev_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES mev_opportunities(id),
    bundle_hash VARCHAR(66),
    transactions JSONB NOT NULL, -- Array of transaction objects
    target_block BIGINT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'included', 'failed', 'reverted')),
    actual_profit DECIMAL(78, 0),
    gas_used BIGINT,
    miner_payment DECIMAL(78, 0)
);

-- ===================================================================
-- NOTIFICATION TABLES
-- ===================================================================

-- Notification channels configuration
CREATE TABLE notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'slack', 'discord', 'webhook', 'sms', 'telegram')),
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 100,
    severity_threshold VARCHAR(20) DEFAULT 'low' CHECK (severity_threshold IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('email', 'slack', 'discord', 'webhook', 'sms', 'telegram')),
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification delivery tracking
CREATE TABLE notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id),
    template_id UUID REFERENCES notification_templates(id),
    recipient VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'rate_limited')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notification_deliveries table
CREATE INDEX idx_notification_deliveries_alert_id ON notification_deliveries(alert_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);
CREATE INDEX idx_notification_deliveries_sent_at ON notification_deliveries(sent_at);

-- ===================================================================
-- ARCHIVE TABLES (Time Machine)
-- ===================================================================

-- Archive metadata for historical data
CREATE TABLE archive_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path VARCHAR(1000) NOT NULL UNIQUE,
    format VARCHAR(20) NOT NULL CHECK (format IN ('json', 'parquet', 'pickle')),
    compression VARCHAR(20) NOT NULL CHECK (compression IN ('gzip', 'lz4', 'zstd')),
    start_timestamp TIMESTAMPTZ NOT NULL,
    end_timestamp TIMESTAMPTZ NOT NULL,
    chain_id INTEGER NOT NULL REFERENCES chains(id),
    transaction_count BIGINT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for archive_metadata table
CREATE INDEX idx_archive_metadata_time_range ON archive_metadata(start_timestamp, end_timestamp);
CREATE INDEX idx_archive_metadata_chain_id ON archive_metadata(chain_id);
CREATE INDEX idx_archive_metadata_created_at ON archive_metadata(created_at);

-- ===================================================================
-- ANALYTICS TABLES
-- ===================================================================

-- Daily statistics
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    chain_id INTEGER NOT NULL REFERENCES chains(id),
    transaction_count BIGINT DEFAULT 0,
    alert_count BIGINT DEFAULT 0,
    mev_opportunity_count BIGINT DEFAULT 0,
    total_mev_profit DECIMAL(78, 0) DEFAULT 0,
    avg_gas_price DECIMAL(78, 0) DEFAULT 0,
    avg_block_time DECIMAL(8, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, chain_id)
);

-- Performance metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(20, 6) NOT NULL,
    labels JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance_metrics table
CREATE INDEX idx_performance_metrics_service_metric ON performance_metrics(service_name, metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- ===================================================================
-- SYSTEM TABLES
-- ===================================================================

-- System configuration
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit_log table
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- ===================================================================
-- FUNCTIONS AND TRIGGERS
-- ===================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_channels_updated_at BEFORE UPDATE ON notification_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rule_chains_updated_at BEFORE UPDATE ON rule_chains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ===================================================================

-- Compound indexes for common queries
CREATE INDEX idx_alerts_rule_timestamp ON alerts(rule_id, created_at DESC);
CREATE INDEX idx_alerts_severity_timestamp ON alerts(severity, created_at DESC);
CREATE INDEX idx_notification_deliveries_status_created ON notification_deliveries(status, created_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_transactions_raw_data_gin ON transactions USING GIN (raw_data);
CREATE INDEX idx_alerts_metadata_gin ON alerts USING GIN (metadata);
CREATE INDEX idx_rules_logic_gin ON rules USING GIN (logic);
CREATE INDEX idx_mev_opportunities_metadata_gin ON mev_opportunities USING GIN (metadata);

-- Text search indexes
CREATE INDEX idx_rules_name_description_trgm ON rules USING GIN (name gin_trgm_ops, description gin_trgm_ops);
CREATE INDEX idx_alerts_title_description_trgm ON alerts USING GIN (title gin_trgm_ops, description gin_trgm_ops);

-- ===================================================================
-- VIEWS
-- ===================================================================

-- Alert summary view
CREATE VIEW alert_summary AS
SELECT 
    DATE(created_at) as date,
    severity,
    COUNT(*) as alert_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN status = 'false_positive' THEN 1 END) as false_positive_count,
    AVG(risk_score) as avg_risk_score
FROM alerts
GROUP BY DATE(created_at), severity
ORDER BY date DESC, severity;

-- Rule performance view
CREATE VIEW rule_performance AS
SELECT 
    r.id,
    r.name,
    r.category,
    r.execution_count,
    r.match_count,
    r.false_positive_count,
    CASE WHEN r.match_count > 0 
         THEN ROUND((r.false_positive_count::DECIMAL / r.match_count) * 100, 2)
         ELSE 0 END as false_positive_rate,
    COUNT(a.id) as total_alerts,
    AVG(a.risk_score) as avg_risk_score
FROM rules r
LEFT JOIN alerts a ON r.id = a.rule_id
GROUP BY r.id, r.name, r.category, r.execution_count, r.match_count, r.false_positive_count
ORDER BY r.match_count DESC;

-- MEV profit summary view
CREATE VIEW mev_profit_summary AS
SELECT 
    DATE(detected_at) as date,
    chain_id,
    type,
    COUNT(*) as opportunity_count,
    COUNT(CASE WHEN executed THEN 1 END) as executed_count,
    SUM(profit_estimate) as total_profit_estimate,
    SUM(CASE WHEN executed THEN actual_profit ELSE 0 END) as total_actual_profit
FROM mev_opportunities mo
LEFT JOIN mev_bundles mb ON mo.id = mb.opportunity_id
GROUP BY DATE(detected_at), chain_id, type
ORDER BY date DESC, total_actual_profit DESC;

-- ===================================================================
-- SEED DATA
-- ===================================================================

-- Insert default chains
INSERT INTO chains (id, name, symbol, rpc_url, is_active) VALUES
(1, 'Ethereum Mainnet', 'ETH', 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID', true),
(137, 'Polygon', 'MATIC', 'https://polygon-rpc.com', true),
(56, 'BSC', 'BNB', 'https://bsc-dataseed.binance.org', true),
(43114, 'Avalanche', 'AVAX', 'https://api.avax.network/ext/bc/C/rpc', true),
(42161, 'Arbitrum One', 'ETH', 'https://arb1.arbitrum.io/rpc', true),
(10, 'Optimism', 'ETH', 'https://mainnet.optimism.io', true);

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('max_alert_retention_days', '90', 'Maximum number of days to retain alerts'),
('default_rate_limit_per_hour', '1000', 'Default rate limit for notifications per hour'),
('mev_detection_enabled', 'true', 'Enable MEV detection features'),
('archive_interval_hours', '24', 'Interval for creating archive files'),
('max_concurrent_rules', '100', 'Maximum number of rules that can execute concurrently');

-- Insert default notification templates
INSERT INTO notification_templates (name, channel_type, subject_template, body_template, is_default) VALUES
('Default Email Alert', 'email', 
 '🚨 Scorpius Alert: {{ alert.title }}',
 '<h2>Scorpius Mempool Alert</h2><p><strong>Severity:</strong> {{ alert.severity }}</p><p><strong>Description:</strong> {{ alert.description }}</p><p><strong>Transaction:</strong> <a href="https://etherscan.io/tx/{{ alert.transaction_hash }}">{{ alert.transaction_hash }}</a></p>',
 true),
('Default Slack Alert', 'slack',
 'Scorpius Alert',
 '🚨 *{{ alert.title }}*\nSeverity: {{ alert.severity }}\nTransaction: {{ alert.transaction_hash }}\nDescription: {{ alert.description }}',
 true);
