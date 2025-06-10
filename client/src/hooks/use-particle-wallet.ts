import { useState, useEffect, useCallback } from 'react';
import { particleConfig, supportedChains } from '@/lib/particle-config';
import { ethers } from 'ethers';

export interface ParticleWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  userInfo: any | null;
  isLoading: boolean;
  provider: any | null;
  smartAccount: any | null;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  usdValue?: number;
  formattedBalance: string;
}

// Mock Particle Network functionality for development
export function useParticleWallet() {
  const [walletState, setWalletState] = useState<ParticleWalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    userInfo: null,
    isLoading: false,
    provider: null,
    smartAccount: null,
  });

  const [balances, setBalances] = useState<TokenBalance[]>([]);

  const connect = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      // Simulate Particle Network connection
      const mockAddress = '0x742d35Cc6639C0532fAA648C5b84A62B12345678';
      const mockUserInfo = {
        uuid: 'mock-uuid',
        email: 'user@example.com',
        name: 'Mock User',
        walletType: 'particle'
      };

      setWalletState({
        isConnected: true,
        address: mockAddress,
        chainId: 1,
        userInfo: mockUserInfo,
        isLoading: false,
        provider: window.ethereum || null,
        smartAccount: null,
      });

      return { address: mockAddress, userInfo: mockUserInfo };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        userInfo: null,
        isLoading: false,
        provider: null,
        smartAccount: null,
      });
      setBalances([]);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    try {
      setWalletState(prev => ({ ...prev, chainId }));
    } catch (error) {
      console.error('Failed to switch chain:', error);
      throw error;
    }
  }, []);

  const getBalance = useCallback(async (tokenAddress?: string) => {
    if (!walletState.address) return '0';
    
    // Return mock balance
    return tokenAddress ? '1000.0' : '2.5';
  }, [walletState.address]);

  const sendTransaction = useCallback(async (to: string, value: string, data?: string) => {
    if (!walletState.address) throw new Error('No wallet connected');

    try {
      // Mock gasless transaction with Particle Network AA
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      return mockTxHash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }, [walletState.address]);

  const swapToUSDC = useCallback(async (fromToken: string, amount: string) => {
    if (!walletState.address) throw new Error('No wallet connected');

    try {
      // Mock swap transaction with gasless capability
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      return {
        txHash: mockTxHash,
        fromAmount: amount,
        toAmount: (parseFloat(amount) * 0.98).toString(), // 2% slippage simulation
        gasless: true,
        sponsoredByPaymaster: true
      };
    } catch (error) {
      console.error('Failed to swap to USDC:', error);
      throw error;
    }
  }, [walletState.address]);

  // Mock balance fetch
  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletState.isConnected || !walletState.address) return;

      try {
        const mockBalances: TokenBalance[] = [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            address: '0x0000000000000000000000000000000000000000',
            balance: '2.5',
            decimals: 18,
            chainId: walletState.chainId || 1,
            formattedBalance: '2.5000',
            usdValue: 6000
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0xA0b86a33E6441b8435b662da5e1a0d5d9d3B7B3e',
            balance: '1000.0',
            decimals: 6,
            chainId: walletState.chainId || 1,
            formattedBalance: '1000.0000',
            usdValue: 1000
          }
        ];

        setBalances(mockBalances);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      }
    };

    fetchBalances();
  }, [walletState.isConnected, walletState.address, walletState.chainId]);

  return {
    ...walletState,
    balances,
    connect,
    disconnect,
    switchChain,
    getBalance,
    sendTransaction,
    swapToUSDC,
  };
}