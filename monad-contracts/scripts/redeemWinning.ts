import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Redeeming as:", signer.address);

  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  if (!marketAddr) throw new Error("Missing MARKET_1 in .env");

  const BinaryMarket = await ethers.getContractAt("BinaryMarket", marketAddr);

  // Check market status
  const resolved = await BinaryMarket.resolved();
  if (!resolved) {
    throw new Error("Market not yet resolved");
  }

  const winningOutcome = await BinaryMarket.winningOutcome();
  console.log(`Winning outcome: ${winningOutcome === 1 ? "YES" : "NO"}`);

  // Pick correct outcome token (YES or NO)
  const tokenAddr =
    winningOutcome === 1
      ? await BinaryMarket.tokenYes()
      : await BinaryMarket.tokenNo();

  const token = await ethers.getContractAt("OutcomeToken", tokenAddr);
  const balance = await token.balanceOf(signer.address);

  if (balance.eq(0)) {
    throw new Error("You have no winning tokens to redeem");
  }

  console.log(
    `Redeeming ${ethers.utils.formatUnits(balance, 18)} tokens for collateral...`
  );

  const tx = await BinaryMarket.redeem(balance);
  await tx.wait();

  console.log("✅ Redemption successful. Collateral claimed!");
}

main().catch((err) => {
  console.error("Error redeeming winnings:", err);
  process.exitCode = 1;
});
