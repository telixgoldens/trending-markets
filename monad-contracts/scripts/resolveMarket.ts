import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Resolving as:", signer.address);

  const oracleManagerAddr = process.env.ORACLE_MANAGER!;
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  if (!oracleManagerAddr || !marketAddr) {
    throw new Error("Missing ORACLE_MANAGER or SAMPLE_MARKET_ADDRESS in .env");
  }

  const OracleManager = await ethers.getContractAt("OracleManager", oracleManagerAddr);
  const BinaryMarket = await ethers.getContractAt("BinaryMarket", marketAddr);

  const resolved = await BinaryMarket.resolved();
  if (resolved) {
    console.log("✅ Market already resolved, skipping...");
    const winningOutcome = await BinaryMarket.winningOutcome();
    console.log("Winning outcome:", winningOutcome.toString() === "1" ? "YES (1)" : "NO (0)");
    return;
  }

  console.log("⚙️ Proposing market resolution...");
  await OracleManager.setDisputeWindow(10);
  const tx = await OracleManager.proposeAIResolution(marketAddr, 1);
  const receipt = await tx.wait();

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
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = disputeDeadline - now;

  if (secondsLeft > 0) {
    console.log(`🕒 Waiting ${secondsLeft}s for dispute window to expire...`);
    await new Promise(r => setTimeout(r, secondsLeft * 1000 + 2000));
  }

  console.log("⚡ Finalizing proposal after dispute window...");
  const finalizeTx = await OracleManager.finalizeProposal(proposalId);
  await finalizeTx.wait();

  console.log("✅ Market finalized successfully!");
}

main().catch((err) => {
  console.error("Error resolving market:", err);
  process.exitCode = 1;
});
