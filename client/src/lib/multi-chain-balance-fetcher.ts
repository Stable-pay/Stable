import { ethers } from 'ethers';

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  formattedBalance: string;
  usdValue: number;
  isNative: boolean;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeToken: {
    symbol: string;
    name: string;
    decimals: number;
  };
  tokens: Array<{
    symbol: string;
    name: string;
    address: string;
    decimals: number;
  }>;
}

// Comprehensive network configurations
const NETWORK_CONFIGS: NetworkConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    tokens: [
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441e95e2c2b08ae91e8e6B0e5C3CB2', decimals: 6 },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 }
    ]
  },
  {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon.llamarpc.com',
    nativeToken: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    tokens: [
      { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
      { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
      { symbol: 'WMATIC', name: 'Wrapped Matic', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 }
    ]
  },
  {
    chainId: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc.llamarpc.com',
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    tokens: [
      { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
      { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 }
    ]
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arbitrum.llamarpc.com',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    tokens: [
      { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
      { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
      { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 }
    ]
  },
  {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: 'https://optimism.llamarpc.com',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    tokens: [
      { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
      { symbol: 'USDT', name: 'Tether USD', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
      { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18 }
    ]
  },
  {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://base.llamarpc.com',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    tokens: [
      { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
      { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 }
    ]
  },
  {
    chainId: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://avalanche.llamarpc.com',
    nativeToken: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    tokens: [
      { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
      { symbol: 'USDT', name: 'Tether USD', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18 },
      { symbol: 'WAVAX', name: 'Wrapped AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18 }
    ]
  }
];

// ERC20 ABI for balance and token info
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export class MultiChainBalanceFetcher {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Initialize providers for each network
    NETWORK_CONFIGS.forEach(config => {
      this.providers.set(config.chainId, new ethers.JsonRpcProvider(config.rpcUrl));
    });
  }

  async fetchBalances(walletAddress: string, chainIds?: number[]): Promise<TokenBalance[]> {
    const targetChains = chainIds || NETWORK_CONFIGS.map(c => c.chainId);
    const allBalances: TokenBalance[] = [];

    console.log(`Fetching balances for ${walletAddress} across ${targetChains.length} chains`);

    await Promise.allSettled(
      targetChains.map(async (chainId) => {
        try {
          const balances = await this.fetchChainBalances(walletAddress, chainId);
          allBalances.push(...balances);
        } catch (error) {
          console.warn(`Failed to fetch balances for chain ${chainId}:`, error);
        }
      })
    );

    // Sort by USD value descending
    return allBalances
      .filter(balance => parseFloat(balance.formattedBalance) > 0)
      .sort((a, b) => b.usdValue - a.usdValue);
  }

  private async fetchChainBalances(walletAddress: string, chainId: number): Promise<TokenBalance[]> {
    const config = NETWORK_CONFIGS.find(c => c.chainId === chainId);
    if (!config) {
      console.warn(`No configuration found for chain ${chainId}`);
      return [];
    }

    const provider = this.providers.get(chainId);
    if (!provider) {
      console.warn(`No provider found for chain ${chainId}`);
      return [];
    }

    const balances: TokenBalance[] = [];

    try {
      // Fetch native token balance
      const nativeBalance = await provider.getBalance(walletAddress);
      const nativeFormatted = ethers.formatUnits(nativeBalance, config.nativeToken.decimals);
      const nativePrice = await this.getTokenPrice(config.nativeToken.symbol);

      if (parseFloat(nativeFormatted) > 0) {
        balances.push({
          symbol: config.nativeToken.symbol,
          name: config.nativeToken.name,
          address: '0x0000000000000000000000000000000000000000',
          balance: nativeBalance.toString(),
          decimals: config.nativeToken.decimals,
          chainId: config.chainId,
          chainName: config.name,
          formattedBalance: nativeFormatted,
          usdValue: parseFloat(nativeFormatted) * nativePrice,
          isNative: true
        });
      }

      // Fetch ERC20 token balances
      await Promise.allSettled(
        config.tokens.map(async (token) => {
          try {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const balance = await contract.balanceOf(walletAddress);
            const formatted = ethers.formatUnits(balance, token.decimals);

            if (parseFloat(formatted) > 0) {
              const price = await this.getTokenPrice(token.symbol);
              balances.push({
                symbol: token.symbol,
                name: token.name,
                address: token.address,
                balance: balance.toString(),
                decimals: token.decimals,
                chainId: config.chainId,
                chainName: config.name,
                formattedBalance: formatted,
                usdValue: parseFloat(formatted) * price,
                isNative: false
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch ${token.symbol} balance on ${config.name}:`, error);
          }
        })
      );

    } catch (error) {
      console.error(`Failed to fetch balances for chain ${chainId}:`, error);
    }

    return balances;
  }

  private async getTokenPrice(symbol: string): Promise<number> {
    const cacheKey = symbol.toLowerCase();
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    try {
      const coingeckoId = this.getCoingeckoId(symbol);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'StablePay/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const price = data[coingeckoId]?.usd || this.getFallbackPrice(symbol);
      
      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      console.warn(`Failed to fetch price for ${symbol}:`, error);
      return this.getFallbackPrice(symbol);
    }
  }

  private getCoingeckoId(symbol: string): string {
    const ids: Record<string, string> = {
      'ETH': 'ethereum',
      'MATIC': 'matic-network',
      'BNB': 'binancecoin',
      'AVAX': 'avalanche-2',
      'OP': 'optimism',
      'ARB': 'arbitrum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'BUSD': 'binance-usd',
      'WETH': 'weth',
      'WMATIC': 'wmatic',
      'WBNB': 'wbnb',
      'WAVAX': 'wrapped-avax'
    };
    return ids[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private getFallbackPrice(symbol: string): number {
    const fallbackPrices: Record<string, number> = {
      'ETH': 2300,
      'MATIC': 0.85,
      'BNB': 340,
      'AVAX': 25,
      'OP': 1.8,
      'ARB': 0.9,
      'USDC': 1.0,
      'USDT': 1.0,
      'DAI': 1.0,
      'BUSD': 1.0
    };
    return fallbackPrices[symbol.toUpperCase()] || 0;
  }

  async refreshBalance(walletAddress: string, tokenAddress: string, chainId: number): Promise<TokenBalance | null> {
    const config = NETWORK_CONFIGS.find(c => c.chainId === chainId);
    if (!config) return null;

    const provider = this.providers.get(chainId);
    if (!provider) return null;

    try {
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token
        const balance = await provider.getBalance(walletAddress);
        const formatted = ethers.formatUnits(balance, config.nativeToken.decimals);
        const price = await this.getTokenPrice(config.nativeToken.symbol);

        return {
          symbol: config.nativeToken.symbol,
          name: config.nativeToken.name,
          address: tokenAddress,
          balance: balance.toString(),
          decimals: config.nativeToken.decimals,
          chainId: config.chainId,
          chainName: config.name,
          formattedBalance: formatted,
          usdValue: parseFloat(formatted) * price,
          isNative: true
        };
      } else {
        // ERC20 token
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const [balance, symbol, name, decimals] = await Promise.all([
          contract.balanceOf(walletAddress),
          contract.symbol(),
          contract.name(),
          contract.decimals()
        ]);

        const formatted = ethers.formatUnits(balance, decimals);
        const price = await this.getTokenPrice(symbol);

        return {
          symbol,
          name,
          address: tokenAddress,
          balance: balance.toString(),
          decimals,
          chainId: config.chainId,
          chainName: config.name,
          formattedBalance: formatted,
          usdValue: parseFloat(formatted) * price,
          isNative: false
        };
      }
    } catch (error) {
      console.error(`Failed to refresh balance:`, error);
      return null;
    }
  }

  getSupportedChains(): NetworkConfig[] {
    return [...NETWORK_CONFIGS];
  }

  getNetworkConfig(chainId: number): NetworkConfig | undefined {
    return NETWORK_CONFIGS.find(c => c.chainId === chainId);
  }
}

export const multiChainBalanceFetcher = new MultiChainBalanceFetcher();