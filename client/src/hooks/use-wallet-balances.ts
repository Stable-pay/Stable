import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { productionMultiChainBalanceFetcher, type TokenBalance } from '@/lib/production-multi-chain-balance-fetcher';

export function useWalletBalances() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch balances for current chain or all chains
  const fetchBalances = useCallback(async (fetchAllChains = false) => {
    if (!address || !isConnected) {
      setTokenBalances([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching balances for ${address.slice(0, 6)}...${address.slice(-4)}`);
      
      let balances: TokenBalance[];
      
      if (fetchAllChains) {
        // Fetch from all supported chains
        balances = await productionMultiChainBalanceFetcher.fetchBalances(address);
      } else {
        // Fetch only from current chain
        const currentChainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : 1;
        balances = await productionMultiChainBalanceFetcher.fetchBalances(address, [currentChainId]);
      }

      console.log(`Found ${balances.length} token balances across chains`);
      setTokenBalances(balances);
      
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch balances');
      setTokenBalances([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, caipNetwork?.id]);

  // Fetch balances for current chain only
  const fetchCurrentChainBalances = useCallback(() => {
    return fetchBalances(false);
  }, [fetchBalances]);

  // Fetch balances across all supported chains
  const fetchAllChainBalances = useCallback(() => {
    return fetchBalances(true);
  }, [fetchBalances]);

  // Refresh specific token balance
  const refreshTokenBalance = useCallback(async (tokenAddress: string, chainId: number) => {
    if (!address || !isConnected) return null;

    try {
      const updatedBalance = await productionMultiChainBalanceFetcher.refreshBalance(address, tokenAddress, chainId);
      
      if (updatedBalance) {
        setTokenBalances(prev => {
          const filtered = prev.filter(b => !(b.address === tokenAddress && b.chainId === chainId));
          return [...filtered, updatedBalance].sort((a, b) => b.usdValue - a.usdValue);
        });
      }
      
      return updatedBalance;
    } catch (error) {
      console.error('Failed to refresh token balance:', error);
      return null;
    }
  }, [address, isConnected]);

  // Auto-fetch balances when wallet connects or network changes
  useEffect(() => {
    if (isConnected && address) {
      // Initially fetch current chain balances, then fetch all chains in background
      fetchCurrentChainBalances().then(() => {
        // Fetch all chains after current chain is loaded
        setTimeout(() => fetchAllChainBalances(), 1000);
      });
    } else {
      setTokenBalances([]);
      setError(null);
    }
  }, [isConnected, address, caipNetwork?.id]);

  // Get balances for specific chain
  const getChainBalances = useCallback((chainId: number) => {
    return tokenBalances.filter(balance => balance.chainId === chainId);
  }, [tokenBalances]);

  // Get balances for current chain
  const getCurrentChainBalances = useCallback(() => {
    const currentChainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : 1;
    return getChainBalances(currentChainId);
  }, [caipNetwork?.id, getChainBalances]);

  // Get supported chains with balances
  const getChainsWithBalances = useCallback(() => {
    const uniqueChainIds: number[] = [];
    tokenBalances.forEach(balance => {
      if (!uniqueChainIds.includes(balance.chainId)) {
        uniqueChainIds.push(balance.chainId);
      }
    });
    return productionMultiChainBalanceFetcher.getSupportedChains().filter(chain => 
      uniqueChainIds.includes(chain.chainId)
    );
  }, [tokenBalances]);

  return {
    // Balance data
    tokenBalances,
    currentChainBalances: getCurrentChainBalances(),
    chainsWithBalances: getChainsWithBalances(),
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshBalances: fetchCurrentChainBalances,
    refreshAllChains: fetchAllChainBalances,
    refreshTokenBalance,
    getChainBalances,
    
    // Computed values
    totalValue: tokenBalances.reduce((sum, token) => sum + token.usdValue, 0),
    currentChainValue: getCurrentChainBalances().reduce((sum, token) => sum + token.usdValue, 0),
    
    // Utility
    supportedChains: productionMultiChainBalanceFetcher.getSupportedChains()
  };
}

// Export TokenBalance type for other components
export type { TokenBalance };