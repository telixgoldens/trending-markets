import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const user = deployer; // Use deployer as user if only one signer is available;
  console.log("Using deployer:", deployer.address);
  console.log("Using user:", user.address);

  // 1. Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mock = await MockERC20.deploy("MockUSD", "mUSD", 18);
  await mock.deployed();
  const mockAddr = mock.address;
  console.log("✅ MockERC20 deployed:", mockAddr);

  // Mint tokens to deployer + user
  await (await mock.mint(deployer.address, ethers.utils.parseUnits("10000", 18))).wait();
  await (await mock.mint(user.address, ethers.utils.parseUnits("10000", 18))).wait();

  // 2. Deploy BinaryMarket
  const BinaryMarket = await ethers.getContractFactory("BinaryMarket");
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + 60; // resolves in 1 min
  const market = await BinaryMarket.deploy(
    mockAddr,
    "Will BTC be above $100k in 2025?",
    expiration,
    deployer.address, // oracle
    50, // fee = 0.5%
    deployer.address, // owner
    "YES BTC", "YBTC",
    "NO BTC", "NBTC"
  );
  await market.deployed();
  const marketAddr = market.address;
  console.log("✅ BinaryMarket deployed:", marketAddr);

  // 3. Approve collateral + add liquidity
  await (await mock.approve(marketAddr, ethers.utils.parseUnits("2000", 18))).wait();
  await (await market.addLiquidity(
    ethers.utils.parseUnits("1000", 18),
    ethers.utils.parseUnits("1000", 18)
  )).wait();
  console.log("✅ Liquidity added (1000 YES + 1000 NO)");

  // 4. Buy YES tokens as user
  const marketUser = market.connect(user);
  await (await mock.connect(user).approve(marketAddr, ethers.utils.parseUnits("100", 18))).wait();
  await (await marketUser.buy(1, ethers.utils.parseUnits("100", 18), 0)).wait();
  console.log("✅ User bought 100 YES tokens");

  // 5. Wait for expiration in real time
  const currentTime = Math.floor(Date.now() / 1000);
  const waitTime = expiration - currentTime;
  if (waitTime > 0) {
    console.log(`⏳ Waiting ${waitTime} seconds for market expiration...`);
    await new Promise(res => setTimeout(res, waitTime * 1000));
  }

  // 6. Resolve market
  await (await market.resolve(1)).wait(); // YES wins
  console.log("✅ Market resolved: YES wins");

  // 7. Redeem YES tokens
  const yesTokenAddr = await market.tokenYes();
  const YesToken = await ethers.getContractAt("OutcomeToken", yesTokenAddr);
  const userYesBal = await YesToken.balanceOf(user.address);
  console.log("User YES balance before redeem:", ethers.utils.formatUnits(userYesBal, 18));

  await (await marketUser.redeem(userYesBal)).wait();
  console.log("✅ User redeemed YES tokens for collateral");

  const userFinalBal = await mock.balanceOf(user.address);
  console.log("User final MockERC20 balance:", ethers.utils.formatUnits(userFinalBal, 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});