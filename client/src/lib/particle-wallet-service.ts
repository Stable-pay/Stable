import { ParticleAuthModule, ParticleProvider } from '@particle-network/auth';
import { ParticleConnect, InjectedConnector } from '@particle-network/connect';
import { Ethereum, Polygon, BNBChain, Arbitrum, Optimism } from '@particle-network/chains';
import { AAWrapProvider, SmartAccount } from '@particle-network/aa';
import { ethers } from 'ethers';

// Production Particle Network Configuration
const particleConfig = {
  projectId: import.meta.env.VITE_PARTICLE_PROJECT_ID || 'c83ce10f-85ce-406e-a9a3-0444767f730b',
  clientKey: import.meta.env.VITE_PARTICLE_CLIENT_KEY,
  appId: 'stable-pay-production'
};

const supportedChains = [Ethereum, Polygon, BNBChain, Arbitrum, Optimism];

// Initialize Particle Auth
const particle = new ParticleAuthModule.ParticleNetwork({
  ...particleConfig,
  chainName: Ethereum.name,
  chainId: Ethereum.id,
});

// Initialize Particle Connect for multi-wallet support
const particleConnect = new ParticleConnect({
  ...particleConfig,
  chains: supportedChains,
  particleWalletEntry: {
    displayWalletEntry: true,
    defaultWalletEntryPosition: 'BR',
  },
});

// Production Particle Wallet Service
export class ParticleWalletService {
  private provider: ParticleProvider | null = null;
  private smartAccount: SmartAccount | null = null;
  private ethersProvider: ethers.BrowserProvider | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Particle Connect
      await particleConnect.init();
      this.isInitialized = true;
      console.log('Particle Network initialized successfully');
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
      // Connect using Particle Connect
      const walletConnectInfo = await particleConnect.connect();
      
      if (walletConnectInfo) {
        this.provider = new ParticleProvider(particle.auth);
        this.ethersProvider = new ethers.BrowserProvider(this.provider, 'any');
        
        // Initialize Smart Account for gasless transactions
        this.smartAccount = new SmartAccount(this.provider, {
          ...particleConfig,
          aaOptions: {
            accountContracts: {
              SIMPLE: [{ chainIds: supportedChains.map(chain => chain.id), version: '1.0.0' }]
            }
          }
        });

        const address = await this.getAddress();
        console.log('Connected to Particle wallet:', address);
        
        return {
          address,
          provider: this.provider,
          smartAccount: this.smartAccount
        };
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (particleConnect) {
        await particleConnect.disconnect();
      }
      this.provider = null;
      this.smartAccount = null;
      this.ethersProvider = null;
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  async getAddress(): Promise<string | null> {
    if (!this.ethersProvider) return null;
    
    try {
      const signer = await this.ethersProvider.getSigner();
      return await signer.getAddress();
    } catch (error) {
      console.error('Failed to get address:', error);
      return null;
    }
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
    if (!this.smartAccount) throw new Error('Smart account not initialized');

    try {
      // Get swap quote
      const response = await fetch('/api/particle/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          chainId,
          userAddress: await this.getAddress()
        })
      });

      const swapData = await response.json();
      if (!swapData.success) {
        throw new Error(swapData.error || 'Failed to get swap quote');
      }

      // Execute gasless swap using Smart Account
      const userOpParams = {
        tx: {
          to: swapData.to,
          data: swapData.data,
          value: swapData.value || '0x0'
        }
      };

      const txHash = await this.smartAccount.sendTransaction(userOpParams);
      console.log('Swap transaction sent:', txHash);
      
      return { success: true, txHash };
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }

  async switchChain(chainId: number) {
    if (!this.provider) throw new Error('Wallet not connected');

    try {
      const targetChain = supportedChains.find(chain => chain.id === chainId);
      if (!targetChain) throw new Error('Unsupported chain');

      await particle.switchChain({ chainId: targetChain.id, chainName: targetChain.name });
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
    return this.provider !== null && this.ethersProvider !== null;
  }

  getProvider() {
    return this.ethersProvider;
  }

  getSmartAccount() {
    return this.smartAccount;
  }
}

// Singleton instance
export const particleWalletService = new ParticleWalletService();