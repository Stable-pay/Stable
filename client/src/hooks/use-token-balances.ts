import { useState, useEffect, useCallback } from 'react';
import { useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, formatUnits } from 'ethers';

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

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

// Token addresses by chain
const TOKEN_ADDRESSES: Record<number, Array<{symbol: string; name: string; address: string}>> = {
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
    { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955' }
  ],
  1337: [
    { symbol: 'USDC', name: 'USD Coin', address: '0x5FbDB2315678afecb367f032d93F642f64180aa3' }
  ]
};

export function useTokenBalances(address: string | undefined, chainId: number) {
  const { walletProvider } = useAppKitProvider('eip155');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!address || !walletProvider) {
      setBalances([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(walletProvider as any);
      const newBalances: TokenBalance[] = [];

      // Get native token balance
      const nativeBalance = await provider.getBalance(address);
      const nativeSymbol = getNativeSymbol(chainId);
      const nativeName = getNativeName(chainId);
      
      if (nativeBalance > BigInt(0)) {
        newBalances.push({
          symbol: nativeSymbol,
          name: nativeName,
          address: '0x0000000000000000000000000000000000000000',
          balance: nativeBalance.toString(),
          decimals: 18,
          chainId,
          formattedBalance: formatUnits(nativeBalance, 18),
          usdValue: parseFloat(formatUnits(nativeBalance, 18)) * getNativePrice(nativeSymbol)
        });
      }

      // Get ERC20 token balances
      const tokens = TOKEN_ADDRESSES[chainId] || [];
      
      for (const token of tokens) {
        try {
          const contract = new Contract(token.address, ERC20_ABI, provider);
          const balance = await contract.balanceOf(address);
          
          if (balance > BigInt(0)) {
            const decimals = await contract.decimals();
            const formattedBalance = formatUnits(balance, decimals);
            
            newBalances.push({
              symbol: token.symbol,
              name: token.name,
              address: token.address,
              balance: balance.toString(),
              decimals,
              chainId,
              formattedBalance,
              usdValue: parseFloat(formattedBalance) * getTokenPrice(token.symbol)
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch ${token.symbol} balance:`, error);
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setError('Failed to fetch token balances');
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, walletProvider]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const totalValue = balances.reduce((sum, token) => sum + token.usdValue, 0);

  return {
    balances,
    isLoading,
    error,
    totalValue,
    refetch: fetchBalances
  };
}

function getNativeSymbol(chainId: number): string {
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
}

function getNativeName(chainId: number): string {
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
}

function getNativePrice(symbol: string): number {
  const prices: Record<string, number> = {
    ETH: 2000,
    MATIC: 0.8,
    BNB: 250,
    AVAX: 25
  };
  return prices[symbol] || 0;
}

function getTokenPrice(symbol: string): number {
  const prices: Record<string, number> = {
    USDC: 1,
    USDT: 1,
    DAI: 1
  };
  return prices[symbol] || 0;
}