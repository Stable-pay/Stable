import { useAccount, useBalance, useReadContract, useWriteContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, parseUnits } from 'viem'
import { erc20Abi } from 'viem'

// Common token addresses across networks
const TOKEN_ADDRESSES = {
  1: { // Ethereum
    USDC: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  137: { // Polygon
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
  },
  42161: { // Arbitrum
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  },
  8453: { // Base
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    WETH: '0x4200000000000000000000000000000000000006'
  }
}

export interface TokenBalance {
  symbol: string
  name: string
  address: string
  balance: string
  decimals: number
  chainId: number
  usdValue?: number
}

export function useWagmiWallet() {
  const { address, isConnected, chainId } = useAccount()
  
  return {
    address,
    isConnected,
    chainId,
    isLoading: false
  }
}

export function useTokenBalances() {
  const { address, isConnected, chainId } = useAccount()
  
  // Get native balance
  const { data: nativeBalance } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: !!address && isConnected
    }
  })

  // Get token balances for current network
  const { data: tokenBalances = [] } = useQuery({
    queryKey: ['tokenBalances', address, chainId],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address || !chainId || !isConnected) return []
      
      const tokens = TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES]
      if (!tokens) return []
      
      const balances: TokenBalance[] = []
      
      // Add native token
      if (nativeBalance) {
        balances.push({
          symbol: nativeBalance.symbol,
          name: nativeBalance.symbol,
          address: 'native',
          balance: formatUnits(nativeBalance.value, nativeBalance.decimals),
          decimals: nativeBalance.decimals,
          chainId: chainId
        })
      }
      
      return balances
    },
    enabled: !!address && isConnected && !!chainId
  })

  return {
    balances: tokenBalances,
    isLoading: !isConnected,
    nativeBalance
  }
}

export function useTokenBalance(tokenAddress: string) {
  const { address, isConnected, chainId } = useAccount()
  
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isConnected && tokenAddress !== 'native'
    }
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: !!address && isConnected && tokenAddress !== 'native'
    }
  })

  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!address && isConnected && tokenAddress !== 'native'
    }
  })

  return {
    balance: balance && decimals ? formatUnits(balance, decimals) : '0',
    decimals: decimals || 18,
    symbol: symbol || 'UNKNOWN',
    isLoading: !balance && isConnected
  }
}

export function useSwappableTokens() {
  const { chainId } = useAccount()
  const { balances } = useTokenBalances()
  
  // Filter tokens with balance > 0 for swapping
  const swappableTokens = balances.filter(token => 
    parseFloat(token.balance) > 0
  )
  
  return {
    tokens: swappableTokens,
    isLoading: false
  }
}