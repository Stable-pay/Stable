import { ethers } from 'ethers';
import { detectWalletProvider, requestWalletConnection, switchToNetwork, getWalletName } from './wallet-detector';

// Production Particle Network Configuration
const particleConfig = {
  projectId: import.meta.env.VITE_PARTICLE_PROJECT_ID || 'c83ce10f-85ce-406e-a9a3-0444767f730b',
  clientKey: import.meta.env.VITE_PARTICLE_CLIENT_KEY,
  appId: 'stable-pay-production'
};

// Supported chain configurations
const supportedChains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 56, name: 'BSC', symbol: 'BNB' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' }
];

// Production Particle Wallet Service
export class ParticleWalletService {
  private ethersProvider: ethers.BrowserProvider | null = null;
  private isInitialized = false;
  private currentAddress: string | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize using server authentication
      const response = await fetch('/api/particle/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });

      const result = await response.json();
      if (result.success) {
        this.isInitialized = true;
        console.log('Particle Network initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Particle Network:', error);
      throw error;
    }
  }

  async connectWallet() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Detect wallet provider
      const provider = detectWalletProvider();
      if (!provider) {
        throw new Error('No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.');
      }

      const walletName = getWalletName(provider);
      console.log(`Attempting to connect to ${walletName}...`);
      
      // Request account access using improved detection
      const accounts = await requestWalletConnection(provider);
      
      if (accounts && accounts.length > 0) {
        this.ethersProvider = new ethers.BrowserProvider(provider);
        this.currentAddress = accounts[0];
        
        console.log(`Connected to ${walletName}:`, this.currentAddress);
        
        // Listen for account changes
        provider.on('accountsChanged', (accounts: string[]) => {
          console.log('Account changed:', accounts);
          if (accounts.length === 0) {
            this.disconnect();
          } else {
            this.currentAddress = accounts[0];
          }
        });

        // Listen for chain changes
        provider.on('chainChanged', (chainId: string) => {
          console.log('Chain changed:', chainId);
          // Reload the page on chain change for simplicity
          window.location.reload();
        });
        
        return {
          address: this.currentAddress,
          provider: this.ethersProvider
        };
      } else {
        throw new Error('No accounts available');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      this.ethersProvider = null;
      this.currentAddress = null;
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  async getAddress(): Promise<string | null> {
    return this.currentAddress;
  }

  async getBalance(tokenAddress?: string): Promise<string> {
    if (!this.ethersProvider) throw new Error('Wallet not connected');

    try {
      const signer = await this.ethersProvider.getSigner();
      const address = await signer.getAddress();

      if (!tokenAddress) {
        // Get native token balance
        const balance = await this.ethersProvider.getBalance(address);
        return ethers.formatEther(balance);
      } else {
        // Get ERC-20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          this.ethersProvider
        );
        
        const [balance, decimals] = await Promise.all([
          tokenContract.balanceOf(address),
          tokenContract.decimals()
        ]);
        
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async getTokenBalances(chainId: number): Promise<any[]> {
    const address = await this.getAddress();
    if (!address) return [];

    try {
      // Fetch balances using server API
      const response = await fetch('/api/particle/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainId })
      });

      const data = await response.json();
      if (data.success) {
        return data.balances.map((balance: any) => ({
          symbol: balance.symbol,
          name: balance.name,
          address: balance.contractAddress,
          balance: balance.balance,
          decimals: balance.decimals,
          chainId,
          formattedBalance: this.formatBalance(balance.balance, balance.decimals),
          usdValue: this.calculateUSDValue(balance.symbol, balance.balance, balance.decimals)
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      return [];
    }
  }

  async swapTokens(fromToken: string, toToken: string, amount: string, chainId: number) {
    if (!this.ethersProvider) throw new Error('Wallet not connected');

    try {
      // Get swap quote from server
      const response = await fetch('/api/particle/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          chainId,
          userAddress: this.currentAddress
        })
      });

      const swapData = await response.json();
      if (!swapData.success) {
        throw new Error(swapData.error || 'Failed to get swap quote');
      }

      // Execute swap transaction
      const signer = await this.ethersProvider.getSigner();
      const tx = {
        to: swapData.to,
        data: swapData.data,
        value: swapData.value || '0x0'
      };

      const txResponse = await signer.sendTransaction(tx);
      console.log('Swap transaction sent:', txResponse.hash);
      
      return { success: true, txHash: txResponse.hash };
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }

  async switchChain(chainId: number) {
    const provider = detectWalletProvider();
    if (!provider) throw new Error('Wallet not connected');

    try {
      const targetChain = supportedChains.find(chain => chain.id === chainId);
      if (!targetChain) throw new Error('Unsupported chain');

      await switchToNetwork(provider, chainId);
      console.log(`Switched to ${targetChain.name}`);
    } catch (error) {
      console.error('Chain switch failed:', error);
      throw error;
    }
  }

  private formatBalance(balance: string, decimals: number): string {
    try {
      const formatted = ethers.formatUnits(balance, decimals);
      const num = parseFloat(formatted);
      return num < 0.001 ? num.toExponential(2) : num.toFixed(4);
    } catch {
      return '0.0000';
    }
  }

  private calculateUSDValue(symbol: string, balance: string, decimals: number): number {
    // Mock USD values - in production, integrate with price API
    const prices: Record<string, number> = {
      'ETH': 2000,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'MATIC': 0.8,
      'BNB': 300
    };

    try {
      const formatted = parseFloat(ethers.formatUnits(balance, decimals));
      return formatted * (prices[symbol] || 0);
    } catch {
      return 0;
    }
  }

  isConnected(): boolean {
    return this.ethersProvider !== null && this.currentAddress !== null;
  }

  getProvider() {
    return this.ethersProvider;
  }
}

// Singleton instance
export const particleWalletService = new ParticleWalletService();