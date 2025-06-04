// Real token addresses and metadata for production swapping
export const TOKEN_ADDRESSES = {
  ethereum: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86a33E6441b8Db75092D5e4FD0B7b1c4c8F0f',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
  },
  polygon: {
    MATIC: '0x0000000000000000000000000000000000000000',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
  },
  bsc: {
    BNB: '0x0000000000000000000000000000000000000000',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'
  },
  base: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
  },
  arbitrum: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548'
  },
  optimism: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    OP: '0x4200000000000000000000000000000000000042'
  },
  avalanche: {
    AVAX: '0x0000000000000000000000000000000000000000',
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'
  }
} as const;

export const TOKEN_SYMBOLS = {
  ethereum: ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI'],
  polygon: ['MATIC', 'USDC', 'USDT', 'WETH', 'DAI'],
  bsc: ['BNB', 'USDC', 'USDT', 'BUSD', 'ETH'],
  base: ['ETH', 'USDC', 'DAI'],
  arbitrum: ['ETH', 'USDC', 'USDT', 'ARB'],
  optimism: ['ETH', 'USDC', 'USDT', 'OP'],
  avalanche: ['AVAX', 'USDC', 'USDT']
} as const;

export type NetworkKey = keyof typeof TOKEN_ADDRESSES;
export type TokenSymbol<T extends NetworkKey> = typeof TOKEN_SYMBOLS[T][number];

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUri?: string;
}

export const getTokensForNetwork = (network: NetworkKey): TokenInfo[] => {
  const symbols = TOKEN_SYMBOLS[network];
  const addresses = TOKEN_ADDRESSES[network];
  
  return symbols.map(symbol => ({
    symbol,
    name: getTokenName(symbol),
    address: addresses[symbol as keyof typeof addresses],
    decimals: getTokenDecimals(symbol),
    logoUri: getTokenLogo(symbol)
  }));
};

const getTokenName = (symbol: string): string => {
  const names: { [key: string]: string } = {
    ETH: 'Ethereum',
    MATIC: 'Polygon',
    BNB: 'BNB',
    AVAX: 'Avalanche',
    USDC: 'USD Coin',
    USDT: 'Tether USD',
    WBTC: 'Wrapped Bitcoin',
    DAI: 'Dai Stablecoin',
    UNI: 'Uniswap',
    WETH: 'Wrapped Ethereum',
    BUSD: 'Binance USD',
    ARB: 'Arbitrum',
    OP: 'Optimism'
  };
  return names[symbol] || symbol;
};

const getTokenDecimals = (symbol: string): number => {
  const decimals: { [key: string]: number } = {
    ETH: 18,
    MATIC: 18,
    BNB: 18,
    AVAX: 18,
    USDC: 6,
    USDT: 6,
    WBTC: 8,
    DAI: 18,
    UNI: 18,
    WETH: 18,
    BUSD: 18,
    ARB: 18,
    OP: 18
  };
  return decimals[symbol] || 18;
};

const getTokenLogo = (symbol: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';
  const logos: { [key: string]: string } = {
    ETH: `${baseUrl}/ethereum/assets/0x0000000000000000000000000000000000000000/logo.png`,
    USDC: `${baseUrl}/ethereum/assets/0xA0b86a33E6441b8Db75092D5e4FD0B7b1c4c8F0f/logo.png`,
    USDT: `${baseUrl}/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png`
  };
  return logos[symbol] || '';
};