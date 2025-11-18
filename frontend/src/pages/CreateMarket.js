import React, { useState, useEffect } from "react";
import { getMarketFactoryContract } from "../utils/contracts";
import IntentInput from "../components/IntentInput";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";

export default function CreateMarket() {
  const location = useLocation();
  const intent = location.state?.intent;
  const navigate = useNavigate();

  const [question, setQuestion] = useState(intent?.condition ?? "");
  const [expiry, setExpiry] = useState(() => {
    if (intent?.date) return Math.floor(new Date(intent.date).getTime() / 1000);
    const now = new Date();
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return Math.floor(yearEnd.getTime() / 1000);
  });
  const [yesName, setYesName] = useState(intent?.yesName ?? "Yes Token");
  const [yesSym, setYesSym] = useState("YES");
  const [noName, setNoName] = useState(intent?.noName ?? "No Token");
  const [noSym, setNoSym] = useState("NO");
  const [status, setStatus] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);

  const readyToWrite = !!signer;

  useEffect(() => {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    provider.send("eth_requestAccounts", []).then((accounts) => {
      if (accounts.length) {
        setAccount(accounts[0]);
        setSigner(provider.getSigner());
      }
    });

    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
      } else {
        setAccount(accounts[0]);
        setSigner(provider.getSigner());
      }
    });
  }, []);

  const getFactory = () => {
    if (!signer) throw new Error("Account signer not ready");
    return getMarketFactoryContract(signer);
  };

  async function create() {
    if (!readyToWrite) {
      setStatus("Please connect your wallet first.");
      return;
    }

    if (!question) {
      setStatus("Question is required.");
      return;
    }

    if (!expiry || Number(expiry) <= Math.floor(Date.now() / 1000)) {
      setStatus("Expiry must be a future timestamp.");
      return;
    }

    try {
      setStatus("Preparing transaction...");
      const factory = getFactory();

      setStatus("Sending transaction...");
      const tx = await factory.createMarket(
        question,
        Number(expiry),
        yesName,
        yesSym,
        noName,
        noSym
      );

      await tx.wait();
      setStatus("Market created successfully!");
      setTimeout(() => navigate("/markets"), 900);
    } catch (err) {
      console.error("CreateMarket create failed:", err);
      setStatus("Create failed: " + (err?.message || err));
    }
  }

  function applySuggestion(suggestion) {
    if (!suggestion) return;
    setQuestion(suggestion.question || question);
    setYesName(suggestion.yesName || "Yes Token");
    setNoName(suggestion.noName || "No Token");
    setYesSym(suggestion.yesSym || "YES");
    setNoSym(suggestion.noSym || "NO");
    if (suggestion.expiry) setExpiry(suggestion.expiry);
    setStatus("Applied AI suggestion!");
  }

  const accountInfo = account || "Not connected";

  return (
    <div className="page container" style={{ color: "#e2e8f0" }}>
      <h1>Create Market</h1>

      <div className="card shadow-sm mb-4 p-4">
        <h2>AI Intent Assistant</h2>
        <p>Type something like “Create a market on ETH above $120000 by year end”.</p>
        <IntentInput onApply={applySuggestion} />
      </div>

      <div
        style={{
          background: "#090909ff",
          border: "1px solid #f0b90b",
          boxShadow: "0 0 15px #f0b90b",
          borderRadius: "16px",
          padding: "2rem",
          marginTop: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ color: "#f0b90b", marginBottom: "0.5rem" }}>Market Setup</h2>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{accountInfo}</div>
        </div>

        <div style={{ display: "grid", gap: "1.2rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: ".3rem" }}>Question</label>
            <input
              className="form-control"
              style={{
                background: "#111827",
                color: "#e2e8f0",
                border: "1px solid #f0b90b",
                borderRadius: "10px",
                padding: ".8rem",
                width: "100%",
              }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will BTC be above $120,000 by 31/12/2025?"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: ".3rem" }}>Resolve Timestamp (UNIX)</label>
            <input
              className="form-control"
              type="number"
              style={{
                background: "#111827",
                color: "#e2e8f0",
                border: "1px solid #f0b90b",
                borderRadius: "10px",
                padding: ".8rem",
                width: "100%",
              }}
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: ".3rem" }}>YES Token</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                className="form-control"
                style={{
                  flex: 1,
                  background: "#111827",
                  color: "#e2e8f0",
                  border: "1px solid #f0b90b",
                  borderRadius: "10px",
                  padding: ".8rem",
                }}
                value={yesName}
                onChange={(e) => setYesName(e.target.value)}
              />
              <input
                className="form-control"
                style={{
                  width: "100px",
                  background: "#111827",
                  color: "#e2e8f0",
                  border: "1px solid #f0b90b",
                  borderRadius: "10px",
                  padding: ".8rem",
                }}
                value={yesSym}
                onChange={(e) => setYesSym(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: ".3rem" }}>NO Token</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                className="form-control"
                style={{
                  flex: 1,
                  background: "#111827",
                  color: "#e2e8f0",
                  border: "1px solid #f0b90b",
                  borderRadius: "10px",
                  padding: ".8rem",
                }}
                value={noName}
                onChange={(e) => setNoName(e.target.value)}
              />
              <input
                className="form-control"
                style={{
                  width: "100px",
                  background: "#111827",
                  color: "#e2e8f0",
                  border: "1px solid #f0b90b",
                  borderRadius: "10px",
                  padding: ".8rem",
                }}
                value={noSym}
                onChange={(e) => setNoSym(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
          <button
            onClick={create}
            style={{
              flex: 1,
              background: readyToWrite ? "#f0b90b" : "#6b6b6b",
              color: readyToWrite ? "#101010ff" : "#ddd",
              border: "none",
              borderRadius: "10px",
              padding: ".8rem",
              fontWeight: "600",
              boxShadow: readyToWrite ? "0 0 10px #f0b90b" : "none",
              cursor: readyToWrite ? "pointer" : "not-allowed",
              transition: "0.3s",
            }}
            disabled={!readyToWrite}
          >
            {readyToWrite ? "Create Market" : "Connect Wallet"}
          </button>
        </div>

        {status && <p style={{ marginTop: "1rem", color: "#93c5fd" }}>{status}</p>}
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div
            key="ai-analysis"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="card p-4 mt-3 bg-light"
          >
            <h4>AI Market Insights</h4>
            <p>
              <strong>Trend:</strong> {analysis.trend}
            </p>
            <p>
              <strong>Confidence:</strong> {(analysis.confidence * 100).toFixed(1)}%
            </p>
            <p>
              <strong>Summary:</strong> {analysis.summary}
            </p>

            {analysis.suggestion && (
              <div className="mt-3">
                <h5>Suggested Setup:</h5>
                <div className="border p-3 rounded bg-white shadow-sm">
                  <p>
                    <strong>Question:</strong> {analysis.suggestion.question}
                  </p>
                  <p>
                    <strong>Tokens:</strong> {analysis.suggestion.yesName} / {analysis.suggestion.noName}
                  </p>
                  <button
                    className="btn btn-outline-primary mt-2"
                    onClick={() => applySuggestion(analysis.suggestion)}
                  >
                    Apply Suggestion
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
