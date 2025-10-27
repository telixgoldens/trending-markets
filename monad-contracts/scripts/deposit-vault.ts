import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  const vaultAddress = process.env.LIQUIDITY_VAULT!;
  const collateralAddress = process.env.ERC20_ADDRESS!;
  const depositAmount = ethers.utils.parseUnits("1000", 18); // change amount if needed

  const Collateral = await ethers.getContractAt("IERC20", collateralAddress);
  const Vault = await ethers.getContractAt("LiquidityVault", vaultAddress);

  console.log(`Depositing into LiquidityVault...`);
  console.log(`Vault: ${vaultAddress}`);
  console.log(`Collateral: ${collateralAddress}`);
  console.log(`Depositor: ${deployer.address}`);
  console.log(`Amount: ${ethers.utils.formatUnits(depositAmount, 18)} tokens\n`);

  // 1 Approve vault to pull collateral
  const allowance = await Collateral.allowance(deployer.address, vaultAddress);
  if (allowance.lt(depositAmount)) {
    console.log("Approving vault to spend collateral...");
    const approveTx = await Collateral.approve(vaultAddress, depositAmount);
    await approveTx.wait();
    console.log("Approval confirmed");
  } else {
    console.log("Vault already approved for this amount");
  }

  // 2 Deposit into vault
  const tx = await Vault.deposit(depositAmount);
  await tx.wait();
  console.log(`Successfully deposited ${ethers.utils.formatUnits(depositAmount, 18)} tokens`);
}

main().catch((err) => {
  console.error("Deposit failed:", err);
  process.exit(1);
});
