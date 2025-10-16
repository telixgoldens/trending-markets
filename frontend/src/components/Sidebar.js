import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Trending</h1>
        <div className="subtitle">Markets</div>
      </div>

      <nav className="menu">
        <NavLink to="/" className="menu-item">Dashboard</NavLink>
        <NavLink to="/markets" className="menu-item">Markets</NavLink>
        <NavLink to="/create" className="menu-item">Create Market</NavLink>
        <NavLink to="/profile" className="menu-item">Profile</NavLink>
      </nav>

      <div className="foot">Trending Markets 2025</div>
    </aside>
  );
}

export default Sidebar;
