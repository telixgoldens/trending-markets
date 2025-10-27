import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Validate environment variables
  const collateral = process.env.ERC20_ADDRESS;
  if (!collateral) throw new Error("Missing ERC20_ADDRESS in .env");

  // Market parameters with defaults
  const question = process.env.QUESTION || "Default prediction question";
  const expiration = process.env.EXPIRATION
    ? parseInt(process.env.EXPIRATION)
    : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  
    const yesName = process.env.YES_NAME || "Yes Token";
  const yesSymbol = process.env.YES_SYMBOL || "YES";
  const noName = process.env.NO_NAME || "No Token";
  const noSymbol = process.env.NO_SYMBOL || "NO";

  console.log("\nDeployment parameters:");
  console.log("Question:", question);
  console.log("Expiration:", new Date(expiration * 1000).toLocaleString());
  console.log("Collateral:", collateral);

  // 1. Deploy OracleManager
  console.log("\nDeploying OracleManager...");
  const OracleManager = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy(deployer.address);
  await oracleManager.deployed();
  console.log("OracleManager deployed to:", oracleManager.address);

  // 2. Deploy MarketFactory
  console.log("\nDeploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(deployer.address, collateral);
  await marketFactory.deployed();
  console.log("MarketFactory deployed to:", marketFactory.address);

  // 3. Link contracts
  console.log("\nLinking contracts...");
  try {
    const txReg = await marketFactory.setOracleManager(oracleManager.address);
    await txReg.wait();
    console.log("Linked MarketFactory -> OracleManager");
  } catch (e) {
    console.error("Failed to link contracts:", e);
    throw e;
  }

  // 4. Create sample market
  console.log("\nCreating sample market...");
  const tx = await marketFactory.createMarket(
    question,
    expiration,
    yesName,
    yesSymbol,
    noName,
    noSymbol
  );
  console.log("Transaction sent:", tx.hash);
  
  const receipt = await tx.wait();
  const event = receipt.events?.find((e: any) => e.event === "MarketCreated");
  if (!event) throw new Error("MarketCreated event not found");

  const marketAddress = event.args[0];
  console.log("Sample market deployed to:", marketAddress);

  // Summary
  console.log("\n📝 Deployment Summary:");
  console.log("OracleManager:", oracleManager.address);
  console.log("MarketFactory:", marketFactory.address);
  console.log("Sample Market:", marketAddress);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
