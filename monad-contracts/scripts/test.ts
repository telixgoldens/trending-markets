// scripts/check-market.ts
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [caller] = await ethers.getSigners();
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS || "0x9450904f8e90fAd32e3f3157A38EFB6A090Cb0D4";

  console.log("Using signer:", caller.address);
  console.log("Market:", marketAddr);

  const Market = await ethers.getContractAt("BinaryMarket", marketAddr);

  // 1) resolved flag and winningOutcome
  const isResolved: boolean = await Market.resolved();
  console.log("resolved:", isResolved);

  if (!isResolved) {
    console.log("Market not resolved yet — nothing to redeem.");
  } else {
    const winningOutcome: number = (await Market.winningOutcome()).toNumber?.() ?? Number(await Market.winningOutcome());
    console.log("winningOutcome:", winningOutcome === 1 ? "YES (1)" : "NO (0)");
  }

  // 2) outcome token addresses
  const tokenYesAddr: string = await Market.tokenYes();
  const tokenNoAddr: string = await Market.tokenNo();
  console.log("tokenYes:", tokenYesAddr);
  console.log("tokenNo: ", tokenNoAddr);

  // 3) your balances of outcome tokens
  const Outcome = await ethers.getContractFactory("OutcomeToken");
  const yesToken = Outcome.attach(tokenYesAddr);
  const noToken = Outcome.attach(tokenNoAddr);

  const yesBal = await yesToken.balanceOf(caller.address);
  const noBal = await noToken.balanceOf(caller.address);
  console.log(`Your balances -> YES: ${ethers.utils.formatUnits(yesBal, 18)}, NO: ${ethers.utils.formatUnits(noBal, 18)}`);

  // 4) market reserves (depth)
  const [resYes, resNo] = await Market.getReserves();
  console.log(`Market reserves -> reserveYes: ${ethers.utils.formatUnits(resYes, 18)}, reserveNo: ${ethers.utils.formatUnits(resNo, 18)}`);

  // 5) If you have winning tokens, redeem them (UNCOMMENT to execute)
  /*
  if (isResolved) {
    const winningOutcome = (await Market.winningOutcome()).toNumber?.() ?? Number(await Market.winningOutcome());
    const winningToken = winningOutcome === 1 ? yesToken : noToken;
    const winningBalance = await winningToken.balanceOf(caller.address);
    if (winningBalance.gt(0)) {
      console.log("Redeeming winning tokens:", ethers.utils.formatUnits(winningBalance, 18));
      const tx = await Market.redeem(winningBalance);
      await tx.wait();
      console.log("Redeem tx confirmed");
    } else {
      console.log("You have no winning tokens to redeem.");
    }
  }
  */
}

main().catch((err) => {
  console.error("Error:", err);
  process.exitCode = 1;
});
