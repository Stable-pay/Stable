import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appKit } from '@/lib/reown';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
}

export function useWalletConnection() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null
  });

  useEffect(() => {
    // Check for ethereum provider
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          const chainId = await ethereum.request({ method: 'eth_chainId' });
          
          setWalletState({
            isConnected: accounts.length > 0,
            address: accounts[0] || null,
            chainId: chainId ? parseInt(chainId, 16) : null
          });
        } catch (error) {
          console.warn('Failed to check wallet connection:', error);
        }
      }
    };

    checkWalletConnection();

    // Listen for account and chain changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      
      const handleAccountsChanged = (accounts: string[]) => {
        setWalletState(prev => ({
          ...prev,
          isConnected: accounts.length > 0,
          address: accounts[0] || null
        }));
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16)
        }));
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    try {
      appKit.open();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return {
    ...walletState,
    connect: connectWallet,
    disconnect: () => appKit.disconnect()
  };
}

export function useTokenBalances() {
  const { isConnected, address, chainId } = useWalletConnection();

  return useQuery({
    queryKey: ['token-balances', address, chainId],
    queryFn: async () => {
      if (!address || !chainId) return null;

      // Fetch real token balances using RPC calls
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          
          // Get ETH balance
          const ethBalance = await ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest']
          });

          const ethBalanceFormatted = parseInt(ethBalance, 16) / Math.pow(10, 18);

          return {
            network: getNetworkName(chainId),
            nativeBalance: ethBalanceFormatted.toFixed(6),
            nativeSymbol: getNativeSymbol(chainId),
            tokens: [] // Would need additional RPC calls for ERC-20 tokens
          };
        } catch (error) {
          console.error('Failed to fetch balances:', error);
          return null;
        }
      }
      return null;
    },
    enabled: isConnected && !!address && !!chainId,
    refetchInterval: 30000
  });
}

function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    8453: 'Base',
    56: 'BSC'
  };
  return networks[chainId] || `Chain ${chainId}`;
}

function getNativeSymbol(chainId: number): string {
  const symbols: Record<number, string> = {
    1: 'ETH',
    137: 'MATIC',
    42161: 'ETH',
    8453: 'ETH',
    56: 'BNB'
  };
  return symbols[chainId] || 'ETH';
}

export function useTotalValue() {
  const { data: tokenData } = useTokenBalances();
  
  // In a real implementation, you would fetch USD prices and calculate total value
  return {
    totalValue: 0,
    isLoading: false
  };
}