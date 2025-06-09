import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blockchainBalanceFetcher, type NetworkBalance, type TokenBalance } from '@/lib/blockchain-balance-fetcher';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
}

export function useDirectWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null
  });

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            const chainId = await (window as any).ethereum.request({ 
              method: 'eth_chainId' 
            });
            
            setWalletState({
              isConnected: true,
              address: accounts[0],
              chainId: parseInt(chainId, 16)
            });
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0]
          }));
        } else {
          setWalletState({
            isConnected: false,
            address: null,
            chainId: null
          });
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16)
        }));
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if ((window as any).ethereum) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const chainId = await (window as any).ethereum.request({
        method: 'eth_chainId'
      });
      
      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16)
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return {
    ...walletState,
    connect: connectWallet
  };
}

export function useRealTokenBalances() {
  const { isConnected, address } = useDirectWallet();

  return useQuery({
    queryKey: ['real-token-balances', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await blockchainBalanceFetcher.getAllNetworkBalances(address);
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000,
    staleTime: 15000
  });
}

export function useSwappableTokens() {
  const { isConnected, address } = useDirectWallet();

  return useQuery({
    queryKey: ['swappable-tokens', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await blockchainBalanceFetcher.getSwappableTokens(address);
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000,
    staleTime: 15000
  });
}