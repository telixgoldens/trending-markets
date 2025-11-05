import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const collateral = process.env.ERC20_ADDRESS;
  if (!collateral) throw new Error("Missing ERC20_ADDRESS in .env");

  // Addresses of already deployed contracts
  const marketFactoryAddress = process.env.MARKET_FACTORY_ADDRESS; // 0xF8756f33D41064F401F226140cC0266648EDD749

  if (!marketFactoryAddress) throw new Error("MARKET_FACTORY_ADDRESS missing in .env");

  console.log("Deploying LiquidityVault...");
  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const vault = await LiquidityVault.deploy(collateral, deployer.address);
  await vault.deployed();
  console.log("LiquidityVault deployed at:", vault.address);

  console.log("Deploying AggregatorRouter...");
  const AggregatorRouter = await ethers.getContractFactory("AggregatorRouter");
  const aggregator = await AggregatorRouter.deploy();
  await aggregator.deployed();
  console.log("AggregatorRouter deployed at:", aggregator.address);

  // Optional: Pre-configure aggregator markets
  // Example: const sampleMarket = "0x9450904f8e90fAd32e3f3157A38EFB6A090Cb0D4";
  // You can add markets in frontend or via a setter function if you add one in AggregatorRouter
  console.log("\n Deployment Complete:");
  console.log("LiquidityVault:", vault.address);
  console.log("AggregatorRouter:", aggregator.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
