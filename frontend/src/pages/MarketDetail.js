import React from "react";
import { useParams } from "react-router-dom";
import SingleMarket from "../components/SingleMarket";

export default function MarketDetail() {
  const { address } = useParams();

  return (
    <div className="page">
      <h1>Market</h1>
      {address ? (
        <SingleMarket marketAddress={address} />
      ) : (
        <div>Loading market...</div>
      )}
    </div>
  );
}
