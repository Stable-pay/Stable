import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpDown, 
  DollarSign, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink,
  Star,
  Fuel,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
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
  color: string;
}

export function PremiumDashboard() {
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

  const getNetworkColor = (chainId: number): string => {
    const colors: Record<number, string> = {
      1: 'from-blue-500 to-purple-600',
      137: 'from-purple-500 to-pink-600',
      42161: 'from-blue-400 to-cyan-500',
      8453: 'from-blue-500 to-indigo-600',
      10: 'from-red-400 to-orange-500',
      43114: 'from-red-500 to-pink-600',
      56: 'from-yellow-400 to-orange-500'
    };
    return colors[chainId] || 'from-gray-500 to-gray-600';
  };

  const getNetworkIcon = (chainId: number): string => {
    const icons: Record<number, string> = {
      1: '⟠',
      137: '⬟',
      42161: '🔷',
      8453: '🔵',
      10: '🔴',
      43114: '🔺',
      56: '🟡'
    };
    return icons[chainId] || '⚡';
  };

  // Load wallet balances
  const loadBalances = async () => {
    if (!address || !chainId || !nativeBalance) return;
    
    setBalancesLoading(true);
    
    try {
      const balanceResults: TokenBalance[] = [];
      
      // Add native token balance
      const formattedBalance = parseFloat(nativeBalance.formatted);
      
      if (formattedBalance > 0.000001) {
        const mockUsdValue = formattedBalance * 2000; // Mock price for demo
        
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
      
      // Calculate network stats
      const stats: NetworkStats[] = [{
        chainId,
        name: getNetworkName(chainId),
        tokenCount: balanceResults.length,
        totalValue: balanceResults.reduce((sum, token) => sum + (token.usdValue || 0), 0),
        color: getNetworkColor(chainId)
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

  // Load balances when wallet connects
  useEffect(() => {
    if (isConnected && address && chainId && nativeBalance) {
      loadBalances();
    }
  }, [isConnected, address, chainId, nativeBalance]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border border-slate-700/50 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Connect Your Wallet
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Access your personalized DeFi dashboard
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Button
              onClick={() => open()}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white border-0 shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-3">
                Portfolio Dashboard
              </h1>
              <p className="text-xl text-slate-300">
                Track and manage your DeFi assets across multiple chains
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setHideBalances(!hideBalances)}
                className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 backdrop-blur-sm"
              >
                {hideBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={loadBalances}
                disabled={balancesLoading}
                className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 backdrop-blur-sm"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${balancesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Wallet Info */}
          <Card className="border border-slate-700/50 shadow-2xl bg-slate-800/40 backdrop-blur-xl mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getNetworkColor(chainId || 1)} rounded-2xl flex items-center justify-center shadow-lg text-2xl`}>
                    {getNetworkIcon(chainId || 1)}
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Connected Wallet</p>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-white text-lg">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => address && copyAddress(address)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm mb-1">Total Portfolio Value</p>
                  <p className="text-4xl font-bold text-emerald-400">
                    {formatValue(totalPortfolioValue)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Network: {getNetworkName(chainId || 1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-white data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <PieChart className="h-4 w-4 mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="defi" className="text-white data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Shield className="h-4 w-4 mr-2" />
              DeFi
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Balance</p>
                      <p className="text-2xl font-bold text-white">
                        {formatValue(totalPortfolioValue)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Networks</p>
                      <p className="text-2xl font-bold text-white">
                        {networkStats.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Tokens</p>
                      <p className="text-2xl font-bold text-white">
                        {balances.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">24h Change</p>
                      <p className="text-2xl font-bold text-emerald-400 flex items-center">
                        +5.7%
                        <TrendingUp className="h-5 w-5 ml-2" />
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Quick Actions</CardTitle>
                <CardDescription className="text-slate-300">
                  Perform common DeFi operations with one click
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link href="/swap">
                    <Card className="cursor-pointer hover:bg-slate-700/30 transition-colors border border-slate-600/50 bg-slate-700/20">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <ArrowUpDown className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Token Swap</h3>
                        <p className="text-slate-400">Convert tokens with gasless transactions</p>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mt-3">
                          <Fuel className="h-3 w-3 mr-1" />
                          Gasless Available
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card className="cursor-pointer hover:bg-slate-700/30 transition-colors border border-slate-600/50 bg-slate-700/20">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Yield Farming</h3>
                      <p className="text-slate-400">Earn rewards by providing liquidity</p>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mt-3">
                        Coming Soon
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:bg-slate-700/30 transition-colors border border-slate-600/50 bg-slate-700/20">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Staking</h3>
                      <p className="text-slate-400">Stake tokens to earn passive income</p>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mt-3">
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
            <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center gap-3">
                  <PieChart className="h-6 w-6" />
                  Token Holdings
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Your current token balances across all networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mx-auto mb-4" />
                    <p className="text-slate-400">Loading token balances...</p>
                  </div>
                ) : balances.length === 0 ? (
                  <div className="p-8 text-center">
                    <Wallet className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No tokens found</p>
                    <p className="text-slate-500 text-sm mt-2">Add some tokens to your wallet to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {balances.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-6 bg-slate-700/30 rounded-xl border border-slate-600/30">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getNetworkColor(token.chainId)} rounded-xl flex items-center justify-center text-lg`}>
                            {getNetworkIcon(token.chainId)}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-lg">{token.symbol}</p>
                            <p className="text-slate-400">{token.chainName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white text-lg">
                            {formatBalance(token.formattedBalance)}
                          </p>
                          <p className="text-emerald-400">
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
            <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center gap-3">
                  <Activity className="h-6 w-6" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Your latest transactions and DeFi interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No recent activity</p>
                  <p className="text-slate-500 text-sm mt-2">Your transactions will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DeFi Tab */}
          <TabsContent value="defi" className="space-y-8">
            <Card className="border border-slate-700/50 shadow-xl bg-slate-800/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center gap-3">
                  <Shield className="h-6 w-6" />
                  DeFi Positions
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Your staking, farming, and lending positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No DeFi positions</p>
                  <p className="text-slate-500 text-sm mt-2">Start earning by staking or providing liquidity</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}