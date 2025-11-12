import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { useWallets } from "@privy-io/react-auth";
import "../styles/MarketDetail.css";

import {
  getProvider,
  getBinaryMarketContract,
  getSigner,
} from "../utils/contracts";

import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const SUBGRAPH_URL = process.env.REACT_APP_SUBGRAPH_URL;

export default function MarketDetail() {
  const { address } = useParams();
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);
  const [onChain, setOnChain] = useState({
    reserveYes: null,
    reserveNo: null,
    resolved: false,
    winningOutcome: null,
    question: null,
    resolveTimestamp: null,
  });
  const [collateralInfo, setCollateralInfo] = useState({
    address: null,
    decimals: 18,
    symbol: "COL",
  });

  const [amount, setAmount] = useState("");
  const [side, setSide] = useState(1); // 1 = YES, 0 = NO
  const [status, setStatus] = useState("");
  const [txPending, setTxPending] = useState(false);

  // modal state
  const [orderOpen, setOrderOpen] = useState(false);
  const [slippage, setSlippage] = useState(1); // percent
  const [estGas, setEstGas] = useState(null);
  const [estGasCost, setEstGasCost] = useState(null);

  const { wallets } = useWallets();
  const privyWallet = wallets?.[0];

  // chart
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Load subgraph + onchain details
  useEffect(() => {
    if (!address) return;
    setLoading(true);

    async function loadAll() {
      try {
        // subgraph: request by lowercase id
        let sg = null;
        try {
          const q = `
            query($id: ID!) {
              market(id: $id) {
                id
                question
                resolveTime
                creator
                createdAt
              }
            }
          `;
          const res = await fetch(SUBGRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: q,
              variables: { id: address.toLowerCase() },
            }),
          });
          const j = await res.json();
          sg = j?.data?.market ?? null;
        } catch (e) {
          console.warn("Subgraph fetch failed:", e);
        }

        const provider = getProvider();
        const market = getBinaryMarketContract(address, provider);

        // read onchain fields
        const [reserves, qOnChain, ts, resolvedFlag, winning] =
          await Promise.all([
            market
              .getReserves()
              .catch(() => [
                ethers.BigNumber.from(0),
                ethers.BigNumber.from(0),
              ]),
            market.question().catch(() => null),
            market.resolveTimestamp().catch(() => null),
            market.resolved().catch(() => false),
            market.winningOutcome().catch(() => null),
          ]);

        const reserveYes = reserves ? reserves[0].toString() : "0";
        const reserveNo = reserves ? reserves[1].toString() : "0";

        // collateral address
        let collateralAddr = null;
        try {
          collateralAddr = await market.collateral();
        } catch (e) {
          try {
            collateralAddr = await market.collateralToken();
          } catch (e2) {
            collateralAddr = null;
          }
        }

        // try to read token metadata
        let decimals = 18;
        let symbol = "COL";
        if (collateralAddr) {
          try {
            const tokenContract = new ethers.Contract(
              collateralAddr,
              [
                "function decimals() view returns (uint8)",
                "function symbol() view returns (string)",
              ],
              provider
            );
            decimals = await tokenContract.decimals().catch(() => 18);
            symbol = await tokenContract.symbol().catch(() => "COL");
          } catch (e) {
            console.warn("Could not read collateral decimals/symbol", e);
          }
        }

        setMarketData(sg);
        setOnChain({
          reserveYes,
          reserveNo,
          resolved: !!resolvedFlag,
          winningOutcome: winning !== null ? Number(winning) : null,
          question: qOnChain || (sg ? sg.question : null),
          resolveTimestamp: ts ? Number(ts) : sg?.resolveTime ?? null,
        });

        setCollateralInfo({
          address: collateralAddr,
          decimals,
          symbol,
        });

        // render chart placeholder / small sample dataset
        renderChart([Number(reserveYes), Number(reserveNo)]);
      } catch (err) {
        console.error("Load market failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  function renderChart(reservesPair = [0, 0]) {
    try {
      const ctx = chartRef.current;
      if (!ctx) return;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.data.datasets[0].data = reservesPair;
        chartInstanceRef.current.update();
        return;
      }
      chartInstanceRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["YES", "NO"],
          datasets: [
            {
              label: "Reserves",
              data: reservesPair,
              backgroundColor: [
                "rgba(46,204,113,0.9)",
                "rgba(255,107,107,0.9)",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              ticks: { color: "var(--muted)" },
              grid: { color: "rgba(255,255,255,0.02)" },
            },
          },
        },
      });
    } catch (e) {
      console.warn("Chart render error", e);
    }
  }

  function fmtToken(amountRaw) {
    if (!amountRaw || amountRaw === "0") return "0";
    try {
      return ethers.utils.formatUnits(amountRaw, collateralInfo.decimals);
    } catch {
      return amountRaw;
    }
  }
  function timeLeft(ts) {
    if (!ts) return "—";
    const left = Number(ts) - Math.floor(Date.now() / 1000);
    if (left <= 0) return "Expired";
    const d = Math.floor(left / (3600 * 24));
    const h = Math.floor((left % (3600 * 24)) / 3600);
    const m = Math.floor((left % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

  async function openOrderModal(desiredSide) {
    setSide(desiredSide);
    setOrderOpen(true);
    setEstGas(null);
    setEstGasCost(null);
    setStatus("");

    try {
      const provider = getProvider();
      if (!privyWallet || !privyWallet.provider) {
        setStatus("Please connect your Privy wallet first.");
        return;
      }

      const signer = await getSigner(privyWallet.provider);
      const market = getBinaryMarketContract(address, signer);

      const decimals = collateralInfo.decimals || 18;
      const sampleAmount = ethers.utils.parseUnits("0.1", decimals);
      const minTokensOut = ethers.BigNumber.from(1);

      try {
        const gasEstimate = await market.estimateGas.buy(
          desiredSide,
          sampleAmount,
          minTokensOut
        );
        const feeData = await provider.getFeeData();
        let gasPrice =
          feeData.gasPrice ||
          feeData.maxFeePerGas ||
          ethers.BigNumber.from("0");

        if (!gasPrice || gasPrice.isZero()) {
          gasPrice = ethers.utils.parseUnits("5", "gwei");
        }
        const cost = gasEstimate.mul(gasPrice);
        setEstGas(gasEstimate.toString());
        setEstGasCost(ethers.utils.formatEther(cost));
      } catch (estErr) {
        console.warn("Gas estimate failed:", estErr);
        setEstGas("n/a");
        setEstGasCost("n/a");
      }
    } catch (err) {
      console.error("Order modal prepare failed:", err);
    }
  }

  async function confirmOrder() {
    setStatus("");
    if (!amount || Number(amount) <= 0) return setStatus("Enter amount > 0");
    if (!collateralInfo.address)
      return setStatus("Collateral token not configured");

    try {
      setTxPending(true);
      setStatus("Preparing transaction...");
      if (!privyWallet || !privyWallet.provider) {
        setStatus("Please connect your Privy wallet first.");
        return;
      }

      const signer = await getSigner(privyWallet.provider);
      const callerAddress = await signer.getAddress();
      const market = getBinaryMarketContract(address, signer);

      const coll = new ethers.Contract(
        collateralInfo.address,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function allowance(address owner, address spender) public view returns (uint256)",
          "function balanceOf(address owner) view returns (uint256)",
        ],
        signer
      );

      const amountRaw = ethers.utils.parseUnits(
        amount.toString(),
        collateralInfo.decimals
      );
      const allowance = await coll.allowance(callerAddress, address);
      const balance = await coll.balanceOf(callerAddress);
      if (balance.lt(amountRaw)) {
        setStatus(`Insufficient ${collateralInfo.symbol} balance`);
        setTxPending(false);
        return;
      }

      if (allowance.lt(amountRaw)) {
        setStatus("Approving collateral...");
        const approveTx = await coll.approve(address, amountRaw);
        await approveTx.wait();
        setStatus("Approval confirmed");
      }

      // compute minTokensOut using slippage percent:
      // We do not compute exact token output here (complex AMM math), so we set a conservative min (1).
      // In production you would compute expected tokensOut from AMM formula and apply slippage.
      const minTokensOut = ethers.BigNumber.from(1);

      setStatus("Sending buy transaction...");
      const tx = await market.buy(side, amountRaw, minTokensOut, {
        gasLimit: 3_000_000,
      });
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Purchase complete — refreshing state");

      // refresh reserves
      const reserves = await market.getReserves();
      setOnChain((prev) => ({
        ...prev,
        reserveYes: reserves[0].toString(),
        reserveNo: reserves[1].toString(),
      }));

      renderChart([
        Number(reserves[0].toString()),
        Number(reserves[1].toString()),
      ]);

      setTimeout(() => {
        setOrderOpen(false);
      }, 800);
    } catch (err) {
      console.error("Buy failed:", err);
      setStatus("Buy failed: " + (err?.message || err));
    } finally {
      setTxPending(false);
    }
  }

  async function handleRedeem() {
    setStatus("");
    try {
      setTxPending(true);
      setStatus("Preparing redeem...");
      if (!privyWallet || !privyWallet.provider) {
        setStatus("Please connect your Privy wallet first.");
        return;
      }
      const signer = await getSigner(privyWallet.provider);
      const market = getBinaryMarketContract(address, signer);

      const winner = onChain.winningOutcome;
      const tokenAddr =
        winner === 1 ? await market.tokenYes() : await market.tokenNo();
      const token = new ethers.Contract(
        tokenAddr,
        ["function balanceOf(address owner) view returns (uint256)"],
        signer
      );

      const ownerAddr = await signer.getAddress();
      const tokensToRedeem = await token.balanceOf(ownerAddr);
      if (tokensToRedeem.lte(0)) {
        setStatus("No winning outcome tokens to redeem");
        setTxPending(false);
        return;
      }

      setStatus("Sending redeem tx...");
      const tx = await market.redeem(tokensToRedeem, { gasLimit: 3_000_000 });
      await tx.wait();
      setStatus("Redeemed — check your collateral balance");
    } catch (err) {
      console.error("Redeem failed:", err);
      setStatus("Redeem failed: " + (err?.message || err));
    } finally {
      setTxPending(false);
    }
  }

  if (loading) {
    return (
      <div className="page market-detail-page">
        <div className="loading">Loading market...</div>
      </div>
    );
  }

  return (
    <div className="page market-detail-page">
      <div className="detail-grid">
        <div className="left-col">
          <div className="market-card-big">
            <div className="header">
              <h1>{onChain.question || "Untitled market"}</h1>
              <div className="meta-row">
                <div>
                  Resolve:{" "}
                  {onChain.resolveTimestamp
                    ? new Date(onChain.resolveTimestamp * 1000).toLocaleString()
                    : "—"}
                </div>
                <div>Time left: {timeLeft(onChain.resolveTimestamp)}</div>
                <div>Market: {address}</div>
              </div>
            </div>

            <div className="reserves">
              <div className="reserve-box">
                <div className="label">YES Reserve</div>
                <div className="value">
                  {fmtToken(onChain.reserveYes)} {collateralInfo.symbol}
                </div>
              </div>
              <div className="reserve-box">
                <div className="label">NO Reserve</div>
                <div className="value">
                  {fmtToken(onChain.reserveNo)} {collateralInfo.symbol}
                </div>
              </div>
            </div>

            <div className="trade-panel">
              {onChain.resolved ? (
                <div className="resolved-block">
                  <div className="resolved-title">Market Resolved</div>
                  <div className="resolved-info">
                    Winning outcome:{" "}
                    {onChain.winningOutcome === 1 ? "YES" : "NO"}
                  </div>
                  <button
                    className="btn gold"
                    onClick={handleRedeem}
                    disabled={txPending}
                  >
                    {txPending ? "Processing..." : "Redeem winning tokens"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="trade-row">
                    <div
                      className={`choice large ${side === 1 ? "active" : ""}`}
                      onClick={() => setSide(1)}
                    >
                      YES
                    </div>
                    <div
                      className={`choice large ${side === 0 ? "active" : ""}`}
                      onClick={() => setSide(0)}
                    >
                      NO
                    </div>
                  </div>

                  <div className="input-row">
                    <div className="input-left">
                      <label>Amount ({collateralInfo.symbol})</label>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`e.g. 1.0 ${collateralInfo.symbol}`}
                      />
                    </div>

                    <div className="input-right">
                      <label>Quick</label>
                      <div className="quick-buttons">
                        <button onClick={() => setAmount("0.1")}>0.1</button>
                        <button onClick={() => setAmount("1")}>1</button>
                        <button onClick={() => setAmount("10")}>10</button>
                      </div>
                    </div>
                  </div>

                  <div className="action-row">
                    <button
                      className="btn buy-yes"
                      disabled={txPending}
                      onClick={() => openOrderModal(1)}
                    >
                      {txPending && side === 1 ? "Processing..." : `Buy YES`}
                    </button>

                    <button
                      className="btn buy-no"
                      disabled={txPending}
                      onClick={() => openOrderModal(0)}
                    >
                      {txPending && side === 0 ? "Processing..." : `Buy NO`}
                    </button>
                  </div>

                  <div className="status">{status}</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="right-col">
          <div className="card small">
            <h3>Market Info</h3>
            <div className="info-row">
              <b>Factory:</b> {marketData?.creator || "—"}
            </div>
            <div className="info-row">
              <b>Created:</b>{" "}
              {marketData
                ? new Date(Number(marketData.createdAt) * 1000).toLocaleString()
                : "—"}
            </div>
            <div className="info-row">
              <b>Collateral:</b> {collateralInfo.address || "—"}
            </div>
            <div className="info-row">
              <b>Resolved:</b> {onChain.resolved ? "Yes" : "No"}
            </div>
          </div>

          <div className="card small" style={{ marginTop: 12 }}>
            <h3>Quick Chart</h3>
            <div style={{ height: 140 }}>
              <canvas ref={chartRef} />
            </div>
          </div>

          <div className="card small" style={{ marginTop: 12 }}>
            <h3>AI Assistant</h3>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Use the Create Market page Intent assistant to craft market
              wording and initial params.
            </div>
          </div>
        </div>
      </div>

      {orderOpen && (
        <div className="modal-overlay" onClick={() => setOrderOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Order</h3>
            <div className="modal-row">
              <div>
                <b>Side</b>
              </div>
              <div>{side === 1 ? "YES" : "NO"}</div>
            </div>
            <div className="modal-row">
              <div>
                <b>Amount</b>
              </div>
              <div>
                {amount} {collateralInfo.symbol}
              </div>
            </div>
            <div className="modal-row">
              <div>
                <b>Slippage</b>
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={slippage}
                  onChange={(e) => setSlippage(Number(e.target.value))}
                />
                %
              </div>
            </div>
            <div className="modal-row">
              <div>
                <b>Estimated gas</b>
              </div>
              <div>{estGas ? `${estGas} units` : "n/a"}</div>
            </div>
            <div className="modal-row">
              <div>
                <b>Estimated gas cost (native)</b>
              </div>
              <div>{estGasCost ? `${estGasCost} ETH` : "n/a"}</div>
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setOrderOpen(false)}>
                Cancel
              </button>
              <button
                className="btn gold"
                onClick={confirmOrder}
                disabled={txPending}
              >
                {txPending ? "Processing..." : "Confirm Buy"}
              </button>
            </div>
            <div
              className="modal-note"
              style={{ marginTop: 8, color: "var(--muted)" }}
            >
              Note: minTokensOut is set conservatively. For production, compute
              expected tokensOut and apply slippage.
            </div>
            <div className="status" style={{ marginTop: 8 }}>
              {status}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
