import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🤖 Smart Oracle active — signer:", signer.address);

  const oracleManagerAddr = process.env.ORACLE_MANAGER!;
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  const priceFeedAddr = process.env.CHAINLINK_FEED!; // e.g. ETH/USD feed address on BNB Testnet

  if (!oracleManagerAddr || !marketAddr || !priceFeedAddr) {
    throw new Error("Missing ORACLE_MANAGER, SAMPLE_MARKET_ADDRESS, or CHAINLINK_FEED in .env");
  }

  const OracleManager = await ethers.getContractAt("OracleManager", oracleManagerAddr);
  const BinaryMarket = await ethers.getContractAt("BinaryMarket", marketAddr);
  const PriceFeed = await ethers.getContractAt("AggregatorV3Interface", priceFeedAddr);

  const resolved = await BinaryMarket.resolved();
  if (resolved) {
    const outcome = await BinaryMarket.winningOutcome();
    console.log(`✅ Market already resolved with outcome: ${outcome.toString() === "1" ? "YES" : "NO"}`);
    return;
  }

  console.log("⚙️ Setting dispute window to 20 seconds...");
  await OracleManager.setDisputeWindow(20);

  console.log("📤 Proposing AI resolution (assume AI says YES = 1)...");
  const proposeTx = await OracleManager.proposeAIResolution(marketAddr, 1);
  const receipt = await proposeTx.wait();

  let proposalId;
  for (const log of receipt.logs) {
    try {
      const parsed = OracleManager.interface.parseLog(log);
      if (parsed.name === "ProposalCreated") {
        proposalId = parsed.args.id;
        break;
      }
    } catch {}
  }
  if (!proposalId) throw new Error("No ProposalCreated event found");
  console.log(`✅ Proposal created (id: ${proposalId.toString()})`);

  const proposal = await OracleManager.proposals(proposalId);
  const disputeDeadline = proposal.disputeDeadline.toNumber();

  console.log("📅 Dispute deadline:", new Date(disputeDeadline * 1000).toLocaleTimeString());

  // --- External Oracle Check ---
  const roundData = await PriceFeed.latestRoundData();
  const currentPrice = Number(roundData.answer) / 1e8; // Chainlink returns 8 decimals
  console.log("📊 Current ETH/USD from Chainlink:", currentPrice);

  // Example rule: question = "Will ETH > $5000?"
  const trueOutcome = currentPrice > 5000 ? 1 : 0;
  const aiOutcome = proposal.proposedOutcome.toNumber();

  console.log(`🧠 AI proposed: ${aiOutcome === 1 ? "YES" : "NO"} | Real oracle says: ${trueOutcome === 1 ? "YES" : "NO"}`);

  if (trueOutcome !== aiOutcome) {
    console.log("⚠️ Mismatch detected — challenging proposal...");
    const tx = await OracleManager.challengeProposal(proposalId);
    await tx.wait();
    console.log("✅ Proposal challenged successfully!");
    return;
  }

  // Wait until dispute time expires
  const now = Math.floor(Date.now() / 1000);
  const waitTime = disputeDeadline - now;
  if (waitTime > 0) {
    console.log(`🕒 Waiting ${waitTime}s for dispute window to end...`);
    await new Promise(r => setTimeout(r, waitTime * 1000 + 2000));
  }

  console.log("⚡ Finalizing proposal...");
  try {
    const finalizeTx = await OracleManager.finalizeProposal(proposalId);
    await finalizeTx.wait();
    console.log("✅ Market finalized successfully!");
  } catch (err: any) {
    console.error("❌ Finalization failed:", err.message);
  }

  const finalOutcome = await BinaryMarket.winningOutcome();
  console.log(`🏁 Final outcome: ${finalOutcome.toString() === "1" ? "YES" : "NO"}`);
}

main().catch((err) => {
  console.error("Error running smart oracle:", err);
  process.exitCode = 1;
});
