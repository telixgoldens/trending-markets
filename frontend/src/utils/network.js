export const TARGET_NETWORK = {
  chainId: "0x279f",  // 10143 decimal -> 0x279f
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
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
