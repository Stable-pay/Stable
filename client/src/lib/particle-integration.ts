// Production Particle Network Integration
import { ParticleNetwork } from '@particle-network/auth';
import { ParticleProvider } from '@particle-network/provider';
import { SmartAccount } from '@particle-network/aa';
import { ethers } from 'ethers';
import { particleConfig } from './particle-config';

class ParticleIntegration {
  private particle: ParticleNetwork | null = null;
  private provider: ParticleProvider | null = null;
  private smartAccount: SmartAccount | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Particle Auth
      this.particle = new ParticleNetwork({
        projectId: particleConfig.projectId,
        clientKey: particleConfig.clientKey,
        appId: particleConfig.appId,
        chainName: 'ethereum',
        chainId: 1,
        wallet: {
          displayWalletEntry: true,
          defaultWalletEntryPosition: 'BR',
        },
      });

      // Initialize Provider
      this.provider = new ParticleProvider(this.particle.auth);

      // Initialize Smart Account with AA
      this.smartAccount = new SmartAccount(this.provider, {
        projectId: particleConfig.projectId,
        clientKey: particleConfig.clientKey,
        appId: particleConfig.appId,
        aaOptions: {
          accountContracts: {
            SIMPLE: [{ chainIds: [1, 137, 56, 42161, 10, 8453], version: '1.0.0' }],
          },
        },
      });

      this.isInitialized = true;
      console.log('Particle Network initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Particle Network:', error);
      throw error;
    }
  }

  async connect() {
    await this.initialize();
    if (!this.particle) throw new Error('Particle not initialized');

    try {
      const userInfo = await this.particle.auth.login();
      await this.smartAccount?.init();
      return userInfo;
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.particle) return;
    
    try {
      await this.particle.auth.logout();
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  }

  async switchChain(chainId: number) {
    if (!this.particle) throw new Error('Particle not initialized');

    try {
      await this.particle.switchChain({
        chainId,
        chainName: this.getChainName(chainId),
      });
    } catch (error) {
      console.error('Chain switch failed:', error);
      throw error;
    }
  }

  async getBalance(address: string, tokenAddress?: string) {
    if (!this.provider) throw new Error('Provider not available');

    try {
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        return await this.provider.getBalance(address);
      } else {
        // ERC-20 token balance
        const contract = new (await import('ethers')).ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          this.provider
        );
        return await contract.balanceOf(address);
      }
    } catch (error) {
      console.error('Balance fetch failed:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: any) {
    if (!this.smartAccount) throw new Error('Smart Account not available');

    try {
      // Build user operation for gasless transaction
      const userOp = await this.smartAccount.buildUserOperation({
        transactions: [transaction],
      });

      // Execute with paymaster sponsorship
      const txHash = await this.smartAccount.sendUserOperation(userOp);
      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  async getSwapQuote(fromToken: string, toToken: string, amount: string, chainId: number) {
    try {
      // Use Particle Swap API
      const response = await fetch('/api/particle/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          chainId,
        }),
      });

      if (!response.ok) throw new Error('Swap quote failed');
      return await response.json();
    } catch (error) {
      console.error('Swap quote failed:', error);
      throw error;
    }
  }

  async executeSwap(swapParams: any) {
    if (!this.smartAccount) throw new Error('Smart Account not available');

    try {
      // Get swap transaction data
      const swapTx = await this.getSwapTransaction(swapParams);
      
      // Execute gasless swap
      return await this.sendTransaction(swapTx);
    } catch (error) {
      console.error('Swap execution failed:', error);
      throw error;
    }
  }

  private async getSwapTransaction(swapParams: any) {
    const response = await fetch('/api/particle/swap/transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapParams),
    });

    if (!response.ok) throw new Error('Failed to get swap transaction');
    return await response.json();
  }

  private getChainName(chainId: number): string {
    const chains: Record<number, string> = {
      1: 'ethereum',
      137: 'polygon',
      56: 'bsc',
      42161: 'arbitrum',
      10: 'optimism',
      8453: 'base',
    };
    return chains[chainId] || 'ethereum';
  }

  getProvider() {
    return this.provider;
  }

  getSmartAccount() {
    return this.smartAccount;
  }

  getParticle() {
    return this.particle;
  }

  isConnected() {
    return this.particle?.auth.isLogin() || false;
  }

  getCurrentUser() {
    return this.particle?.auth.getUserInfo() || null;
  }

  getAddress() {
    return this.smartAccount?.getAddress() || null;
  }
}

export const particleIntegration = new ParticleIntegration();