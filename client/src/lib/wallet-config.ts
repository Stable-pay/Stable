// Developer-controlled wallet addresses for USDC collection
export const DEVELOPER_WALLETS = {
  ethereum: '0x742d35Cc6634C0532925a3b8c17d01F643a3c2A6', // ETH mainnet USDC collection
  polygon: '0x742d35Cc6634C0532925a3b8c17d01F643a3c2A6',  // Polygon USDC collection
  arbitrum: '0x742d35Cc6634C0532925a3b8c17d01F643a3c2A6', // Arbitrum USDC collection
  base: '0x742d35Cc6634C0532925a3b8c17d01F643a3c2A6',     // Base USDC collection
} as const;

// USDC contract addresses by network
export const USDC_ADDRESSES = {
  ethereum: '0xA0b86a33E6441a175636Cc4bf9E2F930DAF1b8EC',
  polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  arbitrum: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

export type SupportedNetwork = keyof typeof DEVELOPER_WALLETS;

export function getDeveloperWallet(network: SupportedNetwork): string {
  return DEVELOPER_WALLETS[network];
}

export function getUSDCAddress(network: SupportedNetwork): string {
  return USDC_ADDRESSES[network];
}

export function isValidNetwork(network: string): network is SupportedNetwork {
  return network in DEVELOPER_WALLETS;
}