export const TARGET_NETWORK = {
  chainId: 97,  
  chainName: "bsc Testnet",
  nativeCurrency: { name: "bsc testnet", symbol: "tBNB", decimals: 18 },
  rpcUrls: ["https://bsc-testnet-rpc.publicnode.com"],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

export async function ensureCorrectNetwork() {
  if (!window.ethereum) return { ok: false, reason: "No wallet found" };

  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    // if wrong network
    if (currentChainId !== TARGET_NETWORK.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TARGET_NETWORK.chainId }],
        });
        return { ok: true };
      } catch (switchError) {
        // If the network isn’t added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [TARGET_NETWORK],
          });
          return { ok: true };
        }
        return { ok: false, reason: "Switch cancelled" };
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("❌ Network check failed:", error);
    return { ok: false, reason: error.message };
  }
}
