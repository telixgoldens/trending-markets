import React, { useEffect, useState } from "react";
import { getMarketFactory, getProvider } from "../lib/contracts";
import MarketCard from "../components/MarketCard";
import { ethers } from "ethers";

export default function Dashboard() {
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const provider = getProvider();
        const factory = getMarketFactory(provider);
        const list = await factory.getMarkets();
        // list is array of addresses
        const marketsData = await Promise.all(list.map(async (addr) => {
          const contract = new ethers.Contract(addr, require("../abi/BinaryMarket.json"), provider);
          let question = "Unknown";
          let resolveTimestamp = null;
          try {
            question = await contract.question();
          } catch (e) {}
          try {
            const rt = await contract.resolveTimestamp();
            resolveTimestamp = rt && rt.toNumber ? rt.toNumber() : rt;
          } catch (e) {}
          return { address: addr, question, resolveTimestamp };
        }));
        setMarkets(marketsData);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p>Active markets</p>
      <div className="grid">
        {markets.length === 0 ? <div>No markets yet</div> : markets.map((m) => <MarketCard key={m.address} market={m} />)}
      </div>
    </div>
  );
}
