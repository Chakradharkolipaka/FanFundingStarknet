/**
 * StarkNet deployment script using starknet.js
 *
 * Prerequisites:
 *   1. Build the Cairo contract: cd contracts/cairo && scarb build
 *   2. Set environment variables:
 *      - STARKNET_PRIVATE_KEY
 *      - STARKNET_ACCOUNT_ADDRESS
 *      - STARKNET_RPC_URL (optional, defaults to Sepolia)
 *
 * Usage:
 *   node scripts/deploy-starknet.mjs
 */

import { Account, RpcProvider, json, hash, CallData, stark, ec, constants } from "starknet";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Use Blast public RPC as primary (full V3 support), Alchemy as fallback
const RPC_URL =
  process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io/rpc/v0_7";

async function main() {
  console.log("🚀 Starting StarkNet deployment...\n");

  // 1. Validate env
  const privateKey = process.env.STARKNET_PRIVATE_KEY;
  const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

  if (!privateKey || !accountAddress) {
    console.error(
      "❌ Missing STARKNET_PRIVATE_KEY or STARKNET_ACCOUNT_ADDRESS in .env.local"
    );
    process.exit(1);
  }

  // 2. Setup provider & account
  const provider = new RpcProvider({
    nodeUrl: RPC_URL,
  });

  // Check chain
  try {
    const chainId = await provider.getChainId();
    console.log("🔗 Chain ID:", chainId);
  } catch (e) {
    console.warn("⚠️  Could not fetch chain ID, continuing anyway...");
  }

  // Pass V3 to force V3 transactions (STRK fee token)
  const account = new Account(provider, accountAddress, privateKey, undefined, constants.TRANSACTION_VERSION.V3);
  console.log("📡 RPC:", RPC_URL);
  console.log("👤 Account:", accountAddress);
  console.log("🔄 Transaction version: V3 (STRK fees)");

  // Verify account exists on-chain
  try {
    const nonce = await provider.getNonceForAddress(accountAddress);
    console.log("🔢 Account nonce:", nonce);
  } catch (e) {
    console.error("❌ Account not found on-chain. Deploy your wallet account first.");
    process.exit(1);
  }

  // 3. Load compiled contract artifacts
  const sierraPath = path.resolve(
    "contracts/cairo/target/dev/fan_funding_starknet_NFTDonation.contract_class.json"
  );
  const casmPath = path.resolve(
    "contracts/cairo/target/dev/fan_funding_starknet_NFTDonation.compiled_contract_class.json"
  );

  if (!fs.existsSync(sierraPath) || !fs.existsSync(casmPath)) {
    console.error(
      "❌ Contract artifacts not found. Run 'cd contracts/cairo && scarb build' first."
    );
    process.exit(1);
  }

  const sierra = json.parse(fs.readFileSync(sierraPath, "utf-8"));
  const casm = json.parse(fs.readFileSync(casmPath, "utf-8"));
  console.log("📦 Contract artifacts loaded.\n");

  // 4. Compute class hash and compiled class hash
  const classHash = hash.computeSierraContractClassHash(sierra);
  const compiledClassHash = hash.computeCompiledClassHash(casm);
  console.log("📋 Sierra class hash:", classHash);
  console.log("📋 Compiled (CASM) class hash:", compiledClassHash);

  let alreadyDeclared = false;
  try {
    await provider.getClassByHash(classHash);
    alreadyDeclared = true;
    console.log("   ℹ️  Class already declared, skipping declaration.\n");
  } catch {
    // Not declared yet, proceed
  }

  if (!alreadyDeclared) {
    console.log("📝 Declaring contract class...");
    try {
      const declareResponse = await account.declare({
        contract: sierra,
        casm,
        compiledClassHash,
      });
      console.log("   Class hash:", declareResponse.class_hash);
      console.log("   Tx hash:", declareResponse.transaction_hash);
      console.log("   Waiting for confirmation...");
      await provider.waitForTransaction(declareResponse.transaction_hash);
      console.log("   ✅ Declaration confirmed!\n");
    } catch (err) {
      // If it fails because already declared, continue
      if (err.message && err.message.includes("already declared")) {
        console.log("   ℹ️  Class was already declared, continuing...\n");
      } else {
        throw err;
      }
    }
  }

  // 5. Deploy
  console.log("🏗️  Deploying contract...");
  const deployResponse = await account.deployContract({
    classHash: classHash,
    constructorCalldata: [],
    salt: stark.randomAddress(),
  });
  console.log("   Contract address:", deployResponse.contract_address);
  console.log("   Tx hash:", deployResponse.transaction_hash);
  console.log("   Waiting for confirmation...");
  await provider.waitForTransaction(deployResponse.transaction_hash);
  console.log("   ✅ Deployment confirmed!\n");

  console.log("═══════════════════════════════════════════");
  console.log("  ✅ Contract deployed successfully!");
  console.log(`  📍 Address: ${deployResponse.contract_address}`);
  console.log(
    `  🔍 Voyager: https://sepolia.voyager.online/contract/${deployResponse.contract_address}`
  );
  console.log("═══════════════════════════════════════════");
  console.log(
    "\n📝 Set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env.local to:",
    deployResponse.contract_address
  );
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
