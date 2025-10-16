import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMarketFactoryContract, getBinaryMarketContract, getProvider } from "../utils/contracts";

export default function Markets() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const provider = getProvider();
        const factory = getMarketFactoryContract(provider);
        const addresses = await factory.getMarkets();

        const marketData = await Promise.all(
          addresses.map(async (addr) => {
            const market = getBinaryMarketContract(addr, provider);
            const question = await market.question();
            return { address: addr, question };
          })
        );

        setMarkets(marketData.reverse());
      } catch (err) {
        console.error("Error loading markets:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page"><div>Loading markets...</div></div>;

  return (
    <div className="page">
      <h1>Active Markets</h1>
      {markets.length === 0 ? (
        <div>No markets deployed yet.</div>
      ) : (
        <div className="market-list">
          {markets.map((m, i) => (
            <div key={i} className="card">
              <Link to={`/markets/${m.address}`} className="market-link">
                <h3>{m.question}</h3>
              </Link>
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                {m.address.slice(0, 8)}...{m.address.slice(-6)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
