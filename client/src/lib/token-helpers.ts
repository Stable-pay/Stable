// Production token configuration and helper functions
export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl?: string;
}

export const CHAIN_CONFIGS = {
  1: {
    name: 'Ethereum',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    blockExplorer: 'https://etherscan.io'
  },
  137: {
    name: 'Polygon',
    nativeToken: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  56: {
    name: 'BSC',
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com'
  },
  42161: {
    name: 'Arbitrum',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  },
  10: {
    name: 'Optimism',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  8453: {
    name: 'Base',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  }
};

export const POPULAR_TOKENS: Record<number, TokenConfig[]> = {
  1: [ // Ethereum
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86a33E6441b8435b662da5e1a0d5d9d3B7B3e',
      decimals: 6
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      decimals: 18
    },
    {
      symbol: 'UNI',
      name: 'Uniswap',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      decimals: 18
    }
  ],
  137: [ // Polygon
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      decimals: 6
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      decimals: 18
    }
  ],
  56: [ // BSC
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0x55d398326f99059fF775485246999027B3197955',
      decimals: 18
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      decimals: 18
    },
    {
      symbol: 'BUSD',
      name: 'Binance USD',
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      decimals: 18
    }
  ]
};

export function getNativeTokenSymbol(chainId: number): string {
  return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]?.nativeToken.symbol || 'ETH';
}

export function getNativeTokenName(chainId: number): string {
  return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]?.nativeToken.name || 'Ethereum';
}

export function getChainName(chainId: number): string {
  return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]?.name || 'Unknown';
}

export function getPopularTokensForChain(chainId: number): TokenConfig[] {
  return POPULAR_TOKENS[chainId] || [];
}

export function getRpcUrl(chainId: number): string {
  return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]?.rpcUrl || '';
}

export function getBlockExplorer(chainId: number): string {
  return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS]?.blockExplorer || '';
}

export function formatTokenAmount(amount: string, decimals: number, displayDecimals: number = 4): string {
  const num = parseFloat(amount);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals
  });
}

export function formatUsdValue(value: number): string {
  if (value === 0) return '$0.00';
  if (value < 0.01) return '< $0.01';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}