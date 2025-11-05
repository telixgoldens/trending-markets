import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  if (!marketAddr) throw new Error("Missing SAMPLE_MARKET_ADDRESS in .env");

  const [signer] = await ethers.getSigners();
  console.log("🔍 Checking market resolution status...");
  console.log("Market address:", marketAddr);

  const BinaryMarket = await ethers.getContractAt("BinaryMarket", marketAddr);
  const question = await BinaryMarket.question();
  console.log(`Question: ${question}`);

  let finalized = false;
  let outcome: string | undefined;

  try {
    finalized = await BinaryMarket.finalized();
  } catch {
    try {
      finalized = await BinaryMarket.resolved();
    } catch {
      try {
        finalized = await BinaryMarket.isResolved();
      } catch {
        console.log("⚠️ No finalized/resolved flag found in contract.");
      }
    }
  }

  if (finalized) {
    try {
      const res = await BinaryMarket.resolvedOutcome();
      outcome = res.toString();
    } catch {
      try {
        const res = await BinaryMarket.winningOutcome();
        outcome = res.toString();
      } catch {
        console.log("⚠️ Could not read outcome variable.");
      }
    }
  }

  if (finalized) {
    console.log(`✅ Market finalized. Outcome: ${outcome === "1" ? "YES" : "NO"}`);
  } else {
    console.log("⏳ Market not yet finalized.");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exitCode = 1;
});
