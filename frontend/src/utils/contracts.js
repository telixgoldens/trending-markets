import { ethers } from "ethers";
import { initToolkit } from "./smartAccount";
import MarketFactoryAbi from "../abi/MarketFactory.json";
import BinaryMarketAbi from "../abi/BinaryMarket.json";
import MockERC20Abi from "../abi/MockERC20.json";

const RPC = process.env.REACT_APP_RPC_URL || "https://testnet-rpc.monad.xyz";

export function getProvider() {
  return new ethers.providers.JsonRpcProvider(RPC);
}

// ✅ Updated signer to use Smart Account signer
export async function getSigner() {
  const toolkit = await initToolkit();
  await toolkit.connect(); // make sure user connects
  return toolkit.getSigner(); // returns smart account signer
}

export function getMarketFactoryContract(signerOrProvider) {
  const addr = process.env.REACT_APP_MARKET_FACTORY;
  if (!addr) throw new Error("MARKET_FACTORY not found in .env");
  return new ethers.Contract(
    addr,
    MarketFactoryAbi,
    signerOrProvider || getProvider()
  );
}

export function getBinaryMarketContract(address, signerOrProvider) {
  return new ethers.Contract(
    address,
    BinaryMarketAbi,
    signerOrProvider || getProvider()
  );
}

export function getMockERC20(signerOrProvider) {
  const addr = process.env.REACT_APP_MOCKERC20;
  if (!addr) throw new Error("MOCKERC20 not found in .env");
  return new ethers.Contract(
    addr,
    MockERC20Abi,
    signerOrProvider || getProvider()
  );
}
