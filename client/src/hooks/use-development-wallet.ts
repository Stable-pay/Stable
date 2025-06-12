import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

interface DevelopmentWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  balance: string;
  isLoading: boolean;
}

// Development wallet addresses for testing
const DEV_WALLETS = [
  '0x742d35Cc6661C0532C4f4e2C7B0e8c84C7b3fF9C',
  '0x8ba1f109551bD432803012645Hac136c22C89721',
  '0x1234567890123456789012345678901234567890'
];

export function useDevelopmentWallet() {
  const [walletState, setWalletState] = useState<DevelopmentWalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null,
    balance: '0',
    isLoading: false
  });

  const connectWallet = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check if MetaMask or other wallet is available
      if (window.ethereum && typeof window.ethereum.request === 'function') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          provider: new ethers.BrowserProvider(window.ethereum as any),
          balance: '1.5', // Development balance
          isLoading: false
        });
      } else {
        // Fallback to development mode with simulated wallet
        const devAddress = DEV_WALLETS[0];
        setWalletState({
          isConnected: true,
          address: devAddress,
          chainId: 1, // Ethereum mainnet
          provider: null,
          balance: '1.5', // Simulated balance
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
      balance: '0',
      isLoading: false
    });
  };

  const switchNetwork = async (chainId: number) => {
    if (!walletState.provider || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      
      const network = await walletState.provider.getNetwork();
      setWalletState(prev => ({ ...prev, chainId: Number(network.chainId) }));
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork
  };
}