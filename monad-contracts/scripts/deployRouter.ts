import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AggregatorRouter with account:", deployer.address);
  console.log("Balance:", (await deployer.getBalance()).toString());

  const Factory = await ethers.getContractFactory("AggregatorRouter");
  const router = await Factory.deploy();
  await router.deployed();

  console.log("✅ AggregatorRouter deployed at:", router.address);
  console.log("Update your .env: AGGREGATOR_ROUTER=" + router.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});