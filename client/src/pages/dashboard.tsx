import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USDCCollectionMonitor } from "@/components/dashboard/usdc-collection-monitor";
import { ReownTokenSwap } from "@/components/swap/reown-token-swap";
import { useWagmiWallet, useTokenBalances } from "@/hooks/use-wagmi-wallet";
import { ReownWalletConnect } from "@/components/wallet/reown-wallet-connect";
import { TrendingUp, Wallet, Shield, University, AlertCircle, DollarSign, Network } from "lucide-react";
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

export default function Dashboard() {
  const { isConnected, address, chainId } = useWagmiWallet();
  const { balances, isLoading: balancesLoading, nativeBalance } = useTokenBalances();
  
  const totalNetworks = 1; // Currently connected network
  const totalTokens = balances?.length || 0;

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view live portfolio balances and execute real token swaps
          </p>
          <ReownWalletConnect />
        </div>
      </div>
    );
  }

  if (balancesLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading live blockchain data...</p>
        </div>
      </div>
    );
  }

  if (balancesError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-6 text-red-400" />
          <h2 className="text-2xl font-bold mb-4">Unable to Load Portfolio</h2>
          <p className="text-gray-600 mb-6">
            Failed to fetch blockchain data. Please check your wallet connection.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Live Wallet Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Live Portfolio Dashboard</h1>
            <p className="text-blue-100 flex items-center space-x-2">
              <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <Badge className="bg-green-500 text-white">Live Data</Badge>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {totalNetworks} Networks
            </div>
            <p className="text-blue-100">{totalTokens} Tokens Available</p>
          </div>
        </div>
      </div>

      {/* Live Portfolio Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Networks</p>
                <h3 className="text-2xl font-bold">{totalNetworks}</h3>
                <p className="text-xs text-green-600">Multi-chain</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Network className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <h3 className="text-2xl font-bold">{totalTokens}</h3>
                <p className="text-xs text-blue-600">Swappable</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Wallet className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Wallet Address</p>
                <h3 className="text-lg font-bold">{address?.slice(0, 8)}...</h3>
                <p className="text-xs text-purple-600">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <h3 className="text-2xl font-bold">Live</h3>
                <p className="text-xs text-emerald-600">Real-time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Chain Network Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Multi-Chain Portfolio</span>
            <Badge className="bg-green-100 text-green-800">Live Blockchain Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {networkBalances && networkBalances.length > 0 ? (
            <div className="space-y-4">
              {networkBalances.map((networkBalance) => (
                <div key={networkBalance.chainId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <h4 className="font-semibold">{networkBalance.network}</h4>
                      <Badge variant="outline">Chain {networkBalance.chainId}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {parseFloat(networkBalance.nativeBalance).toFixed(4)} {networkBalance.nativeSymbol}
                      </div>
                      <div className="text-sm text-gray-600">Native Balance</div>
                    </div>
                  </div>

                  {networkBalance.tokens.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Token Balances:</h5>
                      <div className="grid gap-2 md:grid-cols-2">
                        {networkBalance.tokens.map((token) => (
                          <div key={token.address} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{token.symbol}</span>
                              <span className="text-sm text-gray-600 ml-2">{token.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{parseFloat(token.balance).toFixed(4)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No token balances found</p>
              <p className="text-sm">Make sure your wallet has tokens on supported networks</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real Token Swap Interface */}
      <WorkingTokenSwap />

      {/* USDC Collection Monitor - Live 1inch Integration */}
      <USDCCollectionMonitor />

      {/* Live Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-16" variant="outline" asChild>
              <a href="/swap">
                <TrendingUp className="h-6 w-6 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Swap Tokens</div>
                  <div className="text-sm text-gray-600">Live 1inch API</div>
                </div>
              </a>
            </Button>
            
            <Button className="h-16" variant="outline" asChild>
              <a href="/withdraw">
                <University className="h-6 w-6 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Withdraw INR</div>
                  <div className="text-sm text-gray-600">Bank transfer</div>
                </div>
              </a>
            </Button>
            
            <Button className="h-16" variant="outline" asChild>
              <a href="/kyc">
                <Shield className="h-6 w-6 mr-2" />
                <div className="text-left">
                  <div className="font-medium">KYC Verification</div>
                  <div className="text-sm text-gray-600">Identity verification</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Integration Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <div className="font-medium text-blue-900">Live Blockchain Integration Active</div>
              <div className="text-sm text-blue-700">
                Real-time wallet data • 1inch API swapping • Automatic USDC collection
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}