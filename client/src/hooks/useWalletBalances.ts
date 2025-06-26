import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

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
  const { address, isConnected } = useAccount();

  const { data: tokenBalances = [], isLoading, error } = useQuery({
    queryKey: ['wallet-balances', address],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address) return [];
      
      const response = await fetch(`/api/balance/all/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token balances');
      }
      
      return response.json();
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