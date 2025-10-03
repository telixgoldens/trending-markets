import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.MONAD_RPC_URL);

  // Load signers
  const deployer = new ethers.Wallet(process.env.MONAD_PRIVATE_KEY!, provider);
  const user1 = new ethers.Wallet(process.env.USER_PRIVATE_KEY!, provider);
  const user2 = new ethers.Wallet(process.env.USER_PRIVATE_KEY2!, provider);

  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // Load deployed contracts
  const binaryMarketAddr = process.env.MARKET_ADDRESS!;
  const mockAddr = process.env.COLLATERAL_ADDRESS!;

  const binaryMarket = await ethers.getContractAt("BinaryMarket", binaryMarketAddr, deployer);
  const mockToken = await ethers.getContractAt("MockERC20", mockAddr, deployer);

  // Get YES/NO outcome tokens
  const yesTokenAddr = await binaryMarket.tokenYes();
  const noTokenAddr = await binaryMarket.tokenNo();

  const yesToken = await ethers.getContractAt("ERC20", yesTokenAddr, user2);
  // const noToken = await ethers.getContractAt("ERC20", noTokenAddr, provider);

  console.log("YES token:", yesTokenAddr);
  console.log("NO token:", noTokenAddr);

  // ===== User1 adds liquidity =====
  const mintAmount = ethers.utils.parseUnits("1000", 18);
  await (await mockToken.connect(deployer).mint(user1.address, mintAmount)).wait();
  await (await mockToken.connect(user1).approve(binaryMarket.address, mintAmount)).wait();
  await (await binaryMarket.connect(user1).addLiquidity(
    ethers.utils.parseUnits("500", 18),
    ethers.utils.parseUnits("500", 18)
  )).wait();
  console.log("✅ User1 added liquidity");

  // ===== User2 buys YES tokens =====
  const buyAmount = ethers.utils.parseUnits("100", 18);
  await (await mockToken.connect(deployer).mint(user2.address, buyAmount)).wait();
  await (await mockToken.connect(user2).approve(binaryMarket.address, buyAmount)).wait();
  await (await binaryMarket.connect(user2).buy(0, buyAmount, 0)).wait(); // 0 = YES
  console.log("✅ User2 bought YES tokens");

  const yesBalUser2 = await yesToken.balanceOf(user2.address);
  console.log("User2 YES balance before resolution:", ethers.utils.formatUnits(yesBalUser2, 18));

   // ===== Wait for market expiration =====
  const expiration = await binaryMarket.resolveTimestamp();
  const now = Math.floor(Date.now() / 1000);
  const waitTime = expiration.toNumber() - now;
  if (waitTime > 0) {
    console.log(`⏳ Waiting ${waitTime} seconds for market expiration...`);
    await new Promise(res => setTimeout(res, waitTime * 1000));
  }


  // ===== Oracle/Owner resolves market =====
  const winningOutcome = 0; // 0 = YES wins
  await (await binaryMarket.connect(deployer).resolve(winningOutcome)).wait();
  console.log("✅ Market resolved with outcome:", winningOutcome === 0 ? "YES" : "NO");

  // ===== User2 redeems winnings =====
  await (await binaryMarket.connect(user2).redeem(winningOutcome)).wait();
  const finalBalanceUser2 = await mockToken.balanceOf(user2.address);

  console.log("✅ User2 redeemed tokens");
  console.log("User2 final MockERC20 balance:", ethers.utils.formatUnits(finalBalanceUser2, 18));

  // ===== User1 removes liquidity =====
  const lpShares = await binaryMarket.lpShares(user1.address);
  console.log("User1 LP shares before withdrawal:", ethers.utils.formatUnits(lpShares, 18));

  if (lpShares.gt(0)) {
    await (await binaryMarket.connect(user1).removeLiquidity(lpShares)).wait();
    console.log("✅ User1 removed liquidity");
  }

  const finalBalanceUser1 = await mockToken.balanceOf(user1.address);
  console.log("User1 final MockERC20 balance:", ethers.utils.formatUnits(finalBalanceUser1, 18));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
