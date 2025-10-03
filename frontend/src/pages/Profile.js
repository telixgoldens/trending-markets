import React, { useEffect, useState } from "react";
import { getMockERC20 } from "../lib/contracts";
import { ethers } from "ethers";

export default function Profile() {
  const [balance, setBalance] = useState("—");
  useEffect(() => {
    (async () => {
      try {
        if (!window.ethereum) return;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        const token = getMockERC20(provider);
        const bal = await token.balanceOf(addr);
        setBalance(ethers.utils.formatUnits(bal, 18));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);
  return (
    <div className="page">
      <h1>Profile</h1>
      <div className="card">
        <div>MockERC20 balance: {balance}</div>
      </div>
    </div>
  );
}
