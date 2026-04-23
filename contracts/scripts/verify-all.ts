/**
 * verify-all.ts
 * Reads deployed-addresses.json and verifies every contract on Etherscan.
 * Usage: npx hardhat run scripts/verify-all.ts --network sepolia
 */
import * as fs from "fs";
import * as path from "path";
import { run } from "hardhat";

async function main() {
  const addressFile = path.join(__dirname, "..", "..", "deployed-addresses.json");
  if (!fs.existsSync(addressFile)) {
    throw new Error(`deployed-addresses.json not found at ${addressFile}. Run deploy first.`);
  }

  const data = JSON.parse(fs.readFileSync(addressFile, "utf-8"));
  const { contracts, deployer } = data;

  console.log(`\nVerifying contracts from deployment on ${data.network} (chainId: ${data.chainId})`);
  console.log(`Deployed at: ${data.deployedAt}\n`);

  // Constructor args for each contract
  const verifyConfigs: Array<{ name: string; address: string; constructorArguments: unknown[] }> = [
    {
      name: "AccessControlManager",
      address: contracts.AccessControlManager.address,
      constructorArguments: [deployer],
    },
    {
      name: "WhisperCaseManager",
      address: contracts.WhisperCaseManager.address,
      constructorArguments: [contracts.AccessControlManager.address],
    },
    {
      name: "AuditTrail",
      address: contracts.AuditTrail.address,
      constructorArguments: [contracts.AccessControlManager.address],
    },
    {
      name: "WhisperStats",
      address: contracts.WhisperStats.address,
      constructorArguments: [contracts.AccessControlManager.address],
    },
    {
      name: "WhisperVault",
      address: contracts.WhisperVault.address,
      constructorArguments: [contracts.WhisperCaseManager.address, contracts.AccessControlManager.address],
    },
    {
      name: "RewardManager",
      address: contracts.RewardManager.address,
      constructorArguments: [contracts.WhisperCaseManager.address, contracts.AccessControlManager.address],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, address, constructorArguments } of verifyConfigs) {
    try {
      console.log(`Verifying ${name} at ${address}...`);
      await run("verify:verify", { address, constructorArguments });
      console.log(`  ✅ ${name} verified!\n`);
      passed++;
    } catch (err: any) {
      if (err.message?.includes("Already Verified") || err.message?.includes("already verified")) {
        console.log(`  ✅ ${name} already verified.\n`);
        passed++;
      } else {
        console.error(`  ❌ ${name} verification failed: ${err.message}\n`);
        failed++;
      }
    }
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(` Verification complete: ${passed} passed, ${failed} failed`);
  console.log(`═══════════════════════════════════\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
