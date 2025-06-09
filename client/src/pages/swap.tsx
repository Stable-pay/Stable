import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { ArrowUpDown, Settings, Shield, Zap, TrendingUp, Activity, CreditCard, Coins } from "lucide-react";

export default function Swap() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { toast } = useToast();

  const [autoSend, setAutoSend] = useState(true);

  const openSwapModal = () => {
    if (!isConnected) {
      open();
    } else {
      open({ view: 'Swap' });
    }
  };

  const openOnRampModal = () => {
    if (!isConnected) {
      open();
    } else {
      open({ view: 'OnRampProviders' });
    }
  };

  const openNetworksModal = () => {
    if (!isConnected) {
      open();
    } else {
      open({ view: 'Networks' });
    }
  };

  const openHistoryModal = () => {
    if (!isConnected) {
      open();
    } else {
      open({ view: 'Account' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Native Swap Platform
        </h1>
        <p className="text-xl text-gray-600">
          Powered by Reown AppKit with native multi-chain swapping and real-time DEX aggregation
        </p>
      </div>

      {/* Domain Configuration Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Activity className="h-6 w-6 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">Reown AppKit Configuration</h3>
              <p className="text-amber-800 mb-4">
                To enable full wallet connectivity, add this domain to your Reown project allowlist:
              </p>
              <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                <code className="text-amber-900 text-sm font-mono break-all">
                  https://fc0fcb6c-8722-458b-9985-8a31854bcfb6-00-9b41tf5yjab1.spock.replit.dev
                </code>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => window.open('https://cloud.reown.com', '_blank')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Configure at cloud.reown.com
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => {
                    navigator.clipboard.writeText('https://fc0fcb6c-8722-458b-9985-8a31854bcfb6-00-9b41tf5yjab1.spock.replit.dev');
                    toast({ title: "Domain Copied", description: "Domain copied to clipboard" });
                  }}
                >
                  Copy Domain
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Connect Your Wallet</h3>
                <p className="text-blue-700">Connect your wallet to access native swapping powered by Reown AppKit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Actions Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Native Swap Card */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={openSwapModal}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowUpDown className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-600 text-white">Native</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Token Swap</h3>
            <p className="text-gray-600 mb-4">
              Swap any token using Reown's native DEX aggregation with real-time quotes and optimal routing
            </p>
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <TrendingUp className="h-4 w-4" />
              <span>Best rates across all DEXs</span>
            </div>
          </CardContent>
        </Card>

        {/* On-Ramp Card */}
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={openOnRampModal}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-emerald-600 text-white">Fiat</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Buy Crypto</h3>
            <p className="text-gray-600 mb-4">
              Buy cryptocurrency directly with your credit card or bank account using integrated on-ramp providers
            </p>
            <div className="flex items-center space-x-2 text-sm text-emerald-700">
              <Shield className="h-4 w-4" />
              <span>Secure and compliant</span>
            </div>
          </CardContent>
        </Card>

        {/* Networks Card */}
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={openNetworksModal}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-600 text-white">Multi-chain</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Switch Networks</h3>
            <p className="text-gray-600 mb-4">
              Seamlessly switch between Ethereum, Polygon, Base, Arbitrum, Optimism, and other supported networks
            </p>
            <div className="flex items-center space-x-2 text-sm text-purple-700">
              <Zap className="h-4 w-4" />
              <span>7+ networks supported</span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Card */}
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={openHistoryModal}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-amber-600 text-white">History</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction History</h3>
            <p className="text-gray-600 mb-4">
              View your complete transaction history, swap details, and track all your DeFi activities
            </p>
            <div className="flex items-center space-x-2 text-sm text-amber-700">
              <Activity className="h-4 w-4" />
              <span>Real-time updates</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* USDC Auto-Transfer Feature */}
      <Card className="border-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-2xl overflow-hidden">
        <CardContent className="p-8 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative">
            <div className="flex items-start space-x-4 mb-6">
              <Switch
                id="auto-send"
                checked={autoSend}
                onCheckedChange={setAutoSend}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="auto-send" className="font-bold text-white cursor-pointer text-lg">
                  Auto-transfer swapped USDC to custody wallet
                </Label>
                <p className="text-indigo-100 mt-2 leading-relaxed">
                  Automatically transfer all swapped USDC to our secure custody wallet for seamless INR withdrawal eligibility. 
                  This ensures your funds are ready for fiat conversion without additional transactions.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white mb-1">Instant Transfer</h4>
                <p className="text-indigo-200 text-sm">Automatic USDC custody</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white mb-1">INR Ready</h4>
                <p className="text-indigo-200 text-sm">Eligible for withdrawal</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white mb-1">Secure Storage</h4>
                <p className="text-indigo-200 text-sm">Bank-grade security</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={openSwapModal}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold h-12 px-8"
          size="lg"
        >
          <ArrowUpDown className="h-5 w-5 mr-2" />
          {isConnected ? 'Open Swap Interface' : 'Connect & Swap'}
        </Button>
        
        <Button
          onClick={openOnRampModal}
          variant="outline"
          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-8 font-semibold"
          size="lg"
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Buy Crypto
        </Button>
      </div>
    </div>
  );
}