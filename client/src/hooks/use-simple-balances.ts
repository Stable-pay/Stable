import { useState, useEffect } from 'react';

export interface SimpleTokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  formattedBalance: string;
  usdValue: number;
}

export function useSimpleBalances(address: string | undefined, chainId: number) {
  const [balances, setBalances] = useState<SimpleTokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setBalances([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Demo balances based on chain
    const demoBalances: SimpleTokenBalance[] = [];

    // Add native token
    const nativeTokens: Record<number, { symbol: string; name: string }> = {
      1: { symbol: 'ETH', name: 'Ethereum' },
      137: { symbol: 'MATIC', name: 'Polygon' },
      56: { symbol: 'BNB', name: 'BNB Smart Chain' },
      42161: { symbol: 'ETH', name: 'Arbitrum' },
      10: { symbol: 'ETH', name: 'Optimism' },
      43114: { symbol: 'AVAX', name: 'Avalanche' },
      1337: { symbol: 'ETH', name: 'Hardhat' }
    };

    const native = nativeTokens[chainId] || nativeTokens[1];
    demoBalances.push({
      symbol: native.symbol,
      name: native.name,
      address: '0x0000000000000000000000000000000000000000',
      balance: '1000000000000000000',
      decimals: 18,
      chainId,
      formattedBalance: '1.0',
      usdValue: native.symbol === 'ETH' ? 2000 : native.symbol === 'MATIC' ? 0.8 : native.symbol === 'BNB' ? 250 : native.symbol === 'AVAX' ? 25 : 2000
    });

    // Add stablecoins
    const stablecoins = [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E6441e95e2c2b08ae91e8e6B0e5C3CB2',
        balance: '1000000',
        decimals: 6,
        chainId,
        formattedBalance: '1.0',
        usdValue: 1
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        balance: '1000000',
        decimals: 6,
        chainId,
        formattedBalance: '1.0',
        usdValue: 1
      }
    ];

    demoBalances.push(...stablecoins);

    setTimeout(() => {
      setBalances(demoBalances);
      setIsLoading(false);
    }, 500);
  }, [address, chainId]);

  const totalValue = balances.reduce((sum, token) => sum + token.usdValue, 0);

  const refetch = () => {
    if (address) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return {
    balances,
    isLoading,
    error,
    totalValue,
    refetch
  };
}