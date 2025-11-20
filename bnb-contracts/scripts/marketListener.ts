import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import MarketFactoryAbi from "../artifacts/contracts/MarketFactory.sol/MarketFactory.json";

dotenv.config();

const RPC_URL = process.env.BNB_TESTNET_RPC || "https://bsc-testnet-rpc.publicnode.com";
const FACTORY_ADDRESS = "0xd490A2739475B40908C83e2c21512a9876D093c8";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const DATA_FILE = "./markets.json";

function saveMarket(data: any) {
  let existing: any[] = [];
  if (fs.existsSync(DATA_FILE)) {
    existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  existing.push(data);
  fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));
}

async function main() {
  console.log("Listening for MarketCreated events...");

  const factory = new ethers.Contract(FACTORY_ADDRESS, MarketFactoryAbi.abi, provider);

  factory.on("MarketCreated", (market, creator, question, expiry, event) => {
    const data = {
      market,
      creator,
      question,
      expiry: Number(expiry),
      txHash: event.transactionHash,
      createdAt: new Date().toISOString()
    };

    console.log(" New Market Created:", data);
    saveMarket(data);
    console.log("Saved to markets.json");
  });
}

main().catch((err) => console.error(" Listener error:", err));
