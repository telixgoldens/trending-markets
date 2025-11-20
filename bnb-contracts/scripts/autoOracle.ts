import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🤖 Auto Oracle active — signer:", signer.address);

  const oracleManagerAddr = process.env.ORACLE_MANAGER!;
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  if (!oracleManagerAddr || !marketAddr) {
    throw new Error("Missing ORACLE_MANAGER or SAMPLE_MARKET_ADDRESS in .env");
  }

  const OracleManager = await ethers.getContractAt("OracleManager", oracleManagerAddr);
  const BinaryMarket = await ethers.getContractAt("BinaryMarket", marketAddr);

  const resolved = await BinaryMarket.resolved();
  if (resolved) {
    const winningOutcome = await BinaryMarket.winningOutcome();
    console.log(`Market already resolved with outcome: ${winningOutcome.toString() === "1" ? "YES" : "NO"}`);
    return;
  }

  console.log("Setting dispute window to 30 seconds...");
  await OracleManager.setDisputeWindow(30);

  console.log(" Proposing AI resolution...");
  const proposeTx = await OracleManager.proposeAIResolution(marketAddr, 1);
  const proposeReceipt = await proposeTx.wait();

  let proposalId;
  for (const log of proposeReceipt.logs) {
    try {
      const parsed = OracleManager.interface.parseLog(log);
      if (parsed.name === "ProposalCreated") {
        proposalId = parsed.args.id;
        break;
      }
    } catch {}
  }

  if (!proposalId) throw new Error(" No ProposalCreated event found.");
  console.log(` Proposal created (ID: ${proposalId.toString()})`);

  let proposal = await OracleManager.proposals(proposalId);
  const disputeDeadline = proposal.disputeDeadline.toNumber();

  console.log(" Dispute deadline:", new Date(disputeDeadline * 1000).toLocaleTimeString());
  console.log("Outcome proposed:", proposal.proposedOutcome.toString());

  
  const now = Math.floor(Date.now() / 1000);
  const waitSeconds = disputeDeadline - now;
  if (waitSeconds > 0) {
    console.log(`Waiting ${waitSeconds}s for dispute window to end...`);
    await new Promise(r => setTimeout(r, waitSeconds * 1000 + 2000));
  }

  console.log("Finalizing proposal...");
  try {
    const finalizeTx = await OracleManager.finalizeProposal(proposalId);
    await finalizeTx.wait();
    console.log("Market finalized successfully!");
  } catch (err: any) {
    console.error("Finalization failed:", err.message);
  }

  const finalOutcome = await BinaryMarket.winningOutcome();
  console.log(` Final outcome: ${finalOutcome.toString() === "1" ? "YES" : "NO"}`);
}

main().catch((err) => {
  console.error("Error running auto oracle:", err);
  process.exitCode = 1;
});
