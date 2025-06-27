/**
 * Custom Hook for Reown AppKit Wallet Balance Integration
 * Fetches real-time token balances from connected wallets
 */

import { useState, useEffect, useCallback } from 'react'
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { reownBalanceFetcher, type ReownTokenBalance } from '@/lib/reown-balance-fetcher'

interface UseReownWalletBalancesReturn {
  balances: ReownTokenBalance[]
  isLoading: boolean
  error: string | null
  refreshBalances: () => Promise<void>
  totalUsdValue: number
  isConnected: boolean
  currentChain: number | null
  supportedTokensCount: number
}

export function useReownWalletBalances(): UseReownWalletBalancesReturn {
  const { address, isConnected, status } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('eip155')
  
  const [balances, setBalances] = useState<ReownTokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch wallet balances using Reown provider
   */
  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address || !chainId || !walletProvider) {
      console.log('Wallet not connected or missing provider')
      setBalances([])
      return
    }

    console.log(`Fetching balances for wallet ${address} on chain ${chainId}`)
    setIsLoading(true)
    setError(null)

    try {
      const fetchedBalances = await reownBalanceFetcher.fetchWalletBalances(
        walletProvider,
        address,
        Number(chainId)
      )

      console.log(`Successfully fetched ${fetchedBalances.length} token balances`)
      setBalances(fetchedBalances)
      
      if (fetchedBalances.length === 0) {
        console.log('No token balances found - wallet may be empty or on unsupported network')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet balances'
      console.error('Balance fetching error:', errorMessage)
      setError(errorMessage)
      setBalances([])
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, chainId, walletProvider])

  /**
   * Auto-fetch balances when wallet connects or network changes
   */
  useEffect(() => {
    if (isConnected && address && chainId && status === 'connected') {
      console.log(`Wallet state changed - triggering balance fetch`)
      fetchBalances()
    } else {
      console.log('Wallet disconnected - clearing balances')
      setBalances([])
      setError(null)
    }
  }, [isConnected, address, chainId, status, fetchBalances])

  /**
   * Calculate total USD value of all tokens
   */
  const totalUsdValue = balances.reduce((sum, token) => sum + token.usdValue, 0)

  /**
   * Count supported tokens for current chain
   */
  const supportedTokensCount = chainId ? 
    reownBalanceFetcher.getSupportedChains().includes(Number(chainId)) ? 
      balances.length : 0 
    : 0

  /**
   * Manual refresh function
   */
  const refreshBalances = useCallback(async () => {
    console.log('Manual balance refresh requested')
    await fetchBalances()
  }, [fetchBalances])

  return {
    balances,
    isLoading,
    error,
    refreshBalances,
    totalUsdValue,
    isConnected: isConnected && status === 'connected',
    currentChain: chainId ? Number(chainId) : null,
    supportedTokensCount
  }
}

/**
 * Hook for getting specific token balance
 */
export function useTokenBalance(tokenAddress: string, chainId?: number) {
  const { balances, isLoading, refreshBalances } = useReownWalletBalances()
  const { chainId: currentChainId } = useAppKitNetwork()
  
  const targetChainId = chainId || currentChainId
  
  const tokenBalance = balances.find(balance => 
    balance.address.toLowerCase() === tokenAddress.toLowerCase() && 
    balance.chainId === targetChainId
  )

  return {
    balance: tokenBalance,
    isLoading,
    refreshBalance: refreshBalances,
    hasBalance: tokenBalance && parseFloat(tokenBalance.balance) > 0
  }
}

/**
 * Hook for getting native token balance (ETH, MATIC, BNB, etc.)
 */
export function useNativeBalance() {
  const { balances, isLoading, refreshBalances } = useReownWalletBalances()
  
  const nativeBalance = balances.find(balance => balance.isNative)

  return {
    balance: nativeBalance,
    isLoading,
    refreshBalance: refreshBalances,
    hasBalance: nativeBalance && parseFloat(nativeBalance.balance) > 0
  }
}

export type { ReownTokenBalance }