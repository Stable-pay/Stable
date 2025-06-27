/**
 * Simple Balance Display using existing wallet balance system
 * Avoids Reown AppKit provider issues while showing real wallet data
 */

import { useWalletBalances } from '@/hooks/use-wallet-balances'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, Wallet, AlertTriangle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function SimpleBalanceDisplay() {
  const { isConnected, address } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { 
    tokenBalances, 
    isLoading, 
    error, 
    refreshAllChains,
    totalValue
  } = useWalletBalances()

  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BSC',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
    43114: 'Avalanche'
  }

  const getNetworkName = (chainId: number | null): string => {
    return chainId ? chainNames[chainId] || `Chain ${chainId}` : 'Unknown Network'
  }

  if (!isConnected) {
    return (
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-purple-900 mb-2">Connect Your Wallet</h3>
          <p className="text-purple-600 text-sm">
            Connect your wallet to view your token balances and start converting to INR
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error && tokenBalances.length === 0) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Balance Fetch Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Button 
            onClick={refreshAllChains}
            className="bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with total value and refresh */}
      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg text-purple-900">Wallet Balance</CardTitle>
            <p className="text-sm text-purple-600">
              {address?.slice(0, 6)}...{address?.slice(-4)} on {getNetworkName(Number(chainId))}
            </p>
          </div>
          <Button
            onClick={refreshAllChains}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">
              ${totalValue.toFixed(2)}
            </span>
            <Badge variant="secondary" className="bg-purple-200 text-purple-800">
              {tokenBalances.length} tokens
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && tokenBalances.length === 0 && (
        <Card className="bg-cream border-purple-200">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-purple-700">Fetching your token balances...</p>
            <p className="text-purple-500 text-sm mt-2">
              This may take a few moments for multi-chain wallets
            </p>
          </CardContent>
        </Card>
      )}

      {/* Token balances list */}
      {tokenBalances.length > 0 && (
        <div className="space-y-2">
          {tokenBalances.map((token, index) => (
            <Card key={`${token.chainId}-${token.address}-${index}`} className="bg-white border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-bold text-sm">
                        {token.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-900">{token.symbol}</span>
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                          {token.chainName}
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-600">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-purple-900">
                      {parseFloat(token.formattedBalance).toFixed(4)} {token.symbol}
                    </p>
                    <p className="text-sm text-purple-600">
                      ${token.usdValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tokenBalances.length === 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <Wallet className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-purple-900 mb-2">No Tokens Found</h3>
            <p className="text-purple-600 text-sm mb-4">
              Your wallet appears to be empty on {getNetworkName(Number(chainId))}
            </p>
            <p className="text-purple-500 text-xs">
              Try switching to a different network or adding funds to your wallet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Simplified token selector using existing balance system
 */
export function SimpleTokenSelector({ onTokenSelect }: { onTokenSelect: (token: any) => void }) {
  const { tokenBalances, isLoading } = useWalletBalances()
  const { isConnected } = useAppKitAccount()

  if (!isConnected) {
    return <div className="text-purple-600 text-sm">Connect wallet to view tokens</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-purple-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading tokens...</span>
      </div>
    )
  }

  if (tokenBalances.length === 0) {
    return <div className="text-purple-600 text-sm">No tokens found in wallet</div>
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-purple-700 font-medium">Select token to convert:</p>
      <div className="grid gap-2">
        {tokenBalances.slice(0, 5).map((token, index) => (
          <Button
            key={`${token.chainId}-${token.address}-${index}`}
            variant="outline"
            className="justify-between border-purple-200 hover:bg-purple-50"
            onClick={() => onTokenSelect(token)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{token.symbol}</span>
              <Badge variant="secondary" className="text-xs">
                {token.chainName}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm">{parseFloat(token.formattedBalance).toFixed(4)}</div>
              <div className="text-xs text-purple-600">${token.usdValue.toFixed(2)}</div>
            </div>
          </Button>
        ))}
      </div>
      {tokenBalances.length > 5 && (
        <p className="text-xs text-purple-500 text-center">
          Showing top 5 tokens. Total: {tokenBalances.length}
        </p>
      )}
    </div>
  )
}