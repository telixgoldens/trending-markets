import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const oracleManagerAddr = process.env.ORACLE_MANAGER!;
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;

  const OracleManager = await ethers.getContractAt("OracleManager", oracleManagerAddr);

  console.log(`Inspecting OracleManager at ${oracleManagerAddr}`);

  // 1️⃣ Get latest proposal for this market
  const latestProposalId = await OracleManager.latestProposalId(marketAddr);
  const idNum = Number(latestProposalId);
  console.log(`🧩 Latest proposal ID for market ${marketAddr}: ${idNum}`);

  if (idNum === 0) {
    console.error("❌ No proposals found for this market yet.");
    return;
  }

  // 2️⃣ Fetch that proposal safely
  let proposal;
  try {
    proposal = await OracleManager.proposals(idNum);
  } catch (err) {
    console.error("❌ Failed to fetch proposal:", err);
    return;
  }

  if (!proposal || proposal.market === ethers.constants.AddressZero) {
    console.error(`❌ Proposal ${idNum} does not exist or was cleared`);
    return;
  }

  const proposedAt = proposal.proposedAt
    ? new Date(Number(proposal.proposedAt) * 1000).toLocaleString()
    : "N/A";
  const disputeDeadline = proposal.disputeDeadline
    ? new Date(Number(proposal.disputeDeadline) * 1000).toLocaleString()
    : "N/A";

  console.log("✅ Proposal details:");
  console.log({
    id: idNum,
    market: proposal.market,
    proposedOutcome: proposal.proposedOutcome?.toString?.() ?? "N/A",
    proposedAt,
    disputeDeadline,
    finalized: proposal.finalized,
  });
}

main().catch((err) => {
  console.error("Error inspecting proposal:", err);
  process.exitCode = 1;
});
