import { ethers } from 'ethers';

// ERC-20 contract ABI for token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

// Network configurations with correct RPC endpoints
const NETWORKS = {
  1: {
    name: 'Ethereum',
    rpc: 'https://eth.llamarpc.com',
    nativeSymbol: 'ETH',
    explorer: 'https://etherscan.io',
    tokens: {
      'USDC': '0xA0b86a33E6441b4a0c4eaD6Dd0Ba1DC1F4A5F1A',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    }
  },
  137: {
    name: 'Polygon',
    rpc: 'https://polygon.llamarpc.com',
    nativeSymbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    tokens: {
      'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      'WMATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
    }
  },
  42161: {
    name: 'Arbitrum',
    rpc: 'https://arbitrum.llamarpc.com',
    nativeSymbol: 'ETH',
    explorer: 'https://arbiscan.io',
    tokens: {
      'USDC': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    }
  },
  8453: {
    name: 'Base',
    rpc: 'https://base.llamarpc.com',
    nativeSymbol: 'ETH',
    explorer: 'https://basescan.org',
    tokens: {
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      'WETH': '0x4200000000000000000000000000000000000006'
    }
  }
};

export interface TokenInfo {
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
  tokens: TokenInfo[];
  rpcConnected: boolean;
}

class RealTokenBalanceService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  constructor() {
    // Initialize providers for each network
    Object.entries(NETWORKS).forEach(([chainId, config]) => {
      this.providers.set(Number(chainId), new ethers.JsonRpcProvider(config.rpc));
    });
  }

  async getNetworkBalance(walletAddress: string, chainId: number): Promise<NetworkBalance | null> {
    const network = NETWORKS[chainId as keyof typeof NETWORKS];
    if (!network) {
      console.warn(`Network ${chainId} not supported`);
      return null;
    }

    const provider = this.providers.get(chainId);
    if (!provider) {
      console.warn(`Provider for chain ${chainId} not initialized`);
      return null;
    }

    try {
      // Test RPC connection first
      await provider.getBlockNumber();

      // Get native token balance
      const nativeBalance = await provider.getBalance(walletAddress);
      const nativeBalanceFormatted = ethers.formatEther(nativeBalance);

      // Get ERC-20 token balances
      const tokens: TokenInfo[] = [];

      for (const [symbol, tokenAddress] of Object.entries(network.tokens)) {
        try {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          
          const [balance, decimals, name] = await Promise.all([
            contract.balanceOf(walletAddress),
            contract.decimals(),
            contract.name()
          ]);

          const balanceFormatted = ethers.formatUnits(balance, decimals);
          
          // Only include tokens with non-zero balance
          if (parseFloat(balanceFormatted) > 0) {
            tokens.push({
              symbol,
              name,
              address: tokenAddress,
              balance: balanceFormatted,
              decimals,
              chainId,
              network: network.name
            });
          }
        } catch (tokenError) {
          console.warn(`Failed to fetch ${symbol} balance on ${network.name}:`, tokenError);
        }
      }

      return {
        chainId,
        network: network.name,
        nativeBalance: nativeBalanceFormatted,
        nativeSymbol: network.nativeSymbol,
        tokens,
        rpcConnected: true
      };

    } catch (error) {
      console.error(`RPC connection failed for ${network.name}:`, error);
      return {
        chainId,
        network: network.name,
        nativeBalance: '0',
        nativeSymbol: network.nativeSymbol,
        tokens: [],
        rpcConnected: false
      };
    }
  }

  async getAllNetworkBalances(walletAddress: string): Promise<NetworkBalance[]> {
    const chainIds = Object.keys(NETWORKS).map(Number);
    
    const balancePromises = chainIds.map(chainId => 
      this.getNetworkBalance(walletAddress, chainId)
    );

    const results = await Promise.allSettled(balancePromises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<NetworkBalance> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  async getSwappableTokens(walletAddress: string): Promise<TokenInfo[]> {
    const networkBalances = await this.getAllNetworkBalances(walletAddress);
    const swappableTokens: TokenInfo[] = [];

    networkBalances.forEach(networkBalance => {
      // Add native token if balance > 0
      if (parseFloat(networkBalance.nativeBalance) > 0) {
        swappableTokens.push({
          symbol: networkBalance.nativeSymbol,
          name: `Native ${networkBalance.nativeSymbol}`,
          address: 'NATIVE',
          balance: networkBalance.nativeBalance,
          decimals: 18,
          chainId: networkBalance.chainId,
          network: networkBalance.network
        });
      }

      // Add ERC-20 tokens
      swappableTokens.push(...networkBalance.tokens);
    });

    return swappableTokens;
  }

  async getCurrentChainId(): Promise<number | null> {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const chainId = await (window as any).ethereum.request({ 
          method: 'eth_chainId' 
        });
        return parseInt(chainId, 16);
      } catch (error) {
        console.error('Failed to get chain ID:', error);
      }
    }
    return null;
  }

  async switchNetwork(chainId: number): Promise<boolean> {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        return true;
      } catch (error) {
        console.error('Failed to switch network:', error);
        return false;
      }
    }
    return false;
  }
}

export const realTokenBalanceService = new RealTokenBalanceService();