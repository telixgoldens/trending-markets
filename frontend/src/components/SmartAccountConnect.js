import React, { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";

function short(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function SmartAccountConnect() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const address = user?.wallet?.address;
  const explorerUrl = address
    ? `https://testnet.bscscan.com/address/${address}`
    : "#";

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!ready) return <button className="btn-connect">Initializing...</button>;

  return (
    <div className="smart-connect" style={{ position: "relative" }} ref={dropdownRef}>
      {!authenticated ? (
        <button
          onClick={login}
          className="btn-connect"
          style={{
            background: "#f0b90b",
            color: "#000",
            border: "none",
            borderRadius: "10px",
            padding: ".7rem 1.2rem",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 0 10px #f0b90b",
            transition: "0.3s",
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <button
            onClick={() => setOpen(!open)}
            className="btn-wallet"
            style={{
              background: "#1a1a1a",
              color: "#f0b90b",
              border: "1px solid #f0b90b",
              borderRadius: "10px",
              padding: ".7rem 1.2rem",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: open ? "0 0 15px #f0b90b" : "0 0 8px #f0b90b33",
              transition: "0.2s ease",
            }}
          >
            Wallet ({short(address)})
          </button>

          {open && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                right: 0,
                background: "#0b0b0b",
                border: "1px solid #f0b90b33",
                borderRadius: "10px",
                boxShadow: "0 0 20px rgba(240,185,11,0.2)",
                padding: ".6rem 0",
                zIndex: 20,
                width: "200px",
              }}
            >
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  color: "#f0b90b",
                  padding: ".7rem 1rem",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                View on Explorer
              </a>
              <hr style={{ border: "0.5px solid #f0b90b22", margin: ".4rem 0" }} />
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  color: "#f87171",
                  border: "none",
                  padding: ".7rem 1rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
