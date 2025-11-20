# Trending Markets Prediction Market


---

### 🧩 1. Problem

Prediction markets today face three major pain points:

* **Slow resolution:** UMA’s Optimistic Oracle takes 24–48 hours to finalize results.
* **Complex UX:** Users must bridge, sign transactions, and pay gas — making markets feel like DeFi tools, not simple apps.
* **Scattered liquidity:** Each market isolates liquidity, reducing efficiency and engagement.

---

### 💡 2. Solution — *Trending Markets*

Trending Markets is an **AI-assisted prediction protocol** that resolves events faster and more efficiently.

* 🧠 **AI Resolution:** Uses an AI oracle to propose outcomes instantly (`proposeAIResolution`), reducing wait time to seconds.
* ⛓ **Onchain Verification:** Disputes and finalization are fully transparent through the **OracleManager** and **BinaryMarket** contracts.
* ⚡ **Fast UX:** Supports account abstraction and gasless flow, making predictions feel like a social app rather than a DeFi product.
* 🛰 **Cross-Chain Ready:** Built to deploy across EVM chains like BNB Testnet (Chapel) and others.
* 📊 **Subgraph Indexing:** Tracks market creation, liquidity, swaps, resolutions, and redemptions for analytics and front-end display.

---

### 🧠 3. Technical Architecture

* **Smart Contracts:**

  * `MarketFactory`: deploys new BinaryMarkets.
  * `OracleManager`: handles AI proposals, disputes, and finalization.
  * `BinaryMarket`: manages YES/NO positions and settlements.
* **Oracle Layer:** AI generates intent and proposes outcomes (future: integrate LLM or Chainlink Functions for autonomous AI).
* **Subgraph:** Indexes all events and states from deployed markets for fast querying.
* **Frontend (React + Viem):** Clean UI for creating, predicting, and viewing results.

---

### 🚀 4. Why It’s Different

* Resolves in seconds — not days.
* Combines AI + crypto-native dispute logic.
* Simplified wallet UX with account abstraction.
* Provides open data for trend analysis via The Graph.

---

### 🎥 5. Demo / Presentation

You’ll show:

1. Deploy and create a market (e.g., *“Will ETH > $5000?”*)
2. AI proposes resolution after event.
3. Option to challenge via `challengeProposal`.
4. Market finalizes and subgraph reflects result instantly.

---

