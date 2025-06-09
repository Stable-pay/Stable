import { ethers } from 'ethers';

// ERC-20 ABI for token balance queries
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// Network RPC configurations
const NETWORK_CONFIGS = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    tokens: {
      USDC: '0xA0b86a33E6441b4a0c4eaD6Dd0Ba1DC1F4A5F1A',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    }
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon.llamarpc.com',
    tokens: {
      USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
    }
  },
  42161: {
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arbitrum.llamarpc.com',
    tokens: {
      USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    }
  },
  8453: {
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://base.llamarpc.com',
    tokens: {
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      WETH: '0x4200000000000000000000000000000000000006'
    }
  }
};

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address: string;
  chainId: number;
  network: string;
}

export interface NetworkBalance {
  chainId: number;
  network: string;
  nativeBalance: string;
  nativeSymbol: string;
  tokens: TokenBalance[];
  totalUsdValue: number;
}

class MultiChainBalanceService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  constructor() {
    // Initialize providers for each network
    Object.entries(NETWORK_CONFIGS).forEach(([chainId, config]) => {
      this.providers.set(Number(chainId), new ethers.JsonRpcProvider(config.rpcUrl));
    });
  }

  async getNetworkBalance(address: string, chainId: number): Promise<NetworkBalance | null> {
    const provider = this.providers.get(chainId);
    const config = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
    
    if (!provider || !config) {
      console.warn(`Unsupported network: ${chainId}`);
      return null;
    }

    try {
      // Get native token balance
      const nativeBalance = await provider.getBalance(address);
      const nativeBalanceFormatted = ethers.formatEther(nativeBalance);

      // Get token balances
      const tokens: TokenBalance[] = [];
      
      for (const [symbol, tokenAddress] of Object.entries(config.tokens)) {
        try {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const [balance, decimals, name] = await Promise.all([
            contract.balanceOf(address),
            contract.decimals(),
            contract.name()
          ]);

          const balanceFormatted = ethers.formatUnits(balance, decimals);
          
          if (parseFloat(balanceFormatted) > 0) {
            tokens.push({
              symbol,
              name,
              balance: balanceFormatted,
              decimals,
              address: tokenAddress,
              chainId,
              network: config.name
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} balance on ${config.name}:`, error);
        }
      }

      return {
        chainId,
        network: config.name,
        nativeBalance: nativeBalanceFormatted,
        nativeSymbol: config.symbol,
        tokens,
        totalUsdValue: 0 // Would need price feeds for accurate USD values
      };
    } catch (error) {
      console.error(`Failed to fetch balances for ${config.name}:`, error);
      return null;
    }
  }

  async getAllNetworkBalances(address: string): Promise<NetworkBalance[]> {
    const chainIds = Object.keys(NETWORK_CONFIGS).map(Number);
    
    const balancePromises = chainIds.map(chainId => 
      this.getNetworkBalance(address, chainId).catch(error => {
        console.warn(`Failed to fetch balances for chain ${chainId}:`, error);
        return null;
      })
    );

    const results = await Promise.all(balancePromises);
    return results.filter(result => result !== null) as NetworkBalance[];
  }

  async getSwappableTokens(address: string): Promise<TokenBalance[]> {
    const allBalances = await this.getAllNetworkBalances(address);
    const swappableTokens: TokenBalance[] = [];

    allBalances.forEach(networkBalance => {
      // Add native tokens if balance > 0
      if (parseFloat(networkBalance.nativeBalance) > 0) {
        swappableTokens.push({
          symbol: networkBalance.nativeSymbol,
          name: `Native ${networkBalance.nativeSymbol}`,
          balance: networkBalance.nativeBalance,
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000', // Native token
          chainId: networkBalance.chainId,
          network: networkBalance.network
        });
      }

      // Add ERC-20 tokens
      swappableTokens.push(...networkBalance.tokens);
    });

    return swappableTokens;
  }
}

export const multiChainBalanceService = new MultiChainBalanceService();