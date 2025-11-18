import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  getMarketFactoryContract,
  getBinaryMarketContract,
  getMockERC20,
} from "../utils/contracts";
import MockERC20Abi from "../abi/MockERC20.json";
import "../styles/Profile.css";

export default function Profile() {
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState("—");
  const [activePositions, setActivePositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [factory, setFactory] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setSigner(provider.getSigner());
  }

  async function loadProfile() {
    if (!signer) {
      console.warn("Wallet not connected");
      return;
    }

    try {
      setLoading(true);
      const userAddr = await signer.getAddress();

      const mockToken = getMockERC20(signer);
      const bal = await mockToken.balanceOf(userAddr);
      setBalance(ethers.utils.formatUnits(bal, 18));

      const factoryContract = getMarketFactoryContract(signer);
      setFactory(factoryContract);
      const markets = await factoryContract.getMarkets();

      const all = await Promise.all(
        markets.map(async (addr) => {
          const market = getBinaryMarketContract(addr, signer);
          const question = await market.question();
          const yesTokenAddr = await market.tokenYes();
          const noTokenAddr = await market.tokenNo();
          const resolved = await market.resolved().catch(() => false);
          const outcome = resolved ? await market.winningOutcome() : null;

          const yesToken = new ethers.Contract(yesTokenAddr, MockERC20Abi, signer);
          const noToken = new ethers.Contract(noTokenAddr, MockERC20Abi, signer);

          const [yesBal, noBal] = await Promise.all([
            yesToken.balanceOf(userAddr),
            noToken.balanceOf(userAddr),
          ]);

          const yes = parseFloat(ethers.utils.formatUnits(yesBal, 18));
          const no = parseFloat(ethers.utils.formatUnits(noBal, 18));

          let totalStaked = 0;
          try {
            const filter = market.filters.BetPlaced(userAddr);
            const events = await market.queryFilter(filter, 0, "latest");
            events.forEach((e) => {
              const amount = parseFloat(ethers.utils.formatUnits(e.args.amount, 18));
              totalStaked += amount;
            });
          } catch {}

          let pnl = 0;
          if (resolved) {
            const isWin = outcome === 1 ? yes > 0 : no > 0;
            const payout = isWin ? totalStaked * 2 : 0;
            pnl = payout - totalStaked;
          }

          return {
            address: addr,
            question,
            yes: yes.toFixed(2),
            no: no.toFixed(2),
            staked: totalStaked.toFixed(2),
            pnl: pnl.toFixed(2),
            resolved,
            outcome,
          };
        })
      );

      const actives = all.filter((p) => (p.yes > 0 || p.no > 0) && !p.resolved);
      const hist = all.filter((p) => p.resolved);

      setActivePositions(actives);
      setHistory(hist);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!factory) return;
    factory.on("MarketCreated", loadProfile);
    return () => factory.removeAllListeners("MarketCreated");
  }, [factory]);

  const totalPnl = history.reduce(
    (acc, p) => acc + (parseFloat(p.pnl || 0) || 0),
    0
  );

  return (
    <div className="page profile-page">
      <h1>Profile</h1>

      <div className="card">
        <h2>Wallet Overview</h2>
        <p>Token Balance: {balance}</p>
        {!signer ? (
          <button onClick={connectWallet} className="btn">Connect Wallet</button>
        ) : (
          <button onClick={loadProfile} disabled={loading} className="btn">
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        )}
      </div>

      <div className="card">
        <h2>Active Positions</h2>
        {loading ? (
          <p>Loading positions...</p>
        ) : activePositions.length === 0 ? (
          <p>No active trades found.</p>
        ) : (
          <div className="positions">
            {activePositions.map((p, i) => (
              <div key={i} className="position-item">
                <h3>{p.question}</h3>
                <div className="position-balances">
                  <span>YES: {p.yes}</span>
                  <span>NO: {p.no}</span>
                  <span>Staked: {p.staked}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>PnL History</h2>
        <div className="pnl-summary">
          <p>Total Resolved Markets: {history.length}</p>
          <p>
            Total PnL:{" "}
            <span className={totalPnl >= 0 ? "pnl-positive" : "pnl-negative"}>
              {totalPnl.toFixed(2)}
            </span>
          </p>
        </div>

        {history.length === 0 ? (
          <p>No closed positions yet.</p>
        ) : (
          <div className="pnl-cards">
            {history.map((p, i) => (
              <div
                key={i}
                className={`pnl-card ${parseFloat(p.pnl) >= 0 ? "profit" : "loss"}`}
                onClick={() => setSelectedMarket(p)}
              >
                <h3>{p.question}</h3>
                <p>Outcome: <strong>{p.outcome ? "YES" : "NO"}</strong></p>
                <p>
                  PnL: <strong>{parseFloat(p.pnl) >= 0 ? "+" : ""}{p.pnl}</strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMarket && (
        <div className="modal-overlay" onClick={() => setSelectedMarket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Market Details</h2>
            <p><strong>Question:</strong> {selectedMarket.question}</p>
            <p><strong>Address:</strong> {selectedMarket.address}</p>
            <p><strong>Outcome:</strong> {selectedMarket.outcome ? "YES" : "NO"}</p>
            <p><strong>YES Tokens:</strong> {selectedMarket.yes}</p>
            <p><strong>NO Tokens:</strong> {selectedMarket.no}</p>
            <p><strong>Staked:</strong> {selectedMarket.staked}</p>
            <p>
              <strong>PnL:</strong>{" "}
              <span className={parseFloat(selectedMarket.pnl) >= 0 ? "pnl-positive" : "pnl-negative"}>
                {parseFloat(selectedMarket.pnl) >= 0 ? "+" : ""}{selectedMarket.pnl}
              </span>
            </p>
            <button onClick={() => setSelectedMarket(null)} className="btn close-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
