import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const collateral = process.env.ERC20_ADDRESS;
  if (!collateral) throw new Error("Missing ERC20_ADDRESS in .env");

  const question = process.env.QUESTION || "Default prediction question";
  const expiration = process.env.EXPIRATION
    ? parseInt(process.env.EXPIRATION)
    : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  const yesName = process.env.YES_NAME || "Yes Token";
  const yesSymbol = process.env.YES_SYMBOL || "YES";
  const noName = process.env.NO_NAME || "No Token";
  const noSymbol = process.env.NO_SYMBOL || "NO";

  console.log("Deployment parameters:");
  console.log("Question:", question);
  console.log("Expiration:", new Date(expiration * 1000).toLocaleString());
  console.log("Collateral:", collateral);

  
  console.log("Deploying MinimalForwarder...");
  const MinimalForwarder = await ethers.getContractFactory("MinimalForwarder");
  const minimalForwarder = await MinimalForwarder.deploy();
  await minimalForwarder.deployed();
  console.log("MinimalForwarder deployed to:", minimalForwarder.address);

  
  console.log("Deploying OracleManager...");
  const OracleManager = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy(deployer.address);
  await oracleManager.deployed();
  console.log("OracleManager deployed to:", oracleManager.address);


  console.log("Deploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(
    deployer.address,   
    collateral,         
    minimalForwarder.address 
  );
  await marketFactory.deployed();
  console.log("MarketFactory deployed to:", marketFactory.address);

  console.log("Linking contracts...");
  const txReg = await marketFactory.setOracleManager(oracleManager.address);
  await txReg.wait();
  console.log("Linked MarketFactory -> OracleManager");

  console.log("Creating sample market...");
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

  
  console.log(" Deployment Summary:");
  console.log("Deployer:", deployer.address);
  console.log("MinimalForwarder:", minimalForwarder.address);
  console.log("OracleManager:", oracleManager.address);
  console.log("MarketFactory:", marketFactory.address);
  console.log("Sample Market:", marketAddress);
}

main().catch((error) => {
  console.error(" Deployment failed:", error);
  process.exitCode = 1;
});
