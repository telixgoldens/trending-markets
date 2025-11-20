import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const factoryAddress = "0xa164Aa414cbB0b53574C570f7072dD6c5Df8e936";

  const factory = await ethers.getContractAt("MarketFactory", factoryAddress);

  const question = "Will the World Denuclearize by the end of the yeear?";
  const resolveTime = Math.floor(Date.now() / 1000) + 3 * 24 * 3600; 
  const yesName = "Yes Token";
  const yesSymbol = "Yes";
  const noName = "No Token";
  const noSymbol = "No";

  console.log(" Creating market...");
  const tx = await factory.createMarket(
    question,
    resolveTime,
    yesName,
    yesSymbol,
    noName,
    noSymbol,
    { gasLimit: 3_000_000 }
  );

  console.log("Tx sent:", tx.hash);
  const receipt = await tx.wait();
  const event = receipt.events?.find((e: any) => e.event === "MarketCreated");
  if (event) {
    console.log(" Market created successfully!");
    console.log("Market address:", event.args[0]);
  } else {
    console.log(" No MarketCreated event found in receipt.");
  }
}

main().catch((err) => {
  console.error(" Error:", err);
  process.exitCode = 1;
});
