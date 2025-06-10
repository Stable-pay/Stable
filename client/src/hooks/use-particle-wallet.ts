import { useState, useEffect, useCallback } from 'react';
import { particleWalletService } from '@/lib/particle-wallet-service';

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

export function useParticleWallet() {
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
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await particleWalletService.connectWallet();
      if (result?.address) {
        setWalletState({
          isConnected: true,
          address: result.address,
          chainId: 1,
          isLoading: false,
          error: null
        });
        await fetchBalances(result.address, 1);
      }
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await particleWalletService.disconnect();
      setWalletState({
        isConnected: false,
        address: null,
        chainId: 1,
        isLoading: false,
        error: null
      });
      setBalances([]);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    if (!walletState.isConnected) return;

    try {
      await particleWalletService.switchChain(chainId);
      setWalletState(prev => ({ ...prev, chainId }));
      if (walletState.address) {
        await fetchBalances(walletState.address, chainId);
      }
    } catch (error) {
      console.error('Chain switch failed:', error);
    }
  }, [walletState.isConnected, walletState.address]);

  const fetchBalances = useCallback(async (address: string, chainId: number) => {
    setIsLoadingBalances(true);
    try {
      const tokenBalances = await particleWalletService.getTokenBalances(chainId);
      setBalances(tokenBalances);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, []);

  const swapTokens = useCallback(async (
    fromToken: string,
    toToken: string,
    amount: string
  ) => {
    if (!walletState.isConnected || !walletState.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await particleWalletService.swapTokens(
        fromToken,
        toToken,
        amount,
        walletState.chainId
      );
      
      // Refresh balances after swap
      await fetchBalances(walletState.address, walletState.chainId);
      
      return result;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }, [walletState.isConnected, walletState.address, walletState.chainId, fetchBalances]);

  const refreshBalances = useCallback(async () => {
    if (walletState.address) {
      await fetchBalances(walletState.address, walletState.chainId);
    }
  }, [walletState.address, walletState.chainId, fetchBalances]);

  // Initialize wallet service on mount
  useEffect(() => {
    particleWalletService.initialize().catch(console.error);
  }, []);

  // Check for existing connection
  useEffect(() => {
    const checkConnection = async () => {
      if (particleWalletService.isConnected()) {
        const address = await particleWalletService.getAddress();
        if (address) {
          setWalletState({
            isConnected: true,
            address,
            chainId: 1,
            isLoading: false,
            error: null
          });
          await fetchBalances(address, 1);
        }
      }
    };

    checkConnection();
  }, [fetchBalances]);

  return {
    ...walletState,
    balances,
    isLoadingBalances,
    connect,
    disconnect,
    switchChain,
    swapTokens,
    refreshBalances,
    getTotalValue: () => balances.reduce((total, balance) => total + balance.usdValue, 0)
  };
}