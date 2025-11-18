import React, { useEffect, useState } from "react";
import { getMarketFactoryContract, getBinaryMarketContract } from "../utils/contracts";
import MarketCard from "../components/MarketCard";
import MarketFilters from "../components/MarketFilters";
import "../styles/MarketCard.css";

export default function MarketList() {
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);

  const [markets, setMarkets] = useState([]);
  const [factory, setFactory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("Trending");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const perPage = 20;

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not installed");
    try {
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(account);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setSigner(provider.getSigner());
    } catch (err) {
      console.error("Wallet connect failed:", err);
    }
  }

  async function loadMarkets() {
    if (!signer) return;
    setLoading(true);
    try {
      const factoryContract = getMarketFactoryContract(signer);
      setFactory(factoryContract);

      const marketAddresses = await factoryContract.getMarkets();
      const details = await Promise.all(
        marketAddresses.map(async (addr) => {
          const market = getBinaryMarketContract(addr, signer);
          const question = await market.question();
          const resolveTimestamp = await market.resolveTimestamp();
          const yesToken = await market.tokenYes();
          const noToken = await market.tokenNo();
          const resolved = await market.resolved().catch(() => false);
          return {
            address: addr,
            question,
            resolveTimestamp: resolveTimestamp * 1000,
            yesToken,
            noToken,
            volume: 0,
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
    if (!address) return;
    try {
      const res = await fetch(`/api/watchlist/${address}`);
      const data = await res.json();
      setWatchlist(data.markets || []);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    }
  }

  useEffect(() => {
    if (!signer) return;
    loadMarkets();
    loadWatchlist();
  }, [signer, address]);

  useEffect(() => {
    if (!factory) return;
    factory.on("MarketCreated", loadMarkets);
    return () => factory.removeAllListeners("MarketCreated");
  }, [factory]);

  const filteredMarkets = [...markets].sort((a, b) => {
    if (activeFilter === "Watch List") {
      if (!address) setShowSignInModal(true);
      return 0;
    }
    switch (activeFilter) {
      case "Trending": return b.volume - a.volume;
      case "Ending soon": return a.resolveTimestamp - b.resolveTimestamp;
      case "High volume": return b.volume - a.volume;
      case "Newest": return b.resolveTimestamp - a.resolveTimestamp;
      default: return 0;
    }
  });

  const displayedMarkets = activeFilter === "Watch List" ? watchlist : filteredMarkets;
  const totalPages = Math.ceil(displayedMarkets.length / perPage);
  const paginatedMarkets = displayedMarkets.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="page markets-page">
      <div className="page-header">
        <h1>Explore Markets</h1>
        <p>Discover active and past prediction markets.</p>
        <MarketFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        {!signer && <button className="btn" onClick={connectWallet}>Connect MetaMask</button>}
      </div>

      {showSignInModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Sign In Required</h2>
            <p>Connect MetaMask to view your watchlist.</p>
            <button onClick={() => setShowSignInModal(false)}>Close</button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading markets...</p>
      ) : paginatedMarkets.length === 0 ? (
        <p className="no-markets">No markets available yet.</p>
      ) : (
        <>
          <div className="market-grid">
            {paginatedMarkets.map((m) => <MarketCard key={m.address} market={m} />)}
          </div>
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={page === i + 1 ? "active-page" : ""}
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
