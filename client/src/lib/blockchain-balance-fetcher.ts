import { ethers } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

const NETWORK_CONFIGS = {
  1: {
    name: 'Ethereum',
    rpc: 'https://eth.llamarpc.com',
    nativeSymbol: 'ETH',
    tokens: {
      'USDC': '0xA0b86a33E6441b4a0c4eaD6Dd0Ba1DC1F4A5F1A',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    }
  },
  137: {
    name: 'Polygon',
    rpc: 'https://polygon.llamarpc.com',
    nativeSymbol: 'MATIC',
    tokens: {
      'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
    }
  },
  42161: {
    name: 'Arbitrum',
    rpc: 'https://arbitrum.llamarpc.com',
    nativeSymbol: 'ETH',
    tokens: {
      'USDC': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
    }
  },
  8453: {
    name: 'Base',
    rpc: 'https://base.llamarpc.com',
    nativeSymbol: 'ETH',
    tokens: {
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
    }
  }
};

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  network: string;
}

export interface NetworkBalance {
  chainId: number;
  network: string;
  nativeBalance: string;
  nativeSymbol: string;
  tokens: TokenBalance[];
}

class BlockchainBalanceFetcher {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  constructor() {
    Object.entries(NETWORK_CONFIGS).forEach(([chainId, config]) => {
      this.providers.set(Number(chainId), new ethers.JsonRpcProvider(config.rpc));
    });
  }

  async getNetworkBalance(address: string, chainId: number): Promise<NetworkBalance | null> {
    const config = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
    const provider = this.providers.get(chainId);
    
    if (!config || !provider) return null;

    try {
      const nativeBalance = await provider.getBalance(address);
      const nativeBalanceFormatted = ethers.formatEther(nativeBalance);

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
              address: tokenAddress,
              balance: balanceFormatted,
              decimals,
              chainId,
              network: config.name
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} on ${config.name}:`, error);
        }
      }

      return {
        chainId,
        network: config.name,
        nativeBalance: nativeBalanceFormatted,
        nativeSymbol: config.nativeSymbol,
        tokens
      };
    } catch (error) {
      console.error(`Failed to fetch balances for ${config.name}:`, error);
      return null;
    }
  }

  async getAllNetworkBalances(address: string): Promise<NetworkBalance[]> {
    const chainIds = Object.keys(NETWORK_CONFIGS).map(Number);
    const promises = chainIds.map(chainId => this.getNetworkBalance(address, chainId));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<NetworkBalance> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  async getSwappableTokens(address: string): Promise<TokenBalance[]> {
    const networkBalances = await this.getAllNetworkBalances(address);
    const tokens: TokenBalance[] = [];

    networkBalances.forEach(network => {
      if (parseFloat(network.nativeBalance) > 0) {
        tokens.push({
          symbol: network.nativeSymbol,
          name: `Native ${network.nativeSymbol}`,
          address: 'NATIVE',
          balance: network.nativeBalance,
          decimals: 18,
          chainId: network.chainId,
          network: network.network
        });
      }
      tokens.push(...network.tokens);
    });

    return tokens;
  }
}

export const blockchainBalanceFetcher = new BlockchainBalanceFetcher();