import { ethers } from "hardhat";

async function main() {
  const ACM_ADDRESS = "0x3d686b8e88e5F6B10f0a8f24bB24Db0B0909AF29";
  const [deployer] = await ethers.getSigners();
  
  console.log("Calling registerJournalist from:", deployer.address);
  
  const acm = await ethers.getContractAt("AccessControlManager", ACM_ADDRESS);
  
  try {
    const tx = await acm.registerJournalist();
    console.log("Tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Success! Status:", receipt?.status);
  } catch (error: any) {
    console.error("Failed to register:");
    console.error(error.message);
    if (error.data) {
        console.error("Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
