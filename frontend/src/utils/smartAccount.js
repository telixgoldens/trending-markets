// src/utils/smartAccount.js
import { createWalletClient, custom, http } from "viem";
import { bscTestnet } from "viem/chains";
import { toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";

export async function initToolkit() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found.");
  }

  console.log("🌐 Connecting to MetaMask on BNB Testnet...");

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const walletClient = createWalletClient({
    account: accounts[0],
    chain: bscTestnet,
    transport: custom(window.ethereum),
  });

  console.log("✅ viem walletClient created:", walletClient);

  // Wrap wallet client with the MetaMask Delegation Toolkit
  const smartAccount = await toMetaMaskSmartAccount({
    signer: walletClient,
    chain: bscTestnet,
  });

  console.log("🎉 Smart Account initialized:", smartAccount);
  return smartAccount;
}
