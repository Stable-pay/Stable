import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletTokenSwap } from "@/components/swap/wallet-token-swap";
import { ReownWalletConnect } from "@/components/wallet/reown-wallet-connect";
import { TrendingUp, Wallet, Shield, University, AlertCircle, DollarSign, Network } from "lucide-react";
import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatUnits } from 'viem';

// Network names for display
const NETWORK_NAMES = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  8453: 'Base'
} as const;

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance, isLoading: balanceLoading } = useBalance({ address });

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

  const networkName = NETWORK_NAMES[chainId as keyof typeof NETWORK_NAMES] || 'Unknown Network';
  const nativeBalance = balance ? parseFloat(formatUnits(balance.value, balance.decimals)) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio Dashboard</h1>
          <p className="text-gray-600">
            Real-time wallet balances and token swapping powered by 1inch API
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <ReownWalletConnect />
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Network</p>
                <p className="text-2xl font-bold">{networkName}</p>
              </div>
              <Network className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Native Balance</p>
                <p className="text-2xl font-bold">
                  {balanceLoading ? '...' : nativeBalance.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500">{balance?.symbol}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wallet Address</p>
                <p className="text-sm font-mono">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                </p>
                <Badge variant="outline" className="mt-1">Live Data</Badge>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">1inch Integration</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-gray-500">Real-time swapping</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Token Swap Interface */}
        <div className="lg:col-span-2">
          <MultiChainTokenSwap />
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Platform Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Platform Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Reown WalletKit Integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Live 1inch API Swapping</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Multi-chain Support</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Real Blockchain Data</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Automatic USDC Collection</span>
              </div>
            </CardContent>
          </Card>

          {/* Network Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-purple-600" />
                <span>Network Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Network:</span>
                <Badge variant="outline">{networkName}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Chain ID:</span>
                <span className="text-sm font-mono">{chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Connection:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Live
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Developer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <University className="h-5 w-5 text-orange-600" />
                <span>USDC Collection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                All swapped USDC is automatically sent to developer wallets:
              </div>
              <div className="text-xs font-mono bg-gray-50 p-2 rounded border">
                0x742d35Cc6634C0532925a3b8D93B443A38A73f65
              </div>
              <Badge variant="outline" className="w-full justify-center">
                Multi-Network Collection
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Live Platform Status:</strong> All wallet connections, balance fetching, and token swapping 
          use real blockchain data. No mock or demo data is present in this platform. 
          Connected to {networkName} with 1inch API integration active.
        </AlertDescription>
      </Alert>
    </div>
  );
}