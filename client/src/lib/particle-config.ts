// Particle Network configuration
export const particleConfig = {
  projectId: 'c83ce10f-85ce-406e-a9a3-0444767f730b',
  clientKey: 'cAEYYI4suhkKPKYAuD6APYq6vaj9J4a1KhX1k4Zv',
  serverKey: 'sT0PzyBOnNglTIKBfPNl6yNcxGflwMixaR352Cik',
  appId: 'c83ce10f-85ce-406e-a9a3-0444767f730b',
};

// Supported chains configuration
export const supportedChains = [
  {
    id: 1,
    name: 'Ethereum',
    network: 'ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/'],
    blockExplorers: [{ name: 'Etherscan', url: 'https://etherscan.io' }],
  },
  {
    id: 137,
    name: 'Polygon',
    network: 'polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorers: [{ name: 'PolygonScan', url: 'https://polygonscan.com' }],
  },
  {
    id: 56,
    name: 'BSC',
    network: 'bsc',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorers: [{ name: 'BscScan', url: 'https://bscscan.com' }],
  },
  {
    id: 42161,
    name: 'Arbitrum',
    network: 'arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorers: [{ name: 'Arbiscan', url: 'https://arbiscan.io' }],
  },
  {
    id: 10,
    name: 'Optimism',
    network: 'optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorers: [{ name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' }],
  },
  {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorers: [{ name: 'BaseScan', url: 'https://basescan.org' }],
  }
];

// Authentication types
export const authTypes = [
  'email',
  'phone',
  'google',
  'apple',
  'twitter',
  'discord',
  'github',
  'twitch',
  'microsoft',
  'linkedin',
];

// Swap configuration for USDC
export const swapConfig = {
  defaultOutputToken: '0xA0b86a33E6441b8435b662da5e1a0d5d9d3B7B3e', // USDC address on Ethereum
  slippage: 0.5, // 0.5% slippage
  gasless: true, // Enable gasless transactions
  paymaster: true, // Enable paymaster
};

// Export types for TypeScript
export type ParticleChain = typeof supportedChains[number];
export type ParticleConfig = typeof particleConfig;