package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/gorilla/websocket"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/redis/go-redis/v9"
)

// Metrics
var (
	txIngested = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "scorpius_tx_ingested_total",
			Help: "The total number of transactions ingested",
		},
		[]string{"chain", "status"},
	)
	
	endpointHealth = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "scorpius_endpoint_health_score",
			Help: "Health score of RPC endpoints (0-1)",
		},
		[]string{"chain", "endpoint"},
	)
	
	connectionLatency = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "scorpius_connection_latency_seconds",
			Help: "Connection latency to RPC endpoints",
		},
		[]string{"chain", "endpoint"},
	)
)

// Configuration struct
type Config struct {
	KafkaBrokers     string
	RedisURL         string
	ChainEndpoints   map[string][]string
	BatchSize        int
	FlushIntervalMS  int
	MaxConnections   int
	LogLevel         string
}

// Transaction represents a blockchain transaction
type Transaction struct {
	Hash             string                 `json:"hash"`
	ChainID          int64                  `json:"chain_id"`
	From             string                 `json:"from"`
	To               string                 `json:"to"`
	Value            string                 `json:"value"`
	Gas              string                 `json:"gas"`
	GasPrice         string                 `json:"gas_price"`
	Data             string                 `json:"data"`
	Nonce            string                 `json:"nonce"`
	Timestamp        int64                  `json:"timestamp"`
	BlockNumber      *int64                 `json:"block_number,omitempty"`
	TransactionIndex *int                   `json:"transaction_index,omitempty"`
	Status           string                 `json:"status"` // "pending", "confirmed", "failed"
	Raw              map[string]interface{} `json:"raw"`
}

// ChainMonitor manages connections for a specific blockchain
type ChainMonitor struct {
	chainName    string
	chainID      int64
	endpoints    []string
	activeConn   *websocket.Conn
	producer     *kafka.Producer
	redisClient  *redis.Client
	ctx          context.Context
	cancel       context.CancelFunc
	mu           sync.RWMutex
	healthScores map[string]float64
	lastSeen     map[string]time.Time
}

// NewChainMonitor creates a new chain monitor
func NewChainMonitor(chainName string, chainID int64, endpoints []string, producer *kafka.Producer, redisClient *redis.Client) *ChainMonitor {
	ctx, cancel := context.WithCancel(context.Background())
	
	return &ChainMonitor{
		chainName:    chainName,
		chainID:      chainID,
		endpoints:    endpoints,
		producer:     producer,
		redisClient:  redisClient,
		ctx:          ctx,
		cancel:       cancel,
		healthScores: make(map[string]float64),
		lastSeen:     make(map[string]time.Time),
	}
}

// Start begins monitoring the blockchain
func (cm *ChainMonitor) Start() error {
	log.Printf("Starting monitor for %s (chain_id: %d)", cm.chainName, cm.chainID)
	
	// Initialize health scores
	for _, endpoint := range cm.endpoints {
		cm.healthScores[endpoint] = 1.0
		cm.lastSeen[endpoint] = time.Now()
	}
	
	go cm.monitorLoop()
	go cm.healthCheckLoop()
	
	return nil
}

// Stop stops the chain monitor
func (cm *ChainMonitor) Stop() {
	log.Printf("Stopping monitor for %s", cm.chainName)
	cm.cancel()
	
	cm.mu.Lock()
	if cm.activeConn != nil {
		cm.activeConn.Close()
	}
	cm.mu.Unlock()
}

// monitorLoop is the main monitoring loop
func (cm *ChainMonitor) monitorLoop() {
	for {
		select {
		case <-cm.ctx.Done():
			return
		default:
			if err := cm.connectAndListen(); err != nil {
				log.Printf("Error in monitor loop for %s: %v", cm.chainName, err)
				time.Sleep(5 * time.Second)
			}
		}
	}
}

// connectAndListen connects to the best available endpoint and listens for transactions
func (cm *ChainMonitor) connectAndListen() error {
	endpoint := cm.getBestEndpoint()
	if endpoint == "" {
		return fmt.Errorf("no healthy endpoints available for %s", cm.chainName)
	}
	
	log.Printf("Connecting to %s endpoint: %s", cm.chainName, endpoint)
	
	// Track connection latency
	start := time.Now()
	
	conn, _, err := websocket.DefaultDialer.Dial(endpoint, nil)
	if err != nil {
		cm.updateHealthScore(endpoint, 0.0)
		return fmt.Errorf("failed to connect to %s: %v", endpoint, err)
	}
	
	latency := time.Since(start)
	connectionLatency.WithLabelValues(cm.chainName, endpoint).Observe(latency.Seconds())
	
	cm.mu.Lock()
	cm.activeConn = conn
	cm.mu.Unlock()
	
	// Subscribe to pending transactions
	subscribeMsg := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "eth_subscribe",
		"params":  []interface{}{"newPendingTransactions", true},
	}
	
	if err := conn.WriteJSON(subscribeMsg); err != nil {
		conn.Close()
		return fmt.Errorf("failed to subscribe to pending transactions: %v", err)
	}
	
	// Listen for messages
	for {
		select {
		case <-cm.ctx.Done():
			conn.Close()
			return nil
		default:
			var msg map[string]interface{}
			if err := conn.ReadJSON(&msg); err != nil {
				conn.Close()
				cm.updateHealthScore(endpoint, 0.5)
				return fmt.Errorf("error reading message: %v", err)
			}
			
			if err := cm.handleMessage(msg); err != nil {
				log.Printf("Error handling message: %v", err)
			}
			
			cm.updateHealthScore(endpoint, 1.0)
			cm.lastSeen[endpoint] = time.Now()
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (cm *ChainMonitor) handleMessage(msg map[string]interface{}) error {
	// Check if this is a subscription notification
	if params, ok := msg["params"].(map[string]interface{}); ok {
		if result, ok := params["result"].(map[string]interface{}); ok {
			return cm.processPendingTransaction(result)
		}
	}
	
	return nil
}

// processPendingTransaction processes a pending transaction
func (cm *ChainMonitor) processPendingTransaction(txData map[string]interface{}) error {
	tx := Transaction{
		ChainID:   cm.chainID,
		Status:    "pending",
		Timestamp: time.Now().Unix(),
		Raw:       txData,
	}
	
	// Extract transaction fields
	if hash, ok := txData["hash"].(string); ok {
		tx.Hash = hash
	}
	if from, ok := txData["from"].(string); ok {
		tx.From = from
	}
	if to, ok := txData["to"].(string); ok {
		tx.To = to
	}
	if value, ok := txData["value"].(string); ok {
		tx.Value = value
	}
	if gas, ok := txData["gas"].(string); ok {
		tx.Gas = gas
	}
	if gasPrice, ok := txData["gasPrice"].(string); ok {
		tx.GasPrice = gasPrice
	}
	if data, ok := txData["input"].(string); ok {
		tx.Data = data
	}
	if nonce, ok := txData["nonce"].(string); ok {
		tx.Nonce = nonce
	}
	
	// Send to Kafka
	if err := cm.sendToKafka(tx); err != nil {
		txIngested.WithLabelValues(cm.chainName, "failed").Inc()
		return fmt.Errorf("failed to send transaction to Kafka: %v", err)
	}
	
	// Cache in Redis for quick lookups
	if err := cm.cacheTransaction(tx); err != nil {
		log.Printf("Warning: failed to cache transaction in Redis: %v", err)
	}
	
	txIngested.WithLabelValues(cm.chainName, "success").Inc()
	return nil
}

// sendToKafka sends transaction to Kafka topic
func (cm *ChainMonitor) sendToKafka(tx Transaction) error {
	data, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("failed to marshal transaction: %v", err)
	}
	
	topic := "tx_raw"
	
	return cm.producer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &topic,
			Partition: kafka.PartitionAny,
		},
		Key:   []byte(tx.Hash),
		Value: data,
		Headers: []kafka.Header{
			{Key: "chain_id", Value: []byte(fmt.Sprintf("%d", tx.ChainID))},
			{Key: "chain_name", Value: []byte(cm.chainName)},
			{Key: "timestamp", Value: []byte(fmt.Sprintf("%d", tx.Timestamp))},
		},
	}, nil)
}

// cacheTransaction caches transaction in Redis
func (cm *ChainMonitor) cacheTransaction(tx Transaction) error {
	key := fmt.Sprintf("tx:%s:%s", cm.chainName, tx.Hash)
	
	data, err := json.Marshal(tx)
	if err != nil {
		return err
	}
	
	return cm.redisClient.Set(cm.ctx, key, data, 5*time.Minute).Err()
}

// getBestEndpoint returns the endpoint with the highest health score
func (cm *ChainMonitor) getBestEndpoint() string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	
	var bestEndpoint string
	var bestScore float64
	
	for endpoint, score := range cm.healthScores {
		if score > bestScore {
			bestScore = score
			bestEndpoint = endpoint
		}
	}
	
	if bestScore < 0.5 {
		return ""
	}
	
	return bestEndpoint
}

// updateHealthScore updates the health score for an endpoint
func (cm *ChainMonitor) updateHealthScore(endpoint string, score float64) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	
	// Exponential moving average
	alpha := 0.1
	if currentScore, exists := cm.healthScores[endpoint]; exists {
		cm.healthScores[endpoint] = alpha*score + (1-alpha)*currentScore
	} else {
		cm.healthScores[endpoint] = score
	}
	
	endpointHealth.WithLabelValues(cm.chainName, endpoint).Set(cm.healthScores[endpoint])
}

// healthCheckLoop periodically checks endpoint health
func (cm *ChainMonitor) healthCheckLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-cm.ctx.Done():
			return
		case <-ticker.C:
			cm.performHealthChecks()
		}
	}
}

// performHealthChecks checks the health of all endpoints
func (cm *ChainMonitor) performHealthChecks() {
	for _, endpoint := range cm.endpoints {
		go func(ep string) {
			if time.Since(cm.lastSeen[ep]) > 2*time.Minute {
				cm.updateHealthScore(ep, 0.1)
			}
		}(endpoint)
	}
}

// IngestionService manages all chain monitors
type IngestionService struct {
	config   Config
	producer *kafka.Producer
	redis    *redis.Client
	monitors map[string]*ChainMonitor
	wg       sync.WaitGroup
}

// NewIngestionService creates a new ingestion service
func NewIngestionService(config Config) (*IngestionService, error) {
	// Create Kafka producer
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": config.KafkaBrokers,
		"batch.size":        config.BatchSize,
		"linger.ms":         config.FlushIntervalMS,
		"compression.type":  "lz4",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka producer: %v", err)
	}
	
	// Create Redis client
	redisClient := redis.NewClient(&redis.Options{
		Addr: config.RedisURL,
	})
	
	// Test Redis connection
	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %v", err)
	}
	
	return &IngestionService{
		config:   config,
		producer: producer,
		redis:    redisClient,
		monitors: make(map[string]*ChainMonitor),
	}, nil
}

// Start starts the ingestion service
func (is *IngestionService) Start() error {
	log.Println("Starting Scorpius Mempool Elite Ingestion Service")
	
	// Create monitors for each configured chain
	chainIDs := map[string]int64{
		"ethereum": 1,
		"arbitrum": 42161,
		"optimism": 10,
		"base":     8453,
	}
	
	for chainName, endpoints := range is.config.ChainEndpoints {
		chainID, exists := chainIDs[chainName]
		if !exists {
			log.Printf("Warning: Unknown chain %s, skipping", chainName)
			continue
		}
		
		monitor := NewChainMonitor(chainName, chainID, endpoints, is.producer, is.redis)
		is.monitors[chainName] = monitor
		
		is.wg.Add(1)
		go func(m *ChainMonitor) {
			defer is.wg.Done()
			if err := m.Start(); err != nil {
				log.Printf("Error starting monitor for %s: %v", m.chainName, err)
			}
		}(monitor)
	}
	
	log.Printf("Started monitoring %d chains", len(is.monitors))
	return nil
}

// Stop stops the ingestion service
func (is *IngestionService) Stop() {
	log.Println("Stopping Scorpius Mempool Elite Ingestion Service")
	
	for _, monitor := range is.monitors {
		monitor.Stop()
	}
	
	is.wg.Wait()
	
	is.producer.Flush(15 * 1000) // 15 seconds
	is.producer.Close()
	is.redis.Close()
	
	log.Println("Ingestion service stopped")
}

// loadConfig loads configuration from environment variables
func loadConfig() Config {
	config := Config{
		KafkaBrokers:    getEnvOrDefault("KAFKA_BROKERS", "localhost:9092"),
		RedisURL:        getEnvOrDefault("REDIS_URL", "redis://localhost:6379"),
		BatchSize:       1000,
		FlushIntervalMS: 100,
		MaxConnections:  10,
		LogLevel:        getEnvOrDefault("LOG_LEVEL", "info"),
	}
	
	// Parse chain endpoints
	config.ChainEndpoints = make(map[string][]string)
	
	if ethEndpoints := os.Getenv("ETHEREUM_RPC_URLS"); ethEndpoints != "" {
		config.ChainEndpoints["ethereum"] = strings.Split(ethEndpoints, ",")
	}
	if arbEndpoints := os.Getenv("ARBITRUM_RPC_URLS"); arbEndpoints != "" {
		config.ChainEndpoints["arbitrum"] = strings.Split(arbEndpoints, ",")
	}
	if opEndpoints := os.Getenv("OPTIMISM_RPC_URLS"); opEndpoints != "" {
		config.ChainEndpoints["optimism"] = strings.Split(opEndpoints, ",")
	}
	if baseEndpoints := os.Getenv("BASE_RPC_URLS"); baseEndpoints != "" {
		config.ChainEndpoints["base"] = strings.Split(baseEndpoints, ",")
	}
	
	return config
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	// Load configuration
	config := loadConfig()
	
	// Create ingestion service
	service, err := NewIngestionService(config)
	if err != nil {
		log.Fatalf("Failed to create ingestion service: %v", err)
	}
	
	// Start service
	if err := service.Start(); err != nil {
		log.Fatalf("Failed to start service: %v", err)
	}
	
	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan
	
	// Graceful shutdown
	service.Stop()
}
