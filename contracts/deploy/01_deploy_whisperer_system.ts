import * as fs from "fs";
import * as path from "path";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying Whisperer System contracts from deployer:", deployer);

  // 1. AccessControlManager
  const acmDeploy = await deploy("AccessControlManager", {
    from: deployer,
    args: [deployer], // deployer becomes the default admin
    log: true,
  });
  console.log("AccessControlManager deployed to:", acmDeploy.address);

  // 2. WhisperCaseManager
  const wcmDeploy = await deploy("WhisperCaseManager", {
    from: deployer,
    args: [acmDeploy.address],
    log: true,
  });
  console.log("WhisperCaseManager deployed to:", wcmDeploy.address);

  // 3. AuditTrail
  const atDeploy = await deploy("AuditTrail", {
    from: deployer,
    args: [acmDeploy.address],
    log: true,
  });
  console.log("AuditTrail deployed to:", atDeploy.address);

  // 4. WhisperStats
  const statsDeploy = await deploy("WhisperStats", {
    from: deployer,
    args: [acmDeploy.address],
    log: true,
  });
  console.log("WhisperStats deployed to:", statsDeploy.address);

  // 5. WhisperVault
  const vaultDeploy = await deploy("WhisperVault", {
    from: deployer,
    args: [wcmDeploy.address, acmDeploy.address],
    log: true,
  });
  console.log("WhisperVault deployed to:", vaultDeploy.address);

  // 6. RewardManager
  const rmDeploy = await deploy("RewardManager", {
    from: deployer,
    args: [wcmDeploy.address, acmDeploy.address],
    log: true,
  });
  console.log("RewardManager deployed to:", rmDeploy.address);

  // --- SYSTEM AUTHORIZATION WIRING ---
  const { ethers } = hre;
  const accessControl = await ethers.getContractAt("AccessControlManager", acmDeploy.address);
  const DEFAULT_ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();

  // Check and Grant Roles (if not already granted)
  const isWcmAdmin = await accessControl.hasRole(DEFAULT_ADMIN_ROLE, wcmDeploy.address);
  if (!isWcmAdmin) {
    console.log("Granting DEFAULT_ADMIN_ROLE to WhisperCaseManager...");
    await (await accessControl.grantRole(DEFAULT_ADMIN_ROLE, wcmDeploy.address)).wait();
  }

  const isVaultAdmin = await accessControl.hasRole(DEFAULT_ADMIN_ROLE, vaultDeploy.address);
  if (!isVaultAdmin) {
    console.log("Granting DEFAULT_ADMIN_ROLE to WhisperVault...");
    await (await accessControl.grantRole(DEFAULT_ADMIN_ROLE, vaultDeploy.address)).wait();
  }

  const isRmAdmin = await accessControl.hasRole(DEFAULT_ADMIN_ROLE, rmDeploy.address);
  if (!isRmAdmin) {
    console.log("Granting DEFAULT_ADMIN_ROLE to RewardManager...");
    await (await accessControl.grantRole(DEFAULT_ADMIN_ROLE, rmDeploy.address)).wait();
  }

  // Wiring inter-contract dependencies
  const caseManager = await ethers.getContractAt("WhisperCaseManager", wcmDeploy.address);
  
  if ((await caseManager.vault()) !== vaultDeploy.address) {
    console.log("Setting Vault in WhisperCaseManager...");
    await (await caseManager.setVault(vaultDeploy.address)).wait();
  }
  
  if ((await caseManager.stats()) !== statsDeploy.address) {
    console.log("Setting Stats in WhisperCaseManager...");
    await (await caseManager.setStats(statsDeploy.address)).wait();
  }

  const vault = await ethers.getContractAt("WhisperVault", vaultDeploy.address);
  if ((await vault.stats()) !== statsDeploy.address) {
    console.log("Setting Stats in WhisperVault...");
    await (await vault.setStats(statsDeploy.address)).wait();
  }

  const rewardManager = await ethers.getContractAt("RewardManager", rmDeploy.address);
  if ((await rewardManager.stats()) !== statsDeploy.address) {
    console.log("Setting Stats in RewardManager...");
    await (await rewardManager.setStats(statsDeploy.address)).wait();
  }

  console.log("Whisperer System Deployment and Wiring Complete.");

  // ── Save all deployed addresses to JSON ─────────────────────────────────
  const network = hre.network.name;
  const chainId = hre.network.config.chainId ?? "unknown";

  const deployedAddresses = {
    network,
    chainId,
    deployedAt: new Date().toISOString(),
    deployer,
    contracts: {
      AccessControlManager: {
        address: acmDeploy.address,
        txHash: acmDeploy.transactionHash,
        newlyDeployed: acmDeploy.newlyDeployed,
      },
      WhisperCaseManager: {
        address: wcmDeploy.address,
        txHash: wcmDeploy.transactionHash,
        newlyDeployed: wcmDeploy.newlyDeployed,
      },
      AuditTrail: {
        address: atDeploy.address,
        txHash: atDeploy.transactionHash,
        newlyDeployed: atDeploy.newlyDeployed,
      },
      WhisperStats: {
        address: statsDeploy.address,
        txHash: statsDeploy.transactionHash,
        newlyDeployed: statsDeploy.newlyDeployed,
      },
      WhisperVault: {
        address: vaultDeploy.address,
        txHash: vaultDeploy.transactionHash,
        newlyDeployed: vaultDeploy.newlyDeployed,
      },
      RewardManager: {
        address: rmDeploy.address,
        txHash: rmDeploy.transactionHash,
        newlyDeployed: rmDeploy.newlyDeployed,
      },
    },
  };

  // Write to contracts/deployments/<network>/deployed-addresses.json
  const outDir = path.join(__dirname, "..", "deployments", network);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(deployedAddresses, null, 2));
  console.log(`\n📄 Deployed addresses saved to: ${outPath}`);

  // Also write a root-level copy for easy frontend consumption
  const rootOutPath = path.join(__dirname, "..", "..", "deployed-addresses.json");
  fs.writeFileSync(rootOutPath, JSON.stringify(deployedAddresses, null, 2));
  console.log(`📄 Root copy saved to: ${rootOutPath}`);

  // Print summary
  console.log("\n═══════════════════════════════════════════");
  console.log(" DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════════");
  console.log(`Network:              ${network} (chainId: ${chainId})`);
  console.log(`Deployer:             ${deployer}`);
  console.log(`AccessControlManager: ${acmDeploy.address}`);
  console.log(`WhisperCaseManager:   ${wcmDeploy.address}`);
  console.log(`AuditTrail:           ${atDeploy.address}`);
  console.log(`WhisperStats:         ${statsDeploy.address}`);
  console.log(`WhisperVault:         ${vaultDeploy.address}`);
  console.log(`RewardManager:        ${rmDeploy.address}`);
  console.log("═══════════════════════════════════════════\n");
};
export default func;
func.id = "deploy_whisperer_system";
func.tags = ["WhispererSystem"];
