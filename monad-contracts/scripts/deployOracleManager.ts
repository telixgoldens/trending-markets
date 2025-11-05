import { ethers } from "hardhat";

async function main() {
  const disputeWindow = 3600; // 1 hour window
  const OracleManager = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy(disputeWindow);

  await oracleManager.deployed();
  console.log("✅ OracleManager deployed at:", oracleManager.address);
  console.log("Dispute window (secs):", disputeWindow);
}

main().catch((error) => {
  console.error("Error deploying OracleManager:", error);
  process.exitCode = 1;
});
