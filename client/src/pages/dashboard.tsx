import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USDCCollectionMonitor } from "@/components/dashboard/usdc-collection-monitor";
import { useWalletConnection, useWalletBalances, useTotalUSDValue } from "@/hooks/use-wallet-data";
import { TrendingUp, Wallet, Shield, University, AlertCircle, DollarSign, ExternalLink } from "lucide-react";

export default function Dashboard() {
  const { isConnected, address, connect } = useWalletConnection();
  const { data: walletBalances, isLoading: balancesLoading, error: balancesError } = useWalletBalances();
  const { totalValue } = useTotalUSDValue();

  // Calculate live portfolio metrics
  const portfolioStats = {
    totalValue: totalValue || 0,
    networksCount: walletBalances?.length || 0,
    tokensCount: walletBalances?.reduce((sum, network) => sum + network.tokens.length, 0) || 0,
    hasUSDC: walletBalances?.some(network => 
      network.tokens.some(token => token.symbol === 'USDC')
    ) || false
  };

  const getNetworkDisplayName = (network: string) => {
    const names = {
      ethereum: 'Ethereum',
      polygon: 'Polygon',
      arbitrum: 'Arbitrum', 
      base: 'Base'
    };
    return names[network as keyof typeof names] || network;
  };

  const getNetworkColor = (network: string) => {
    const colors = {
      ethereum: 'bg-blue-500',
      polygon: 'bg-purple-500',
      arbitrum: 'bg-cyan-500',
      base: 'bg-indigo-500'
    };
    return colors[network as keyof typeof colors] || 'bg-gray-500';
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view your live portfolio balances and transaction history
          </p>
          <Button onClick={connect} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet
          </Button>
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
          <p className="mt-4 text-gray-600">Loading your portfolio...</p>
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
            There was an error loading your wallet data. Please try again.
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
      {/* Wallet Info Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Portfolio Dashboard</h1>
            <p className="text-blue-100">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              ${portfolioStats.totalValue.toFixed(2)}
            </div>
            <p className="text-blue-100">Total Portfolio Value</p>
          </div>
        </div>
      </div>

      {/* Portfolio Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <h3 className="text-2xl font-bold">${portfolioStats.totalValue.toFixed(2)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Networks</p>
                <h3 className="text-2xl font-bold">{portfolioStats.networksCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Wallet className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tokens</p>
                <h3 className="text-2xl font-bold">{portfolioStats.tokensCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">USDC Ready</p>
                <h3 className="text-2xl font-bold">
                  {portfolioStats.hasUSDC ? 'Yes' : 'No'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Live Network Balances</span>
            <Badge className="bg-green-100 text-green-800">Real-time</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletBalances && walletBalances.length > 0 ? (
            <div className="space-y-4">
              {walletBalances.map((networkBalance) => (
                <div key={networkBalance.network} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getNetworkColor(networkBalance.network)}`}></div>
                      <h4 className="font-semibold">{getNetworkDisplayName(networkBalance.network)}</h4>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {parseFloat(networkBalance.nativeBalance).toFixed(4)} ETH
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
              <p>No balances found</p>
              <p className="text-sm">Make sure your wallet has tokens on supported networks</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* USDC Collection Monitor */}
      <USDCCollectionMonitor />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-16" variant="outline">
              <TrendingUp className="h-6 w-6 mr-2" />
              <div className="text-left">
                <div className="font-medium">Swap Tokens</div>
                <div className="text-sm text-gray-600">Convert to USDC</div>
              </div>
            </Button>
            
            <Button className="h-16" variant="outline">
              <University className="h-6 w-6 mr-2" />
              <div className="text-left">
                <div className="font-medium">Withdraw INR</div>
                <div className="text-sm text-gray-600">Bank transfer</div>
              </div>
            </Button>
            
            <Button className="h-16" variant="outline">
              <Shield className="h-6 w-6 mr-2" />
              <div className="text-left">
                <div className="font-medium">KYC Status</div>
                <div className="text-sm text-gray-600">Verify identity</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}