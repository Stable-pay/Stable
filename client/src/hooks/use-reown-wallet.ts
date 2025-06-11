import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useDisconnect, useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { modal } from '@/lib/reown-config';

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

export interface ReownWalletState {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  isConnecting: boolean;
  isReconnecting: boolean;
}

export function useReownWallet() {
  const { address, isConnected, chainId, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Get native token balance
  const { data: nativeBalance } = useBalance({
    address: address,
  });

  // Connect wallet function
  const connect = useCallback(async () => {
    try {
      await modal.open();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  // Fetch token balances
  const fetchTokenBalances = useCallback(async () => {
    if (!address || !chainId) return;

    setIsLoadingBalances(true);
    try {
      const tokens: TokenBalance[] = [];

      // Add native token balance
      if (nativeBalance) {
        const nativePrice = await getTokenPrice(getNativeSymbol(chainId));
        const formattedBalance = formatUnits(nativeBalance.value, nativeBalance.decimals);
        
        tokens.push({
          symbol: nativeBalance.symbol,
          name: getNativeName(chainId),
          address: '0x0000000000000000000000000000000000000000',
          balance: nativeBalance.value.toString(),
          decimals: nativeBalance.decimals,
          chainId: chainId,
          formattedBalance: formattedBalance,
          usdValue: parseFloat(formattedBalance) * nativePrice
        });
      }

      // Fetch common token balances
      const commonTokens = getCommonTokens(chainId);
      for (const token of commonTokens) {
        try {
          const balance = await fetchTokenBalance(address, token.address, chainId);
          if (balance && parseFloat(balance.formattedBalance) > 0) {
            tokens.push(balance);
          }
        } catch (error) {
          console.warn(`Failed to fetch ${token.symbol} balance:`, error);
        }
      }

      setBalances(tokens);
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, chainId, nativeBalance]);

  // Fetch individual token balance
  const fetchTokenBalance = async (
    userAddress: string, 
    tokenAddress: string, 
    chainId: number
  ): Promise<TokenBalance | null> => {
    try {
      const response = await fetch('/api/tokens/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          tokenAddress,
          chainId
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return null;
    }
  };

  // Get swap quote using DEX aggregators
  const getSwapQuote = useCallback(async (
    fromToken: string,
    toToken: string,
    amount: string
  ) => {
    if (!address || !chainId) throw new Error('Wallet not connected');

    try {
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          userAddress: address,
          chainId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get swap quote');
      }

      return await response.json();
    } catch (error) {
      console.error('Swap quote error:', error);
      throw error;
    }
  }, [address, chainId]);

  // Execute swap transaction
  const executeSwap = useCallback(async (quote: any) => {
    if (!address || !chainId) throw new Error('Wallet not connected');

    try {
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote,
          userAddress: address,
          chainId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute swap');
      }

      return await response.json();
    } catch (error) {
      console.error('Swap execution error:', error);
      throw error;
    }
  }, [address, chainId]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    await fetchTokenBalances();
  }, [fetchTokenBalances]);

  // Auto-fetch balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalances();
    } else {
      setBalances([]);
    }
  }, [isConnected, address, fetchTokenBalances]);

  return {
    isConnected,
    address,
    chainId,
    isConnecting,
    isReconnecting,
    isLoadingBalances,
    balances,
    connect,
    disconnect,
    refreshBalances,
    getSwapQuote,
    executeSwap,
    getTotalValue: () => balances.reduce((total, token) => total + (token.usdValue || 0), 0)
  };
}

// Helper functions
function getNativeSymbol(chainId: number): string {
  const symbols: Record<number, string> = {
    1: 'ETH',
    137: 'MATIC',
    56: 'BNB',
    42161: 'ETH'
  };
  return symbols[chainId] || 'ETH';
}

function getNativeName(chainId: number): string {
  const names: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'Binance Coin',
    42161: 'Ethereum'
  };
  return names[chainId] || 'Ethereum';
}

function getCommonTokens(chainId: number) {
  const tokens: Record<number, Array<{symbol: string; name: string; address: string}>> = {
    1: [
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441e95e2c2b08ae91e8e6B0e5C3CB2' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' }
    ],
    137: [
      { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
      { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' }
    ],
    56: [
      { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955' },
      { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' }
    ]
  };
  return tokens[chainId] || [];
}

async function getTokenPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${getCoingeckoId(symbol)}&vs_currencies=usd`);
    const data = await response.json();
    const id = getCoingeckoId(symbol);
    return data[id]?.usd || 0;
  } catch (error) {
    console.warn(`Failed to fetch price for ${symbol}:`, error);
    return 0;
  }
}

function getCoingeckoId(symbol: string): string {
  const ids: Record<string, string> = {
    'ETH': 'ethereum',
    'MATIC': 'matic-network',
    'BNB': 'binancecoin',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'DAI': 'dai'
  };
  return ids[symbol] || symbol.toLowerCase();
}