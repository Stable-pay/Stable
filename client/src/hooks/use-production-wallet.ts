import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';

// ERC20 ABI for token balance queries
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Production token addresses (verified contracts)
const PRODUCTION_TOKENS: Record<number, Array<{
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}>> = {
  1: [ // Ethereum Mainnet
    { symbol: 'USDC', address: '0xA0b86a33E6e3B0c8c8D7D45b40b9b5Ba0b3D0e8B', decimals: 6 },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
  ],
  137: [ // Polygon
    { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
  ],
  42161: [ // Arbitrum
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
  ],
  8453: [ // Base
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  ],
  10: [ // Optimism
    { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
    { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  ],
};

export interface ProductionTokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  formattedBalance: string;
  isNative: boolean;
  usdValue?: number;
}

export function useProductionWallet() {
  const { address, isConnected, chainId } = useAccount();
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');

  // Fetch KYC status
  const { data: kycData } = useQuery({
    queryKey: ['/api/kyc/status', address],
    enabled: !!address,
  });

  useEffect(() => {
    if (kycData?.status) {
      setKycStatus(kycData.status);
    }
  }, [kycData]);

  // Get native token balance
  const { data: nativeBalance } = useBalance({
    address: address,
    query: { enabled: !!address },
  });

  // Get network name
  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      8453: 'Base',
      10: 'Optimism',
      43114: 'Avalanche',
      56: 'BNB Chain'
    };
    return networks[chainId] || 'Unknown';
  };

  // Get token balances for current chain
  const { data: tokenBalances } = useQuery({
    queryKey: ['token-balances', address, chainId],
    queryFn: async () => {
      if (!address || !chainId || !PRODUCTION_TOKENS[chainId]) return [];

      const balances: ProductionTokenBalance[] = [];
      
      // Add native token balance
      if (nativeBalance) {
        const nativeSymbol = chainId === 1 ? 'ETH' : 
                           chainId === 137 ? 'MATIC' : 
                           chainId === 42161 ? 'ETH' : 
                           chainId === 8453 ? 'ETH' : 
                           chainId === 10 ? 'ETH' : 'ETH';
        
        balances.push({
          symbol: nativeSymbol,
          address: 'native',
          balance: nativeBalance.value.toString(),
          decimals: nativeBalance.decimals,
          chainId,
          chainName: getNetworkName(chainId),
          formattedBalance: formatUnits(nativeBalance.value, nativeBalance.decimals),
          isNative: true
        });
      }

      // Fetch ERC20 token balances
      const tokens = PRODUCTION_TOKENS[chainId] || [];
      
      for (const token of tokens) {
        try {
          const response = await fetch(`/api/wallet/token-balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address,
              tokenAddress: token.address,
              chainId
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const formattedBalance = formatUnits(BigInt(data.balance || '0'), token.decimals);
            
            if (parseFloat(formattedBalance) > 0) {
              balances.push({
                symbol: token.symbol,
                address: token.address,
                balance: data.balance || '0',
                decimals: token.decimals,
                chainId,
                chainName: getNetworkName(chainId),
                formattedBalance,
                isNative: false
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
        }
      }

      return balances;
    },
    enabled: !!address && !!chainId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    address,
    isConnected,
    chainId,
    chainName: chainId ? getNetworkName(chainId) : '',
    balances: tokenBalances || [],
    kycStatus,
    isKycVerified: kycStatus === 'verified',
    canTransfer: isConnected && kycStatus === 'verified',
    canWithdraw: isConnected && kycStatus === 'verified'
  };
}

// Custom hook for checking if user can perform specific actions
export function useTransferPermissions() {
  const { isConnected, kycStatus } = useProductionWallet();
  
  return {
    canSend: isConnected && kycStatus === 'verified',
    canSwap: isConnected && kycStatus === 'verified', 
    canWithdraw: isConnected && kycStatus === 'verified',
    needsKyc: isConnected && kycStatus !== 'verified',
    kycPending: kycStatus === 'pending',
    kycRejected: kycStatus === 'rejected'
  };
}