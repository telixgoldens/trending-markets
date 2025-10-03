import { ethers } from "hardhat";
// import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockERC20 with account:", deployer.address);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mock = await MockERC20.deploy("Mock USD", "mUSD", 18);
  await mock.deployed();

  console.log("✅ MockERC20 deployed at:", mock.address);

  // Optionally mint some tokens to yourself for testing
  const tx = await mock.mint(deployer.address, ethers.utils.parseUnits("1000000", 18));
  await tx.wait();
  console.log("Minted 1,000,000 mUSD to deployer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
