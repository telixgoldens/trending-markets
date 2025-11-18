import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Dispute bot active — signer:", signer.address);

  const oracleManagerAddr = process.env.ORACLE_MANAGER!;
  const marketAddr = process.env.SAMPLE_MARKET_ADDRESS!;
  if (!oracleManagerAddr || !marketAddr) {
    throw new Error("Missing ORACLE_MANAGER or SAMPLE_MARKET_ADDRESS in .env");
  }

  const OracleManager = await ethers.getContractAt("OracleManager", oracleManagerAddr);
  const proposalCount = (await OracleManager.proposalCount()).toNumber();

  if (proposalCount === 0) {
    console.log(" No proposals to dispute.");
    return;
  }

  const proposalId = proposalCount;
  const proposal = await OracleManager.proposals(proposalId);

  console.log(" Latest proposal:", proposalId.toString());
  console.log("Proposed outcome:", proposal.proposedOutcome.toString());
  console.log("Finalized:", proposal.finalized);

  const now = Math.floor(Date.now() / 1000);
  const disputeDeadline = proposal.disputeDeadline.toNumber();

  if (proposal.finalized) {
    console.log("Proposal already finalized or challenged — skipping.");
    return;
  }

  if (now > disputeDeadline) {
    console.log(" Dispute window expired — cannot challenge now.");
    return;
  }

  console.log("Disputing active proposal...");
  const tx = await OracleManager.challengeProposal(proposalId);
  await tx.wait();
  console.log("Proposal successfully challenged!");
}

main().catch((err) => {
  console.error("Error challenging proposal:", err);
  process.exitCode = 1;
});
