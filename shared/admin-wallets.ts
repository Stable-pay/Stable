// Admin-controlled wallet addresses for each supported chain
export const ADMIN_WALLETS: Record<number, string> = {
  1: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Ethereum
  137: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Polygon
  56: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // BSC
  42161: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Arbitrum
  10: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Optimism
  8453: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Base
  43114: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Avalanche
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Local hardhat
};

// Validate admin wallet address for a given chain
export function getAdminWallet(chainId: number): string | null {
  const wallet = ADMIN_WALLETS[chainId];
  return wallet && wallet.length > 0 ? wallet : null;
}

// Check if admin wallet is configured for chain
export function isAdminWalletConfigured(chainId: number): boolean {
  return getAdminWallet(chainId) !== null;
}