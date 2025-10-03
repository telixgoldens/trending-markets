import React from "react";
import WalletConnect from "./WalletConnect";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-left">
        <h2>Markets</h2>
      </div>
      <div className="nav-right">
        <WalletConnect />
      </div>
    </header>
  );
}

export default Navbar;
