import { useQuery } from '@tanstack/react-query';
import { useWalletConnection } from './use-wallet-data';
import { multiChainBalanceService, type NetworkBalance, type TokenBalance } from '@/lib/multi-chain-balance';

export function useMultiChainBalances() {
  const { isConnected, address } = useWalletConnection();

  return useQuery({
    queryKey: ['multi-chain-balances', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await multiChainBalanceService.getAllNetworkBalances(address);
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000,
    staleTime: 15000
  });
}

export function useSwappableTokens() {
  const { isConnected, address } = useWalletConnection();

  return useQuery({
    queryKey: ['swappable-tokens', address],
    queryFn: async () => {
      if (!address) throw new Error('No wallet connected');
      return await multiChainBalanceService.getSwappableTokens(address);
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000,
    staleTime: 15000
  });
}

export function useTotalPortfolioValue() {
  const { data: networkBalances, isLoading } = useMultiChainBalances();
  
  const totalValue = networkBalances?.reduce((sum, network) => {
    return sum + network.totalUsdValue;
  }, 0) || 0;

  const totalNetworks = networkBalances?.length || 0;
  const totalTokens = networkBalances?.reduce((sum, network) => {
    return sum + network.tokens.length;
  }, 0) || 0;

  return {
    totalValue,
    totalNetworks,
    totalTokens,
    isLoading,
    networks: networkBalances || []
  };
}