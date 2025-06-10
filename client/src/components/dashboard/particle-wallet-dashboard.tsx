import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  ArrowUpDown, 
  DollarSign, 
  TrendingUp, 
  Send, 
  Shield,
  Zap,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Link } from 'wouter';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { useToast } from '@/hooks/use-toast';

export function ParticleWalletDashboard() {
  const { 
    address, 
    isConnected, 
    balances, 
    connect, 
    disconnect,
    chainId,
    userInfo,
    isLoading
  } = useParticleWallet();
  
  const { toast } = useToast();
  const [balancesVisible, setBalancesVisible] = useState(true);

  const totalPortfolioValue = balances.reduce((sum, token) => sum + (token.usdValue || 0), 0);
  const [liveRates, setLiveRates] = useState<Record<string, any>>({});

  // Fetch live rates for portfolio tracking
  useEffect(() => {
    const fetchLiveRates = async () => {
      if (balances.length === 0) return;
      
      try {
        const { productionPriceAPI } = await import('@/lib/production-price-api');
        const symbols = balances.map(token => token.symbol);
        const rates = await productionPriceAPI.getMultiplePrices(symbols);
        setLiveRates(rates);
      } catch (error) {
        console.error('Failed to fetch live rates:', error);
      }
    };

    fetchLiveRates();
    const interval = setInterval(fetchLiveRates, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [balances]);

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Particle Network",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Particle Network",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet.",
        variant: "destructive"
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Particle Network Dashboard
            </h1>
            <p className="text-gray-600">Connect your wallet to access advanced DeFi features</p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Connect Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Account Abstraction</div>
                    <div className="text-sm text-gray-600">Smart contract wallet</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-medium">Gasless Transactions</div>
                    <div className="text-sm text-gray-600">Sponsored by paymaster</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Multi-Chain Support</div>
                    <div className="text-sm text-gray-600">6+ networks supported</div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                {isLoading ? 'Connecting...' : 'Connect Particle Wallet'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Particle Network Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Account: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Smart Account
            </Badge>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Portfolio</p>
                  <div className="flex items-center gap-2">
                    {balancesVisible ? (
                      <p className="text-2xl font-bold">${totalPortfolioValue.toFixed(2)}</p>
                    ) : (
                      <p className="text-2xl font-bold">••••••</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBalancesVisible(!balancesVisible)}
                      className="h-6 w-6 p-0"
                    >
                      {balancesVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tokens</p>
                  <p className="text-2xl font-bold">{balances.length}</p>
                </div>
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gasless Swaps</p>
                  <p className="text-2xl font-bold text-green-600">Enabled</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Network</p>
                  <p className="text-2xl font-bold">
                    {chainId === 1 ? 'ETH' : chainId === 137 ? 'MATIC' : 'Multi'}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tokens" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tokens">Token Balances</TabsTrigger>
            <TabsTrigger value="swaps">Swap Hub</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Token Balances
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {balances.map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-gray-600">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {balancesVisible ? (
                          <>
                            <div className="font-medium">{token.formattedBalance}</div>
                            {token.usdValue && (
                              <div className="text-sm text-gray-600">${token.usdValue.toFixed(2)}</div>
                            )}
                          </>
                        ) : (
                          <div className="font-medium">••••••</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swaps" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5" />
                    Quick Swap to USDC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Swap any token to USDC with zero gas fees using Particle Network's paymaster.
                  </p>
                  <Link href="/swap">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Start Swap
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Cross-Chain Bridge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Bridge tokens across different networks seamlessly.
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    <Send className="w-4 h-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Account Type</div>
                    <div className="text-sm text-gray-600">Smart Contract Wallet</div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Particle Network
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Gasless Transactions</div>
                    <div className="text-sm text-gray-600">Sponsored by paymaster</div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                {userInfo && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Login Method</div>
                      <div className="text-sm text-gray-600">{userInfo.email || 'Social Login'}</div>
                    </div>
                    <Badge variant="outline">
                      Active
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}