// scripts/interact.ts
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load env
  const marketAddress = process.env.MARKET_ADDRESS as string;
  const mockAddress = process.env.COLLATERAL_ADDRESS as string;

  if (!marketAddress || !mockAddress) {
    throw new Error("Please set MARKET_ADDRESS and COLLATERAL_ADDRESS in .env");
  }

  // Attach to contracts
  const market = await ethers.getContractAt("BinaryMarket", marketAddress);
  const mock = await ethers.getContractAt("MockERC20", mockAddress);

  console.log("BinaryMarket:", marketAddress);
  console.log("MockERC20:", mockAddress);

  // Check balances
  let balance = await mock.balanceOf(deployer.address);
  console.log("Initial MockERC20 balance:", ethers.utils.formatUnits(balance, 18));

  // 1. Approve collateral
  const approveTx = await mock.approve(marketAddress, ethers.utils.parseUnits("1000", 18));
  await approveTx.wait();
  console.log("Approved 1000 tokens to BinaryMarket");

  // 2. Add liquidity (50 YES / 50 NO)
  const liquidityTx = await market.addLiquidity(
    ethers.utils.parseUnits("50", 18),
    ethers.utils.parseUnits("50", 18)
  );
  await liquidityTx.wait();
  console.log("Added liquidity (50 YES + 50 NO)");

  // 3. Buy YES outcome (10 tokens)
  const buyTx = await market.buy(0, ethers.utils.parseUnits("10", 18), 0);
  await buyTx.wait();
  console.log("Bought 10 YES tokens");

  // 4. Check balances again
  balance = await mock.balanceOf(deployer.address);
  console.log("Final MockERC20 balance:", ethers.utils.formatUnits(balance, 18));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
