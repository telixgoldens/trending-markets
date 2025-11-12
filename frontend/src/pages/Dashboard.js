import React, { useEffect, useState } from "react";
import { getMarketFactoryContract, getProvider } from "../utils/contracts";
import MarketCard from "../components/MarketCard";
import { ethers } from "ethers";
import BinaryMarketAbi from "../abi/BinaryMarket.json";
import "../styles/MarketCard.css"; 



export default function Dashboard() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 20;


  useEffect(() => {
    async function loadMarkets() {
      try {
        setLoading(true);
        const provider = getProvider();
        const factory = getMarketFactoryContract(provider);
        const list = await factory.getMarkets();

        const marketsData = await Promise.all(
          list.map(async (addr) => {
            const contract = new ethers.Contract(
              addr,
              BinaryMarketAbi,
              provider
            );
            let question = "Unknown";
            let resolveTimestamp = null;

            try {
              question = await contract.question();
            } catch (error) {
              console.error("An error occurred:", error);
            }
            try {
              const rt = await contract.resolveTimestamp();
              resolveTimestamp = rt?.toNumber ? rt.toNumber() : rt;
            } catch (error) {
              console.error("An error occurred:", error);
            }

            return { address: addr, question, resolveTimestamp };
          })
        );

        setMarkets(marketsData.reverse());
      } catch (err) {
        console.error("Error loading markets:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMarkets();
    const interval = setInterval(loadMarkets, 20 * 60 * 1000); 
    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.ceil(markets.length / perPage);
  const paginatedMarkets = markets.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <p>Active Markets</p>


      {loading ? (
        <div className="card">Loading markets...</div>
      ) : markets.length === 0 ? (
        <div className="card">No markets found.</div>
      ) : (
        <>
         <div className="market-grid">
            {paginatedMarkets.map((m) => (
              <MarketCard key={m.address} market={m} />
            ))}
          </div>

          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`page-btn ${page === i + 1 ? "active" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
