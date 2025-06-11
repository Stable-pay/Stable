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

  // State for native balance
  const [nativeBalance, setNativeBalance] = useState<string>('0');

  // Common tokens for each network
  const getCommonTokens = (chainId: number) => {
    const tokens: Record<number, Array<{symbol: string; name: string; address: string; decimals: number}>> = {
      1: [
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441e95e2c2b08ae91e8e6B0e5C3CB2', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }
      ],
      137: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 }
      ],
      56: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
        { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
        { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 }
      ],
      42161: [
        { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 }
      ]
    };
    return tokens[chainId] || [];
  };

  // Fetch token balances
  const fetchTokenBalances = async () => {
    if (!address || !caipNetwork?.id || !isConnected) return;

    setIsLoading(true);
    try {
      const balances: TokenBalance[] = [];
      const chainId = parseInt(caipNetwork.id.toString());

      // Add native token balance
      if (nativeBalance) {
        const nativePrice = await getTokenPrice(getNativeSymbol(chainId));
        const formattedBalance = parseFloat(nativeBalance.formatted);
        
        balances.push({
          symbol: nativeBalance.symbol,
          name: getNativeName(chainId),
          address: '0x0000000000000000000000000000000000000000',
          balance: nativeBalance.value.toString(),
          decimals: nativeBalance.decimals,
          chainId: chainId,
          formattedBalance: nativeBalance.formatted,
          usdValue: formattedBalance * nativePrice
        });
      }

      // Fetch ERC20 token balances
      const commonTokens = getCommonTokens(chainId);
      for (const token of commonTokens) {
        try {
          const response = await fetch('/api/tokens/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: address,
              tokenAddress: token.address,
              chainId: chainId
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.balance && parseFloat(data.balance.formattedBalance) > 0) {
              balances.push({
                symbol: data.balance.symbol,
                name: data.balance.name,
                address: data.balance.address,
                balance: data.balance.balance,
                decimals: data.balance.decimals,
                chainId: data.balance.chainId,
                formattedBalance: data.balance.formattedBalance,
                usdValue: data.balance.usdValue || 0
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch ${token.symbol} balance:`, error);
        }
      }

      setTokenBalances(balances);
    } catch (error) {
      console.error('Error fetching token balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch balances when wallet connects or network changes
  useEffect(() => {
    if (isConnected && address && caipNetwork?.id) {
      fetchTokenBalances();
    } else {
      setTokenBalances([]);
    }
  }, [isConnected, address, caipNetwork?.id, nativeBalance]);

  return {
    tokenBalances,
    isLoading,
    refreshBalances: fetchTokenBalances,
    totalValue: tokenBalances.reduce((sum, token) => sum + token.usdValue, 0)
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
    'DAI': 'dai',
    'BUSD': 'binance-usd'
  };
  return ids[symbol] || symbol.toLowerCase();
}