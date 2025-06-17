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

// Supported USDT trading pairs for direct transfers to developer wallets
export const BINANCE_SUPPORTED_TOKENS: BinanceToken[] = [
  // Ethereum Network (ERC-20) - USDT pairs
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
    symbol: "BAT",
    name: "Basic Attention Token",
    chainId: 1,
    address: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "3",
    minWithdrawal: "6"
  },
  {
    symbol: "ETC",
    name: "Ethereum Classic",
    chainId: 1,
    address: "0x3d658390460295FB963f54dC0899cfb1c30776Df",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "XLM",
    name: "Stellar",
    chainId: 1,
    address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
    decimals: 7,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "ZRX",
    name: "0x Protocol",
    chainId: 1,
    address: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
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
    symbol: "ATOM",
    name: "Cosmos",
    chainId: 1,
    address: "0x8D983cb9388EaC77af0474fA441C4815500Cb7BB",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "NEO",
    name: "Neo",
    chainId: 1,
    address: "0xCc5d0A905b99DE2441cc2500d9f7e31e6B7Fb6d3",
    decimals: 0,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "VET",
    name: "VeChain",
    chainId: 1,
    address: "0xD850942eF8811f2A866692A623011bDE52a462C1",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "100",
    minWithdrawal: "200"
  },
  {
    symbol: "QTUM",
    name: "Qtum",
    chainId: 1,
    address: "0x9a642d6b3368ddc662CA244bAdf32cDA716005BC",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "ONT",
    name: "Ontology",
    chainId: 1,
    address: "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "KNC",
    name: "Kyber Network",
    chainId: 1,
    address: "0xdd974D5C2e2928deA5F71b9825b8b646686BD200",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "VTHO",
    name: "VeThor Token",
    chainId: 1,
    address: "0x0000A906E4d90e35596fC28575b7d7E7C8d0d42F",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "21",
    minWithdrawal: "42"
  },
  {
    symbol: "COMP",
    name: "Compound",
    chainId: 1,
    address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "MKR",
    name: "Maker",
    chainId: 1,
    address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.003",
    minWithdrawal: "0.006"
  },
  {
    symbol: "ONE",
    name: "Harmony",
    chainId: 1,
    address: "0x68037790A0229e9Ce6EaA8A99ea92964106C4703",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "BAND",
    name: "Band Protocol",
    chainId: 1,
    address: "0xBA11D00c5f74255f56a5E366F4F77f5A186d7f55",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
  },
  {
    symbol: "STORJ",
    name: "Storj",
    chainId: 1,
    address: "0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
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
    symbol: "EGLD",
    name: "MultiversX",
    chainId: 1,
    address: "0xbf7c81fff98bbe61b40ed186e4afd6ddd01337fe",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "PAXG",
    name: "PAX Gold",
    chainId: 1,
    address: "0x45804880De22913dAFE09f4980848ECE6EcbAf78",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.002",
    minWithdrawal: "0.004"
  },
  {
    symbol: "ZEN",
    name: "Horizen",
    chainId: 1,
    address: "0x2b9F14b163a9F55D7c5d94E55D77F8d5D977BAcE",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "FIL",
    name: "Filecoin",
    chainId: 1,
    address: "0x19d16b87c3DF0b75E1ee31cB08E9bFaED7b36C9F",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "AAVE",
    name: "Aave",
    chainId: 1,
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "GRT",
    name: "The Graph",
    chainId: 1,
    address: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
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
  {
    symbol: "CRV",
    name: "Curve DAO Token",
    chainId: 1,
    address: "0xD533a949740bb3306d119CC777fa900bA034cd52",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
  },
  {
    symbol: "AXS",
    name: "Axie Infinity",
    chainId: 1,
    address: "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.3",
    minWithdrawal: "0.6"
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
    symbol: "CTSI",
    name: "Cartesi",
    chainId: 1,
    address: "0x491604c0FDF08347Dd1fa4Ee062a822A5DD06B5D",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "6",
    minWithdrawal: "12"
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
    symbol: "YFI",
    name: "yearn.finance",
    chainId: 1,
    address: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.0001",
    minWithdrawal: "0.0002"
  },
  {
    symbol: "1INCH",
    name: "1inch",
    chainId: 1,
    address: "0x111111111117dC0aa78b770fA6A738034120C302",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
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
    symbol: "MANA",
    name: "Decentraland",
    chainId: 1,
    address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "6",
    minWithdrawal: "12"
  },
  {
    symbol: "ALGO",
    name: "Algorand",
    chainId: 1,
    address: "0x27702a26126e0B3702af63Ee09aC4d1A084EF628",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "EOS",
    name: "EOS",
    chainId: 1,
    address: "0x86Fa049857E0209aa7D9e616F7eb3b3B78ECfdb0",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "ZEC",
    name: "Zcash",
    chainId: 1,
    address: "0x78d4b48170154CEcD43F774FEfEd4e9Bae8B3D13",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "ENJ",
    name: "Enjin Coin",
    chainId: 1,
    address: "0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "3",
    minWithdrawal: "6"
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
    symbol: "SUSHI",
    name: "SushiSwap",
    chainId: 1,
    address: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
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
    symbol: "LRC",
    name: "Loopring",
    chainId: 1,
    address: "0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "LPT",
    name: "Livepeer",
    chainId: 1,
    address: "0x58b6A8A3302369DAEc383334672404Ee733aB239",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "NMR",
    name: "Numeraire",
    chainId: 1,
    address: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "SLP",
    name: "Smooth Love Potion",
    chainId: 1,
    address: "0xcc8Fa225D80b9c7D42F96e9570156c65D6cAAa25",
    decimals: 0,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "30",
    minWithdrawal: "60"
  },
  {
    symbol: "CHZ",
    name: "Chiliz",
    chainId: 1,
    address: "0x3506424F91fD33084466F402d5D97f05F8e3b4AF",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "50",
    minWithdrawal: "100"
  },
  {
    symbol: "OGN",
    name: "Origin Protocol",
    chainId: 1,
    address: "0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "10",
    minWithdrawal: "20"
  },
  {
    symbol: "GALA",
    name: "Gala",
    chainId: 1,
    address: "0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "45",
    minWithdrawal: "90"
  },
  {
    symbol: "TLM",
    name: "Alien Worlds",
    chainId: 1,
    address: "0x888888848B652B3E3a0f34c96E00EEC0F3a23F72",
    decimals: 4,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "20",
    minWithdrawal: "40"
  },
  {
    symbol: "SNX",
    name: "Synthetix",
    chainId: 1,
    address: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "AUDIO",
    name: "Audius",
    chainId: 1,
    address: "0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "40",
    minWithdrawal: "80"
  },
  {
    symbol: "ENS",
    name: "Ethereum Name Service",
    chainId: 1,
    address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.15",
    minWithdrawal: "0.3"
  },
  {
    symbol: "IMX",
    name: "Immutable X",
    chainId: 1,
    address: "0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
  },
  {
    symbol: "FLOW",
    name: "Flow",
    chainId: 1,
    address: "0x5C147e19312C044f3c3A9B8F9a2e77e3c1E6B5E8",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "GTC",
    name: "Gitcoin",
    chainId: 1,
    address: "0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "THETA",
    name: "Theta Network",
    chainId: 1,
    address: "0x3883f5e181fccaF8410FA61e12b59BAd963fb645",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "3",
    minWithdrawal: "6"
  },
  {
    symbol: "TFUEL",
    name: "Theta Fuel",
    chainId: 1,
    address: "0x4922a015c4407F87432B179bb209e125432E4a2A",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "80",
    minWithdrawal: "160"
  },
  {
    symbol: "OCEAN",
    name: "Ocean Protocol",
    chainId: 1,
    address: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "3",
    minWithdrawal: "6"
  },
  {
    symbol: "CELR",
    name: "Celer Network",
    chainId: 1,
    address: "0x4F9254C83EB525f9FCf346490bbb3ed28a81C667",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "80",
    minWithdrawal: "160"
  },
  {
    symbol: "SKL",
    name: "SKALE Network",
    chainId: 1,
    address: "0x00c83aeCC790e8a4453e5dD3B0B4b3680501a7A7",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "30",
    minWithdrawal: "60"
  },
  {
    symbol: "WAXP",
    name: "WAX",
    chainId: 1,
    address: "0x39Bb259F66E1C59d5ABEF88375979b4D20D98022",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "20",
    minWithdrawal: "40"
  },
  {
    symbol: "LTO",
    name: "LTO Network",
    chainId: 1,
    address: "0x3db6Ba6ab6F95efed1a6E794caD492fAAabF294D",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "20",
    minWithdrawal: "40"
  },
  {
    symbol: "FET",
    name: "Fetch.ai",
    chainId: 1,
    address: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "LOKA",
    name: "League of Kingdoms",
    chainId: 1,
    address: "0x61E90A50137E1F645c9eF4a0d3A4f01477738406",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "ICP",
    name: "Internet Computer",
    chainId: 1,
    address: "0x054C64741dBafDC19784505494029823D89c3b13",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "ROSE",
    name: "Oasis Network",
    chainId: 1,
    address: "0x8a88f04e0c905054D2F33b26BB3A46D7091A039A",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
  },
  {
    symbol: "CELO",
    name: "Celo",
    chainId: 1,
    address: "0x3294395e62F4eB6aF3f1Fcf89f5602D90Fb3Ef69",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "KDA",
    name: "Kadena",
    chainId: 1,
    address: "0x8e870d67f660d95d5be530380d0ec0bd388289e1",
    decimals: 12,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "KSM",
    name: "Kusama",
    chainId: 1,
    address: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
    decimals: 12,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "ACH",
    name: "Alchemy Pay",
    chainId: 1,
    address: "0xEd04915c23f00A313a544955524EB7DBD823143d",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "30",
    minWithdrawal: "60"
  },
  {
    symbol: "SYS",
    name: "Syscoin",
    chainId: 1,
    address: "0x0655977FEb2f289A4aB78af67BAB0d17aAb84367",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "8",
    minWithdrawal: "16"
  },
  {
    symbol: "RAD",
    name: "Radicle",
    chainId: 1,
    address: "0x31c8EAcBFFdD875c74b94b077895Bd78CF1E64A3",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "ILV",
    name: "Illuvium",
    chainId: 1,
    address: "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "LDO",
    name: "Lido DAO",
    chainId: 1,
    address: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "RARE",
    name: "SuperRare",
    chainId: 1,
    address: "0xFCA59Cd816aB1eaD66534D82bc21E7515cE441CF",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "3",
    minWithdrawal: "6"
  },
  {
    symbol: "LSK",
    name: "Lisk",
    chainId: 1,
    address: "0x6033F7f88332B8db6ad452B7C6D5bB643990aE3f",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "DGB",
    name: "DigiByte",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "REEF",
    name: "Reef",
    chainId: 1,
    address: "0xFE3E6a25e6b192A42a44ecDDCd13796471735ACf",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1000",
    minWithdrawal: "2000"
  },
  {
    symbol: "ALICE",
    name: "My Neighbor Alice",
    chainId: 1,
    address: "0xAC51066d7bEC65Dc4589368da368b212745d63E8",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "FORTH",
    name: "Ampleforth Governance",
    chainId: 1,
    address: "0x77FbA179C79De5B7653F68b5039Af940AdA60ce0",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "ASTR",
    name: "Astar",
    chainId: 1,
    address: "0xedf6066a2b290C185783862C7F4776A2C8077AD1",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "BTRST",
    name: "Braintrust",
    chainId: 1,
    address: "0x799ebfABE77a6E34311eeEe9825190B9ECe32824",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "SAND",
    name: "The Sandbox",
    chainId: 1,
    address: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "3",
    minWithdrawal: "6"
  },
  {
    symbol: "BAL",
    name: "Balancer",
    chainId: 1,
    address: "0xba100000625a3754423978a60c9317c58a424e3D",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "GLM",
    name: "Golem",
    chainId: 1,
    address: "0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
  },
  {
    symbol: "CLV",
    name: "Clover Finance",
    chainId: 1,
    address: "0x80C62FE4487E1351b47Ba49809EBD60ED085bf52",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "15",
    minWithdrawal: "30"
  },
  {
    symbol: "QNT",
    name: "Quant",
    chainId: 1,
    address: "0x4a220E6096B25EADb88358cb44068A3248254675",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.03",
    minWithdrawal: "0.06"
  },
  {
    symbol: "STG",
    name: "StarGate Finance",
    chainId: 1,
    address: "0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "AXL",
    name: "Axelar",
    chainId: 1,
    address: "0x467719aD09025FcC6cF6F8311755809d45a5E5f3",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "KAVA",
    name: "Kava",
    chainId: 1,
    address: "0x467719aD09025FcC6cF6F8311755809d45a5E5f3",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
  },
  {
    symbol: "MASK",
    name: "Mask Network",
    chainId: 1,
    address: "0x69af81e73A73B40adF4f3d4223Cd9b1ECE623074",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "2",
    minWithdrawal: "4"
  },
  {
    symbol: "BOSON",
    name: "Boson Protocol",
    chainId: 1,
    address: "0xC477D038d5420C6A9e0b031712f61c5120090de9",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "20",
    minWithdrawal: "40"
  },
  {
    symbol: "POND",
    name: "Marlin",
    chainId: 1,
    address: "0x57B946008913B82E4dF85f501cbAeD910e58D26C",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "50",
    minWithdrawal: "100"
  },
  {
    symbol: "JAM",
    name: "Geojam",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1000",
    minWithdrawal: "2000"
  },
  {
    symbol: "PROM",
    name: "Prometeus",
    chainId: 1,
    address: "0xF4134146AF2d511Dd5EA8cDB1C4AC88C57D60404",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "DIA",
    name: "DIA",
    chainId: 1,
    address: "0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "LOOM",
    name: "Loom Network",
    chainId: 1,
    address: "0xA4e8C3Ec456107eA67d3075bF9e3DF3A75823DB0",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "50",
    minWithdrawal: "100"
  },
  {
    symbol: "STMX",
    name: "StormX",
    chainId: 1,
    address: "0xbE9375C6a420D2eEB258962efB95551A5b722803",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "400",
    minWithdrawal: "800"
  },
  {
    symbol: "TRAC",
    name: "OriginTrail",
    chainId: 1,
    address: "0xaA7a9CA87d3694B5755f213B5D04094b8d0F0A6F",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "10",
    minWithdrawal: "20"
  },
  {
    symbol: "POLYX",
    name: "Polymesh",
    chainId: 1,
    address: "0x9992eC3cF6A55b00978cdDF2b27BC6882d88D1eC",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "10",
    minWithdrawal: "20"
  },
  {
    symbol: "IOST",
    name: "IOST",
    chainId: 1,
    address: "0xFA1a856Cfa3409CFa145Fa4e20Eb270dF3EB21ab",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "50",
    minWithdrawal: "100"
  },
  {
    symbol: "SUI",
    name: "Sui",
    chainId: 1,
    address: "0x84020d7D1b6b71A29E8D1Df0C9a3C51fbAa08Bf7",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "FLOKI",
    name: "FLOKI",
    chainId: 1,
    address: "0xcf0C122c6b73ff809C693DB761e7CC0e3A2b4ac6",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "500000",
    minWithdrawal: "1000000"
  },
  {
    symbol: "XEC",
    name: "eCash",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 2,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1000",
    minWithdrawal: "2000"
  },
  {
    symbol: "BLUR",
    name: "Blur",
    chainId: 1,
    address: "0x5283D291DBCF85356A21bA090E6db59121208b44",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "ANKR",
    name: "Ankr",
    chainId: 1,
    address: "0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "70",
    minWithdrawal: "140"
  },
  {
    symbol: "DAI",
    name: "Dai",
    chainId: 1,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.8",
    minWithdrawal: "1.6"
  },
  {
    symbol: "DASH",
    name: "Dash",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "HBAR",
    name: "Hedera",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "ICX",
    name: "ICON",
    chainId: 1,
    address: "0xb5A5F22694352C15B00323844aD545ABb2B11028",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "IOTA",
    name: "IOTA",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "RVN",
    name: "Ravencoin",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 8,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "XNO",
    name: "Nano",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 30,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "XTZ",
    name: "Tezos",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "ZIL",
    name: "Zilliqa",
    chainId: 1,
    address: "0x05f4a42e251f2d52b8ed15E9FEdAacFcEF1FAD27",
    decimals: 12,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "20",
    minWithdrawal: "40"
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
    symbol: "ORBS",
    name: "Orbs",
    chainId: 1,
    address: "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "50",
    minWithdrawal: "100"
  },
  {
    symbol: "ADX",
    name: "AdEx",
    chainId: 1,
    address: "0xADE00C28244d5CE17D72E40330B1c318cD12B7c3",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "10",
    minWithdrawal: "20"
  },
  {
    symbol: "FORT",
    name: "Forta",
    chainId: 1,
    address: "0x41545f8b9472D758bB669ed8EaEEEcD7a9C4Ec29",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "50",
    minWithdrawal: "100"
  },
  {
    symbol: "ONG",
    name: "Ontology Gas",
    chainId: 1,
    address: "0xd341d1680Eeee3255b8C4c75bCCE7EB57f144dAe",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "5",
    minWithdrawal: "10"
  },
  {
    symbol: "RENDER",
    name: "Render",
    chainId: 1,
    address: "0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
  },
  {
    symbol: "BONK",
    name: "Bonk",
    chainId: 1,
    address: "0x1151CB3d861920e07a38e03eEAd12C32178567F6",
    decimals: 5,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "10000000",
    minWithdrawal: "20000000"
  },
  {
    symbol: "MAGIC",
    name: "Magic",
    chainId: 1,
    address: "0xB0c7a3Ba49C7a6EaBa6cD4a96C55a1391070Ac9A",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "3",
    minWithdrawal: "6"
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "IOTX",
    name: "IoTeX",
    chainId: 1,
    address: "0x6fB3e0A217407EFFf7Ca062D46c26E5d60a14d69",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "100",
    minWithdrawal: "200"
  },
  {
    symbol: "PNUT",
    name: "Peanut the Squirrel",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "PENGU",
    name: "Pudgy Penguins",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "10",
    minWithdrawal: "20"
  },
  {
    symbol: "TRUMP",
    name: "MAGA",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "NEIRO",
    name: "First Neiro On Ethereum",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1000",
    minWithdrawal: "2000"
  },
  {
    symbol: "METIS",
    name: "Metis",
    chainId: 1,
    address: "0x9E32b13ce7f2E80A01932B42553652E053D6ed8e",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.01",
    minWithdrawal: "0.02"
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "JTO",
    name: "Jito",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 9,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "ORCA",
    name: "Orca",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "1",
    minWithdrawal: "2"
  },
  {
    symbol: "DATA",
    name: "Streamr",
    chainId: 1,
    address: "0x0Cf0Ee63788A0849fE5297F3407f701E122cC023",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "100",
    minWithdrawal: "200"
  },
  {
    symbol: "VIRTUAL",
    name: "Protocol",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
  },
  {
    symbol: "AIXBT",
    name: "aixbt by Virtuals",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 6,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "0.1",
    minWithdrawal: "0.2"
  },
  {
    symbol: "KAITO",
    name: "Kaito AI",
    chainId: 1,
    address: "0x1234567890123456789012345678901234567890",
    decimals: 18,
    network: "ERC20",
    binanceSupported: true,
    withdrawalFee: "10",
    minWithdrawal: "20"
  },

  // BNB Smart Chain (BEP-20)
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
  {
    symbol: "ARB",
    name: "Arbitrum",
    chainId: 42161,
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    decimals: 18,
    network: "Arbitrum One",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
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
  },
  {
    symbol: "OP",
    name: "Optimism",
    chainId: 10,
    address: "0x4200000000000000000000000000000000000042",
    decimals: 18,
    network: "Optimism",
    binanceSupported: true,
    withdrawalFee: "0.5",
    minWithdrawal: "1"
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