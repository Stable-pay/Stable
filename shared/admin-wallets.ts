// Admin-controlled wallet addresses for each supported chain
export const ADMIN_WALLETS: Record<number, string> = {
  1: '', // Ethereum - To be provided by user
  137: '', // Polygon - To be provided by user
  56: '', // BSC - To be provided by user
  42161: '', // Arbitrum - To be provided by user
  10: '', // Optimism - To be provided by user
  8453: '', // Base - To be provided by user
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