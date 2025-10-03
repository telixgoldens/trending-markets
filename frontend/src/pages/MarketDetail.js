import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProvider, getSigner, getBinaryMarket, getMockERC20 } from "../lib/contracts";
import { ethers } from "ethers";

export default function MarketDetail() {
  const { address } = useParams();
  const [market, setMarket] = useState(null);
  const [provider] = useState(getProvider());
  const [collateralBalance, setCollateralBalance] = useState("0");
  const [yesBalance, setYesBalance] = useState("0");
  const [noBalance, setNoBalance] = useState("0");
  const [amount, setAmount] = useState("10");
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      if (!address) return;
      const contract = getBinaryMarket(address, provider);
      try {
        const question = await contract.question();
        const resolveTs = await contract.resolveTimestamp();
        setMarket({ address, question, resolveTimestamp: resolveTs && resolveTs.toNumber ? resolveTs.toNumber() : resolveTs });
        // load token addresses
        const yesAddr = await contract.tokenYes();
        const noAddr = await contract.tokenNo();
        const collateral = getMockERC20(provider);
        const signer = await getSigner().catch(()=>null);
        if (signer) {
          const userAddress = await signer.getAddress();
          const collBal = await collateral.balanceOf(userAddress);
          setCollateralBalance(ethers.utils.formatUnits(collBal, 18));
          const yesContract = new ethers.Contract(yesAddr, require("../abi/MockERC20.json"), provider);
          const noContract = new ethers.Contract(noAddr, require("../abi/MockERC20.json"), provider);
          const y = await yesContract.balanceOf(userAddress);
          const n = await noContract.balanceOf(userAddress);
          setYesBalance(ethers.utils.formatUnits(y, 18));
          setNoBalance(ethers.utils.formatUnits(n, 18));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [address, provider]);

  async function buy(outcomeIndex) {
    setStatus("Sending buy...");
    try {
      const signer = await getSigner();
      const contract = getBinaryMarket(address, signer);
      const collateral = getMockERC20(signer);
      const num = ethers.utils.parseUnits(amount || "0", 18);
      // approve collateral
      const approveTx = await collateral.approve(address, num);
      await approveTx.wait();
      const tx = await contract.buy(outcomeIndex, num, 0);
      await tx.wait();
      setStatus("Bought!");
    } catch (err) {
      console.error(err);
      setStatus("Buy error: " + (err.message || err));
    }
  }

  async function addLiquidity() {
    setStatus("Adding liquidity...");
    try {
      const signer = await getSigner();
      const contract = getBinaryMarket(address, signer);
      const collateral = getMockERC20(signer);
      const num = ethers.utils.parseUnits(amount || "0", 18);
      await (await collateral.approve(address, num)).wait();
      await (await contract.addLiquidity(num, num)).wait();
      setStatus("Liquidity added");
    } catch (err) {
      console.error(err);
      setStatus("Add liquidity error: " + (err.message || err));
    }
  }

  async function resolveMarket(outcome) {
    setStatus("Resolving...");
    try {
      const signer = await getSigner();
      const contract = getBinaryMarket(address, signer);
      await (await contract.resolve(outcome)).wait();
      setStatus("Resolved");
    } catch (err) {
      console.error(err);
      setStatus("Resolve error: " + (err.message || err));
    }
  }

  async function redeem() {
    setStatus("Redeeming...");
    try {
      const signer = await getSigner();
      const contract = getBinaryMarket(address, signer);
      // redeem all winning tokens: we'll read appropriate token balance
      const winningOutcome = await contract.winningOutcome().catch(()=>null);
      if (winningOutcome === null || winningOutcome === undefined) { setStatus("Not resolved"); return; }
      const tokenAddr = winningOutcome === 1 ? await contract.tokenYes() : await contract.tokenNo();
      const token = new ethers.Contract(tokenAddr, require("../abi/MockERC20.json"), signer);
      const user = await signer.getAddress();
      const bal = await token.balanceOf(user);
      if (bal.isZero()) { setStatus("No winning tokens to redeem"); return; }
      await (await contract.redeem(bal)).wait();
      setStatus("Redeemed");
    } catch (err) {
      console.error(err);
      setStatus("Redeem error: " + (err.message || err));
    }
  }

  return (
    <div className="page">
      <h1>Market</h1>
      {market ? (
        <div className="card">
          <h2>{market.question}</h2>
          <p>Resolve time: {market.resolveTimestamp}</p>
          <div className="controls">
            <input value={amount} onChange={(e)=>setAmount(e.target.value)} />
            <button onClick={()=>buy(1)} className="btn">Buy YES</button>
            <button onClick={()=>buy(0)} className="btn btn-danger">Buy NO</button>
            <button onClick={addLiquidity} className="btn">Add Liquidity</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={()=>resolveMarket(1)} className="btn">Resolve YES</button>
            <button onClick={()=>resolveMarket(0)} className="btn btn-danger">Resolve NO</button>
            <button onClick={redeem} className="btn">Redeem</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div>Collateral balance: {collateralBalance}</div>
            <div>YES balance: {yesBalance}</div>
            <div>NO balance: {noBalance}</div>
            <div>Status: {status}</div>
          </div>
        </div>
      ) : (
        <div>Loading market...</div>
      )}
    </div>
  );
}
