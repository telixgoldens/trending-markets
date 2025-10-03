import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

function short(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function WalletConnect() {
  const [addr, setAddr] = useState(null);

  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      setAddr(window.ethereum.selectedAddress);
    }
  }, []);

  async function connect() {
    if (!window.ethereum) {
      alert("Please install MetaMask or another injected wallet");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAddr(address);
    } catch (err) {
      console.error(err);
      alert("Connection failed");
    }
  }

  return (
    <div>
      {addr ? (
        <div className="wallet">Connected: {short(addr)}</div>
      ) : (
        <button onClick={connect} className="btn-connect">Connect Wallet</button>
      )}
    </div>
  );
}
