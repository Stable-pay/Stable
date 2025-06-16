// Top 100 cryptocurrencies by market cap with DeFi swap liquidity support
export interface CryptoToken {
  symbol: string;
  name: string;
  coingeckoId: string;
  marketCapRank: number;
  networks: string[];
  hasDefiLiquidity: boolean;
  decimals: number;
  logo?: string;
}

export const TOP_100_CRYPTO: CryptoToken[] = [
  // Top 10
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', marketCapRank: 1, networks: ['ethereum', 'bitcoin'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', marketCapRank: 2, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'USDT', name: 'Tether', coingeckoId: 'tether', marketCapRank: 3, networks: ['ethereum', 'polygon', 'bsc'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', marketCapRank: 4, networks: ['solana'], hasDefiLiquidity: true, decimals: 9 },
  { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin', marketCapRank: 5, networks: ['bsc'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple', marketCapRank: 6, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin', marketCapRank: 7, networks: ['ethereum', 'polygon', 'bsc', 'avalanche'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', marketCapRank: 8, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', marketCapRank: 9, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'TRX', name: 'TRON', coingeckoId: 'tron', marketCapRank: 10, networks: ['ethereum', 'tron'], hasDefiLiquidity: true, decimals: 6 },

  // Top 11-20
  { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', marketCapRank: 11, networks: ['avalanche'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu', marketCapRank: 12, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network', marketCapRank: 13, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 9 },
  { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', marketCapRank: 14, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 10 },
  { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', marketCapRank: 15, networks: ['ethereum', 'polygon'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', marketCapRank: 16, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'BCH', name: 'Bitcoin Cash', coingeckoId: 'bitcoin-cash', marketCapRank: 17, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap', marketCapRank: 18, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'NEAR', name: 'NEAR Protocol', coingeckoId: 'near', marketCapRank: 19, networks: ['ethereum', 'near'], hasDefiLiquidity: true, decimals: 24 },
  { symbol: 'LTC', name: 'Litecoin', coingeckoId: 'litecoin', marketCapRank: 20, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },

  // Top 21-30
  { symbol: 'ICP', name: 'Internet Computer', coingeckoId: 'internet-computer', marketCapRank: 21, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 8 },
  { symbol: 'APT', name: 'Aptos', coingeckoId: 'aptos', marketCapRank: 22, networks: ['aptos'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'HBAR', name: 'Hedera', coingeckoId: 'hedera-hashgraph', marketCapRank: 23, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 8 },
  { symbol: 'STX', name: 'Stacks', coingeckoId: 'stacks', marketCapRank: 24, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'CRO', name: 'Cronos', coingeckoId: 'crypto-com-chain', marketCapRank: 25, networks: ['ethereum', 'cronos'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'ARB', name: 'Arbitrum', coingeckoId: 'arbitrum', marketCapRank: 26, networks: ['ethereum', 'arbitrum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'OP', name: 'Optimism', coingeckoId: 'optimism', marketCapRank: 27, networks: ['ethereum', 'optimism'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'MNT', name: 'Mantle', coingeckoId: 'mantle', marketCapRank: 28, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'ATOM', name: 'Cosmos', coingeckoId: 'cosmos', marketCapRank: 29, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'INJ', name: 'Injective', coingeckoId: 'injective-protocol', marketCapRank: 30, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },

  // Top 31-40
  { symbol: 'VET', name: 'VeChain', coingeckoId: 'vechain', marketCapRank: 31, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'FIL', name: 'Filecoin', coingeckoId: 'filecoin', marketCapRank: 32, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'RUNE', name: 'THORChain', coingeckoId: 'thorchain', marketCapRank: 33, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'IMX', name: 'Immutable X', coingeckoId: 'immutable-x', marketCapRank: 34, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'TAO', name: 'Bittensor', coingeckoId: 'bittensor', marketCapRank: 35, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 9 },
  { symbol: 'GRT', name: 'The Graph', coingeckoId: 'the-graph', marketCapRank: 36, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'RENDER', name: 'Render Token', coingeckoId: 'render-token', marketCapRank: 37, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'BGB', name: 'Bitget Token', coingeckoId: 'bitget-token', marketCapRank: 38, networks: ['ethereum', 'bsc'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'THETA', name: 'THETA', coingeckoId: 'theta-token', marketCapRank: 39, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'FTM', name: 'Fantom', coingeckoId: 'fantom', marketCapRank: 40, networks: ['ethereum', 'fantom'], hasDefiLiquidity: true, decimals: 18 },

  // Top 41-50
  { symbol: 'LDO', name: 'Lido DAO', coingeckoId: 'lido-dao', marketCapRank: 41, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'KAS', name: 'Kaspa', coingeckoId: 'kaspa', marketCapRank: 42, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 8 },
  { symbol: 'BONK', name: 'Bonk', coingeckoId: 'bonk', marketCapRank: 43, networks: ['solana'], hasDefiLiquidity: true, decimals: 5 },
  { symbol: 'WIF', name: 'dogwifhat', coingeckoId: 'dogwifcoin', marketCapRank: 44, networks: ['solana'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'AAVE', name: 'Aave', coingeckoId: 'aave', marketCapRank: 45, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'SEI', name: 'Sei', coingeckoId: 'sei-network', marketCapRank: 46, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'JUP', name: 'Jupiter', coingeckoId: 'jupiter-exchange-solana', marketCapRank: 47, networks: ['solana'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'ALGO', name: 'Algorand', coingeckoId: 'algorand', marketCapRank: 48, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'QNT', name: 'Quant', coingeckoId: 'quant-network', marketCapRank: 49, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'JASMY', name: 'JasmyCoin', coingeckoId: 'jasmycoin', marketCapRank: 50, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },

  // Top 51-60
  { symbol: 'FLOW', name: 'Flow', coingeckoId: 'flow', marketCapRank: 51, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'WLD', name: 'Worldcoin', coingeckoId: 'worldcoin-wld', marketCapRank: 52, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'PYTH', name: 'Pyth Network', coingeckoId: 'pyth-network', marketCapRank: 53, networks: ['solana'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'JTO', name: 'Jito', coingeckoId: 'jito-governance-token', marketCapRank: 54, networks: ['solana'], hasDefiLiquidity: true, decimals: 9 },
  { symbol: 'FET', name: 'Fetch.ai', coingeckoId: 'fetch-ai', marketCapRank: 55, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'EGLD', name: 'MultiversX', coingeckoId: 'elrond-erd-2', marketCapRank: 56, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'GALA', name: 'Gala', coingeckoId: 'gala', marketCapRank: 57, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe', marketCapRank: 58, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'XLM', name: 'Stellar', coingeckoId: 'stellar', marketCapRank: 59, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 7 },
  { symbol: 'SAND', name: 'The Sandbox', coingeckoId: 'the-sandbox', marketCapRank: 60, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },

  // Top 61-70
  { symbol: 'MANA', name: 'Decentraland', coingeckoId: 'decentraland', marketCapRank: 61, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'EOS', name: 'EOS', coingeckoId: 'eos', marketCapRank: 62, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 4 },
  { symbol: 'XTZ', name: 'Tezos', coingeckoId: 'tezos', marketCapRank: 63, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'FLOKI', name: 'FLOKI', coingeckoId: 'floki', marketCapRank: 64, networks: ['ethereum', 'bsc'], hasDefiLiquidity: true, decimals: 9 },
  { symbol: 'XMR', name: 'Monero', coingeckoId: 'monero', marketCapRank: 65, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 12 },
  { symbol: 'USDE', name: 'Ethena USDe', coingeckoId: 'ethena-usde', marketCapRank: 66, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'BSV', name: 'Bitcoin SV', coingeckoId: 'bitcoin-cash-sv', marketCapRank: 67, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 8 },
  { symbol: 'CAKE', name: 'PancakeSwap', coingeckoId: 'pancakeswap-token', marketCapRank: 68, networks: ['bsc'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'HNT', name: 'Helium', coingeckoId: 'helium', marketCapRank: 69, networks: ['solana'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'PENDLE', name: 'Pendle', coingeckoId: 'pendle', marketCapRank: 70, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },

  // Top 71-80
  { symbol: 'CORE', name: 'Core', coingeckoId: 'coredaoorg', marketCapRank: 71, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'NEO', name: 'Neo', coingeckoId: 'neo', marketCapRank: 72, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 0 },
  { symbol: 'KCS', name: 'KuCoin Token', coingeckoId: 'kucoin-shares', marketCapRank: 73, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'IOTA', name: 'IOTA', coingeckoId: 'iota', marketCapRank: 74, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 6 },
  { symbol: 'LEO', name: 'UNUS SED LEO', coingeckoId: 'leo-token', marketCapRank: 75, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'CKB', name: 'Nervos Network', coingeckoId: 'nervos-network', marketCapRank: 76, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'BRETT', name: 'Brett', coingeckoId: 'brett', marketCapRank: 77, networks: ['base'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'AIOZ', name: 'AIOZ Network', coingeckoId: 'aioz-network', marketCapRank: 78, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'GMT', name: 'Green Metaverse Token', coingeckoId: 'stepn', marketCapRank: 79, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 8 },
  { symbol: 'PRIME', name: 'Echelon Prime', coingeckoId: 'echelon-prime', marketCapRank: 80, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },

  // Top 81-90
  { symbol: 'ONDO', name: 'Ondo', coingeckoId: 'ondo-finance', marketCapRank: 81, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'NOT', name: 'Notcoin', coingeckoId: 'notcoin', marketCapRank: 82, networks: ['ethereum'], hasDefiLiquidity: false, decimals: 9 },
  { symbol: 'POPCAT', name: 'Popcat', coingeckoId: 'popcat', marketCapRank: 83, networks: ['solana'], hasDefiLiquidity: true, decimals: 9 },
  { symbol: 'AXS', name: 'Axie Infinity', coingeckoId: 'axie-infinity', marketCapRank: 84, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'BEAM', name: 'Beam', coingeckoId: 'beam-2', marketCapRank: 85, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'ENS', name: 'Ethereum Name Service', coingeckoId: 'ethereum-name-service', marketCapRank: 86, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'NEIRO', name: 'Neiro', coingeckoId: 'neiro', marketCapRank: 87, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 9 },
  { symbol: 'ETC', name: 'Ethereum Classic', coingeckoId: 'ethereum-classic', marketCapRank: 88, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'ROSE', name: 'Oasis Network', coingeckoId: 'oasis-network', marketCapRank: 89, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'CHZ', name: 'Chiliz', coingeckoId: 'chiliz', marketCapRank: 90, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },

  // Top 91-100
  { symbol: 'SAFE', name: 'Safe', coingeckoId: 'safe', marketCapRank: 91, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'APE', name: 'ApeCoin', coingeckoId: 'apecoin', marketCapRank: 92, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'COMP', name: 'Compound', coingeckoId: 'compound-governance-token', marketCapRank: 93, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'LRC', name: 'Loopring', coingeckoId: 'loopring', marketCapRank: 94, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'XDC', name: 'XDC Network', coingeckoId: 'xdce-crowd-sale', marketCapRank: 95, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'ORDI', name: 'ORDI', coingeckoId: 'ordi', marketCapRank: 96, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'TWT', name: 'Trust Wallet Token', coingeckoId: 'trust-wallet-token', marketCapRank: 97, networks: ['bsc'], hasDefiLiquidity: true, decimals: 6 },
  { symbol: 'TUSD', name: 'TrueUSD', coingeckoId: 'true-usd', marketCapRank: 98, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 },
  { symbol: 'SUI', name: 'Sui', coingeckoId: 'sui', marketCapRank: 99, networks: ['sui'], hasDefiLiquidity: true, decimals: 9 },
  { symbol: 'WEMIX', name: 'WEMIX', coingeckoId: 'wemix-token', marketCapRank: 100, networks: ['ethereum'], hasDefiLiquidity: true, decimals: 18 }
];

// Get tokens with DeFi liquidity support only
export const getSupportedTokens = (): CryptoToken[] => {
  return TOP_100_CRYPTO.filter(token => token.hasDefiLiquidity);
};

// Check if a token is supported for conversion
export const isTokenSupported = (symbol: string): boolean => {
  const token = TOP_100_CRYPTO.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
  return token ? token.hasDefiLiquidity : false;
};

// Get token info by symbol
export const getTokenInfo = (symbol: string): CryptoToken | undefined => {
  return TOP_100_CRYPTO.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
};

// Get tokens by market cap rank range
export const getTokensByRank = (startRank: number, endRank: number): CryptoToken[] => {
  return TOP_100_CRYPTO.filter(token => 
    token.marketCapRank >= startRank && 
    token.marketCapRank <= endRank &&
    token.hasDefiLiquidity
  );
};