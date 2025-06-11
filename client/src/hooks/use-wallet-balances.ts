import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

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

export function useWalletBalances() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Common tokens for each network
  const getCommonTokens = (chainId: number) => {
    const tokens: Record<number, Array<{symbol: string; name: string; address: string; decimals: number}>> = {
      1: [
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441e95e2c2b08ae91e8e6B0e5C3CB2', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      ],
      137: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      ],
      56: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
        { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      ],
      1337: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', decimals: 6 },
      ]
    };
    return tokens[chainId] || [];
  };

  const refreshBalances = useCallback(async () => {
    if (!isConnected || !address || !caipNetwork) return;

    setIsLoading(true);
    const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
    
    try {
      const balances: TokenBalance[] = [];

      // Add native token (ETH, MATIC, etc.)
      const nativeSymbol = getNativeTokenSymbol(chainId);
      balances.push({
        symbol: nativeSymbol,
        name: getNativeTokenName(chainId),
        address: '0x0000000000000000000000000000000000000000',
        balance: '1000000000000000000', // 1 ETH equivalent for demo
        decimals: 18,
        chainId: chainId,
        formattedBalance: '1.0',
        usdValue: 2000
      });

      // Add common tokens
      const commonTokens = getCommonTokens(chainId);
      for (const token of commonTokens) {
        balances.push({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          balance: '1000000', // 1 USDC equivalent for demo
          decimals: token.decimals,
          chainId: chainId,
          formattedBalance: '1.0',
          usdValue: 1
        });
      }

      setTokenBalances(balances);
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setTokenBalances([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, caipNetwork]);

  // Helper functions
  const getNativeTokenSymbol = (chainId: number): string => {
    const symbols: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB',
      42161: 'ETH',
      10: 'ETH',
      43114: 'AVAX',
      1337: 'ETH'
    };
    return symbols[chainId] || 'ETH';
  };

  const getNativeTokenName = (chainId: number): string => {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BNB Smart Chain',
      42161: 'Arbitrum',
      10: 'Optimism',
      43114: 'Avalanche',
      1337: 'Hardhat'
    };
    return names[chainId] || 'Ethereum';
  };

  // Auto-fetch balances when wallet connects or network changes
  useEffect(() => {
    if (isConnected && address) {
      refreshBalances();
    } else {
      setTokenBalances([]);
    }
  }, [isConnected, address, refreshBalances]);

  // Calculate total portfolio value
  const totalValue = tokenBalances.reduce((sum, token) => sum + token.usdValue, 0);

  return {
    tokenBalances,
    isLoading,
    refreshBalances,
    totalValue
  };
}