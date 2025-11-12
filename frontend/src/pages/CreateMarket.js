import React, { useState } from "react";
import { getMarketFactoryContract } from "../utils/contracts";
import IntentInput from "../components/IntentInput";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";

export default function CreateMarket() {
  const location = useLocation();
  const intent = location.state?.intent;

  const [question, setQuestion] = useState(() => intent?.condition ?? "");
  const [expiry, setExpiry] = useState(() =>
    intent?.date
      ? Math.floor(new Date(intent.date).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 7 * 24 * 3600
  );
  const [yesName, setYesName] = useState(() => intent?.yesName ?? "Yes Token");
  const [yesSym, setYesSym] = useState("YES");
  const [noName, setNoName] = useState(() => intent?.noName ?? "No Token");
  const [noSym, setNoSym] = useState("NO");
  const [status, setStatus] = useState("");
  const [analysis] = useState(null);

  const { wallets } = useWallets();
  const privyWallet = wallets.find(w => w.walletClientType === "privy");

  async function create() {
    if (!privyWallet) {
      setStatus(" Connect your smart account first!");
      return;
    }

    try {
      setStatus("Preparing transaction...");

      
      const provider = new ethers.providers.Web3Provider(privyWallet.provider);
      const signer = provider.getSigner();

      const factory = getMarketFactoryContract(signer);

      setStatus("Sending transaction...");
      const tx = await factory.createMarket(
        question,
        expiry,
        yesName,
        yesSym,
        noName,
        noSym
      );
      await tx.wait();

      setStatus("Market created successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Create failed: " + (err.message || err));
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
    setStatus(" Applied AI suggestion!");
  }

  return (
    <div className="page container" style={{ color: "#e2e8f0" }}>
      <h1>Create Market</h1>

      
      <div className="card shadow-sm mb-4 p-4">
        <h2>AI Intent Assistant</h2>
        <p>
          Type natural language like “Create a market on ETH above $3000 by December”.
        </p>
        <IntentInput />
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
        <h2 style={{ color: "#f0b90b", marginBottom: "1rem" }}>Market Setup</h2>

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
              placeholder="Will BTC be above $70,000 by 2025?"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: ".3rem" }}>
              Resolve Timestamp (UNIX)
            </label>
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
              background: "#f0b90b",
              color: "#101010ff",
              border: "none",
              borderRadius: "10px",
              padding: ".8rem",
              fontWeight: "600",
              boxShadow: "0 0 10px #f0b90b",
              cursor: "pointer",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.boxShadow = "0 0 20px #f0b90b")}
            onMouseLeave={(e) => (e.target.style.boxShadow = "0 0 10px  #f0b90b")}
          >
            Create Market
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
                    <strong>Tokens:</strong> {analysis.suggestion.yesName} /{" "}
                    {analysis.suggestion.noName}
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
