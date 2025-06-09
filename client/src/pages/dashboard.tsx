import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USDCCollectionMonitor } from "@/components/dashboard/usdc-collection-monitor";
import { useWalletConnection, useTokenBalances } from "@/hooks/use-wallet-data";
import { TrendingUp, Wallet, Shield, University, AlertCircle, DollarSign, Network } from "lucide-react";

export default function Dashboard() {
  const { isConnected, address, chainId, connect } = useWalletConnection();
  const { data: tokenData, isLoading: balancesLoading, error: balancesError } = useTokenBalances();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view live portfolio balances and execute real token swaps
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
              {tokenData?.nativeBalance} {tokenData?.nativeSymbol}
            </div>
            <p className="text-blue-100">{tokenData?.network} Network</p>
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
                <p className="text-sm text-gray-600">Native Balance</p>
                <h3 className="text-2xl font-bold">
                  {parseFloat(tokenData?.nativeBalance || '0').toFixed(4)}
                </h3>
                <p className="text-xs text-green-600">{tokenData?.nativeSymbol}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Network className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Network</p>
                <h3 className="text-2xl font-bold">{tokenData?.network}</h3>
                <p className="text-xs text-blue-600">Chain ID: {chainId}</p>
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

      {/* Live Network Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Connected Wallet Details</span>
            <Badge className="bg-green-100 text-green-800">Live Blockchain Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Network Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-medium">{tokenData?.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chain ID:</span>
                    <span className="font-medium">{chainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Native Token:</span>
                    <span className="font-medium">{tokenData?.nativeSymbol}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Wallet Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-mono text-sm">{address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-medium">{tokenData?.nativeBalance} {tokenData?.nativeSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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