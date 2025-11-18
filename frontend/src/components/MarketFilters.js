import React from "react";
import PropTypes from 'prop-types'; 


export default function MarketFilters({ activeFilter, setActiveFilter }) {
  const options = ["Trending", "Ending soon", "High volume", "Newest", "Watch List"];

  return (
    <div
      className="page-controls"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "15px",
        justifyContent: "center",
      }}
    >
      <style>
        {`
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 8px rgba(250, 204, 21, 0.4); }
            50% { box-shadow: 0 0 18px rgba(250, 204, 21, 0.8); }
            100% { box-shadow: 0 0 8px rgba(250, 204, 21, 0.4); }
          }
        `}
      </style>

      {options.map((option) => {
        const isActive = activeFilter === option;
        return (
          <button
            key={option}
            onClick={() => setActiveFilter(option)}
            style={{
              padding: "10px 18px",
              background: isActive
                ? "linear-gradient(90deg, #facc15 0%, #f5c000 100%)"
                : "transparent",
              color: isActive ? "#0a0a0a" : "#facc15",
              borderRadius: "10px",
              border: "1px solid #facc15",
              fontWeight: isActive ? "700" : "500",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.25s ease-in-out",
              animation: isActive ? "pulseGlow 1.8s infinite ease-in-out" : "none",
              boxShadow: isActive
                ? "0 0 12px rgba(250, 204, 21, 0.6)"
                : "0 0 6px rgba(250, 204, 21, 0.15)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(250, 204, 21, 0.1)";
              e.target.style.boxShadow = "0 0 10px rgba(250, 204, 21, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = isActive
                ? "linear-gradient(90deg, #facc15 0%, #f5c000 100%)"
                : "transparent";
              e.target.style.boxShadow = isActive
                ? "0 0 12px rgba(250, 204, 21, 0.6)"
                : "0 0 6px rgba(250, 204, 21, 0.15)";
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
MarketFilters.propTypes = {
  activeFilter: PropTypes.string.isRequired,
  setActiveFilter: PropTypes.func.isRequired,
};
