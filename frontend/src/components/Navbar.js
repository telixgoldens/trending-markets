import React from "react";
import { Link, useLocation } from "react-router-dom";
import navLogo from "../assets/trending-logo.jpg";
import PropTypes from "prop-types";
import SmartAccountConnect from "./SmartAccountConnect";
import "../styles/Navbar.css";

export default function Navbar({ onTimeframeChange, currentTimeframe }) {
  const location = useLocation();
  const timeframes = ["1H", "6H", "24H", "7D", "30D", "All"];

  return (
    <header className="tm-navbar">
      <div className="tm-nav-left">
        <div className="tm-logo">
          <img src={navLogo} alt="" className="tm-logo-mark" />
          <h4 className="tm-logo-text">Trending Markets</h4>
        </div>

        <nav className="tm-top-links">
          <Link to="/" className={`tm-link ${location.pathname === "/" ? "active" : ""}`}>
            Dashboard
          </Link>
          <Link to="/markets" className={`tm-link ${location.pathname === "/markets" ? "active" : ""}`}>
            Markets
          </Link>
          <Link to="/create" className={`tm-link ${location.pathname === "/create" ? "active" : ""}`}>
            Create
          </Link>
          <Link to="/profile" className={`tm-link ${location.pathname === "/profile" ? "active" : ""}`}>
            Profile
          </Link>
          <Link to="/leaderboard" className={`tm-link ${location.pathname === "/leaderboard" ? "active" : ""}`}>
            Leaderboard
          </Link>
          <Link to="/activity" className={`tm-link ${location.pathname === "/activity" ? "active" : ""}`}>
            Activity
          </Link>
        </nav>
      </div>

      <div className="tm-nav-right">
        <div className="tm-timeframes">
          {timeframes.map((tf) => (
            <button
              key={tf}
              className={`tf-btn ${currentTimeframe === tf ? "active" : ""}`}
              onClick={() => onTimeframeChange && onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        <input className="tm-search" placeholder="Search markets..." />
        <SmartAccountConnect />
      </div>
    </header>
  );
}
Navbar.propTypes = {
  onTimeframeChange: PropTypes.func,
  currentTimeframe: PropTypes.string,
};
