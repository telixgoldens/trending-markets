import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "../styles/MarketCard.css";

export default function MarketCard({ market, user, onWatchlistChange }) {
  const [isWatching, setIsWatching] = useState(market.isWatching || false);
  const resolveTs =
    market.resolveTimestamp ??
    market.resolveTime ??
    market.resolveAt ??
    market.resolveTimestamp;
  const resolveAt = resolveTs ? new Date(resolveTs) : null;
  const address = market.address || "";
  
let volume = "—";
try {
  if (market.volume) {
    
    const volNum =
      typeof market.volume === "string" && market.volume.startsWith("0x")
        ? parseInt(market.volume, 16)
        : parseFloat(market.volume);

    const adjusted = volNum / 1e18;

    if (adjusted >= 1_000_000) {
      volume = (adjusted / 1_000_000).toFixed(2) + "M";
    } else if (adjusted >= 1_000) {
      volume = (adjusted / 1_000).toFixed(2) + "K";
    } else {
      volume = adjusted.toFixed(2);
    }

    const symbol = market.tokenSymbol || "USDT";
    volume = `${volume} ${symbol}`;
  }
} catch (err) {
  console.error("Error parsing market volume:", err);
}

  
  const yesPercent = (() => {
    try {
      const yesBN = market.yesToken
        ? parseFloat(market.yesToken.toString())
        : 1;
      const noBN = market.noToken ? parseFloat(market.noToken.toString()) : 1;
      const total = yesBN + noBN;
      return Math.round((yesBN / total) * 100);
    } catch (err) {
      console.error("An error occurred calculating percentages:", err);
      return 50;
    }
  })();
  

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const yesOffset = circumference - (circumference * yesPercent) / 100;

  const toggleWatch = async (e) => {
    e.preventDefault(); 
    if (!user) {
      alert("Please sign in to manage your watchlist.");
      return;
    }

    const newState = !isWatching;
    setIsWatching(newState);
    onWatchlistChange?.(address, newState);

    try {
      await fetch(`/api/watchlist/${user.id}`, {
        method: newState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market: address }),
      });
    } catch (err) {
      console.error("Error updating watchlist:", err);
    }
  };

  return (
    <Link to={`/markets/${address}`} className="market-card-link">
      <article className="market-card">
        <div className="card-header">
          <button
            className="watch-btn"
            onClick={toggleWatch}
            title={isWatching ? "Remove from watchlist" : "Add to watchlist"}
          >
            {isWatching ? "★" : "☆"}
          </button>
          <h3 className="card-title">{market.question || "Untitled market"}</h3>
        </div>

        <div className="meta-row">
          <div>Resolve: {resolveAt ? resolveAt.toLocaleString() : "—"}</div>
          <div>Market: {address.slice(0, 8)}...</div>
          <div>Volume: {volume}</div>
        </div>

        <div className="circular-gauge">
          <svg width="100" height="100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#ff6b6b"
              strokeWidth="10"
              fill="transparent"
              opacity="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#facc15" 
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={yesOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="55" textAnchor="middle" fontSize="16" fill="#fff">
              {yesPercent}%
            </text>
          </svg>
        </div>

        <div className="choice-buttons">
          <button className="yes-btn">YES</button>
          <button className="no-btn">NO</button>
        </div>
      </article>
    </Link>
  );
}

MarketCard.propTypes = {
  market: PropTypes.shape({
    isWatching: PropTypes.bool,
    resolveTimestamp: PropTypes.number,
    resolveTime: PropTypes.number,
    resolveAt: PropTypes.number,
    address: PropTypes.string,
    volume: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    yesToken: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    noToken: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    question: PropTypes.string,
    tokenSymbol: PropTypes.string,
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  onWatchlistChange: PropTypes.func.isRequired,
};
