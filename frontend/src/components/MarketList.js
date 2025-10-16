import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProvider,
  getMarketFactoryContract,
  getBinaryMarketContract,
} from "../utils/contracts";

export default function MarketList() {
  const [markets, setMarkets] = useState([]);
  const [factory, setFactory] = useState(null);

  async function loadMarkets() {
    try {
      const provider = getProvider();
      const factoryContract = getMarketFactoryContract(provider);
      setFactory(factoryContract);

      const marketAddresses = await factoryContract.getMarkets();

      const details = await Promise.all(
        marketAddresses.map(async (addr) => {
          const market = getBinaryMarketContract(addr, provider);
          const question = await market.question();
          const resolveTimestamp = await market.resolveTimestamp();
          const yesToken = await market.tokenYes();
          const noToken = await market.tokenNo();

          return {
            address: addr,
            question,
            resolveTimestamp: new Date(
              resolveTimestamp.toNumber() * 1000
            ).toLocaleString(),
            yesToken,
            noToken,
          };
        })
      );

      setMarkets(details);
    } catch (err) {
      console.error("Error loading markets:", err);
    }
  }

  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    if (!factory) return;

    // Listen for the MarketCreated event
    factory.on("MarketCreated", () => {
      console.log(" New market detected — refreshing list...");
      loadMarkets();
    });

    // Clean up listener on unmount
    return () => {
      factory.removeAllListeners("MarketCreated");
    };
  }, [factory]);

  return (
    <div className="page">
      <h2>Deployed Markets</h2>
      {markets.length === 0 ? (
        <p>No markets found.</p>
      ) : (
        <div className="market-list">
          {markets.map((m, i) => (
            <div key={i} className="market-card">
              <h3>{m.question}</h3>
              <p>Resolves: {m.resolveTimestamp}</p>
              <p>YES Token: {m.yesToken}</p>
              <p>NO Token: {m.noToken}</p>
              <Link to={`/markets/${m.address}`} className="btn">{m.question}</Link>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
