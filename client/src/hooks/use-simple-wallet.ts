import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  formattedBalance: string;
  usdValue: number;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number;
  isLoading: boolean;
  error: string | null;
}

export function useSimpleWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: 1,
    isLoading: false,
    error: null
  });

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setWalletState(prev => ({ 
        ...prev, 
        error: 'Please install MetaMask or another Web3 wallet' 
      }));
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts && accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        
        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: Number(network.chainId),
          isLoading: false,
          error: null
        });

        // Fetch sample balances
        const sampleBalances: TokenBalance[] = [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            address: '0x0000000000000000000000000000000000000000',
            balance: '2500000000000000000',
            decimals: 18,
            chainId: Number(network.chainId),
            formattedBalance: '2.5000',
            usdValue: 5000
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0xA0b86a33E6441b8435b662da5e1a0d5d9d3B7B3e',
            balance: '1250500000',
            decimals: 6,
            chainId: Number(network.chainId),
            formattedBalance: '1250.5000',
            usdValue: 1250.5
          }
        ];
        
        setBalances(sampleBalances);
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet'
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: 1,
      isLoading: false,
      error: null
    });
    setBalances([]);
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      
      setWalletState(prev => ({ ...prev, chainId }));
    } catch (error) {
      console.error('Chain switch failed:', error);
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    // Refresh balances logic would go here
    console.log('Refreshing balances...');
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setWalletState(prev => ({ ...prev, address: accounts[0] }));
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [disconnect]);

  return {
    ...walletState,
    balances,
    isLoadingBalances,
    connect,
    disconnect,
    switchChain,
    refreshBalances,
    getTotalValue: () => balances.reduce((total, balance) => total + balance.usdValue, 0)
  };
}