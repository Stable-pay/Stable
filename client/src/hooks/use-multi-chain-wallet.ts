import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits, createPublicClient, http } from 'viem';
import { mainnet, polygon, arbitrum, base } from 'viem/chains';

// Multi-chain RPC configuration
const CHAIN_CONFIGS = {
  1: { 
    chain: mainnet, 
    rpc: 'https://eth.llamarpc.com',
    name: 'Ethereum',
    nativeSymbol: 'ETH'
  },
  137: { 
    chain: polygon, 
    rpc: 'https://polygon.llamarpc.com',
    name: 'Polygon',
    nativeSymbol: 'MATIC'
  },
  42161: { 
    chain: arbitrum, 
    rpc: 'https://arbitrum.llamarpc.com',
    name: 'Arbitrum',
    nativeSymbol: 'ETH'
  },
  8453: { 
    chain: base, 
    rpc: 'https://base.llamarpc.com',
    name: 'Base',
    nativeSymbol: 'ETH'
  }
} as const;

// Common ERC20 tokens across networks
const TOKEN_CONFIGS = {
  1: [ // Ethereum
    { symbol: 'USDC', address: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B', decimals: 6 },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 }
  ],
  137: [ // Polygon
    { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
    { symbol: 'WBTC', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 }
  ],
  42161: [ // Arbitrum
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    { symbol: 'WBTC', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8 },
    { symbol: 'LINK', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18 }
  ],
  8453: [ // Base
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    { symbol: 'cbETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18 }
  ]
} as const;

export interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  isNative: boolean;
  formattedBalance: string;
}

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

export function useMultiChainBalances() {
  const { address, isConnected } = useAccount();

  const { data: allBalances = [], isLoading, error } = useQuery({
    queryKey: ['multiChainBalances', address],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address || !isConnected) return [];

      const allTokens: TokenBalance[] = [];

      // Fetch balances from all chains
      for (const [chainIdStr, config] of Object.entries(CHAIN_CONFIGS)) {
        const chainId = parseInt(chainIdStr) as keyof typeof CHAIN_CONFIGS;
        
        try {
          // Create public client for this chain
          const client = createPublicClient({
            chain: config.chain,
            transport: http(config.rpc)
          });

          // Get native token balance
          const nativeBalance = await client.getBalance({ address: address as `0x${string}` });
          const nativeFormatted = formatUnits(nativeBalance, 18);
          
          // Only add native token if balance > 0
          if (parseFloat(nativeFormatted) > 0) {
            allTokens.push({
              symbol: config.nativeSymbol,
              address: 'native',
              balance: nativeBalance.toString(),
              decimals: 18,
              chainId,
              chainName: config.name,
              isNative: true,
              formattedBalance: parseFloat(nativeFormatted).toFixed(6)
            });
          }

          // Get ERC20 token balances
          const tokens = TOKEN_CONFIGS[chainId] || [];
          
          for (const token of tokens) {
            try {
              const tokenBalance = await client.readContract({
                address: token.address as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`]
              });

              const formatted = formatUnits(tokenBalance as bigint, token.decimals);
              
              // Only add token if balance > 0
              if (parseFloat(formatted) > 0) {
                allTokens.push({
                  symbol: token.symbol,
                  address: token.address,
                  balance: (tokenBalance as bigint).toString(),
                  decimals: token.decimals,
                  chainId,
                  chainName: config.name,
                  isNative: false,
                  formattedBalance: parseFloat(formatted).toFixed(6)
                });
              }
            } catch (error) {
              console.warn(`Failed to fetch ${token.symbol} balance on ${config.name}:`, error);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch balances from ${config.name}:`, error);
        }
      }

      return allTokens.sort((a, b) => {
        // Sort by chain ID first, then by balance value
        if (a.chainId !== b.chainId) return a.chainId - b.chainId;
        return parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance);
      });
    },
    enabled: !!address && isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });

  return {
    balances: allBalances,
    isLoading,
    error,
    refetch: () => {
      // Manual refetch function
    }
  };
}

export function useSwappableTokens() {
  const { balances, isLoading } = useMultiChainBalances();
  
  // Filter tokens that have balance > 0 and can be swapped
  const swappableTokens = balances.filter(token => 
    parseFloat(token.formattedBalance) > 0
  );

  return {
    tokens: swappableTokens,
    isLoading,
    totalTokens: swappableTokens.length,
    totalChains: Array.from(new Set(swappableTokens.map(t => t.chainId))).length
  };
}