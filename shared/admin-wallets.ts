// Admin-controlled wallet addresses for each supported chain
export const ADMIN_WALLETS: Record<number, string> = {
  1: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Ethereum
  137: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Polygon
  56: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // BSC
  42161: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Arbitrum
  10: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Optimism
  8453: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Base
  43114: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Avalanche
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