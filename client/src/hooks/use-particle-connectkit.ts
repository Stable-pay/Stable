import { useState, useEffect, useCallback } from 'react';
import { particleWallet } from '@/lib/particle-connect';
import { productionPriceAPI } from '@/lib/production-price-api';
import { getPopularTokensForChain, formatTokenAmount } from '@/lib/token-helpers';

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

export interface ParticleWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  userInfo: any | null;
  isLoading: boolean;
}

export function useParticleConnectKit() {
  const [walletState, setWalletState] = useState<ParticleWalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    userInfo: null,
    isLoading: false,
  });

  const [balances, setBalances] = useState<TokenBalance[]>([]);

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (particleWallet.isConnected()) {
        const userInfo = particleWallet.getUserInfo();
        const address = particleWallet.getAddress();
        const provider = particleWallet.getProvider();
        
        if (provider && address) {
          const network = await provider.getNetwork();
          setWalletState({
            isConnected: true,
            address,
            chainId: Number(network.chainId),
            userInfo,
            isLoading: false,
          });
        }
      }
    };

    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      const { address, chainId, userInfo } = await particleWallet.connect();
      
      setWalletState({
        isConnected: true,
        address,
        chainId,
        userInfo,
        isLoading: false,
      });

      return userInfo;
    } catch (error) {
      setWalletState(prev => ({ ...prev, isLoading: false }));
      console.error('Connection failed:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await particleWallet.disconnect();
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        userInfo: null,
        isLoading: false,
      });
      setBalances([]);
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    try {
      await particleWallet.switchChain(chainId);
      setWalletState(prev => ({ ...prev, chainId }));
    } catch (error) {
      console.error('Chain switch failed:', error);
      throw error;
    }
  }, []);

  const fetchTokenBalances = useCallback(async () => {
    if (!walletState.address || !walletState.chainId) return;

    try {
      const fetchedBalances: TokenBalance[] = [];
      
      // Fetch native token balance
      const nativeBalance = await particleWallet.getBalance(walletState.address);
      const nativeSymbol = getNativeTokenSymbol(walletState.chainId);
      
      if (parseFloat(nativeBalance) > 0.001) {
        const nativePrice = await productionPriceAPI.getLivePrice(nativeSymbol);
        const nativeUsdValue = nativePrice ? parseFloat(nativeBalance) * nativePrice.price : 0;

        fetchedBalances.push({
          symbol: nativeSymbol,
          name: getNativeTokenName(walletState.chainId),
          address: '0x0000000000000000000000000000000000000000',
          balance: nativeBalance,
          decimals: 18,
          chainId: walletState.chainId,
          usdValue: nativeUsdValue,
          formattedBalance: formatTokenAmount(nativeBalance, 18),
        });
      }

      // Fetch popular ERC-20 tokens
      const popularTokens = getPopularTokensForChain(walletState.chainId);
      
      for (const token of popularTokens.slice(0, 10)) {
        try {
          const balance = await particleWallet.getBalance(walletState.address, token.address);
          const balanceNumber = parseFloat(balance);
          
          if (balanceNumber > 0.001) {
            const tokenPrice = await productionPriceAPI.getLivePrice(token.symbol);
            const usdValue = tokenPrice ? balanceNumber * tokenPrice.price : 0;
            
            fetchedBalances.push({
              symbol: token.symbol,
              name: token.name,
              address: token.address,
              balance,
              decimals: token.decimals,
              chainId: walletState.chainId,
              usdValue,
              formattedBalance: formatTokenAmount(balance, token.decimals),
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch balance for ${token.symbol}:`, error);
        }
      }

      setBalances(fetchedBalances.sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0)));
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      setBalances([]);
    }
  }, [walletState.address, walletState.chainId]);

  const sendTransaction = useCallback(async (to: string, value: string, data?: string) => {
    try {
      const txHash = await particleWallet.sendTransaction(to, value, data);
      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, []);

  const swapToUSDC = useCallback(async (fromToken: string, amount: string) => {
    if (!walletState.address || !walletState.chainId) throw new Error('Wallet not connected');

    try {
      // Get live swap quote
      const quote = await productionPriceAPI.getSwapQuote(fromToken, 'USDC', amount, walletState.chainId);
      
      if (!quote) {
        throw new Error('Unable to get swap quote');
      }

      // For demo purposes, simulate swap execution
      // In production, this would integrate with actual DEX protocols
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      
      return {
        txHash: mockTxHash,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        rate: quote.rate,
        gasless: false, // Standard transaction for now
        sponsoredByPaymaster: false,
        minimumReceived: quote.minimumReceived,
      };
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }, [walletState.address, walletState.chainId]);

  // Fetch balances when wallet connects
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
    sendTransaction,
    swapToUSDC,
    refreshBalances: fetchTokenBalances,
  };
}

function getNativeTokenSymbol(chainId: number): string {
  const symbols: Record<number, string> = {
    1: 'ETH',
    137: 'MATIC',
    56: 'BNB',
    42161: 'ETH',
    10: 'ETH',
    8453: 'ETH',
  };
  return symbols[chainId] || 'ETH';
}

function getNativeTokenName(chainId: number): string {
  const names: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BNB',
    42161: 'Ethereum',
    10: 'Ethereum',
    8453: 'Ethereum',
  };
  return names[chainId] || 'Ethereum';
}