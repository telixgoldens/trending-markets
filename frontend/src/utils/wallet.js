import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);

  async function connect() {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    try {
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      await ethProvider.send("eth_requestAccounts", []);

      const signer = ethProvider.getSigner();
      const addr = await signer.getAddress();

      setProvider(ethProvider);
      setSigner(signer);
      setAddress(addr);
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  }

  async function disconnect() {
    setProvider(null);
    setSigner(null);
    setAddress(null);
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
        }
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{ provider, signer, address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return ctx;
}
