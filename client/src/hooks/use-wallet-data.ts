import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appKit } from '@/lib/reown';
import { walletBalanceService, type WalletBalances } from '@/lib/wallet-balance';

export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    const checkConnection = () => {
      try {
        // Use AppKit modal state for connection info
        const isModalConnected = appKit.getIsConnected?.() || false;
        setIsConnected(isModalConnected);
        
        // Try to get address from AppKit
        if (isModalConnected && typeof window !== 'undefined') {
          // Get address from ethereum provider if available
          const ethereum = (window as any).ethereum;
          if (ethereum?.selectedAddress) {
            setAddress(ethereum.selectedAddress);
          }
        }
      } catch (error) {
        console.warn('Failed to get wallet state:', error);
        setIsConnected(false);
        setAddress(null);
        setChainId(null);
      }
    };

    // Check initial state
    checkConnection();

    // Listen for account changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress(null);
          setIsConnected(false);
        }
      };

      const handleChainChanged = (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      // Get initial accounts
      ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        })
        .catch((error: any) => console.warn('Failed to get accounts:', error));

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    isConnected,
    address,
    chainId,
    connect: () => appKit.open(),
    disconnect: () => appKit.disconnect()
  };
}

export function useWalletBalances() {
  const { isConnected, address } = useWalletConnection();

  return useQuery({
    queryKey: ['wallet-balances', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await walletBalanceService.getAllNetworkBalances(address);
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });
}

export function useNetworkBalance(network: string) {
  const { isConnected, address } = useWalletConnection();

  return useQuery({
    queryKey: ['network-balance', address, network],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await walletBalanceService.getWalletBalances(address, network);
    },
    enabled: isConnected && !!address && !!network,
    refetchInterval: 30000,
    staleTime: 15000
  });
}

export function useTotalUSDValue() {
  const { data: balances, isLoading } = useWalletBalances();
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (balances) {
      const total = balances.reduce((sum, networkBalance) => {
        return sum + networkBalance.totalUsdValue;
      }, 0);
      setTotalValue(total);
    }
  }, [balances]);

  return {
    totalValue,
    isLoading,
    balances
  };
}