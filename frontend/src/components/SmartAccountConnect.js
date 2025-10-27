// src/components/SmartAccountConnect.js
import React, { useState } from "react";
import { initToolkit } from "../utils/smartAccount";

function short(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function SmartAccountConnect() {
  const [smartAddress, setSmartAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  async function connectSmartAccount() {
    try {
      setConnecting(true);
      console.log("window.ethereum present:", !!window.ethereum);
      if (window.ethereum) {
        window.ethereum
          .request({ method: "eth_chainId" })
          .then((cid) => console.log("MetaMask chainId (hex):", cid))
          .catch(() => console.log("Could not read chainId"));
      }
      const toolkit = await initToolkit();
      console.log("initToolkit returned:", toolkit);
      if (!toolkit) {
        console.error("❌ Toolkit is null — smart account init failed.");
        alert("Smart account initialization failed. Check console logs.");
        return;
      }

      const connectResult = await toolkit.connect();
      console.log("toolkit.connect() returned:", connectResult);

      const address = await toolkit.getSmartAccountAddress();
      setSmartAddress(address);
    } catch (err) {
      console.error("Smart Account connection failed:", err);
      alert("Connection failed. Check console for details.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div>
      {smartAddress ? (
        <div className="wallet">Smart Account: {short(smartAddress)}</div>
      ) : (
        <button
          onClick={connectSmartAccount}
          className="btn-connect"
          disabled={connecting}
        >
          {connecting ? "Connecting..." : "Connect Smart Account"}
        </button>
      )}
    </div>
  );
}
