import { MetaMaskDelegationToolkit } from "@metamask/delegation-toolkit";
import MetaMaskSDK from "@metamask/sdk";

let toolkit = null;
let sdk = null;

export async function initToolkit() {
  if (toolkit) return toolkit;

  // Initialize MetaMask SDK (handles connect for extension/embedded wallets)
  sdk = new MetaMaskSDK({
    dappMetadata: { name: "Trending Markets", url: window.location.href },
  });

  const provider = sdk.getProvider();

  // Initialize Delegation Toolkit for Monad testnet
  toolkit = new MetaMaskDelegationToolkit({
    rpcUrl: "https://monad-testnet-rpc.monad.xyz", // replace with actual RPC
    chainId: 2810, // example Monad testnet ID — verify this
    provider,
  });

  await toolkit.init();
  return toolkit;
}
