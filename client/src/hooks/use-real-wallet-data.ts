import { useQuery } from '@tanstack/react-query';
import { useWalletConnection } from './use-wallet-connection';
import { realTokenBalanceService, type NetworkBalance, type TokenInfo } from '@/lib/real-token-balance';

export function useRealWalletBalances() {
  const { isConnected, address } = useWalletConnection();

  return useQuery({
    queryKey: ['real-wallet-balances', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await realTokenBalanceService.getAllNetworkBalances(address);
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 3
  });
}

export function useRealSwappableTokens() {
  const { isConnected, address } = useWalletConnection();

  return useQuery({
    queryKey: ['real-swappable-tokens', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await realTokenBalanceService.getSwappableTokens(address);
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 3
  });
}

export function useRealPortfolioSummary() {
  const { data: networkBalances, isLoading, error } = useRealWalletBalances();
  
  const summary = {
    totalNetworks: networkBalances?.length || 0,
    totalTokens: networkBalances?.reduce((sum, network) => sum + network.tokens.length, 0) || 0,
    connectedNetworks: networkBalances?.filter(network => network.rpcConnected).length || 0,
    hasAnyBalance: networkBalances?.some(network => 
      parseFloat(network.nativeBalance) > 0 || network.tokens.length > 0
    ) || false,
    networks: networkBalances || []
  };

  return {
    ...summary,
    isLoading,
    error
  };
}