import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

function short(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [open, setOpen] = useState(false);

  const explorerUrl = account
    ? `https://testnet.bscscan.com/address/${account}`
    : "#";

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        setSigner(new ethers.providers.Web3Provider(window.ethereum).getSigner());
      }
    });
  }, []);

  async function connect() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      const web3 = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3.send("eth_requestAccounts", []);
      const signer = web3.getSigner();

      setProvider(web3);
      setSigner(signer);
      setAccount(accounts[0]);
    } catch (err) {
      console.error("Wallet connect error:", err);
    }
  }

  function disconnect() {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setOpen(false);
  }

  if (!account) {
    return (
      <button
        onClick={connect}
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
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
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
        {short(account)}
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
            onClick={disconnect}
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
  );
}
