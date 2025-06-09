import { useAccount, useReadContracts, useBalance } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';

// Real token contract addresses for USDT on Polygon
const POLYGON_TOKENS = [
  { 
    symbol: 'USDT', 
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 
    decimals: 6,
    chainId: 137 
  },
  { 
    symbol: 'USDC', 
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 
    decimals: 6,
    chainId: 137 
  },
  { 
    symbol: 'DAI', 
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 
    decimals: 18,
    chainId: 137 
  },
  { 
    symbol: 'WMATIC', 
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 
    decimals: 18,
    chainId: 137 
  }
];

const ETHEREUM_TOKENS = [
  { 
    symbol: 'USDT', 
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', 
    decimals: 6,
    chainId: 1 
  },
  { 
    symbol: 'USDC', 
    address: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B', 
    decimals: 6,
    chainId: 1 
  },
  { 
    symbol: 'DAI', 
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
    decimals: 18,
    chainId: 1 
  }
];

const ARBITRUM_TOKENS = [
  { 
    symbol: 'USDT', 
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 
    decimals: 6,
    chainId: 42161 
  },
  { 
    symbol: 'USDC', 
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 
    decimals: 6,
    chainId: 42161 
  }
];

const BASE_TOKENS = [
  { 
    symbol: 'USDC', 
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 
    decimals: 6,
    chainId: 8453 
  }
];

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

export interface WalletTokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  formattedBalance: string;
  isNative: boolean;
}

export function useWalletTokenBalances() {
  const { address, isConnected, chainId } = useAccount();
  
  // Get native balance for current network
  const { data: nativeBalance } = useBalance({ 
    address,
    query: { enabled: !!address && isConnected }
  });

  // Get token balances for current network only
  const getCurrentNetworkTokens = () => {
    switch (chainId) {
      case 137: return POLYGON_TOKENS;
      case 1: return ETHEREUM_TOKENS;
      case 42161: return ARBITRUM_TOKENS;
      case 8453: return BASE_TOKENS;
      default: return [];
    }
  };

  const currentTokens = getCurrentNetworkTokens();

  // Prepare contracts for batch reading
  const contracts = currentTokens.map(token => ({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    chainId: token.chainId
  }));

  // Read all token balances at once
  const { data: tokenBalances, isLoading: isLoadingTokens } = useReadContracts({
    contracts,
    query: { 
      enabled: !!address && isConnected && contracts.length > 0,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  });

  // Process and format the results
  const { data: processedBalances = [], isLoading } = useQuery({
    queryKey: ['processedBalances', address, chainId, tokenBalances?.length, nativeBalance?.value.toString()],
    queryFn: (): WalletTokenBalance[] => {
      const results: WalletTokenBalance[] = [];
      
      // Add native token if has balance
      if (nativeBalance && parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)) > 0) {
        const networkNames: Record<number, string> = {
          1: 'Ethereum',
          137: 'Polygon', 
          42161: 'Arbitrum',
          8453: 'Base'
        };

        results.push({
          symbol: nativeBalance.symbol,
          address: 'native',
          balance: nativeBalance.value.toString(),
          decimals: nativeBalance.decimals,
          chainId: chainId || 1,
          chainName: networkNames[chainId || 1] || 'Unknown',
          formattedBalance: parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(6),
          isNative: true
        });
      }

      // Add ERC20 tokens with balances
      if (tokenBalances) {
        tokenBalances.forEach((result, index) => {
          if (result.status === 'success' && result.result) {
            const token = currentTokens[index];
            const balance = result.result as bigint;
            const formatted = formatUnits(balance, token.decimals);
            
            // Only include tokens with balance > 0
            if (parseFloat(formatted) > 0) {
              results.push({
                symbol: token.symbol,
                address: token.address,
                balance: balance.toString(),
                decimals: token.decimals,
                chainId: token.chainId,
                chainName: token.chainId === 137 ? 'Polygon' : 
                          token.chainId === 1 ? 'Ethereum' :
                          token.chainId === 42161 ? 'Arbitrum' :
                          token.chainId === 8453 ? 'Base' : 'Unknown',
                formattedBalance: parseFloat(formatted).toFixed(6),
                isNative: false
              });
            }
          }
        });
      }

      return results.sort((a, b) => parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance));
    },
    enabled: !!address && isConnected,
    staleTime: 15000 // Consider data stale after 15 seconds
  });

  return {
    balances: processedBalances,
    isLoading: isLoading || isLoadingTokens,
    currentChainId: chainId,
    supportedNetworks: ['Ethereum', 'Polygon', 'Arbitrum', 'Base']
  };
}

export function useSwappableWalletTokens() {
  const { balances, isLoading } = useWalletTokenBalances();
  
  return {
    tokens: balances.filter(token => parseFloat(token.formattedBalance) > 0),
    isLoading,
    totalTokens: balances.length
  };
}