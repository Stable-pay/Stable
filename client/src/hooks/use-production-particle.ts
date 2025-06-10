import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { productionPriceAPI } from '@/lib/production-price-api';

export interface ParticleWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  userInfo: any | null;
  isLoading: boolean;
  provider: ethers.BrowserProvider | null;
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

// Production Particle Network integration
export function useProductionParticle() {
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
      
      // Call Particle Network backend API for authentication
      const response = await fetch('/api/particle/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredAuthType: 'email',
          socialType: 'google'
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const authData = await response.json();
      
      if (authData.success && authData.userInfo) {
        // Get Web3 provider
        let provider: ethers.BrowserProvider | null = null;
        
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_requestAccounts', []);
          const network = await provider.getNetwork();
          
          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId: Number(network.chainId),
            userInfo: authData.userInfo,
            isLoading: false,
            provider,
            smartAccount: null,
          });
          
          return authData.userInfo;
        }
      }
      
      throw new Error('Failed to connect wallet');
    } catch (error) {
      console.error('Connection failed:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await fetch('/api/particle/auth/logout', {
        method: 'POST',
      });
      
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
      console.error('Disconnect failed:', error);
    }
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    if (!walletState.provider) return;

    try {
      await walletState.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` },
      ]);
      
      setWalletState(prev => ({ ...prev, chainId }));
    } catch (error) {
      console.error('Chain switch failed:', error);
      throw error;
    }
  }, [walletState.provider]);

  // Fetch live token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!walletState.address || !walletState.chainId) return;

    try {
      // Get live token balances from backend
      const response = await fetch('/api/particle/wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletState.address,
          chainId: walletState.chainId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const data = await response.json();
      
      if (data.success && data.balances) {
        const liveBalances: TokenBalance[] = await Promise.all(
          data.balances.map(async (token: any) => {
            // Get live USD prices
            const priceData = await productionPriceAPI.getLivePrice(token.symbol);
            const balanceNumber = parseFloat(ethers.formatUnits(token.balance, token.decimals));
            const usdValue = priceData ? balanceNumber * priceData.price : 0;

            return {
              symbol: token.symbol,
              name: token.name,
              address: token.contractAddress || '0x0000000000000000000000000000000000000000',
              balance: token.balance,
              decimals: token.decimals,
              chainId: walletState.chainId!,
              usdValue,
              formattedBalance: balanceNumber.toFixed(6),
            };
          })
        );

        setBalances(liveBalances.sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0)));
      }
    } catch (error) {
      console.error('Failed to fetch live balances:', error);
      setBalances([]);
    }
  }, [walletState.address, walletState.chainId]);

  const swapToUSDC = useCallback(async (fromToken: string, amount: string) => {
    if (!walletState.address || !walletState.chainId) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get live swap quote
      const quoteResponse = await fetch('/api/particle/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          toToken: 'USDC',
          amount,
          chainId: walletState.chainId,
          userAddress: walletState.address,
        }),
      });

      if (!quoteResponse.ok) {
        throw new Error('Failed to get swap quote');
      }

      const quoteData = await quoteResponse.json();
      
      if (!quoteData.success) {
        throw new Error(quoteData.error || 'Failed to get swap quote');
      }

      // Execute swap transaction
      const swapResponse = await fetch('/api/particle/swap/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quoteData.quote,
          userAddress: walletState.address,
          chainId: walletState.chainId,
        }),
      });

      if (!swapResponse.ok) {
        throw new Error('Failed to execute swap');
      }

      const swapData = await swapResponse.json();
      
      if (swapData.success) {
        // Refresh balances after swap
        await fetchTokenBalances();
        
        return {
          txHash: swapData.txHash,
          fromAmount: quoteData.quote.fromAmount,
          toAmount: quoteData.quote.toAmount,
          rate: quoteData.quote.rate,
          gasless: swapData.gasless || false,
          sponsoredByPaymaster: swapData.sponsoredByPaymaster || false,
          minimumReceived: quoteData.quote.minimumReceived,
        };
      }
      
      throw new Error(swapData.error || 'Swap execution failed');
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }, [walletState.address, walletState.chainId, fetchTokenBalances]);

  // Auto-fetch balances when wallet connects
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      fetchTokenBalances();
    }
  }, [walletState.isConnected, walletState.address, fetchTokenBalances]);

  return {
    ...walletState,
    balances,
    connect,
    disconnect,
    switchChain,
    swapToUSDC,
    refreshBalances: fetchTokenBalances,
  };
}