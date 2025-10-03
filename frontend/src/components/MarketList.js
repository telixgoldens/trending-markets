import React, { useEffect, useState } from "react";
import { getProvider, getMarketFactoryContract, getBinaryMarketContract } from "../utils/contracts";

export default function MarketList() {
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    async function loadMarkets() {
      try {
        const provider = getProvider();
        const factory = getMarketFactoryContract(provider);
        const marketAddresses = await factory.getMarkets();

        const details = await Promise.all(
          marketAddresses.map(async (addr) => {
            const market = getBinaryMarketContract(addr, provider);

            const question = await market.question();
            const resolveTimestamp = await market.resolveTimestamp();
            const yesToken = await market.yesToken();
            const noToken = await market.noToken();

            return {
              address: addr,
              question,
              resolveTimestamp: new Date(resolveTimestamp.toNumber() * 1000).toLocaleString(),
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
    loadMarkets();
  }, []);

  return (
    <div>
      <h2>Deployed Markets</h2>
      {markets.length === 0 ? (
        <p>No markets found.</p>
      ) : (
        <ul>
          {markets.map((m, i) => (
            <li key={i}>
              <strong>{m.question}</strong> <br />
              Market: {m.address} <br />
              Resolves: {m.resolveTimestamp} <br />
              YES Token: {m.yesToken} <br />
              NO Token: {m.noToken}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
