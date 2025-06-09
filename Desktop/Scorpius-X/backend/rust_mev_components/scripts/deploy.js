// scripts/deploy.js
const hre = require("hardhat");
const ethers = hre.ethers; // Use ethers provided by Hardhat environment (v6 compatible)
const fs = require('fs');
const path = require('path');

// Minimal ABI for PoolAddressesProvider
const poolAddressesProviderAbi = [ "function getPool() external view returns (address)" ];
// Minimal ABI for deployed contract interaction test
const deployedContractAbi = [ "function owner() external view returns (address)", "function POOL() external view returns (address)" ];

async function main() {
  console.log("\n--- Starting Deployment ---");

  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer Account: ${deployer.address}`);

  try {
      const balanceWei = await provider.getBalance(deployer.address);
      console.log(`Deployer Balance: ${ethers.formatEther(balanceWei)} ETH`);
  } catch (e) { console.warn(`Could not fetch deployer balance: ${e.message}`); }

  const aaveProviderAddr = process.env.AAVE_POOL_PROVIDER_ADDRESS || "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
  const wethAddr = process.env.WETH_ADDRESS || "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  console.log(`Using Aave Pool Provider: ${aaveProviderAddr}`);
  console.log(`Using WETH Address: ${wethAddr}`);

  // --- FIX: Use ethers.isAddress for Ethers v6 ---
  if (!ethers.isAddress(aaveProviderAddr) || !ethers.isAddress(wethAddr)) {
      throw new Error("Invalid AAVE_POOL_PROVIDER_ADDRESS or WETH_ADDRESS format in .env or script defaults.");
  }
  // --- End Fix ---

  // Pre-Deployment Check (Optional but Recommended)
  try {
      console.log("Checking Aave Pool Provider validity...");
      const poolAddressProviderContract = new ethers.Contract(aaveProviderAddr, poolAddressesProviderAbi, provider);
      const poolAddress = await poolAddressProviderContract.getPool();
      console.log(`   -> Found Aave Pool Address: ${poolAddress}`);
      if (poolAddress === ethers.ZeroAddress) { // Use ethers.ZeroAddress in v6
          throw new Error("Aave Pool Provider returned ZERO ADDRESS for the Pool!");
      }
      console.log("✅ Aave Pool Provider seems valid.");
  } catch (error) { /* ... error handling ... */ process.exit(1); }

  // --- Deploy Contract ---
  const ContractFactory = await ethers.getContractFactory("AaveV3FlashLoanArbMultiHop");
  console.log("\nDeploying AaveV3FlashLoanArbMultiHop...");

  let contract;
  try {
      contract = await ContractFactory.deploy(aaveProviderAddr, wethAddr);
      const deployTx = contract.deploymentTransaction(); // Use deploymentTransaction() in v6
      if (!deployTx) throw new Error("Deployment transaction not found");
      console.log(`   Deploy transaction sent: ${deployTx.hash}`);
      console.log("   Waiting for deployment confirmation (1 block)...");
      const deployReceipt = await deployTx.wait(1);
      if (!deployReceipt) throw new Error("Deployment receipt not found");
      console.log("✅ Contract successfully deployed!");
      const deployedAddress = await contract.getAddress(); // Use getAddress() in v6
      console.log(`   Contract Address: ${deployedAddress}`);
      console.log(`   Block Number: ${deployReceipt.blockNumber}`);
      console.log(`   Gas Used: ${deployReceipt.gasUsed.toString()}`);

  } catch (error) { /* ... error handling ... */ process.exit(1); }

  // --- Post-Deployment Interaction Test (Optional) ---
  console.log("\nTesting basic contract interaction...");
  try {
       const deployedAddress = await contract.getAddress(); // Get address again or reuse
       const deployedContractInstance = new ethers.Contract(deployedAddress, deployedContractAbi, provider);
       const ownerAddress = await deployedContractInstance.owner();
       const poolAddressFromContract = await deployedContractInstance.POOL();
       console.log(`   Successfully called owner(): ${ownerAddress}`);
       console.log(`   Successfully called POOL(): ${poolAddressFromContract}`);
       if (ownerAddress.toLowerCase() !== deployer.address.toLowerCase()) {
           console.warn("   ⚠️ Warning: Deployed contract owner doesn't match deployer address!");
       }
       console.log("✅ Basic interaction test passed.");
  } catch (interactError) { console.error("🚨 FAILED basic interaction test:", interactError.message); }


  // --- Save Artifacts (Optional) ---
  // saveFrontendFiles(contract);

  // --- Verification on Etherscan (Optional) ---
   const networkName = hre.network.name;
   if (networkName !== "hardhat" && networkName !== "localhost" && process.env.ETHERSCAN_API_KEY) {
       console.log("\nWaiting for block confirmations before verification (5 blocks)...");
       try {
           const deployedAddress = await contract.getAddress();
           const deployTx = contract.deploymentTransaction();
           if(deployTx) await deployTx.wait(5); // Wait on the transaction promise
           else await provider.waitForTransaction( (await contract.deploymentTransaction())?.hash ?? "", 5); // Fallback wait
           console.log("Attempting Etherscan verification...");
           await hre.run("verify:verify", {
               address: deployedAddress,
               constructorArguments: [aaveProviderAddr, wethAddr],
           });
           console.log("✅ Contract verified successfully!");
       } catch (error) { /* ... error handling ... */ }
   } else if (networkName !== "hardhat" && networkName !== "localhost") {
        console.log("\nSkipping Etherscan verification.");
   }

   console.log("\n--- Deployment Script Finished ---");
}

// --- Optional Helper Function ---
// function saveFrontendFiles(contract) { /* ... implementation ... */ }

// --- Execute Main Function ---
main()
  .then(() => process.exit(0))
  .catch((error) => { console.error("Unhandled error:", error); process.exit(1); });