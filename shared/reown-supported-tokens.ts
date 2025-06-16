/**
 * Comprehensive list of Reown (WalletConnect) supported tokens and chains
 * Based on official Reown AppKit documentation and supported networks
 */

export interface ReownToken {
  symbol: string;
  name: string;
  chainId: number;
  address: string;
  decimals: number;
  logoURI?: string;
}

export interface ReownChain {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  iconUrl?: string;
}

// Reown Supported Chains - Complete List Including Non-EVM Networks
export const REOWN_SUPPORTED_CHAINS: ReownChain[] = [
  // Ethereum Mainnet
  {
    id: 1,
    name: "Ethereum",
    network: "ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.infura.io/v3/", "https://eth-mainnet.alchemyapi.io/v2/"],
    blockExplorerUrls: ["https://etherscan.io"],
    iconUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png"
  },
  // Polygon
  {
    id: 137,
    name: "Polygon",
    network: "polygon",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com", "https://rpc-mainnet.matic.network"],
    blockExplorerUrls: ["https://polygonscan.com"],
    iconUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png"
  },
  // Solana Mainnet
  {
    id: 501,
    name: "Solana",
    network: "solana",
    nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
    rpcUrls: ["https://api.mainnet-beta.solana.com", "https://solana-api.projectserum.com"],
    blockExplorerUrls: ["https://explorer.solana.com"],
    iconUrl: "https://cryptologos.cc/logos/solana-sol-logo.png"
  },
  // Bitcoin Mainnet
  {
    id: 0,
    name: "Bitcoin",
    network: "bitcoin",
    nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 8 },
    rpcUrls: ["https://blockstream.info/api", "https://api.blockcypher.com/v1/btc/main"],
    blockExplorerUrls: ["https://blockstream.info", "https://blockchain.info"],
    iconUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png"
  },
  // Cosmos Hub
  {
    id: 118,
    name: "Cosmos Hub",
    network: "cosmos",
    nativeCurrency: { name: "Cosmos", symbol: "ATOM", decimals: 6 },
    rpcUrls: ["https://cosmos-rpc.quickapi.com", "https://rpc-cosmoshub.blockapsis.com"],
    blockExplorerUrls: ["https://www.mintscan.io/cosmos"],
    iconUrl: "https://cryptologos.cc/logos/cosmos-atom-logo.png"
  },
  // Near Protocol
  {
    id: 397,
    name: "Near Protocol",
    network: "near",
    nativeCurrency: { name: "Near", symbol: "NEAR", decimals: 24 },
    rpcUrls: ["https://rpc.mainnet.near.org", "https://near-mainnet.infura.io"],
    blockExplorerUrls: ["https://explorer.near.org"],
    iconUrl: "https://cryptologos.cc/logos/near-protocol-near-logo.png"
  },
  // Polkadot
  {
    id: 0,
    name: "Polkadot",
    network: "polkadot",
    nativeCurrency: { name: "Polkadot", symbol: "DOT", decimals: 10 },
    rpcUrls: ["https://rpc.polkadot.io", "https://polkadot.api.onfinality.io/public"],
    blockExplorerUrls: ["https://polkadot.subscan.io"],
    iconUrl: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png"
  },
  // Tron
  {
    id: 728126428,
    name: "Tron",
    network: "tron",
    nativeCurrency: { name: "Tronix", symbol: "TRX", decimals: 6 },
    rpcUrls: ["https://api.trongrid.io", "https://api.tronstack.io"],
    blockExplorerUrls: ["https://tronscan.org"],
    iconUrl: "https://cryptologos.cc/logos/tron-trx-logo.png"
  },
  {
    id: 56,
    name: "BNB Smart Chain",
    network: "bsc",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io"],
    blockExplorerUrls: ["https://bscscan.com"],
    iconUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png"
  },
  {
    id: 42161,
    name: "Arbitrum One",
    network: "arbitrum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://arbiscan.io"],
    iconUrl: "https://cryptologos.cc/logos/arbitrum-arb-logo.png"
  },
  {
    id: 10,
    name: "Optimism",
    network: "optimism",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.optimism.io", "https://optimism-mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
    iconUrl: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png"
  },
  {
    id: 8453,
    name: "Base",
    network: "base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org", "https://base-mainnet.diamondswap.org/rpc"],
    blockExplorerUrls: ["https://basescan.org"],
    iconUrl: "https://cryptologos.cc/logos/base-base-logo.png"
  },
  {
    id: 43114,
    name: "Avalanche C-Chain",
    network: "avalanche",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc", "https://rpc.ankr.com/avalanche"],
    blockExplorerUrls: ["https://snowtrace.io"],
    iconUrl: "https://cryptologos.cc/logos/avalanche-avax-logo.png"
  },
  {
    id: 250,
    name: "Fantom Opera",
    network: "fantom",
    nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
    rpcUrls: ["https://rpc.ftm.tools", "https://rpc.ankr.com/fantom"],
    blockExplorerUrls: ["https://ftmscan.com"],
    iconUrl: "https://cryptologos.cc/logos/fantom-ftm-logo.png"
  },
  {
    id: 42220,
    name: "Celo",
    network: "celo",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpcUrls: ["https://forno.celo.org", "https://rpc.ankr.com/celo"],
    blockExplorerUrls: ["https://explorer.celo.org"],
    iconUrl: "https://cryptologos.cc/logos/celo-celo-logo.png"
  },
  {
    id: 1284,
    name: "Moonbeam",
    network: "moonbeam",
    nativeCurrency: { name: "Glimmer", symbol: "GLMR", decimals: 18 },
    rpcUrls: ["https://rpc.api.moonbeam.network", "https://rpc.ankr.com/moonbeam"],
    blockExplorerUrls: ["https://moonbeam.moonscan.io"],
    iconUrl: "https://cryptologos.cc/logos/moonbeam-glmr-logo.png"
  },
  {
    id: 100,
    name: "Gnosis Chain",
    network: "gnosis",
    nativeCurrency: { name: "xDAI", symbol: "xDAI", decimals: 18 },
    rpcUrls: ["https://rpc.gnosischain.com", "https://rpc.ankr.com/gnosis"],
    blockExplorerUrls: ["https://gnosisscan.io"],
    iconUrl: "https://cryptologos.cc/logos/gnosis-gno-logo.png"
  },
  {
    id: 324,
    name: "zkSync Era",
    network: "zksync",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.era.zksync.io", "https://zksync2-mainnet.zksync.io"],
    blockExplorerUrls: ["https://explorer.zksync.io"],
    iconUrl: "https://cryptologos.cc/logos/zksync-zk-logo.png"
  }
];

// Major tokens supported across Reown chains
export const REOWN_SUPPORTED_TOKENS: ReownToken[] = [
  // Ethereum Mainnet Tokens
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 1,
    address: "0xA0b86a33E6441c49863dc7b4eA2b43DB5D31f0b2",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 1,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    chainId: 1,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    chainId: 1,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    decimals: 18
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    chainId: 1,
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    chainId: 1,
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18
  },
  {
    symbol: "LINK",
    name: "ChainLink Token",
    chainId: 1,
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18
  },
  {
    symbol: "AAVE",
    name: "Aave Token",
    chainId: 1,
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18
  },
  {
    symbol: "CRV",
    name: "Curve DAO Token",
    chainId: 1,
    address: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    decimals: 18
  },
  {
    symbol: "COMP",
    name: "Compound",
    chainId: 1,
    address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    decimals: 18
  },

  // Solana Mainnet Tokens (SPL Tokens)
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 501,
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 501,
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6
  },
  {
    symbol: "RAY",
    name: "Raydium",
    chainId: 501,
    address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    decimals: 6
  },
  {
    symbol: "SRM",
    name: "Serum",
    chainId: 501,
    address: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
    decimals: 6
  },
  {
    symbol: "MNGO",
    name: "Mango",
    chainId: 501,
    address: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
    decimals: 6
  },
  {
    symbol: "STEP",
    name: "Step Finance",
    chainId: 501,
    address: "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT",
    decimals: 9
  },
  {
    symbol: "ORCA",
    name: "Orca",
    chainId: 501,
    address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    decimals: 6
  },
  {
    symbol: "SAMO",
    name: "Samoyedcoin",
    chainId: 501,
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    decimals: 9
  },

  // Bitcoin Network (Native BTC)
  {
    symbol: "BTC",
    name: "Bitcoin",
    chainId: 0,
    address: "native",
    decimals: 8
  },

  // Cosmos Hub Tokens
  {
    symbol: "ATOM",
    name: "Cosmos Hub",
    chainId: 118,
    address: "uatom",
    decimals: 6
  },

  // Near Protocol Tokens
  {
    symbol: "NEAR",
    name: "Near Protocol",
    chainId: 397,
    address: "native",
    decimals: 24
  },
  {
    symbol: "AURORA",
    name: "Aurora",
    chainId: 397,
    address: "meta-pool.near",
    decimals: 24
  },

  // Polkadot Network
  {
    symbol: "DOT",
    name: "Polkadot",
    chainId: 0,
    address: "native",
    decimals: 10
  },

  // Tron Network Tokens
  {
    symbol: "TRX",
    name: "Tronix",
    chainId: 728126428,
    address: "native",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD (TRC20)",
    chainId: 728126428,
    address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6
  },

  // Polygon Tokens
  {
    symbol: "USDC",
    name: "USD Coin (PoS)",
    chainId: 137,
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD (PoS)",
    chainId: 137,
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin (PoS)",
    chainId: 137,
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    decimals: 18
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    chainId: 137,
    address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    decimals: 18
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    chainId: 137,
    address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    decimals: 8
  },

  // BSC Tokens
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 56,
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 56,
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    chainId: 56,
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals: 18
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    chainId: 56,
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    decimals: 18
  },
  {
    symbol: "BTCB",
    name: "Bitcoin BEP2",
    chainId: 56,
    address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    decimals: 18
  },

  // Arbitrum Tokens
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 42161,
    address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 42161,
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    decimals: 6
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    chainId: 42161,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimals: 18
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    chainId: 42161,
    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    decimals: 18
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    chainId: 42161,
    address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    decimals: 8
  },

  // Optimism Tokens
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 10,
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 10,
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    decimals: 6
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    chainId: 10,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimals: 18
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    chainId: 10,
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    chainId: 10,
    address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    decimals: 8
  },

  // Base Tokens
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 8453,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    chainId: 8453,
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18
  },

  // Avalanche Tokens
  {
    symbol: "USDC",
    name: "USD Coin",
    chainId: 43114,
    address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chainId: 43114,
    address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    decimals: 6
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    chainId: 43114,
    address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
    decimals: 18
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    chainId: 43114,
    address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
    decimals: 18
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    chainId: 43114,
    address: "0x50b7545627a5162F82A992c33b87aDc75187B218",
    decimals: 8
  }
];

// Utility functions
export const getTokensByChain = (chainId: number): ReownToken[] => {
  return REOWN_SUPPORTED_TOKENS.filter(token => token.chainId === chainId);
};

export const getChainById = (chainId: number): ReownChain | undefined => {
  return REOWN_SUPPORTED_CHAINS.find(chain => chain.id === chainId);
};

export const isTokenSupportedByReown = (symbol: string, chainId: number): boolean => {
  return REOWN_SUPPORTED_TOKENS.some(token => 
    token.symbol === symbol && token.chainId === chainId
  );
};

export const getReownTokenInfo = (symbol: string, chainId: number): ReownToken | undefined => {
  return REOWN_SUPPORTED_TOKENS.find(token => 
    token.symbol === symbol && token.chainId === chainId
  );
};

export const getAllSupportedChainIds = (): number[] => {
  return REOWN_SUPPORTED_CHAINS.map(chain => chain.id);
};

export const getAllSupportedTokenSymbols = (): string[] => {
  const symbols: string[] = [];
  const seen = new Set<string>();
  
  for (const token of REOWN_SUPPORTED_TOKENS) {
    if (!seen.has(token.symbol)) {
      symbols.push(token.symbol);
      seen.add(token.symbol);
    }
  }
  
  return symbols;
};