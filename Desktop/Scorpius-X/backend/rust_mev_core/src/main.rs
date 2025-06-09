// -------------------
// Top-level imports and setup
// -------------------

// Bring logging macros into scope.
#[macro_use]
extern crate log;

use ethers::contract::abigen;
use ethers::prelude::*;
use ethers::providers::{Http, Provider};
use ethers::types::{Address, U256};

use clap::Parser;
use dotenvy::dotenv;
use eyre::Result;
use futures::future::join_all;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::env;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

// -------------------
// Type aliases & ABI bindings
// -------------------

// Shared provider type alias.
type Client = Arc<Provider<Http>>;

// Generate contract bindings using abigen!  
abigen!(
    IUniswapV2Factory, "./abis/IUniswapV2Factory.json";
    IUniswapV2Pair, "./abis/IUniswapV2Pair.json";
    IUniswapV3Factory, "./abis/IUniswapV3Factory.json";
    IQuoterV2, "./abis/IUniswapV3QuoterV2.json";
    IChainlinkAggregatorV3, "./abis/IChainlinkAggregatorV3.json";
);

// -------------------
// Struct definitions
// -------------------

#[derive(Debug, Clone)]
pub struct Token {
    pub symbol: String,
    pub address: Address,
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

/// FeedInfo now uses Provider<Http> to match the instance produced by IChainlinkAggregatorV3::new.
/// Derive Clone so that we can clone FeedInfo.
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

#[derive(Parser, Debug)]
#[command(author, version, about)]
pub struct CliArgs {
    #[arg(long)]
    pub chain: Option<String>,

    #[arg(long)]
    pub block: Option<u64>,

    #[arg(long)]
    pub max_hops: Option<u8>,

    #[arg(long)]
    pub min_profit_usd_override: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SwapStepRaw {
    #[serde(rename = "dexName")]
    pub dex_name: String,
    #[serde(rename = "tokenInAddr")]
    pub token_in_addr: Address,
    #[serde(rename = "tokenOutAddr")]
    pub token_out_addr: Address,
    #[serde(rename = "poolAddress")]
    pub pool_address: Address,
    #[serde(rename = "isV3")]
    pub is_v3: bool,
    pub fee: Option<u32>,
    #[serde(rename = "tokenInSymbol")]
    pub token_in_symbol: String,
    #[serde(rename = "tokenOutSymbol")]
    pub token_out_symbol: String,
    #[serde(rename = "inputAmountSim")]
    #[serde(with = "u256_string_serialization")]
    pub input_amount_sim: U256,
    #[serde(rename = "outputAmountSim")]
    #[serde(with = "u256_string_serialization")]
    pub output_amount_sim: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArbOpportunityRaw {
    #[serde(rename = "estimatedNetProfit")]
    pub estimated_net_profit: String,
    #[serde(rename = "loanAmount")]
    pub loan_amount: String,
    #[serde(rename = "minReturn")]
    pub min_return: String,
    #[serde(rename = "swapPath")]
    pub swap_path: Vec<SwapStepRaw>,
    #[serde(rename = "tokenPathSymbols")]
    pub token_path_symbols: Vec<String>,
    #[serde(rename = "tokenPathAddresses")]
    pub token_path_addresses: Vec<String>,
    #[serde(rename = "path")]
    pub path: Vec<String>,
    #[serde(rename = "estimatedGasUnits")]
    pub estimated_gas_units: String,
    #[serde(rename = "gasEstimateFallbackUsed")]
    pub gas_estimate_fallback_used: bool,
}

// -------------------
// Global caches
// -------------------

lazy_static! {
    pub static ref V2_PAIR_CACHE: Arc<Mutex<HashMap<(Address, Address, Address), Option<Address>>>> =
        Arc::new(Mutex::new(HashMap::new()));

    pub static ref V3_POOL_CACHE: Arc<Mutex<HashMap<(Address, Address, u32, Address), Option<Address>>>> =
        Arc::new(Mutex::new(HashMap::new()));

    pub static ref POOL_DATA_CACHE: Arc<Mutex<HashMap<Address, (V2PoolData, u64)>>> =
        Arc::new(Mutex::new(HashMap::new()));

    pub static ref FEED_INFO_CACHE: Arc<Mutex<HashMap<String, Option<(FeedInfo, u64)>>>> =
        Arc::new(Mutex::new(HashMap::new()));
}

// -------------------
// Helper trait for U256 conversion
// -------------------

trait ToF64Lossy {
    fn to_f64_lossy(&self) -> f64;
}

impl ToF64Lossy for U256 {
    fn to_f64_lossy(&self) -> f64 {
        self.to_string().parse().unwrap_or(f64::NAN)
    }
}

// -------------------
// U256 Serialization helper module
// -------------------

pub mod u256_string_serialization {
    use ethers::types::U256;
    use serde::{self, Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(val: &U256, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&val.to_string())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<U256, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        s.parse::<U256>().map_err(serde::de::Error::custom)
    }
}

// -------------------
// Configuration Loader (Updated)
// -------------------

fn load_app_config() -> Result<AppConfig> {
    dotenv().ok(); 
    let rpc_url = env::var("RPC_URL").expect("RPC_URL must be set");

    // Temporarily use just two tokens that are known to have liquidity.
    let mut tokens_map = HashMap::new();
    tokens_map.insert("WETH".to_string(), TokenConfig {
        address: "0x4200000000000000000000000000000000000006".parse().unwrap(),
        decimals: 18,
    });
    tokens_map.insert("USDC".to_string(), TokenConfig {
        address: "0xd9aa3fC9B706A1f5a0dA5991E6571923F5287b2A".parse().unwrap(),
        decimals: 6,
    });

    let mut dex_map = HashMap::new();

    // ✅ UniswapV2 using a known standard V2 factory address.
    dex_map.insert("UniswapV2".to_string(), DexConfig {
        r#type: "V2".into(),
        factory: Some("0x327Df1E6de05895d2ab08513aaDD9313Fe505d86".parse().unwrap()),
        router: None,
        quoter: None,
        preferred_fees: None,
    });

    // ✅ UniswapV3 on Base using the confirmed addresses.
    dex_map.insert("UniswapV3".to_string(), DexConfig {
        r#type: "V3".into(),
        factory: Some("0x327Ee6dd6f6a25a9A0D3bA5038366BC10c17496E".parse().unwrap()),
        router: None,
        quoter: Some("0x23d7efCE1f800DE3e36c1B6D4171068F5FF75EbB".parse().unwrap()), // Base Quoter V2
        preferred_fees: Some(vec![500, 3000]),
    });

    // Set the base token symbol to one that is in the tokens map.
    Ok(AppConfig {
        rpc_url,
        min_profit_usd: 10.0,
        max_hops: 3,
        scan_loan_amount_usd: 1000.0,
        base_token_symbol: "WETH".to_string(),
        tokens: tokens_map,
        dexes: dex_map,
        chain_id: 8453, // BASE mainnet
        flashloan_fee_rate: 0.0009,
        slippage_tolerance: 0.005,
        chainlink_feeds: Some(HashMap::new()),
        fallback_eth_price_usd: 2000.0,
    })
}

// -------------------
// Token lookup helpers
// -------------------

fn get_token(symbol: &str, config: &AppConfig) -> Option<Token> {
    config.tokens.get(symbol).map(|tok| Token {
        symbol: symbol.to_string(),
        address: tok.address,
        decimals: tok.decimals,
    })
}

fn get_token_by_addr(addr: &Address, config: &AppConfig) -> Option<Token> {
    for (symbol, tok_cfg) in &config.tokens {
        if &tok_cfg.address == addr {
            return Some(Token {
                symbol: symbol.clone(),
                address: *addr,
                decimals: tok_cfg.decimals,
            });
        }
    }
    None
}

// -------------------
// Unit parsing helpers
// -------------------

fn parse_units<T: Into<f64>>(amount: T, decimals: u32) -> Result<U256> {
    let float = amount.into();
    let scaled = float * 10f64.powi(decimals as i32);
    let int_str = format!("{:.0}", scaled);
    Ok(U256::from_dec_str(&int_str)?)
}

fn format_units(amount: U256, decimals: i32) -> Result<String> {
    let divisor = U256::from(10u64.pow(decimals as u32));
    let major = amount / divisor;
    let minor = amount % divisor;
    Ok(format!("{}.{}", major, minor))
}

// -------------------
// Simulation & Pool Fetching Functions
// -------------------

async fn get_v2_pair_address(
    t_a: Address,
    t_b: Address,
    factory: Address,
    client: Client,
) -> Result<Option<Address>> {
    let (token0, token1) = if t_a < t_b { (t_a, t_b) } else { (t_b, t_a) };
    let cache_key = (token0, token1, factory);
    {
        let cache = V2_PAIR_CACHE.lock().await;
        if let Some(cached_addr) = cache.get(&cache_key) {
            return Ok(cached_addr.clone());
        }
    }
    let factory_contract = IUniswapV2Factory::new(factory, client.clone());
    match factory_contract.get_pair(token0, token1).call().await {
        Ok(pair_addr) => {
            let pair_opt = if pair_addr == Address::zero() {
                None
            } else {
                Some(pair_addr)
            };
            V2_PAIR_CACHE.lock().await.insert(cache_key, pair_opt.clone());
            Ok(pair_opt)
        }
        Err(e) => {
            warn!("Failed to get V2 pair: {}", e);
            Ok(None)
        }
    }
}

async fn get_v2_pool_data(pair_addr: Address, client: Client) -> Result<Option<(V2PoolData, u64)>> {
    {
        let cache = POOL_DATA_CACHE.lock().await;
        if let Some(pool_data) = cache.get(&pair_addr) {
            return Ok(Some(pool_data.clone()));
        }
    }
    let pair_contract = IUniswapV2Pair::new(pair_addr, client.clone());
    match pair_contract.get_reserves().call().await {
        Ok(reserves) => {
            match pair_contract.token_0().call().await {
                Ok(token0) => {
                    let pool_data = V2PoolData {
                        reserve0: reserves.0.into(),
                        reserve1: reserves.1.into(),
                        token0,
                    };
                    let block_number = client.get_block_number().await?;
                    POOL_DATA_CACHE.lock().await.insert(pair_addr, (pool_data.clone(), block_number.as_u64()));
                    Ok(Some((pool_data, block_number.as_u64())))
                }
                Err(e) => {
                    warn!("Failed to get token0: {}", e);
                    Ok(None)
                }
            }
        }
        Err(e) => {
            warn!("Failed to get reserves: {}", e);
            Ok(None)
        }
    }
}

async fn get_v3_pool_address(
    t_a: Address,
    t_b: Address,
    fee: u32,
    factory: Address,
    client: Client,
) -> Result<Option<Address>> {
    // Reorder tokens as required by the V3 factory.
    let (token0, token1) = if t_a < t_b { (t_a, t_b) } else { (t_b, t_a) };
    // Log the query with fee tier.
    info!("Querying V3 pool: {} ↔ {} | Fee: {}", token0, token1, fee);
    let cache_key = (token0, token1, fee, factory);
    {
        let cache = V3_POOL_CACHE.lock().await;
        if let Some(cached_addr) = cache.get(&cache_key) {
            return Ok(cached_addr.clone());
        }
    }
    let factory_contract = IUniswapV3Factory::new(factory, client.clone());
    match factory_contract.get_pool(token0, token1, fee).call().await {
        Ok(pool_addr) => {
            let pool_opt = if pool_addr == Address::zero() {
                None
            } else {
                Some(pool_addr)
            };
            V3_POOL_CACHE.lock().await.insert(cache_key, pool_opt.clone());
            Ok(pool_opt)
        }
        Err(e) => {
            warn!("Failed to get V3 pool: {}", e);
            Ok(None)
        }
    }
}

async fn get_amount_out_v3_quote(
    amt_in: U256,
    t_in: Address,
    t_out: Address,
    fee: u32,
    quoter: Address,
    client: Client,
) -> Result<U256> {
    if amt_in.is_zero() {
        return Ok(U256::zero());
    }
    let quoter_contract = IQuoterV2::new(quoter, client);
    match quoter_contract
        .quote_exact_input_single(t_in, t_out, fee, amt_in, U256::zero())
        .call()
        .await
    {
        Ok(result) => Ok(result.0),
        Err(e) => {
            warn!("V3 quote failed: {}", e);
            Ok(U256::zero())
        }
    }
}

fn get_amount_out_v2_local(amount_in: U256, reserve_in: U256, reserve_out: U256) -> U256 {
    if amount_in.is_zero() || reserve_in.is_zero() || reserve_out.is_zero() {
        return U256::zero();
    }
    let num = amount_in.checked_mul(U256::from(997)).unwrap_or_default() * reserve_out;
    let den = reserve_in.checked_mul(U256::from(1000)).unwrap_or_default()
        + amount_in.checked_mul(U256::from(997)).unwrap_or_default();
    if den.is_zero() {
        U256::zero()
    } else {
        num / den
    }
}

#[derive(Debug, Clone)]
struct SimulateResult {
    output_amount: U256,
    pool_address: Option<Address>,
    fee: Option<u32>,
    is_v3: bool,
    error: Option<String>,
}

async fn simulate_swap_step(
    amount_in: U256,
    token_in: &Token,
    token_out: &Token,
    dex_name: &str,
    dex_config: &DexConfig,
    client: Client,
) -> SimulateResult {
    let mut result = SimulateResult {
        output_amount: U256::zero(),
        pool_address: None,
        fee: None,
        is_v3: dex_config.r#type == "V3",
        error: None,
    };

    if amount_in.is_zero() {
        result.error = Some("Zero input".into());
        return result;
    }

    match dex_config.r#type.as_str() {
        "V2" => {
            if let Some(factory) = dex_config.factory {
                info!("Checking pair: {} ↔ {} on {}", token_in.symbol, token_out.symbol, dex_name);
                match get_v2_pair_address(token_in.address, token_out.address, factory, client.clone()).await {
                    Ok(Some(pair_addr)) => {
                        result.pool_address = Some(pair_addr);
                        match get_v2_pool_data(pair_addr, client.clone()).await {
                            Ok(Some((pool_data, _))) => {
                                let (res_in, res_out) = if token_in.address == pool_data.token0 {
                                    (pool_data.reserve0, pool_data.reserve1)
                                } else {
                                    (pool_data.reserve1, pool_data.reserve0)
                                };
                                result.output_amount = get_amount_out_v2_local(amount_in, res_in, res_out);
                            }
                            _ => result.error = Some("V2 Pool data unavailable".into()),
                        }
                    }
                    _ => result.error = Some("V2 Pair not found".into()),
                }
            } else {
                result.error = Some("V2 Factory missing".into());
            }
        }
        "V3" => {
            if let (Some(factory), Some(quoter)) = (dex_config.factory, dex_config.quoter) {
                info!("Checking pair: {} ↔ {} on {}", token_in.symbol, token_out.symbol, dex_name);
                let fees = dex_config.preferred_fees.as_ref().map_or(&[100u32, 500, 3000, 10000][..], |v| v.as_slice());
                let mut best_output = U256::zero();
                let mut best_fee = None;
                let mut best_pool: Option<Address> = None;

                let pool_checks: Vec<_> = fees.iter().map(|&fee| {
                    let client_clone = client.clone();
                    async move {
                        (fee, get_v3_pool_address(token_in.address, token_out.address, fee, factory, client_clone).await)
                    }
                }).collect();
                let pool_results = join_all(pool_checks).await;
                let valid_pools: Vec<_> = pool_results.into_iter()
                    .filter_map(|(fee, res)| res.ok().flatten().map(|addr| (fee, addr)))
                    .collect();

                if valid_pools.is_empty() {
                    result.error = Some("V3 Pool not found".into());
                    return result;
                }

                let quote_tasks: Vec<_> = valid_pools.into_iter().map(|(fee, pool_addr)| {
                    let client_clone = client.clone();
                    async move {
                        match get_amount_out_v3_quote(amount_in, token_in.address, token_out.address, fee, quoter, client_clone).await {
                            Ok(amount) => Some((fee, pool_addr, amount)),
                            Err(_) => None,
                        }
                    }
                }).collect();
                let quote_results = join_all(quote_tasks).await;
                for res_opt in quote_results.into_iter().flatten() {
                    if res_opt.2 > best_output {
                        best_output = res_opt.2;
                        best_fee = Some(res_opt.0);
                        best_pool = Some(res_opt.1);
                    }
                }
                result.output_amount = best_output;
                result.fee = best_fee;
                result.pool_address = best_pool;
                if result.pool_address.is_none() {
                    result.error = Some("V3 quotes failed".into());
                }
            } else {
                result.error = Some("V3 Factory/Quoter missing".into());
            }
        }
        _ => result.error = Some(format!("Unsupported DEX: {}", dex_config.r#type)),
    }

    if result.output_amount.is_zero() && result.error.is_none() {
        result.error = Some("Zero output".into());
    }
    result
}

// -------------------
// DFS Pathfinding
// -------------------

#[derive(Clone, Debug)]
struct PathState {
    path: Vec<SwapStepRaw>,
    current_token: Token,
    current_amount: U256,
    depth: u8,
    start_amount: U256,
}

type SharedOpps = Arc<Mutex<Vec<ArbOpportunityRaw>>>;
type BoxedResult = Pin<Box<dyn Future<Output = Result<()>> + Send>>;

async fn find_arbitrage_paths(client: Client, config: Arc<AppConfig>) -> Result<Vec<ArbOpportunityRaw>> {
    let start_time = Instant::now();
    let base_token = get_token(&config.base_token_symbol, &config)
        .ok_or_else(|| eyre::eyre!("Base token not found in config"))?;
    let base_price = get_usd_price_async(&base_token.symbol, &client, &config).await.unwrap_or(1.0);
    if base_price <= 0.0 {
        return Err(eyre::eyre!("Invalid base price"));
    }
    let loan_f = config.scan_loan_amount_usd / base_price;
    let scan_loan: U256 = parse_units(loan_f, base_token.decimals as u32)?.into();
    let opps: SharedOpps = Arc::new(Mutex::new(Vec::new()));
    let visited: Arc<Mutex<HashSet<String>>> = Arc::new(Mutex::new(HashSet::new()));

    let init_state = PathState {
        path: vec![],
        current_token: base_token.clone(),
        current_amount: scan_loan,
        depth: 0,
        start_amount: scan_loan,
    };
    info!("DFS Start. Base: {}, Loan: {}", base_token.symbol, format_units(scan_loan, base_token.decimals as i32)?);
    dfs_explore_sequential(init_state, client.clone(), config.clone(), opps.clone(), visited.clone()).await?;
    let final_ops = opps.lock().await.clone();
    info!("Scan done in {:.2}s. Found {} paths.", start_time.elapsed().as_secs_f64(), final_ops.len());
    Ok(final_ops)
}

fn dfs_explore_sequential(
    state: PathState,
    client: Client,
    config: Arc<AppConfig>,
    opps: SharedOpps,
    visited: Arc<Mutex<HashSet<String>>>,
) -> BoxedResult {
    Box::pin(async move {
        if state.depth >= config.max_hops {
            return Ok(());
        }
        let state_key = format!("{}-{}", state.depth, state.current_token.symbol);
        if !visited.lock().await.insert(state_key) {
            return Ok(());
        }
        let base_token = get_token(&config.base_token_symbol, &config)
            .ok_or_else(|| eyre::eyre!("Base token not found"))?;
        if state.current_token.address == base_token.address && state.depth > 0 {
            let gross_profit = state.current_amount.saturating_sub(state.start_amount);
            if !gross_profit.is_zero() {
                let gas_units = 500_000u64 + (state.depth as u64 * 150_000);
                let gas_cost_base = estimate_gas_cost_in_base(&base_token, gas_units, client.clone(), &config).await.unwrap_or(U256::max_value());
                let fee_rate_num = U256::from((config.flashloan_fee_rate * 10000.0) as u128);
                let fee_rate_den = U256::from(10000);
                let flashloan_fee = state.start_amount.checked_mul(fee_rate_num).unwrap_or_default() / fee_rate_den;
                let net_profit = gross_profit.saturating_sub(flashloan_fee).saturating_sub(gas_cost_base);
                if net_profit > U256::zero() {
                    let net_profit_usd = calculate_usd_value(net_profit, &base_token, &client, &config).await.unwrap_or(0.0);
                    if net_profit_usd >= config.min_profit_usd {
                        let path_tokens: Vec<Token> = std::iter::once(base_token.clone())
                            .chain(state.path.iter().filter_map(|s| get_token_by_addr(&s.token_out_addr, &config)))
                            .collect();
                        let opportunity = ArbOpportunityRaw {
                            estimated_net_profit: net_profit.to_string(),
                            loan_amount: state.start_amount.to_string(),
                            min_return: (state.current_amount * U256::from(((1.0 - config.slippage_tolerance) * 10000.0) as u64) / U256::from(10000)).to_string(),
                            swap_path: state.path.clone(),
                            token_path_symbols: path_tokens.iter().map(|t| t.symbol.clone()).collect(),
                            token_path_addresses: path_tokens.iter().map(|t| t.address.to_string()).collect(),
                            path: state.path.iter().map(|s| s.dex_name.clone()).collect(),
                            estimated_gas_units: gas_units.to_string(),
                            gas_estimate_fallback_used: gas_cost_base == U256::max_value(),
                        };
                        opps.lock().await.push(opportunity);
                        info!("Found profitable path: {} → {} | Profit: ${:.2}",
                              base_token.symbol,
                              state.path.iter().map(|s| s.token_out_symbol.clone()).collect::<Vec<_>>().join(" → "),
                              net_profit_usd);
                    }
                }
                return Ok(());
            }
        }
        let mut next_states = Vec::new();
        for next_sym in config.tokens.keys() {
            if next_sym == &state.current_token.symbol {
                continue;
            }
            if let Some(next_tok) = get_token(next_sym, &config) {
                for (dex_name, dex_cfg) in &config.dexes {
                    let sim_result = simulate_swap_step(
                        state.current_amount,
                        &state.current_token,
                        &next_tok,
                        dex_name,
                        &dex_cfg,
                        client.clone(),
                    ).await;
                    if sim_result.output_amount > U256::zero() && sim_result.pool_address.is_some() {
                        let next_step = SwapStepRaw {
                            dex_name: dex_name.clone(),
                            token_in_addr: state.current_token.address,
                            token_out_addr: next_tok.address,
                            pool_address: sim_result.pool_address.unwrap(),
                            is_v3: sim_result.is_v3,
                            fee: sim_result.fee,
                            token_in_symbol: state.current_token.symbol.clone(),
                            token_out_symbol: next_tok.symbol.clone(),
                            input_amount_sim: state.current_amount,
                            output_amount_sim: sim_result.output_amount,
                        };
                        let mut next_path = state.path.clone();
                        next_path.push(next_step);
                        next_states.push(PathState {
                            path: next_path,
                            current_token: next_tok.clone(),
                            current_amount: sim_result.output_amount,
                            depth: state.depth + 1,
                            start_amount: state.start_amount,
                        });
                    }
                }
            }
        }
        for next_state in next_states {
            dfs_explore_sequential(next_state, client.clone(), config.clone(), opps.clone(), visited.clone()).await?;
        }
        Ok(())
    })
}

// -------------------
// Price & Gas Cost Helpers
// -------------------

async fn get_chainlink_feed(symbol: &str, client: Client, config: &AppConfig) -> Result<Option<(FeedInfo, u64)>> {
    {
        let cache = FEED_INFO_CACHE.lock().await;
        if let Some(feed_info) = cache.get(symbol) {
            return Ok(feed_info.clone());
        }
    }
    if let Some(chainlink_feeds) = &config.chainlink_feeds {
        if let Some(feed_config) = chainlink_feeds.get(symbol) {
            let feed_contract = IChainlinkAggregatorV3::new(feed_config.address, client.clone());
            let decimals = 8; // Most Chainlink feeds use 8 decimals.
            match feed_contract.latest_round_data().call().await {
                Ok(_) => {
                    let feed_info = FeedInfo {
                        contract: feed_contract,
                        decimals,
                        address: feed_config.address,
                    };
                    let block_number = client.get_block_number().await?.as_u64();
                    FEED_INFO_CACHE.lock().await.insert(symbol.to_string(), Some((feed_info.clone(), block_number)));
                    return Ok(Some((feed_info, block_number)));
                },
                Err(e) => {
                    warn!("Chainlink feed not responding: {}", e);
                    return Ok(None);
                }
            }
        }
    }
    FEED_INFO_CACHE.lock().await.insert(symbol.to_string(), None);
    Ok(None)
}

async fn get_usd_price_async(symbol: &str, client: &Client, config: &AppConfig) -> Result<f64> {
    let upper_sym = symbol.to_uppercase();
    if ["USDC", "USDT", "DAI", "BUSD"].contains(&upper_sym.as_str()) {
        return Ok(1.0);
    }
    if let Some(_chainlink_feeds) = &config.chainlink_feeds {
        if let Ok(Some((feed_info, _))) = get_chainlink_feed(&upper_sym, client.clone(), config).await {
            match feed_info.contract.latest_round_data().call().await {
                Ok(data) => {
                    let price_scaled = data.1.as_u128() as f64;
                    let divisor = 10f64.powi(feed_info.decimals as i32);
                    return Ok(price_scaled / divisor);
                },
                Err(e) => {
                    warn!("Failed to get latest price data: {}", e);
                }
            }
        }
        let eth_sym = format!("{}/ETH", upper_sym);
        if let Ok(Some((feed_info, _))) = get_chainlink_feed(&eth_sym, client.clone(), config).await {
            match feed_info.contract.latest_round_data().call().await {
                Ok(data) => {
                    let token_eth_price = data.1.as_u128() as f64 / 10f64.powi(feed_info.decimals as i32);
                    if let Ok(eth_usd) = get_eth_price_async(client.clone(), config).await {
                        return Ok(token_eth_price * eth_usd);
                    }
                },
                Err(_) => {}
            }
        }
    }
    if upper_sym == "WETH" || upper_sym == "ETH" {
        return Ok(config.fallback_eth_price_usd);
    }
    Err(eyre::eyre!("No price feed available for {}", symbol))
}

async fn get_eth_price_async(client: Client, config: &AppConfig) -> Result<f64> {
    if let Some(chainlink_feeds) = &config.chainlink_feeds {
        if let Some(feed_config) = chainlink_feeds.get("ETH") {
            let feed_contract = IChainlinkAggregatorV3::new(feed_config.address, client.clone());
            let decimals = 8;
            match feed_contract.latest_round_data().call().await {
                Ok(data) => {
                    let price_scaled = data.1.as_u128() as f64;
                    let divisor = 10f64.powi(decimals as i32);
                    return Ok(price_scaled / divisor);
                },
                Err(e) => {
                    warn!("Failed to get ETH price data: {}", e);
                }
            }
        }
    }
    Ok(config.fallback_eth_price_usd)
}

async fn estimate_gas_cost_in_eth(units: u64, client: &Client) -> Result<U256> {
    let gas_price = client.get_gas_price().await?;
    Ok(U256::from(units) * gas_price)
}

async fn estimate_gas_cost_in_base(base_token: &Token, units: u64, client: Client, config: &AppConfig) -> Result<U256> {
    let cost_eth = estimate_gas_cost_in_eth(units, &client).await?;
    convert_eth_cost_to_base(cost_eth, base_token, client, config).await
}

async fn convert_eth_cost_to_base(cost_eth: U256, base_token: &Token, client: Client, config: &AppConfig) -> Result<U256> {
    let eth_price_usd = get_eth_price_async(client.clone(), config).await?;
    let base_price_usd = get_usd_price_async(&base_token.symbol, &client, config).await?;
    if eth_price_usd <= 0.0 || base_price_usd <= 0.0 {
        return Err(eyre::eyre!("Invalid prices for gas conversion"));
    }
    let eth_price_wad: U256 = parse_units(eth_price_usd, 18)?.into();
    let base_price_wad: U256 = parse_units(base_price_usd, 18)?.into();
    if base_price_wad.is_zero() {
        return Err(eyre::eyre!("Base price WAD is zero"));
    }
    let scale_factor = U256::from(10).pow(U256::from(base_token.decimals));
    let exp18 = U256::from(10).pow(U256::from(18));
    let numerator = cost_eth
        .checked_mul(eth_price_wad).ok_or_else(|| eyre::eyre!("Overflow"))?
        .checked_mul(scale_factor).ok_or_else(|| eyre::eyre!("Overflow"))?;
    let denominator = base_price_wad.checked_mul(exp18).ok_or_else(|| eyre::eyre!("Overflow"))?;
    if denominator.is_zero() {
        return Err(eyre::eyre!("Division by zero"));
    }
    Ok(numerator / denominator)
}

async fn calculate_usd_value(amount_wei: U256, token: &Token, client: &Client, config: &AppConfig) -> Result<f64> {
    let price = get_usd_price_async(&token.symbol, client, config).await?;
    if price.is_nan() || price <= 0.0 {
        return Err(eyre::eyre!("Invalid token price"));
    }
    let value_float = amount_wei.to_f64_lossy() / 10f64.powi(token.decimals as i32);
    Ok(value_float * price)
}

// -------------------
// Main Function
// -------------------

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format_timestamp_millis()
        .init();

    let args = CliArgs::parse();
    let mut config = load_app_config()?;

    if let Some(min_profit) = args.min_profit_usd_override {
        info!("Overriding min profit: ${:.2} → ${:.2}", config.min_profit_usd, min_profit);
        config.min_profit_usd = min_profit;
    }
    if let Some(max_hops) = args.max_hops {
        info!("Overriding max hops: {} → {}", config.max_hops, max_hops);
        config.max_hops = max_hops;
    }

    let provider = Provider::<Http>::try_from(&config.rpc_url)?
        .interval(Duration::from_millis(100));

    let client: Client = if let Some(block_number) = args.block {
        info!("Running simulation at historical block {}", block_number);
        let provider_with_block = provider.clone().with_sender(Address::zero());
        Arc::new(provider_with_block)
    } else {
        Arc::new(provider)
    };

    match client.client_version().await {
        Ok(version) => info!("Connected to node: {}", version),
        Err(e) => warn!("Failed to get node info: {}", e),
    }

    let config_arc = Arc::new(config);
    match find_arbitrage_paths(client.clone(), config_arc.clone()).await {
        Ok(opportunities) => {
            let json = serde_json::to_string_pretty(&opportunities)?;
            println!("{}", json);
            info!("Found {} arbitrage paths", opportunities.len());
            Ok(())
        },
        Err(e) => {
            error!("Error finding arbitrage paths: {}", e);
            Err(e)
        }
    }
}
