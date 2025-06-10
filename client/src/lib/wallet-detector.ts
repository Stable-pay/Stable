// Wallet detection and connection utilities
export interface WalletProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: WalletProvider;
  }
}

export function detectWalletProvider(): WalletProvider | null {
  if (typeof window === 'undefined') return null;
  
  // Check for any ethereum provider
  if (window.ethereum) {
    return window.ethereum;
  }
  
  return null;
}

export function getWalletName(provider: WalletProvider): string {
  if (provider.isMetaMask) return 'MetaMask';
  if (provider.isCoinbaseWallet) return 'Coinbase Wallet';
  if (provider.isWalletConnect) return 'WalletConnect';
  return 'Web3 Wallet';
}

export async function requestWalletConnection(provider: WalletProvider): Promise<string[]> {
  try {
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });
    return accounts || [];
  } catch (error) {
    if (error instanceof Error) {
      // User rejected the request
      if (error.message.includes('User rejected')) {
        throw new Error('User rejected wallet connection');
      }
      // Wallet not found or other errors
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
    throw new Error('Unknown wallet connection error');
  }
}

export async function switchToNetwork(provider: WalletProvider, chainId: number): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      await addNetwork(provider, chainId);
    } else {
      throw error;
    }
  }
}

async function addNetwork(provider: WalletProvider, chainId: number): Promise<void> {
  const networkConfigs: Record<number, any> = {
    137: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com']
    },
    56: {
      chainId: '0x38',
      chainName: 'BNB Smart Chain',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: ['https://bsc-dataseed.binance.org'],
      blockExplorerUrls: ['https://bscscan.com']
    },
    42161: {
      chainId: '0xa4b1',
      chainName: 'Arbitrum One',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
      blockExplorerUrls: ['https://arbiscan.io']
    },
    10: {
      chainId: '0xa',
      chainName: 'Optimism',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.optimism.io'],
      blockExplorerUrls: ['https://optimistic.etherscan.io']
    }
  };

  const config = networkConfigs[chainId];
  if (!config) {
    throw new Error(`Unsupported network: ${chainId}`);
  }

  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [config]
  });
}