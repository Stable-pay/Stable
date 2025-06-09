import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpDown, 
  DollarSign, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Copy,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Globe,
  Fuel
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';
import { Link } from 'wouter';

interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  formattedBalance: string;
  isNative: boolean;
  usdValue?: number;
}

interface NetworkStats {
  chainId: number;
  name: string;
  tokenCount: number;
  totalValue: number;
}

export function StablePayDashboard() {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();
  const { data: nativeBalance } = useBalance({ address });
  const { toast } = useToast();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [hideBalances, setHideBalances] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats[]>([]);

  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      8453: 'Base',
      10: 'Optimism',
      43114: 'Avalanche',
      56: 'BSC'
    };
    return networks[chainId] || 'Unknown';
  };

  const loadBalances = async () => {
    if (!address || !chainId || !nativeBalance) return;
    
    setBalancesLoading(true);
    
    try {
      const balanceResults: TokenBalance[] = [];
      
      const formattedBalance = parseFloat(nativeBalance.formatted);
      
      if (formattedBalance > 0.000001) {
        const mockUsdValue = formattedBalance * 2000;
        
        balanceResults.push({
          symbol: nativeBalance.symbol,
          address: 'native',
          balance: nativeBalance.value.toString(),
          decimals: nativeBalance.decimals,
          chainId,
          chainName: getNetworkName(chainId),
          formattedBalance: formattedBalance.toFixed(6),
          isNative: true,
          usdValue: mockUsdValue
        });
        
        setTotalPortfolioValue(mockUsdValue);
      }
      
      setBalances(balanceResults);
      
      const stats: NetworkStats[] = [{
        chainId,
        name: getNetworkName(chainId),
        tokenCount: balanceResults.length,
        totalValue: balanceResults.reduce((sum, token) => sum + (token.usdValue || 0), 0)
      }];
      
      setNetworkStats(stats);
      
    } catch (error) {
      console.error('Failed to load balances:', error);
      toast({
        title: "Balance Loading Failed",
        description: "Unable to fetch wallet balances",
        variant: "destructive"
      });
    } finally {
      setBalancesLoading(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard"
    });
  };

  const formatValue = (value: number) => {
    if (hideBalances) return '••••••';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatBalance = (balance: string) => {
    if (hideBalances) return '••••••';
    return balance;
  };

  useEffect(() => {
    if (isConnected && address && chainId && nativeBalance) {
      loadBalances();
    }
  }, [isConnected, address, chainId, nativeBalance]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-xl bg-white">
          <CardHeader className="text-center pb-8 pt-12">
            <div 
              className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
              style={{ backgroundColor: '#6667AB' }}
            >
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold mb-3" style={{ color: '#6667AB' }}>
              Connect Your Wallet
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Access your personalized portfolio dashboard
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Button
              onClick={() => open()}
              className="w-full h-14 text-lg font-semibold bg-[#6667AB] hover:bg-[#5a5b96] text-white shadow-lg"
              size="lg"
            >
              <Wallet className="h-5 w-5 mr-3" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold mb-3" style={{ color: '#6667AB' }}>
                Portfolio Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Track and manage your DeFi assets across multiple chains
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setHideBalances(!hideBalances)}
                className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white"
              >
                {hideBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={loadBalances}
                disabled={balancesLoading}
                className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${balancesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Wallet Info */}
          <Card className="shadow-xl bg-white border-0 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: '#6667AB' }}
                  >
                    <Wallet className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Connected Wallet</p>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-lg" style={{ color: '#6667AB' }}>
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => address && copyAddress(address)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-[#6667AB]"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm mb-1">Total Portfolio Value</p>
                  <p className="text-4xl font-bold" style={{ color: '#6667AB' }}>
                    {formatValue(totalPortfolioValue)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Network: {getNetworkName(chainId || 1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg border-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[#6667AB] data-[state=active]:text-white"
              style={{ color: '#6667AB' }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="tokens" 
              className="data-[state=active]:bg-[#6667AB] data-[state=active]:text-white"
              style={{ color: '#6667AB' }}
            >
              <PieChart className="h-4 w-4 mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-[#6667AB] data-[state=active]:text-white"
              style={{ color: '#6667AB' }}
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="defi" 
              className="data-[state=active]:bg-[#6667AB] data-[state=active]:text-white"
              style={{ color: '#6667AB' }}
            >
              <Shield className="h-4 w-4 mr-2" />
              DeFi
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-xl bg-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Balance</p>
                      <p className="text-2xl font-bold" style={{ color: '#6667AB' }}>
                        {formatValue(totalPortfolioValue)}
                      </p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#6667AB' }}
                    >
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl bg-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Networks</p>
                      <p className="text-2xl font-bold" style={{ color: '#6667AB' }}>
                        {networkStats.length}
                      </p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#6667AB' }}
                    >
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl bg-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Tokens</p>
                      <p className="text-2xl font-bold" style={{ color: '#6667AB' }}>
                        {balances.length}
                      </p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#6667AB' }}
                    >
                      <PieChart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl bg-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">24h Change</p>
                      <p className="text-2xl font-bold text-green-600 flex items-center">
                        +5.7%
                        <TrendingUp className="h-5 w-5 ml-2" />
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-xl bg-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl" style={{ color: '#6667AB' }}>Quick Actions</CardTitle>
                <CardDescription className="text-gray-600">
                  Perform common DeFi operations with one click
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link href="/swap">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow border-gray-200 bg-gray-50">
                      <CardContent className="p-6 text-center">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                          style={{ backgroundColor: '#6667AB' }}
                        >
                          <ArrowUpDown className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#6667AB' }}>
                          Token Swap
                        </h3>
                        <p className="text-gray-600">Convert tokens with gasless transactions</p>
                        <Badge className="bg-green-100 text-green-700 border-green-200 mt-3">
                          <Fuel className="h-3 w-3 mr-1" />
                          Gasless Available
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-gray-200 bg-gray-50">
                    <CardContent className="p-6 text-center">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: '#6667AB' }}
                      >
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#6667AB' }}>
                        Yield Farming
                      </h3>
                      <p className="text-gray-600">Earn rewards by providing liquidity</p>
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 mt-3">
                        Coming Soon
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-gray-200 bg-gray-50">
                    <CardContent className="p-6 text-center">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: '#6667AB' }}
                      >
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2" style={{ color: '#6667AB' }}>
                        Staking
                      </h3>
                      <p className="text-gray-600">Stake tokens to earn passive income</p>
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 mt-3">
                        Coming Soon
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-8">
            <Card className="shadow-xl bg-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3" style={{ color: '#6667AB' }}>
                  <PieChart className="h-6 w-6" />
                  Token Holdings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your current token balances across all networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#6667AB' }} />
                    <p className="text-gray-500">Loading token balances...</p>
                  </div>
                ) : balances.length === 0 ? (
                  <div className="p-8 text-center">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tokens found</p>
                    <p className="text-gray-400 text-sm mt-2">Add some tokens to your wallet to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {balances.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg text-white font-bold"
                            style={{ backgroundColor: '#6667AB' }}
                          >
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-lg" style={{ color: '#6667AB' }}>
                              {token.symbol}
                            </p>
                            <p className="text-gray-500">{token.chainName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg" style={{ color: '#6667AB' }}>
                            {formatBalance(token.formattedBalance)}
                          </p>
                          <p className="text-green-600">
                            {formatValue(token.usdValue || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-8">
            <Card className="shadow-xl bg-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3" style={{ color: '#6667AB' }}>
                  <Activity className="h-6 w-6" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your latest transactions and DeFi interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-gray-400 text-sm mt-2">Your transactions will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DeFi Tab */}
          <TabsContent value="defi" className="space-y-8">
            <Card className="shadow-xl bg-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3" style={{ color: '#6667AB' }}>
                  <Shield className="h-6 w-6" />
                  DeFi Positions
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your staking, farming, and lending positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No DeFi positions</p>
                  <p className="text-gray-400 text-sm mt-2">Start earning by staking or providing liquidity</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}