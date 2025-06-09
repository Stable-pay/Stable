import { ethers } from 'ethers';
import { appKit } from './reown';

// ERC-20 ABI for balance queries
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// Network configurations with RPC URLs
const NETWORK_CONFIGS = {
  ethereum: {
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
  },
  polygon: {
    chainId: 137,
    rpcUrl: 'https://polygon.llamarpc.com',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
  },
  arbitrum: {
    chainId: 42161,
    rpcUrl: 'https://arbitrum.llamarpc.com',
    nativeCurrency: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 }
  },
  base: {
    chainId: 8453,
    rpcUrl: 'https://base.llamarpc.com',
    nativeCurrency: { name: 'Base', symbol: 'ETH', decimals: 18 }
  }
};

// Popular token addresses per network
const TOKEN_ADDRESSES = {
  ethereum: {
    USDC: '0xA0b86a33E6441b4a0c4eaD6Dd0Ba1DC1F4A5F1A',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  polygon: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
  },
  arbitrum: {
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  },
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    WETH: '0x4200000000000000000000000000000000000006'
  }
};

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address: string;
  usdValue?: number;
}

export interface WalletBalances {
  address: string;
  network: string;
  nativeBalance: string;
  tokens: TokenBalance[];
  totalUsdValue: number;
}

class WalletBalanceService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  constructor() {
    // Initialize providers for each network
    Object.entries(NETWORK_CONFIGS).forEach(([network, config]) => {
      this.providers.set(network, new ethers.JsonRpcProvider(config.rpcUrl));
    });
  }

  async getWalletBalances(address: string, network: string): Promise<WalletBalances> {
    const provider = this.providers.get(network);
    if (!provider) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const networkConfig = NETWORK_CONFIGS[network as keyof typeof NETWORK_CONFIGS];
    
    // Get native token balance
    const nativeBalance = await provider.getBalance(address);
    const nativeBalanceFormatted = ethers.formatEther(nativeBalance);

    // Get token balances
    const tokenAddresses = TOKEN_ADDRESSES[network as keyof typeof TOKEN_ADDRESSES];
    const tokens: TokenBalance[] = [];

    if (tokenAddresses) {
      for (const [symbol, tokenAddress] of Object.entries(tokenAddresses)) {
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
              address: tokenAddress
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} balance:`, error);
        }
      }
    }

    return {
      address,
      network,
      nativeBalance: nativeBalanceFormatted,
      tokens,
      totalUsdValue: 0 // Will be calculated with price data
    };
  }

  async getAllNetworkBalances(address: string): Promise<WalletBalances[]> {
    const networks = Object.keys(NETWORK_CONFIGS);
    const balancePromises = networks.map(network => 
      this.getWalletBalances(address, network).catch(error => {
        console.warn(`Failed to fetch balances for ${network}:`, error);
        return null;
      })
    );

    const results = await Promise.all(balancePromises);
    return results.filter(result => result !== null) as WalletBalances[];
  }

  async getConnectedWalletBalances(): Promise<WalletBalances[]> {
    try {
      const walletInfo = appKit.getWalletInfo();
      if (!walletInfo) {
        throw new Error('No wallet connected');
      }

      const address = appKit.getAddress();
      if (!address) {
        throw new Error('No wallet address available');
      }

      return await this.getAllNetworkBalances(address);
    } catch (error) {
      console.error('Failed to get connected wallet balances:', error);
      throw error;
    }
  }

  async getTransactionHistory(address: string, network: string): Promise<any[]> {
    // This would integrate with blockchain explorers or indexing services
    // For now, return empty array - would need additional APIs like Etherscan, etc.
    return [];
  }
}

export const walletBalanceService = new WalletBalanceService();