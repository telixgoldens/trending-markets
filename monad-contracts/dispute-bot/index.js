const { ethers } = require("ethers");
require("dotenv").config();

const RPC = process.env.RPC;
const ORACLE_MANAGER = process.env.ORACLE_MANAGER;
const PRIVATE_KEY = process.env.BOT_PK;

const ABI = [
  "function proposals(uint256) view returns (address market,uint8 proposedOutcome,uint256 proposedAt,uint256 disputeDeadline,bool finalized)",
  "function latestProposalId(address) view returns (uint256)",
  "function challengeProposal(uint256)"
];

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const mgr = new ethers.Contract(ORACLE_MANAGER, ABI, wallet);

  setInterval(async () => {
    try {
      for (let i = 0; i < 10; i++) {
        try {
          const p = await mgr.proposals(i);
          if (p.finalized) continue;
          const now = Math.floor(Date.now() / 1000);
          if (p.proposedAt > 0) {
            const suspicious = false; 
            if (suspicious) {
              console.log("Challenging proposal", i);
              const tx = await mgr.challengeProposal(i);
              await tx.wait();
              console.log("Challenged", i);
            }
          }
        } catch (e) {  }
      }
    } catch (err) {
      console.error("Poll error", err);
    }
  }, 15_000);
}

main().catch(console.error);
