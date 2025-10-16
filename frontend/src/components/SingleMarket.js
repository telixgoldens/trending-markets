import React, { useState } from "react";
import { getMarketFactoryContract } from "../utils/contracts";

export default function IntentInput() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleIntent() {
    try {
      setLoading(true);
      setStatus("🧠 Understanding your intent...");
      setIntent(null);
      setAnalysis(null);

      const res = await fetch("http://localhost:5000/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!data.intent) throw new Error("Intent not parsed");

      setIntent(data.intent);
      setStatus("✅ Intent understood! Running AI market analysis...");

      // Run AI analysis
      const analyzeRes = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: data.intent.asset,
          question: data.intent.question,
        }),
      });

      const analyzeData = await analyzeRes.json();
      if (!analyzeData.analysis) throw new Error("AI analysis failed");

      setAnalysis(analyzeData.analysis);
      setStatus("✅ AI analysis complete! Review and submit on-chain.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error parsing or analyzing intent");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      if (!intent) return alert("No intent found");
      setSubmitting(true);
      setStatus("🚀 Submitting market on Monad...");

      // ✅ Replaced getSigner with smart account signer
      const { smartAccountSigner } = await import("../utils/smartAccount");
      const signer = await smartAccountSigner();

      const factory = getMarketFactoryContract(signer);
      const tx = await factory.createMarket(
        intent.question,
        intent.expiry,
        intent.yesName,
        "YES",
        intent.noName,
        "NO"
      );
      await tx.wait();

      setStatus("✅ Market created successfully!");

      // ✅ Reset form after success
      setText("");
      setIntent(null);
      setAnalysis(null);
    } catch (err) {
      console.error(err);
      setStatus("❌ On-chain submission failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="intent-box">
      <textarea
        placeholder='e.g. "Create a market on whether ETH will be above $3000 by December 31, 2025"'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button disabled={loading} onClick={handleIntent}>
        {loading ? "Processing..." : "Analyze Intent"}
      </button>

      <p style={{ marginTop: "8px" }}>{status}</p>

      {analysis && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#f1f5f9",
            borderRadius: 8,
          }}
        >
          <h4>AI Market Summary</h4>
          <p><b>Trend:</b> {analysis.trend}</p>
          <p><b>Confidence:</b> {(analysis.confidence * 100).toFixed(1)}%</p>
          <p><b>Summary:</b> {analysis.summary}</p>

          <button
            style={{ marginTop: 10 }}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit Market On-Chain"}
          </button>
        </div>
      )}
    </div>
  );
}
