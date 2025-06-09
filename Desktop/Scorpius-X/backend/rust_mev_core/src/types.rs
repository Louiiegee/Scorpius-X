use ethers::types::{Address, U256};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::Mutex;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use ethers::prelude::*;
use clap::Parser;

// -----------------------------
// Shared Types
// -----------------------------
#[derive(Debug, Clone)]
pub struct Token {
    pub address: Address,
    pub symbol: String,
    pub decimals: u8,
}

#[derive(Debug, Clone)]
pub struct TokenConfig {
    pub address: Address,
    pub decimals: u8,
}

#[derive(Debug, Clone)]
pub struct DexConfig {
    pub r#type: String,
    pub factory: Option<Address>,
    pub router: Option<Address>,
    pub quoter: Option<Address>,
    pub preferred_fees: Option<Vec<u32>>,
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub rpc_url: String,
    pub min_profit_usd: f64,
    pub max_hops: u8,
    pub scan_loan_amount_usd: f64,
    pub base_token_symbol: String,
    pub tokens: HashMap<String, TokenConfig>,
    pub dexes: HashMap<String, DexConfig>,
    pub chain_id: u64,
    pub flashloan_fee_rate: f64,
    pub slippage_tolerance: f64,
    pub chainlink_feeds: Option<HashMap<String, ChainlinkFeedConfig>>,
    pub fallback_eth_price_usd: f64,
}

#[derive(Debug, Clone)]
pub struct ChainlinkFeedConfig {
    pub address: Address,
}

#[derive(Debug, Clone)]
pub struct FeedInfo {
    pub contract: IChainlinkAggregatorV3<Provider<Http>>,
    pub decimals: u8,
    pub address: Address,
}

#[derive(Debug, Clone)]
pub struct V2PoolData {
    pub reserve0: U256,
    pub reserve1: U256,
    pub token0: Address,
}

pub type Client = Arc<Provider<Http>>;

// -----------------------------
// Caches
// -----------------------------
pub static V2_PAIR_CACHE: Lazy<Arc<Mutex<HashMap<(Address, Address, Address), Option<Address>>>>> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
pub static POOL_DATA_CACHE: Lazy<Arc<Mutex<HashMap<Address, (V2PoolData, u64)>>>> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
pub static V3_POOL_CACHE: Lazy<Arc<Mutex<HashMap<(Address, Address, u32, Address), Option<Address>>>>> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
pub static FEED_INFO_CACHE: Lazy<Arc<Mutex<HashMap<String, Option<(FeedInfo, u64)>>>> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

// -----------------------------
// CLI Args
// -----------------------------
#[derive(Debug, Parser)]
#[command(name = "mev_bot")]
pub struct CliArgs {
    #[arg(long)]
    pub block: Option<u64>,

    #[arg(long)]
    pub max_hops: Option<u8>,

    #[arg(long)]
    pub min_profit_usd_override: Option<f64>,
}
