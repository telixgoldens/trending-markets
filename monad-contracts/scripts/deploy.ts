import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Load env vars
  const collateral = process.env.COLLATERAL_ADDRESS;
  if (!collateral) {
    throw new Error("❌ Missing COLLATERAL_ADDRESS in .env");
  }

  const question = process.env.QUESTION || "Default prediction question";
  const expiration = process.env.EXPIRATION
    ? parseInt(process.env.EXPIRATION)
    : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  const yesName = process.env.YES_NAME || "Yes Token";
  const yesSymbol = process.env.YES_SYMBOL || "YES";
  const noName = process.env.NO_NAME || "No Token";
  const noSymbol = process.env.NO_SYMBOL || "NO";

  console.log("Prediction Question:", question);
  console.log("Expiration:", expiration);
  console.log(`YES token: ${yesName} (${yesSymbol})`);
  console.log(`NO token: ${noName} (${noSymbol})`);
  console.log("Collateral:", collateral);

  // 1. Deploy MarketFactory
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(deployer.address, collateral);
  await marketFactory.deployed();
  console.log("MarketFactory deployed to:", await marketFactory.address);

  // 2. Create BinaryMarket (passing tokens + question)
  const tx = await marketFactory.createMarket(
    question,
    expiration,
    yesName,
    yesSymbol,
    noName,
    noSymbol
  );
  const receipt = await tx.wait();

  // 3. Parse MarketCreated event
 const event = receipt.events?.find((e: any) => e.event === "MarketCreated");
if (!event) {
  throw new Error("MarketCreated event not found");
}
const marketAddress = event.args[0];
console.log("✅ New BinaryMarket deployed to:", marketAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
