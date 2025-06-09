// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox"); // Use the latest toolbox
require("dotenv").config();

// --- Environment Variables ---
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || process.env.RPC_URL || ""; // <-- Corrected line
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL || "";
const BSC_RPC_URL = process.env.BSC_RPC_URL || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

// Check keys/URLs
if (!DEPLOYER_PRIVATE_KEY) console.warn("⚠️ DEPLOYER_PRIVATE_KEY missing");
if (!MAINNET_RPC_URL) console.warn("⚠️ MAINNET_RPC_URL missing");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19", // For your main contract
        settings: { optimizer: { enabled: true, runs: 200 } }
      },
      {
        version: "0.8.20", // For OpenZeppelin v5+ dependencies
        settings: { optimizer: { enabled: true, runs: 200 } }
      }
    ],
  },
  networks: {
     hardhat: {
          chainId: 31337,
          forking: {
              url: MAINNET_RPC_URL || "https://rpc.ankr.com/eth", // Fallback
              enabled: process.env.HARDHAT_FORK === "true",
          },
          gasPrice: "auto",
     },
     localhost: {
         url: "http://127.0.0.1:8545/",
         chainId: 31337,
     },
     mainnet: {
          url: MAINNET_RPC_URL,
          accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
          chainId: 1,
      },
      arbitrumOne: {
          url: ARBITRUM_RPC_URL,
          accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
          chainId: 42161,
      },
      bsc: {
          url: BSC_RPC_URL,
          accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
          chainId: 56,
      },
      // Add other networks like sepolia, base, optimism, polygon...
      // sepolia: { /* ... */ },
   },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      // Add others
    },
    // customChains: [ /* ... */ ]
  },
  gasReporter: {
      enabled: process.env.REPORT_GAS === "true",
      currency: "USD",
      coinmarketcap: process.env.COINMARKETCAP_API_KEY || null,
   },
  paths: {
      sources: "./contracts", tests: "./test", cache: "./cache", artifacts: "./artifacts",
   },
  mocha: {
      timeout: process.env.MOCHA_TIMEOUT ? parseInt(process.env.MOCHA_TIMEOUT) : 400000
  }
};