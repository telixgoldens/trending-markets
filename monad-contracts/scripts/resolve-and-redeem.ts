import hre from "hardhat";

async function main() {
  const marketAddress = "0x...";
  const market = await hre.ethers.getContractAt("BinaryMarket", marketAddress);

  // resolve (must be called by oracle or owner after resolveTimestamp)
  const tx = await market.resolve(1); // set YES winner (0 or 1)
  await tx.wait();
  console.log("Market resolved");

  // Redeem by caller:
  // const tokensToRedeem = ... must be held by caller
  // await tokenYes.approve(market.address, tokensToRedeem) // token burn is onlyOwner so user must have tokens burned by market - market.burn handles this
  // call redeem:
  // const tx2 = await market.redeem(tokensToRedeem);
  // await tx2.wait();
}
main().catch(console.error);
