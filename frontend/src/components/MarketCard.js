import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { ethers } from "ethers";
import { useWallet } from "../utils/wallet"; 
import {
  getBinaryMarketContract,
  getMockERC20,
} from "../utils/contracts";
import "../styles/MarketCard.css";

export default function MarketCard({ market }) {
  const { signer, address } = useWallet();  
  const [yesBalance, setYesBalance] = useState("0");
  const [noBalance, setNoBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [resolved, setResolved] = useState(market.resolved);
  const [outcome, setOutcome] = useState(null);

  const readyToWrite = !!signer;

  const marketContract = useMemo(() => {
    if (!market.address) return null;
    return getBinaryMarketContract(market.address, signer || undefined);
  }, [market.address, signer]);

  const loadBalances = async () => {
    if (!address || !marketContract) return;
    try {
      const provider = marketContract.provider;
      const yesToken = getMockERC20(provider, market.yesToken);
      const noToken = getMockERC20(provider, market.noToken);

      const [yesBal, noBal] = await Promise.all([
        yesToken.balanceOf(address),
        noToken.balanceOf(address),
      ]);

      setYesBalance(ethers.utils.formatUnits(yesBal, 18));
      setNoBalance(ethers.utils.formatUnits(noBal, 18));

      if (resolved) {
        const win = await marketContract.winningOutcome();
        setOutcome(win ? "YES" : "NO");
      }
    } catch (err) {
      console.error("Failed to load balances:", err);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [address, marketContract, resolved]);

  const placeBet = async (side) => {
    if (!readyToWrite) {
      setStatus("Connect wallet first.");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setStatus("Enter a valid amount.");
      return;
    }

    try {
      setStatus("Approving token...");
      const tokenAddr = side === "YES" ? market.yesToken : market.noToken;
      const token = getMockERC20(signer.provider, tokenAddr);
      const amtWei = ethers.utils.parseUnits(amount, 18);

      const allowance = await token.allowance(address, market.address);
      if (allowance.lt(amtWei)) {
        const approveTx = await token.connect(signer).approve(market.address, amtWei);
        await approveTx.wait();
      }

      setStatus("Placing bet...");
      const tx = await marketContract.placeBet(side === "YES", amtWei);
      await tx.wait();

      setStatus("Bet placed successfully!");
      setAmount("");
      loadBalances();
    } catch (err) {
      console.error(err);
      setStatus("Failed to place bet: " + (err.message || err));
    }
  };

  return (
    <div className={`market-card ${resolved ? "resolved" : ""}`}>
      <h3>{market.question}</h3>
      <p>Resolve: {new Date(market.resolveTimestamp).toLocaleString()}</p>
      {resolved && <p>Outcome: <strong>{outcome}</strong></p>}

      <div className="balances">
        <span>YES: {yesBalance}</span>
        <span>NO: {noBalance}</span>
      </div>

      {!resolved && (
        <div className="betting">
          <input
            type="number"
            value={amount}
            placeholder="Amount"
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={() => placeBet("YES")} disabled={!readyToWrite}>
            Bet YES
          </button>
          <button onClick={() => placeBet("NO")} disabled={!readyToWrite}>
            Bet NO
          </button>
        </div>
      )}

      {status && <p className="status">{status}</p>}
    </div>
  );
}

MarketCard.propTypes = {
  market: PropTypes.shape({
    address: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    yesToken: PropTypes.string.isRequired,
    noToken: PropTypes.string.isRequired,
    resolveTimestamp: PropTypes.number.isRequired,
    resolved: PropTypes.bool,
  }).isRequired,
};
