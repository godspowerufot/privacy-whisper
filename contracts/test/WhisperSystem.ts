import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { 
  AccessControlManager, 
  WhisperCaseManager, 
  WhisperVault, 
  RewardManager, 
  WhisperStats, 
  AuditTrail,
  AccessControlManager__factory,
  WhisperCaseManager__factory,
  WhisperVault__factory,
  RewardManager__factory,
  WhisperStats__factory,
  AuditTrail__factory
} from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  journalist: HardhatEthersSigner;
  whisperer: HardhatEthersSigner;
  admin: HardhatEthersSigner;
  other: HardhatEthersSigner;
};

async function deployFixture() {
  const ethSigners = await ethers.getSigners();
  const signers: Signers = {
    deployer: ethSigners[0],
    journalist: ethSigners[1],
    whisperer: ethSigners[2],
    admin: ethSigners[3],
    other: ethSigners[4],
  };

  // 1. AccessControl
  const acmFactory = (await ethers.getContractFactory("AccessControlManager")) as AccessControlManager__factory;
  const accessControl = (await acmFactory.deploy(signers.admin.address)) as AccessControlManager;
  const acmAddress = await accessControl.getAddress();

  // 2. CaseManager
  const wcmFactory = (await ethers.getContractFactory("WhisperCaseManager")) as WhisperCaseManager__factory;
  const caseManager = (await wcmFactory.deploy(acmAddress)) as WhisperCaseManager;
  const wcmAddress = await caseManager.getAddress();

  // 3. AuditTrail
  const atFactory = (await ethers.getContractFactory("AuditTrail")) as AuditTrail__factory;
  const auditTrail = (await atFactory.deploy(acmAddress)) as AuditTrail;
  const atAddress = await auditTrail.getAddress();

  // 4. Stats
  const statsFactory = (await ethers.getContractFactory("WhisperStats")) as WhisperStats__factory;
  const stats = (await statsFactory.deploy(acmAddress)) as WhisperStats;
  const statsAddress = await stats.getAddress();

  // 5. Vault
  const vaultFactory = (await ethers.getContractFactory("WhisperVault")) as WhisperVault__factory;
  const vault = (await vaultFactory.deploy(wcmAddress, acmAddress)) as WhisperVault;
  const vaultAddress = await vault.getAddress();

  // 6. RewardManager
  const rmFactory = (await ethers.getContractFactory("RewardManager")) as RewardManager__factory;
  const rewardManager = (await rmFactory.deploy(wcmAddress, acmAddress)) as RewardManager;
  const rmAddress = await rewardManager.getAddress();

  // --- SYSTEM AUTHORIZATION ---
  // Grant DEFAULT_ADMIN_ROLE to system contracts so they can update stats & audit trail
  const DEFAULT_ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();
  await accessControl.connect(signers.admin).grantRole(DEFAULT_ADMIN_ROLE, wcmAddress);
  await accessControl.connect(signers.admin).grantRole(DEFAULT_ADMIN_ROLE, vaultAddress);
  await accessControl.connect(signers.admin).grantRole(DEFAULT_ADMIN_ROLE, rmAddress);

  // Grant JOURNALIST_ROLE to the test journalist
  await accessControl.connect(signers.admin).addJournalist(signers.journalist.address);

  // Wiring
  await caseManager.connect(signers.admin).setVault(vaultAddress);
  await caseManager.connect(signers.admin).setStats(statsAddress);
  await vault.connect(signers.admin).setStats(statsAddress);
  await rewardManager.connect(signers.admin).setStats(statsAddress);

  return { 
    signers, 
    accessControl, 
    caseManager, 
    auditTrail, 
    stats, 
    vault, 
    rewardManager, 
    addr: { acm: acmAddress, wcm: wcmAddress, at: atAddress, stats: statsAddress, vault: vaultAddress, rm: rmAddress } 
  };
}

describe("Whisperer System Exhaustive Unit Tests", function () {
  let signers: Signers;
  let accessControl: AccessControlManager;
  let caseManager: WhisperCaseManager;
  let auditTrail: AuditTrail;
  let stats: WhisperStats;
  let vault: WhisperVault;
  let rewardManager: RewardManager;
  let addr: any;

  beforeEach(async function () {
    const fixture = await deployFixture();
    signers = fixture.signers;
    accessControl = fixture.accessControl;
    caseManager = fixture.caseManager;
    auditTrail = fixture.auditTrail;
    stats = fixture.stats;
    vault = fixture.vault;
    rewardManager = fixture.rewardManager;
    addr = fixture.addr;
  });

  describe("Scenario 1: Access Control & Authorization", function () {
    it("verify INITIAL ROLES", async function () {
      expect(await accessControl.isAdmin(signers.admin.address)).to.be.true;
      expect(await accessControl.isJournalist(signers.journalist.address)).to.be.true;
    });

    it("verify SYSTEM CONTRACT AUTHORIZATION", async function () {
      const DEFAULT_ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();
      expect(await accessControl.hasRole(DEFAULT_ADMIN_ROLE, addr.wcm)).to.be.true;
      expect(await accessControl.hasRole(DEFAULT_ADMIN_ROLE, addr.vault)).to.be.true;
    });
  });

  describe("Scenario 2: Case Lifecycle (Success & Failure)", function () {
    it("should allow journalist to create a case", async function () {
      const encryptedName = await fhevm.createEncryptedInput(addr.wcm, signers.journalist.address).add256(1).encrypt();
      await expect(caseManager.connect(signers.journalist).createCase("T", "D", encryptedName.handles[0], encryptedName.inputProof))
        .to.emit(caseManager, "CaseCreated");
      
      const c = await caseManager.getCase(1);
      expect(c.isOpen).to.be.true;
      expect((await stats.userStats(signers.journalist.address)).managedCases).to.equal(1);
    });

    it("revert: NotJournalist creates case", async function () {
        const encryptedName = await fhevm.createEncryptedInput(addr.wcm, signers.other.address).add256(1).encrypt();
        await expect(caseManager.connect(signers.other).createCase("T", "D", encryptedName.handles[0], encryptedName.inputProof))
          .to.be.revertedWithCustomError(caseManager, "NotJournalist");
    });

    it("should allow closing case by authorized users", async function () {
        const encryptedName = await fhevm.createEncryptedInput(addr.wcm, signers.journalist.address).add256(1).encrypt();
        await caseManager.connect(signers.journalist).createCase("T", "D", encryptedName.handles[0], encryptedName.inputProof);
        
        await caseManager.connect(signers.journalist).closeCase(1);
        expect((await caseManager.getCase(1)).isOpen).to.be.false;
    });

    it("revert: Unauthorized closeCase", async function () {
        const encryptedName = await fhevm.createEncryptedInput(addr.wcm, signers.journalist.address).add256(1).encrypt();
        await caseManager.connect(signers.journalist).createCase("T", "D", encryptedName.handles[0], encryptedName.inputProof);
        await expect(caseManager.connect(signers.other).closeCase(1))
            .to.be.revertedWithCustomError(caseManager, "OnlyCaseJournalist");
    });
  });

  describe("Scenario 3: Whisper Submission & Reveal", function () {
    beforeEach(async function () {
        const encryptedName = await fhevm.createEncryptedInput(addr.wcm, signers.journalist.address).add256(1).encrypt();
        await caseManager.connect(signers.journalist).createCase("T", "D", encryptedName.handles[0], encryptedName.inputProof);
    });

    it("successful whisper submission", async function () {
        const encryptedInput = await fhevm.createEncryptedInput(addr.vault, signers.whisperer.address)
            .add256(123).add256(456).addAddress(signers.whisperer.address).add8(5).encrypt();
        
        await expect(vault.connect(signers.whisperer).submitWhisper(1, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.handles[2], encryptedInput.handles[3], encryptedInput.inputProof))
            .to.emit(vault, "WhisperSubmitted");
        
        expect(await vault.getWhisperCount(1)).to.equal(1);
        expect((await stats.userStats(signers.whisperer.address)).totalWhispers).to.equal(1);
    });

    it("revert: submit to closed case", async function () {
        await caseManager.connect(signers.journalist).closeCase(1);
        const encryptedInput = await fhevm.createEncryptedInput(addr.vault, signers.whisperer.address)
            .add256(1).add256(1).addAddress(signers.whisperer.address).add8(1).encrypt();
        await expect(vault.connect(signers.whisperer).submitWhisper(1, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.handles[2], encryptedInput.handles[3], encryptedInput.inputProof))
            .to.be.revertedWithCustomError(vault, "CaseAlreadyClosed");
    });

    it("reveal request: success", async function () {
        const encryptedInput = await fhevm.createEncryptedInput(addr.vault, signers.whisperer.address)
            .add256(1).add256(1).addAddress(signers.whisperer.address).add8(1).encrypt();
        await vault.connect(signers.whisperer).submitWhisper(1, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.handles[2], encryptedInput.handles[3], encryptedInput.inputProof);

        await expect(vault.connect(signers.journalist).requestWhisperReveal(1, 0))
            .to.emit(vault, "WhisperRevealRequested");
    });
  });

  describe("Scenario 4: Rewards & Payments", function () {
    beforeEach(async function () {
        const encryptedName = await fhevm.createEncryptedInput(addr.wcm, signers.journalist.address).add256(1).encrypt();
        await caseManager.connect(signers.journalist).createCase("T", "D", encryptedName.handles[0], encryptedName.inputProof);
    });

    it("full reward lifecycle", async function () {
        const encryptedAmount = await fhevm.createEncryptedInput(addr.rm, signers.journalist.address).add256(1000).encrypt();
        await rewardManager.connect(signers.journalist).approveReward(1, encryptedAmount.handles[0], encryptedAmount.inputProof);
        
        await expect(rewardManager.connect(signers.journalist).distributeReward(1, signers.whisperer.address))
            .to.emit(rewardManager, "RewardDistributed");
        
        expect((await stats.userStats(signers.whisperer.address)).totalEarned).to.equal(1000);
        expect((await stats.userStats(signers.journalist.address)).totalBountiesPaid).to.equal(1000);
    });

    it("revert: double approval", async function () {
        const encryptedAmount = await fhevm.createEncryptedInput(addr.rm, signers.journalist.address).add256(1000).encrypt();
        await rewardManager.connect(signers.journalist).approveReward(1, encryptedAmount.handles[0], encryptedAmount.inputProof);
        await expect(rewardManager.connect(signers.journalist).approveReward(1, encryptedAmount.handles[0], encryptedAmount.inputProof))
            .to.be.revertedWithCustomError(rewardManager, "RewardAlreadyApproved");
    });
  });
});
