import React, { useEffect, useState } from "react";
import { ensureCorrectNetwork } from "./utils/network";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MarketList from "./components/MarketList"; 
import MarketDetail from "./pages/MarketDetail";
import CreateMarket from "./pages/CreateMarket";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { usePrivy } from "@privy-io/react-auth";
import "./styles/App.css";

function App() {
  const [networkOk, setNetworkOk] = useState(true);
  const { user } = usePrivy();


  useEffect(() => {
    async function checkNetwork() {
      const result = await ensureCorrectNetwork();
      setNetworkOk(result.ok);
    }

    checkNetwork();

    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  if (!networkOk) {
    return (
      <div className="page">
        <h2 style={{ color: "red" }}>Wrong Network</h2>
        <p>
          Please switch to the <strong>BnB Testnet</strong> in MetaMask.
        </p>
      </div>
    );
  }

  return (
    <Router>
        <div className="main">
          <Navbar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/markets" element={<MarketList user={user} />} /> {/* ✅ fixed */}
              <Route path="/markets/:address" element={<MarketDetail />} />
              <Route path="/create" element={<CreateMarket />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />

            </Routes>
          </main>
        </div>
      
    </Router>
  );
}

export default App;
