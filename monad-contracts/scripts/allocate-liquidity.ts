import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [owner] = await ethers.getSigners();

  const vaultAddress = process.env.LIQUIDITY_VAULT!;
  const marketAddress = process.env.SAMPLE_MARKET_ADDRESS!;
  const yesAmount = ethers.utils.parseUnits("100", 18); // change as needed
  const noAmount = ethers.utils.parseUnits("100", 18);  // change as needed

  const Vault = await ethers.getContractAt("LiquidityVault", vaultAddress);

  console.log("Allocating liquidity from vault to market...\n");
  console.log(`Vault:   ${vaultAddress}`);
  console.log(`Market:  ${marketAddress}`);
  console.log(`Owner:   ${owner.address}`);
  console.log(`YES:     ${ethers.utils.formatUnits(yesAmount, 18)}`);
  console.log(`NO:      ${ethers.utils.formatUnits(noAmount, 18)}\n`);

  // must be vault owner
  const tx = await Vault.allocateToMarket(marketAddress, yesAmount, noAmount);
  await tx.wait();

  console.log(`Liquidity allocated successfully to ${marketAddress}`);
}

main().catch((err) => {
  console.error("Allocation failed:", err);
  process.exit(1);
});
