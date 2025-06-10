// Production Particle Connect Integration
import { ConnectKit, AuthType, SocialType } from '@particle-network/connectkit';
import { Ethereum, Polygon, BNBChain, Arbitrum, Optimism, Base } from '@particle-network/chains';
import { ethers } from 'ethers';

// Initialize Particle ConnectKit
export const particleConnectKit = new ConnectKit({
  projectId: import.meta.env.VITE_PARTICLE_PROJECT_ID!,
  clientKey: import.meta.env.VITE_PARTICLE_CLIENT_KEY!,
  appId: import.meta.env.VITE_PARTICLE_PROJECT_ID!,
  chains: [Ethereum, Polygon, BNBChain, Arbitrum, Optimism, Base],
  particleWalletEntry: {
    displayWalletEntry: true,
    defaultWalletEntryPosition: 'BR' as const,
  },
  walletConnectors: [],
});

class ParticleWalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connect(): Promise<{
    address: string;
    chainId: number;
    userInfo: any;
  }> {
    try {
      // Connect using Particle Auth
      const userInfo = await particleConnectKit.auth.login({
        preferredAuthType: AuthType.email,
        socialType: SocialType.google,
      });

      // Get provider and signer
      this.provider = new ethers.BrowserProvider(particleConnectKit.provider, 'any');
      this.signer = await this.provider.getSigner();

      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      return {
        address,
        chainId,
        userInfo,
      };
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await particleConnectKit.auth.logout();
      this.provider = null;
      this.signer = null;
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) throw new Error('Provider not available');

    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` },
      ]);
    } catch (error) {
      console.error('Chain switch failed:', error);
      throw error;
    }
  }

  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not available');

    try {
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
      } else {
        const contract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          this.provider
        );
        const [balance, decimals] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
        ]);
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error('Balance fetch failed:', error);
      return '0';
    }
  }

  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not available');

    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
        data: data || '0x',
      });

      return tx.hash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return particleConnectKit.auth.isConnected();
  }

  getUserInfo(): any {
    return particleConnectKit.auth.getUserInfo();
  }

  getAddress(): string | null {
    return this.signer?.address || null;
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }
}

export const particleWallet = new ParticleWalletService();