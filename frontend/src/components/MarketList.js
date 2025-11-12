import React, { useEffect, useState } from "react";
import {
  getProvider,
  getMarketFactoryContract,
  getBinaryMarketContract,
} from "../utils/contracts";
import MarketCard from "../components/MarketCard";
import MarketFilters from "../components/MarketFilters";
import PropTypes from 'prop-types'; 
import "../styles/MarketCard.css";

export default function MarketList({ user }) {
  
  const [markets, setMarkets] = useState([]);
  const [factory, setFactory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("Trending");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const perPage = 20;

  async function loadMarkets() {
    try {
      setLoading(true);
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
          const volume = yesToken + noToken || 0;
          const resolved = await market.resolved().catch(() => false);

          return {
            address: addr,
            question,
            resolveTimestamp: resolveTimestamp * 1000,
            yesToken,
            noToken,
            volume,
            resolved,
          };
        })
      );

      setMarkets(details);
    } catch (err) {
      console.error("Error loading markets:", err);
    } finally {
      setLoading(false);
    }
  }

  
  async function loadWatchlist() {
    if (!user) return;
    try {
      const res = await fetch(`/api/watchlist/${user.id}`);
      const data = await res.json();
      setWatchlist(data.markets || []);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    }
  }

  useEffect(() => {
    loadMarkets();
    loadWatchlist();
  }, [user]);

  useEffect(() => {
    if (!factory) return;
    factory.on("MarketCreated", () => loadMarkets());
    return () => factory.removeAllListeners("MarketCreated");
  }, [factory]);

  const filteredMarkets = [...markets].sort((a, b) => {
    if (activeFilter === "Watch List") {
      if (!user) {
        setShowSignInModal(true);
        return 0;
      }
      return 0; 
    }

    switch (activeFilter) {
      case "Trending":
        return b.volume - a.volume;
      case "Ending soon":
        return a.resolveTimestamp - b.resolveTimestamp;
      case "High volume":
        return b.volume - a.volume;
      case "Newest":
        return b.resolveTimestamp - a.resolveTimestamp;
      default:
        return 0;
    }
  });

  const displayedMarkets =
    activeFilter === "Watch List" ? watchlist : filteredMarkets;
  const totalPages = Math.ceil(displayedMarkets.length / perPage);
  const paginatedMarkets = displayedMarkets.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <div className="page markets-page">
      <div className="page-header">
        <h1>Explore Markets</h1>
        <p>Discover active and past prediction markets.</p>
        <MarketFilters
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      </div>

      {showSignInModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#111827",
              padding: "2rem",
              borderRadius: "12px",
              textAlign: "center",
              color: "#facc15",
            }}
          >
            <h2>Sign In Required</h2>
            <p>To view your watchlist, please sign in first.</p>
            <button
              onClick={() => setShowSignInModal(false)}
              style={{
                marginTop: "1rem",
                padding: "0.8rem 1.5rem",
                borderRadius: "10px",
                background: "#facc15",
                color: "#111827",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading markets...</p>
      ) : paginatedMarkets.length === 0 ? (
        <p className="no-markets">No markets available yet.</p>
      ) : (
        <>
          <div
            className="market-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {paginatedMarkets.map((m) => (
              <MarketCard key={m.address} market={m} />
            ))}
          </div>

          <div
            className="pagination"
            style={{ marginTop: 20, textAlign: "center" }}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  margin: "0 4px",
                  padding: "6px 12px",
                  background: page === i + 1 ? "#facc15" : "#1f2937",
                  color: "#111827",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: page === i + 1 ? "700" : "500",
                }}
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
MarketList.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
};