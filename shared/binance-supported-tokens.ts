/**
 * Binance-supported tokens and chains for developer-controlled wallet transfers
 * Based on Binance.com supported networks and tokens as of June 2025
 */

export interface BinanceToken {
  symbol: string;
  name: string;
  chainId: number;
  address: string;
  decimals: number;
  network: string;
  binanceSupported: boolean;
  withdrawalFee: string;
  minWithdrawal: string;
}

export interface BinanceChain {
  id: number;
  name: string;
  network: string;
  symbol: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  binanceSupported: boolean;
  withdrawalEnabled: boolean;
  depositEnabled: boolean;
}

// Binance-supported chains (verified from binance.com)
export const BINANCE_SUPPORTED_CHAINS: BinanceChain[] = [
  {
    id: 1,
    name: "Ethereum Mainnet",
    network: "ethereum",
    symbol: "ETH",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://eth.llamarpc.com", "https://ethereum.publicnode.com"],
    blockExplorerUrls: ["https://etherscan.io"],
    binanceSupported: true,
    withdrawalEnabled: true,
    depositEnabled: true
  },
  {
    id: 56,
    name: "BNB Smart Chain",
    network: "bsc",
    symbol: "BNB",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed1.binance.org", "https://bsc-dataseed2.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
    binanceSupported: true,
    withdrawalEnabled: true,
    depositEnabled: true
  },
  {
    id: 137,
    name: "Polygon",
    network: "polygon",
    symbol: "MATIC",
    nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com", "https://polygon.llamarpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
    binanceSupported: true,
    withdrawalEnabled: true,
    depositEnabled: true
  },
  {
    id: 43114,
    name: "Avalanche C-Chain",
    network: "avalanche",
    symbol: "AVAX",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"],
    binanceSupported: true,
    withdrawalEnabled: true,
    depositEnabled: true
  },
  {
    id: 42161,
    name: "Arbitrum One",
    network: "arbitrum",
    symbol: "ETH",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
    binanceSupported: true,
    withdrawalEnabled: true,
    depositEnabled: true
  },
  {
    id: 10,
    name: "Optimism",
    network: "optimism",
    symbol: "ETH",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
    binanceSupported: true,
    withdrawalEnabled: true,
    depositEnabled: true
  }
];

// Binance-supported tokens (verified from binance.com withdrawal/deposit pages)
export const BINANCE_SUPPORTED_TOKENS: BinanceToken[] = [
  // Ethereum Network (ERC-20)
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 1,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 1,
    address: "0xA0b86a33E6441955C100d30E18E9e7ba28C35516",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    chainId: 1,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    chainId: 1,
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.28",
    minWithdrawal: "0.56"
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    chainId: 1,
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.58",
    minWithdrawal: "1.16"
  },
  {
    symbol: "AAVE",
    name: "Aave",
    chainId: 1,
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.0058",
    minWithdrawal: "0.0116"
  },

  // BNB Smart Chain (BEP-20)
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 56,
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.2",
    minWithdrawal: "0.4"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 56,
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.2",
    minWithdrawal: "0.4"
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    chainId: 56,
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.2",
    minWithdrawal: "0.4"
  },
  {
    symbol: "CAKE",
    name: "PancakeSwap Token",
    chainId: 56,
    address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.058",
    minWithdrawal: "0.116"
  },

  // Polygon Network
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 137,
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    network: "Polygon",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 137,
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    decimals: 6,
    network: "Polygon",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    chainId: 137,
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    decimals: 18,
    network: "Polygon",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },

  // Avalanche C-Chain
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 43114,
    address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    decimals: 6,
    network: "AVAX C",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 43114,
    address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6,
    network: "AVAX C",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },

  // Arbitrum One
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 42161,
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    decimals: 6,
    network: "Arbitrum One",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 42161,
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    network: "Arbitrum One",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },

  // Optimism
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 10,
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    decimals: 6,
    network: "Optimism",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 10,
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
    network: "Optimism",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  }
];

// Developer-controlled wallet addresses for each supported chain
export const DEVELOPER_WALLETS: Record<number, string> = {
  1: "0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D", // Ethereum
  56: "0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D", // BSC
  137: "0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D", // Polygon
  43114: "0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D", // Avalanche
  42161: "0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D", // Arbitrum
  10: "0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D" // Optimism
};

export const getBinanceTokensByChain = (chainId: number): BinanceToken[] => {
  return BINANCE_SUPPORTED_TOKENS.filter(token => token.chainId === chainId);
};

export const getBinanceChainById = (chainId: number): BinanceChain | undefined => {
  return BINANCE_SUPPORTED_CHAINS.find(chain => chain.id === chainId);
};

export const isTokenSupportedByBinance = (symbol: string, chainId: number): boolean => {
  return BINANCE_SUPPORTED_TOKENS.some(
    token => token.symbol === symbol && token.chainId === chainId && token.binanceSupported
  );
};

export const getBinanceTokenInfo = (symbol: string, chainId: number): BinanceToken | undefined => {
  return BINANCE_SUPPORTED_TOKENS.find(
    token => token.symbol === symbol && token.chainId === chainId && token.binanceSupported
  );
};

export const getDeveloperWallet = (chainId: number): string | null => {
  return DEVELOPER_WALLETS[chainId] || null;
};

export const getAllSupportedBinanceChainIds = (): number[] => {
  return BINANCE_SUPPORTED_CHAINS
    .filter(chain => chain.binanceSupported)
    .map(chain => chain.id);
};

export const getAllSupportedBinanceTokenSymbols = (): string[] => {
  return [...new Set(BINANCE_SUPPORTED_TOKENS
    .filter(token => token.binanceSupported)
    .map(token => token.symbol))];
};