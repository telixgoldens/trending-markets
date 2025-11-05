import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const factoryAddress = "0xd490A2739475B40908C83e2c21512a9876D093c8";

  const factory = await ethers.getContractAt("MarketFactory", factoryAddress);

  const question = "Will ETH be above $5000 by November 30 2025?";
  const resolveTime = Math.floor(Date.now() / 1000) + 3 * 24 * 3600; // 3 days
  const yesName = "Yes Token";
  const yesSymbol = "YES";
  const noName = "No Token";
  const noSymbol = "NO";

  console.log("🚀 Creating market...");
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
    console.log("✅ Market created successfully!");
    console.log("Market address:", event.args[0]);
  } else {
    console.log("⚠️ No MarketCreated event found in receipt.");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exitCode = 1;
});
