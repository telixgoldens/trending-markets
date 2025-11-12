import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseIntent, analyzeMarket } from "../utils/intentAI";
import "../styles/IntentInput.css";

export default function IntentInput() {
  const [userText, setUserText] = useState("");
  const [intent, setIntent] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIntent(null);
    setAnalysis(null);

    try {
      const parsed = await parseIntent(userText);
      setIntent(parsed);

      if (parsed) {
        const result = await analyzeMarket(parsed, {});
        setAnalysis(result);
      }
    } catch (err) {
      console.error("Intent parse/analyze error:", err);
    }

    setLoading(false);
  };

  const handleContinue = () => {
    if (intent?.action === "create_market") {
      navigate("/create", { state: { intent } });
    } else {
      navigate("/create", { state: { intent } });
    }
  };

  function shortSummary(i) {
    if (!i) return "";
    const when = i.date ? ` by ${new Date(i.date).toLocaleString()}` : "";
    return `${i.action === "create_market" ? "Create market:" : i.action} ${i.condition || i.question || ""}${when}`;
  }

  return (
    <div className="intent-box">
      <h3>AI Intent Assistant</h3>
      <form onSubmit={handleSubmit} className="intent-form">
        <input
          type="text"
          placeholder='e.g. "Create a market on whether BTC > $70k by 2025"'
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !userText}>
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </form>

      
      {intent && (
        <div className="intent-result">
          <h4>Intent understood</h4>
          <p className="intent-summary">{shortSummary(intent)}</p>

          
          <button className="continue-btn" onClick={handleContinue}>
             Continue to Create Market
          </button>
        </div>
      )}

      {analysis && (
        <div className="analysis-result">
          <h4>Market Analysis</h4>
          <p>
            <strong>Confidence:</strong>{" "}
            {typeof analysis.confidence === "number"
              ? `${(analysis.confidence * 100).toFixed(1)}%`
              : "—"}
          </p>
          {analysis.summary && <p><strong>Summary:</strong> {analysis.summary}</p>}
          {analysis.suggestedAction && (
            <p><strong>Suggested Action:</strong> {analysis.suggestedAction}</p>
          )}
        </div>
      )}
    </div>
  );
}
