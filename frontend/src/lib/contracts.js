import { ethers } from "ethers";
import MarketFactoryAbi from "../abi/MarketFactory.json";
import BinaryMarketAbi from "../abi/BinaryMarket.json";
import MockERC20Abi from "../abi/MockERC20.json";

const RPC = process.env.REACT_APP_RPC_URL || "https://testnet-rpc.monad.xyz";

export function getProvider() {
  return new ethers.providers.JsonRpcProvider(RPC);
}

export async function getSigner() {
  if (!window.ethereum) throw new Error("No injected wallet found");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider.getSigner();
}

export function getMarketFactory(signerOrProvider) {
  const addr = process.env.REACT_APP_MARKET_FACTORY;
  return new ethers.Contract(addr, MarketFactoryAbi, signerOrProvider || getProvider());
}

export function getBinaryMarket(address, signerOrProvider) {
  return new ethers.Contract(address, BinaryMarketAbi, signerOrProvider || getProvider());
}

export function getMockERC20(signerOrProvider) {
  const addr = process.env.REACT_APP_MOCKERC20;
  return new ethers.Contract(addr, MockERC20Abi, signerOrProvider || getProvider());
}
