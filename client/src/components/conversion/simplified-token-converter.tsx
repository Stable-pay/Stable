/**
 * Simplified Token to INR Converter - UI Only
 * Matches the design from user screenshots
 */

import { useWalletBalances } from '@/hooks/use-wallet-balances'
import { useAppKitAccount } from '@reown/appkit/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export function SimplifiedTokenConverter() {
  const { isConnected } = useAppKitAccount()
  const { tokenBalances, isLoading, refreshAllChains } = useWalletBalances()
  const [selectedToken, setSelectedToken] = useState<any>(null)

  // Mock USD to INR rate for display
  const usdToInrRate = 83.29

  if (!isConnected) {
    return (
      <Card className="bg-gradient-to-br from-purple-500 to-purple-700 border-0 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-medium mb-2">Connect Your Wallet</h3>
          <p className="text-purple-100">
            Connect your wallet to view token balances and convert to INR
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-br from-purple-500 to-purple-700 border-0 text-white">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Available Token Balance to INR</CardTitle>
          <p className="text-purple-100">
            Live USD to INR: ₹{usdToInrRate}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Available Token Balances</h3>
            <Button
              onClick={refreshAllChains}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Token Balance List */}
          <div className="space-y-3">
            {tokenBalances.length > 0 ? (
              tokenBalances.slice(0, 5).map((token, index) => (
                <div
                  key={`${token.chainId}-${token.address}-${index}`}
                  className="bg-white/20 backdrop-blur-md rounded-xl p-4 cursor-pointer hover:bg-white/30 transition-all"
                  onClick={() => setSelectedToken(token)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {token.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-lg">{token.symbol}</span>
                          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                            {token.chainName}
                          </Badge>
                        </div>
                        <p className="text-purple-100 text-sm">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        {parseFloat(token.formattedBalance).toFixed(6)}
                      </p>
                      <p className="text-purple-100 text-sm">
                        ≈ ₹{(token.usdValue * usdToInrRate).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-8 text-center">
                <p className="text-white/80">
                  {isLoading ? 'Loading token balances...' : 'No tokens found in your wallet'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Section */}
      {selectedToken && (
        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 border-0 text-white">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Direct Token to INR Conversion</h3>
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">
                  {selectedToken.symbol} → INR ₹{(selectedToken.usdValue * usdToInrRate / parseFloat(selectedToken.formattedBalance)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-xl p-6">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Converting</p>
                  <p className="text-white font-bold text-xl">
                    {parseFloat(selectedToken.formattedBalance).toFixed(6)} {selectedToken.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-purple-100 text-sm mb-1">Final Amount</p>
                  <p className="text-white font-bold text-xl">
                    ₹{(selectedToken.usdValue * usdToInrRate).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl">
              <ArrowRight className="w-5 h-5 mr-2" />
              Convert {selectedToken.symbol} to INR
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bottom CTA */}
      <div className="text-center">
        <p className="text-purple-300 text-sm">
          Need a new wallet?{' '}
          <button className="text-purple-100 hover:text-white underline">
            Create Social Wallet
          </button>
        </p>
      </div>
    </div>
  )
}