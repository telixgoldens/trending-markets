// src/utils/contracts.js
import { ethers } from "ethers";
import MarketFactoryABI from "../abis/MarketFactory.json";
import BinaryMarketABI from "../abis/BinaryMarket.json";


const MARKET_FACTORY_ADDRESS = process.env.REACT_APP_MARKET_FACTORY;

export function getBinaryMarketContract(address, signerOrProvider) {
  return new ethers.Contract(address, BinaryMarketABI, signerOrProvider);
}


export function getProvider() {
  // Browser wallet (Metamask, etc.)
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  // Fallback RPC (optional: set your Monad testnet RPC here)
  return new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
}

export function getMarketFactoryContract(signerOrProvider) {
  return new ethers.Contract(
    MARKET_FACTORY_ADDRESS,
    MarketFactoryABI,
    signerOrProvider
  );
}
