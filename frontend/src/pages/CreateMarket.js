import React, { useState, useEffect } from "react";
import { getSigner, getProvider, getMarketFactoryContract } from "../utils/contracts";
import { initToolkit } from "../utils/smartAccount";
import { ethers } from "ethers";
import IntentInput from "../components/IntentInput";

export default function CreateMarket() {
  const [question, setQuestion] = useState("");
  const [expiry, setExpiry] = useState(Math.floor(Date.now() / 1000) + 7 * 24 * 3600);
  const [yesName, setYesName] = useState("Yes Token");
  const [yesSym, setYesSym] = useState("YES");
  const [noName, setNoName] = useState("No Token");
  const [noSym, setNoSym] = useState("NO");
  const [status, setStatus] = useState("");
  const [markets, setMarkets] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function analyzeMarket() {
    if (!question) return alert("Enter a question first");
    setAnalyzing(true);
    setStatus("Analyzing market...");

    try {
      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setAnalysis(data.analysis);
      setStatus("✅ AI analysis completed");
    } catch (err) {
      console.error(err);
      setStatus("❌ Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function create() {
    try {
      setStatus("⏳ Connecting smart account...");
      const toolkit = await initToolkit();
      await toolkit.connect(); // ensure smart account is connected

      setStatus("🚀 Sending transaction...");
      const signer = await getSigner();
      const factory = getMarketFactoryContract(signer);

      const tx = await factory.createMarket(
        question,
        expiry,
        yesName,
        yesSym,
        noName,
        noSym
      );

      await tx.wait();
      setStatus("✅ Market created — allow few seconds for indexing");
      await loadMarkets();
    } catch (err) {
      console.error(err);
      setStatus("❌ Create failed: " + (err.message || err));
    }
  }

  async function loadMarkets() {
    try {
      setLoadingMarkets(true);
      const provider = getProvider();
      const factory = getMarketFactoryContract(provider);
      const list = await factory.getMarkets();
      setMarkets(list);
    } catch (err) {
      console.error("Error loading markets:", err);
    } finally {
      setLoadingMarkets(false);
    }
  }

  useEffect(() => {
    loadMarkets();
    const interval = setInterval(loadMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <h1>Create Market</h1>

      {/* AI Intent Input */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>AI Intent Assistant</h2>
        <p>Type natural language like “Create a market on ETH above $3000 by December”.</p>
        <IntentInput />
      </div>

      {/* Manual Market Creation Form */}
      <div className="card">
        <label>Question</label>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />

        <label>Resolve timestamp (unix)</label>
        <input value={expiry} onChange={(e) => setExpiry(e.target.value)} />

        <label>YES token name / symbol</label>
        <input value={yesName} onChange={(e) => setYesName(e.target.value)} />
        <input value={yesSym} onChange={(e) => setYesSym(e.target.value)} />

        <label>NO token name / symbol</label>
        <input value={noName} onChange={(e) => setNoName(e.target.value)} />
        <input value={noSym} onChange={(e) => setNoSym(e.target.value)} />

        <div style={{ marginTop: 12 }}>
          <button onClick={create} className="btn">
            Create Market
          </button>
        </div>
        <div style={{ marginTop: 8 }}>{status}</div>
      </div>

      {/* Markets list */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>All Markets</h2>
        {loadingMarkets ? (
          <div>Loading markets...</div>
        ) : markets.length > 0 ? (
          <ul>
            {markets.map((addr, i) => (
              <li key={i}>
                <a href={`/market/${addr}`} style={{ color: "#2563eb" }}>
                  {addr}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div>No markets yet</div>
        )}
      </div>
    </div>
  );
}
