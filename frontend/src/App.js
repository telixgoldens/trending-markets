import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MarketList from "./components/MarketList";
import MarketDetail from "./pages/MarketDetail";
import CreateMarket from "./pages/CreateMarket";
import Profile from "./pages/Profile";
import "./styles/App.css";

function App() {
  const [user, setUser] = useState(null); 

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask not found");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setUser(accounts[0]);
  }

  return (
    <Router>
      <div className="main">
        <Navbar connectWallet={connectWallet} user={user} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/markets" element={<MarketList user={user} />} />
            <Route path="/markets/:address" element={<MarketDetail user={user} />} />
            <Route path="/create" element={<CreateMarket user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
