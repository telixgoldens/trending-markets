import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [user] = await ethers.getSigners();
  const routerAddr = process.env.AGGREGATOR_ROUTER!;
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  const collAddr = process.env.ERC20_ADDRESS!;
  const amount = ethers.utils.parseUnits("100", 18);

  const Router = await ethers.getContractAt("AggregatorRouter", routerAddr);
  const Market = await ethers.getContractAt("BinaryMarket", marketAddr);
  const Collateral = await ethers.getContractAt("IERC20", collAddr);

  console.log("user:", user.address);
  console.log("router:", routerAddr);
  console.log("market:", marketAddr);
  console.log("collateral:", collAddr);
  console.log("user balance:", ethers.utils.formatUnits(await Collateral.balanceOf(user.address), 18));
  console.log("allowance to router:", ethers.utils.formatUnits(await Collateral.allowance(user.address, routerAddr), 18));

  try {
    const txData = Collateral.interface.encodeFunctionData("transferFrom", [user.address, marketAddr, amount]);
    const callRes = await ethers.provider.call({
      to: collAddr,
      data: txData,
      from: routerAddr
    });
    console.log("simulate transferFrom (router->market) succeeded, return:", callRes);
  } catch (err: any) {
    console.error("simulate transferFrom reverted:", err.error?.data ?? err.data ?? err);
    const data = err.error?.data ?? err.data ?? null;
    if (data) {
      console.log("revert selector:", data.slice(0,10));
    }
  }

  try {
    await Router.callStatic.routeBuy([marketAddr], 1, amount, 0, { from: user.address });
    console.log("callStatic.routeBuy succeeded (would not revert)");
  } catch (err: any) {
    console.error("callStatic.routeBuy reverted:", err.error?.data ?? err.data ?? err);
    const data = err.error?.data ?? err.data ?? null;
    if (data) {
      console.log("revert hex:", data);
      try {
        console.log("parse with Router iface:");
        console.log(Router.interface.parseError(data));
      } catch (_) { console.log("Router iface could not parse error"); }
      try {
        console.log("parse with Market iface:");
        console.log(Market.interface.parseError(data));
      } catch (_) { console.log("Market iface could not parse error"); }
      console.log("selector:", data.slice(0,10));
    }
  }

  try {
    const reserves = await Market.getReserves();
    console.log("market reserves:", ethers.utils.formatUnits(reserves[0],18), ethers.utils.formatUnits(reserves[1],18));
  } catch (e) {
    console.warn("getReserves failed:", e);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });