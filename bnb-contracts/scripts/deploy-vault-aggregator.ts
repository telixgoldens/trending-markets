import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const collateral = process.env.ERC20_ADDRESS;
  if (!collateral) throw new Error("Missing ERC20_ADDRESS in .env");

  const marketFactoryAddress = process.env.MARKET_FACTORY_ADDRESS; 

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

  
  console.log("\n Deployment Complete:");
  console.log("LiquidityVault:", vault.address);
  console.log("AggregatorRouter:", aggregator.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
