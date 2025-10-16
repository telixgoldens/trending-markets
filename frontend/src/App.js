import React, { useEffect, useState } from "react";
import { ensureCorrectNetwork } from "./utils/network";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import MarketDetail from "./pages/MarketDetail";
import CreateMarket from "./pages/CreateMarket";
import Profile from "./pages/Profile";
import "./styles/Pages.css";

function App() {
  const [networkOk, setNetworkOk] = useState(true);

  useEffect(() => {
    async function checkNetwork() {
      const result = await ensureCorrectNetwork();
      setNetworkOk(result.ok);
    }

    checkNetwork();

    // recheck when user switches network manually
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  if (!networkOk) {
    return (
      <div className="page">
        <h2 style={{ color: "red" }}>⚠️ Wrong Network</h2>
        <p>
          Please switch to the <strong>Monad Testnet</strong> in MetaMask.
        </p>
      </div>
    );
  }
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Navbar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/markets/:address" element={<MarketDetail />} />
              <Route path="/create" element={<CreateMarket />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
