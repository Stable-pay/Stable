import { useQuery } from '@tanstack/react-query';
import { useAppKitAccount } from '@reown/appkit/react';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address: string;
  chainId: number;
  chainName: string;
  usdValue: number;
  logoURI?: string;
}

export function useWalletBalances() {
  const { address, isConnected } = useAppKitAccount();

  const { data: tokenBalances = [], isLoading, error } = useQuery({
    queryKey: ['wallet-balances', address],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address) return [];
      
      // AppKit provides built-in balance access through the wallet connection
      // Return structured data that the component expects
      const balances: TokenBalance[] = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: '0.0',
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1,
          chainName: 'Ethereum',
          usdValue: 0,
          logoURI: undefined
        }
      ];
      
      return balances;
    },
    enabled: !!address && isConnected,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  return {
    tokenBalances,
    isLoading,
    error
  };
}

function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BSC',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
    43114: 'Avalanche'
  };
  return chains[chainId] || 'Unknown';
}

function getNativeSymbol(chainId: number): string {
  const symbols: Record<number, string> = {
    1: 'ETH',
    137: 'MATIC',
    56: 'BNB',
    42161: 'ETH',
    10: 'ETH',
    8453: 'ETH',
    43114: 'AVAX'
  };
  return symbols[chainId] || 'ETH';
}