import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [signer] = await ethers.getSigners();
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  const oracleManagerAddr = process.env.ORACLE_MANAGER!;

  if (!marketAddr || !oracleManagerAddr) {
    throw new Error("Missing SAMPLE_MARKET_ADDRESS or ORACLE_MANAGER in .env");
  }

  console.log("Setting Oracle for market...");
  console.log("Market:", marketAddr);
  console.log("New Oracle:", oracleManagerAddr);

  const BinaryMarket = await ethers.getContractAt("BinaryMarket", marketAddr);
  const tx = await BinaryMarket.setOracle(oracleManagerAddr);
  await tx.wait();

  console.log(` Oracle set to OracleManager: ${oracleManagerAddr}`);
}

main().catch((err) => {
  console.error("Error setting oracle:", err);
  process.exitCode = 1;
});
