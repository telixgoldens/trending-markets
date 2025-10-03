import hre from "hardhat";
import { BigNumber } from "ethers";

async function main() {
  const marketAddress = "0x..."; // your BinaryMarket address
  const collateralAddress = "0x..."; // token deployed as collateral (MockERC20)
  const market = await hre.ethers.getContractAt("BinaryMarket", marketAddress);
  const collateral = await hre.ethers.getContractAt("MockERC20", collateralAddress);

  const [sender] = await hre.ethers.getSigners();

  // approve
  const yesDeposit = hre.ethers.utils.parseUnits("1000", 18); // 1k
  const noDeposit = hre.ethers.utils.parseUnits("1000", 18);
  await collateral.approve(marketAddress, yesDeposit.add(noDeposit));
  const tx = await market.addLiquidity(yesDeposit, noDeposit);
  await tx.wait();
  console.log("Liquidity added");
}

main().catch(console.error);
