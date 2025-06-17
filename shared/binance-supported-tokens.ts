/**
 * Binance USDT trading pairs and supported tokens for developer-controlled wallet transfers
 * Based on CoinMarketCap Binance exchange USDT pairs as of June 2025
 * Source: https://coinmarketcap.com/exchanges/binance/
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

// Binance USDT trading pairs (verified from coinmarketcap.com/exchanges/binance/)
export const BINANCE_SUPPORTED_TOKENS: BinanceToken[] = [
  // Ethereum Network (ERC-20) - Major USDT pairs
  {
    symbol: "BTC",
    name: "Bitcoin",
    chainId: 1,
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.0005",
    minWithdrawal: "0.001"
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    chainId: 1,
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.0024",
    minWithdrawal: "0.0048"
  },
  {
    symbol: "BNB",
    name: "BNB",
    chainId: 1,
    address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.0050",
    minWithdrawal: "0.01"
  },
  {
    symbol: "SOL",
    name: "Solana",
    chainId: 1,
    address: "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "XRP",
    name: "XRP",
    chainId: 1,
    address: "0x1d2F0da169ceB9fC7B3144628dB156f3F6c60dBE",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    chainId: 1,
    address: "0x4206931337dc273a630d328dA6441786BfaD668f",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
  },
  {
    symbol: "ADA",
    name: "Cardano",
    chainId: 1,
    address: "0x3ee2200efb3400fabb9aacf31297cbdd1d435d47",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    chainId: 1,
    address: "0x85f138bfEE4ef8e540890CFb48F620571d67Eda3",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "TRX",
    name: "TRON",
    chainId: 1,
    address: "0xE1Be5D3f34e89dE342Ee97E6e90D405884dA6c67",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "TON",
    name: "Toncoin",
    chainId: 1,
    address: "0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.005",
    minWithdrawal: "0.01"
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    chainId: 1,
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.35",
    minWithdrawal: "0.7"
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    chainId: 1,
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    chainId: 1,
    address: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402",
    decimals: 10,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    chainId: 1,
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.65",
    minWithdrawal: "1.3"
  },
  {
    symbol: "LTC",
    name: "Litecoin",
    chainId: 1,
    address: "0x6159504a9c6Dd5dE8E3cAB9972D9f8d5EF7aFd8c",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.001",
    minWithdrawal: "0.002"
  },
  {
    symbol: "BCH",
    name: "Bitcoin Cash",
    chainId: 1,
    address: "0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.0005",
    minWithdrawal: "0.001"
  },
  {
    symbol: "PEPE",
    name: "Pepe",
    chainId: 1,
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2500000",
    minWithdrawal: "5000000"
  },
  {
    symbol: "APT",
    name: "Aptos",
    chainId: 1,
    address: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "NEAR",
    name: "NEAR Protocol",
    chainId: 1,
    address: "0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4",
    decimals: 24,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.005",
    minWithdrawal: "0.01"
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    chainId: 1,
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "100000",
    minWithdrawal: "200000"
  },

  // BNB Smart Chain (BEP-20) - Native and wrapped tokens
  {
    symbol: "BNB",
    name: "BNB",
    chainId: 56,
    address: "0x0000000000000000000000000000000000000000", // Native BNB
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.0005",
    minWithdrawal: "0.001"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 56,
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 56,
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    chainId: 56,
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "CAKE",
    name: "PancakeSwap Token",
    chainId: 56,
    address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    decimals: 18,
    network: "BEP20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },

  // Polygon Network
  {
    symbol: "MATIC",
    name: "Polygon",
    chainId: 137,
    address: "0x0000000000000000000000000000000000000000", // Native MATIC
    decimals: 18,
    network: "Polygon",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 137,
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    network: "Polygon",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 137,
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    decimals: 6,
    network: "Polygon",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },

  // Avalanche C-Chain
  {
    symbol: "AVAX",
    name: "Avalanche",
    chainId: 43114,
    address: "0x0000000000000000000000000000000000000000", // Native AVAX
    decimals: 18,
    network: "AVAX C",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 43114,
    address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    decimals: 6,
    network: "AVAX C",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 43114,
    address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6,
    network: "AVAX C",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },

  // Arbitrum One
  {
    symbol: "ETH",
    name: "Ethereum",
    chainId: 42161,
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    decimals: 18,
    network: "Arbitrum One",
    binanceSupported: true,
    withdrawalFee: "0.0001",
    minWithdrawal: "0.0002"
  },
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
    symbol: "ETH",
    name: "Ethereum",
    chainId: 10,
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    decimals: 18,
    network: "Optimism",
    binanceSupported: true,
    withdrawalFee: "0.0001",
    minWithdrawal: "0.0002"
  },
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
  const uniqueSymbols = new Set(BINANCE_SUPPORTED_TOKENS
    .filter(token => token.binanceSupported)
    .map(token => token.symbol));
  return Array.from(uniqueSymbols);
};