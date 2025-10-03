import hre from "hardhat";

async function main() {
  const factoryAddress = "0x..."; // paste factory address (deployed)
  const factory = await hre.ethers.getContractAt("MarketFactory", factoryAddress);

  // Example params
  const question = "Will ETH be above $4k on 2025-12-01?";
  const resolveTimestamp = Math.floor(new Date("2025-12-01T00:00:00Z").getTime() / 1000);
  const oracle = (await hre.ethers.getSigners())[0].address;
  const feeBps = 50; // 0.5%

  const tx = await factory.deployMarket(question, resolveTimestamp, oracle, feeBps);
  const receipt = await tx.wait();
  console.log("Market created, tx:", receipt.transactionHash);

  // get market address from event (simplest = read last in getMarkets)
  const markets = await factory.getMarkets();
  console.log("Markets:", markets);
  console.log("New market address:", markets[markets.length - 1]);
}

main().catch(console.error);
