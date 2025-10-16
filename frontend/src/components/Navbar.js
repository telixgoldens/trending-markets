import React from "react";
import SmartAccountConnect from "./SmartAccountConnect";
import "../styles/Navbar.css";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-left">
        <h2>Markets</h2>
      </div>
      <div className="nav-right">
        <SmartAccountConnect />
      </div>
    </header>
  );
}
