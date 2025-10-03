import React from "react";
import { Link } from "react-router-dom";
import "../styles/MarketCard.css";

export default function MarketCard({ market }) {
  const resolveAt = market.resolveTimestamp ? new Date(Number(market.resolveTimestamp) * 1000) : null;
  return (
    <div className="market-card">
      <h3>{market.question}</h3>
      <div className="meta">
        <div>Resolve: {resolveAt ? resolveAt.toLocaleString() : "—"}</div>
        <div>Market: {market.address ? market.address.slice(0, 8) + "..." : "-"}</div>
      </div>
      <div className="actions">
        <Link to={`/markets/${market.address}`} className="btn">Open</Link>
      </div>
    </div>
  );
}
