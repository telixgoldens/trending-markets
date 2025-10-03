import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // OPTIONAL: deploy MockERC20 for testing if you don't have a test collateral
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Test USD", "tUSD");
  await token.deployed();
  console.log("MockERC20 deployed:", token.address);

  // Deploy factory with collateral address
  const Factory = await hre.ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(token.address);
  await factory.deployed();
  console.log("MarketFactory deployed:", factory.address);

  // Mint some mock tokens to deployer for testing
  await token.mint(deployer.address, hre.ethers.utils.parseUnits("10000", 18));
  console.log("Minted 10k tUSD to deployer");

  // Output addresses for later use
  console.log("COLLATERAL =", token.address);
  console.log("FACTORY =", factory.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
