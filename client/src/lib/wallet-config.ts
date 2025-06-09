// Developer-controlled wallet addresses for USDC collection
export const DEVELOPER_WALLETS = {
  ethereum: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65', // ETH mainnet USDC collection
  polygon: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',  // Polygon USDC collection
  arbitrum: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65', // Arbitrum USDC collection
  base: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',     // Base USDC collection
  optimism: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65', // Optimism USDC collection
  bsc: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',      // BNB Chain USDC collection
  avalanche: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65', // Avalanche USDC collection
} as const;

// USDC contract addresses by network
export const USDC_ADDRESSES = {
  ethereum: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',
  polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  bsc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
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