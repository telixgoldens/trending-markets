import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [user] = await ethers.getSigners();

  const routerAddress = process.env.AGGREGATOR_ROUTER!;
  const collateralAddress = process.env.ERC20_ADDRESS!;
  const marketAddress = process.env.SAMPLE_MARKET_ADDRESS!;
  
  if (!routerAddress || !collateralAddress || !marketAddress) {
    throw new Error("Missing required addresses in .env");
  }

  const Router = await ethers.getContractAt("AggregatorRouter", routerAddress);
  const Collateral = await ethers.getContractAt("IERC20", collateralAddress);
  const Market = await ethers.getContractAt("BinaryMarket", marketAddress);

  try {
    const isResolved = await Market.resolved();
    if (isResolved) throw new Error("Market already resolved — aborting buy");
  } catch (e: any) {
    if (e.message && e.message.includes("already resolved")) throw e;
  }

  const userBalance = await Collateral.balanceOf(user.address);
  const collateralIn = ethers.utils.parseUnits("100", 18);

  console.log("\nPre-flight checks:");
  console.log("User:", user.address);
  console.log("Router:", routerAddress);
  console.log("Market:", marketAddress);
  console.log("Collateral:", collateralAddress);
  console.log(`User collateral balance: ${ethers.utils.formatUnits(userBalance, 18)}`);
  console.log(`Amount trying to spend: ${ethers.utils.formatUnits(collateralIn, 18)}`);

  const marketCollateral = await Market.collateral();
  const yesToken = await Market.tokenYes();
  const noToken = await Market.tokenNo();
  const reserves = await Market.getReserves();
  
  console.log("\nMarket info:");
  console.log("Market collateral:", marketCollateral);
  console.log("Yes token:", yesToken);
  console.log("No token:", noToken);
  console.log("Yes reserve:", ethers.utils.formatUnits(reserves[0], 18));
  console.log("No reserve:", ethers.utils.formatUnits(reserves[1], 18));

  const allowance = await Collateral.allowance(user.address, routerAddress);
  console.log("\nAllowance:", ethers.utils.formatUnits(allowance, 18));
  
  if (allowance.lt(collateralIn)) {
    console.log("Approving router...");
    const approveTx = await Collateral.approve(routerAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
    console.log("Approval confirmed");
  }

  console.log("\nExecuting buy...");
  const buyTx = await Router.routeBuy([marketAddress], 1, collateralIn, 0, {
    gasLimit: 500000
  });
  
  console.log("Transaction sent:", buyTx.hash);
  const receipt = await buyTx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
}

main().catch((err) => {
  console.error("\nBuy failed:", err);
  process.exit(1);
});