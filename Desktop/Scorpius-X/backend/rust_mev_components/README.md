# MEV-Bot: Arbitrage + Flashloan + Liquidation Automation

## 🧠 Features

- Flashbots bundle sending with real-time simulation
- Aave V3 Flashloan arbitrage with multi-hop routing
- Chainlink and Aave oracle monitoring for liquidation safety
- ML model scoring using scikit-learn (joblib)
- Rust core engine for lightning-fast pathfinding
- Structured logging, retry logic, and modular strategy engine

## 📁 Project Structure

- `contracts/` — Smart contracts (Solidity) for deployment
- `deployments/` — ABI/bytecode artifacts used by Python
- `scripts/` — Hardhat scripts (e.g., `deploy.js`)
- `rust_core/` — Arbitrage scanner core in Rust
- `python_bot/` — Bot logic, ML, and strategy pipeline
  - `core/` — Main execution engine
  - `ml/` — Model logic and training
  - `utils/` — Logging & support
  - `runners/` — Standalone test runners
- `abis/` — ABI JSONs for DEXs, Aave, ERC20, etc.
- `config/` — `.env` and optional config JSONs

## 🚀 Quickstart

```bash
# 1. Compile Rust engine
cd rust_core
cargo build --release

# 2. Setup Python
cd ..
pip install -r requirements.txt

# 3. Set environment
cp config/.env .env  # customize keys and RPC

# 4. Run main bot
python3 python_bot/core/mev_bot.py
```

## 🔐 Environment Variables (.env)

```
PRIVATE_KEY=0x...
RPC_URL=https://mainnet...
FLASHLOAN_CONTRACT_ADDRESS=0x...
MEV_RUST_BIN=./rust_core/target/release/mev_rust_core
RUST_CHAIN=mainnet
RUST_MAX_HOPS=3
```

## 📊 Logging

- `logs/mev_bot_combined.log` — Main log output
- `logs/mev_bot_error.log` — Error-only
- `arbitrage_log.csv` — Optional CSV for arb profits

## ⚙️ ML + Simulation

- ML predictions are scored per opportunity
- Trained model file: `model.joblib`
- Use `train_model_local.py` to retrain

## 🧪 Testing

- Run `dryrun_runner_ml_live.py` to simulate and log opportunities
- Use Rust binary directly for CLI scans:
```bash
./rust_core/target/release/mev_rust_core --chain mainnet --max-hops 3 --block 19500000
```

## 🛠 Contracts (Solidity)

Deployed via Hardhat:
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

Make sure to update `config/.env` and ABI paths as needed.

---

## 🧬 Powered By

- Rust + Tokio for fast parallel pathfinding
- Flashbots for private execution
- Aave/Chainlink for DeFi integrations
- Python async stack for ML and strategy glue

---

Built with ❤️ by a sniper for snipers.