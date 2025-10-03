import React, { useState } from "react";
import { getSigner, getMarketFactory } from "../lib/contracts";

export default function CreateMarket() {
  const [question, setQuestion] = useState("");
  const [expiry, setExpiry] = useState(Math.floor(Date.now() / 1000) + 7 * 24 * 3600);
  const [yesName, setYesName] = useState("Yes Token");
  const [yesSym, setYesSym] = useState("YES");
  const [noName, setNoName] = useState("No Token");
  const [noSym, setNoSym] = useState("NO");
  const [status, setStatus] = useState("");

  async function create() {
    setStatus("Sending tx...");
    try {
      const signer = await getSigner();
      const factory = getMarketFactory(signer);
      const tx = await factory.createMarket(question, expiry, yesName, yesSym, noName, noSym);
      await tx.wait();
      setStatus("Market created — allow few seconds for indexing");
    } catch (err) {
      console.error(err);
      setStatus("Create failed: " + (err.message || err));
    }
  }

  return (
    <div className="page">
      <h1>Create Market</h1>
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
          <button onClick={create} className="btn">Create Market</button>
        </div>
        <div style={{ marginTop: 8 }}>{status}</div>
      </div>
    </div>
  );
}
