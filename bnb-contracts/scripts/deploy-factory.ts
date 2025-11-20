import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MinimalForwarder with:", deployer.address);

  const Forwarder = await ethers.getContractFactory("MinimalForwarder");
  const forwarder = await Forwarder.deploy();
  await forwarder.deployed();

  console.log("MinimalForwarder deployed at:", forwarder.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
