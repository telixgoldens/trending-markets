import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  getProvider,
  getSigner,
  getMarketFactoryContract,
  getBinaryMarketContract,
  getMockERC20,
} from "../utils/contracts";
import MockERC20Abi from "../abi/MockERC20.json";
import "../styles/Profile.css";

export default function Profile() {
  const [balance, setBalance] = useState("—");
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [factory, setFactory] = useState(null);

  async function loadProfile() {
    try {
      setLoading(true);
      const provider = getProvider();
      const signer = await getSigner();
      const userAddr = await signer.getAddress();

      // Collateral balance
      const mockToken = getMockERC20(provider);
      const bal = await mockToken.balanceOf(userAddr);
      setBalance(ethers.utils.formatUnits(bal, 18));

      // Markets
      const factoryContract = getMarketFactoryContract(provider);
      setFactory(factoryContract);
      const markets = await factoryContract.getMarkets();

      const all = await Promise.all(
        markets.map(async (addr) => {
          const market = getBinaryMarketContract(addr, provider);
          const question = await market.question();
          const yesTokenAddr = await market.tokenYes();
          const noTokenAddr = await market.tokenNo();

          const yesToken = new ethers.Contract(
            yesTokenAddr,
            MockERC20Abi,
            provider
          );
          const noToken = new ethers.Contract(
            noTokenAddr,
            MockERC20Abi,
            provider
          );

          const [yesBal, noBal] = await Promise.all([
            yesToken.balanceOf(userAddr),
            noToken.balanceOf(userAddr),
          ]);

          return {
            address: addr,
            question,
            yes: ethers.utils.formatUnits(yesBal, 18),
            no: ethers.utils.formatUnits(noBal, 18),
          };
        })
      );

      setPositions(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!factory) return;

    // Listen for new markets
    factory.on("MarketCreated", () => {
      console.log("New market detected — refreshing profile...");
      loadProfile();
    });

    return () => {
      factory.removeAllListeners("MarketCreated");
    };
  }, [factory]);

  return (
    <div className="page">
      <h1>Profile</h1>

      <div className="card">
        <h2>Wallet Overview</h2>
        <p> Token Balance: {balance}</p>
        <button onClick={loadProfile} disabled={loading} className="btn">
          {loading ? "Refreshing..." : "🔄 Refresh Data"}
        </button>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Market Positions</h2>
        {loading ? (
          <p>Loading positions...</p>
        ) : positions.length === 0 ? (
          <p>No markets found.</p>
        ) : (
          <div className="positions">
            {positions.map((p, i) => (
              <div key={i} className="position-item">
                <h3>{p.question}</h3>
                <div className="position-balances">
                  <span> YES: {p.yes}</span>
                  <span> NO: {p.no}</span>
                </div>
                <small>{p.address}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
