import hre from "hardhat";

async function main() {
  const marketAddress = "0x...";
  const market = await hre.ethers.getContractAt("BinaryMarket", marketAddress);
  const collateral = "0x..."; // not needed if already approved

  // Use signer[0]
  const buyer = (await hre.ethers.getSigners())[0];
  // approve collateral to market first using token contract if needed

  const collateralIn = hre.ethers.utils.parseUnits("10", 18); // spend 10 collateral
  const minTokensOut = 0;
  const tx = await market.buy(1, collateralIn, minTokensOut); // buy YES
  await tx.wait();
  console.log("Bought YES tokens");
}

main().catch(console.error);
