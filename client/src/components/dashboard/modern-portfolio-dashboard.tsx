import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, TrendingUp, DollarSign, Wallet, RefreshCw, Eye, EyeOff, Copy, ExternalLink, Activity } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { formatUnits } from 'viem';
import { Link } from 'wouter';

interface WalletBalance {
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

interface ChainData {
  chainId: number;
  name: string;
  symbol: string;
  color: string;
  balances: WalletBalance[];
  totalUSD: number;
  rpcConnected: boolean;
}

export function ModernPortfolioDashboard() {
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();
  
  const [chainData, setChainData] = useState<ChainData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [hideBalances, setHideBalances] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const supportedChains: Omit<ChainData, 'balances' | 'totalUSD' | 'rpcConnected'>[] = [
    { chainId: 1, name: 'Ethereum', symbol: 'ETH', color: 'from-blue-400 to-blue-600' },
    { chainId: 137, name: 'Polygon', symbol: 'MATIC', color: 'from-purple-400 to-purple-600' },
    { chainId: 42161, name: 'Arbitrum', symbol: 'ETH', color: 'from-blue-500 to-cyan-500' },
    { chainId: 8453, name: 'Base', symbol: 'ETH', color: 'from-blue-600 to-indigo-600' },
    { chainId: 10, name: 'Optimism', symbol: 'ETH', color: 'from-red-400 to-red-600' },
    { chainId: 43114, name: 'Avalanche', symbol: 'AVAX', color: 'from-red-500 to-orange-500' },
    { chainId: 56, name: 'BSC', symbol: 'BNB', color: 'from-yellow-400 to-yellow-600' }
  ];

  const loadWalletBalances = async () => {
    if (!address || !isConnected) return;
    
    setLoading(true);
    setRefreshing(true);
    
    try {
      const chainResults: ChainData[] = [];
      let totalValue = 0;

      for (const chain of supportedChains) {
        try {
          const balances: WalletBalance[] = [];
          let chainTotal = 0;
          
          // Get native token balance if on current chain or use RPC
          if (chainId === chain.chainId && typeof window !== 'undefined' && (window as any).ethereum) {
            try {
              const balance = await (window as any).ethereum.request({
                method: 'eth_getBalance',
                params: [address, 'latest']
              });
              
              const balanceInEther = formatUnits(BigInt(balance), 18);
              const formattedBalance = parseFloat(balanceInEther);
              
              if (formattedBalance > 0.0001) {
                balances.push({
                  symbol: chain.symbol,
                  address: 'native',
                  balance: balance,
                  decimals: 18,
                  chainId: chain.chainId,
                  chainName: chain.name,
                  formattedBalance: formattedBalance.toFixed(6),
                  isNative: true,
                  usdValue: formattedBalance * 2500 // Mock USD value
                });
                
                chainTotal += formattedBalance * 2500;
              }
            } catch (error) {
              console.error(`Failed to get ${chain.name} balance:`, error);
            }
          }

          chainResults.push({
            ...chain,
            balances,
            totalUSD: chainTotal,
            rpcConnected: chainId === chain.chainId
          });
          
          totalValue += chainTotal;
        } catch (error) {
          console.error(`Failed to load ${chain.name} data:`, error);
          chainResults.push({
            ...chain,
            balances: [],
            totalUSD: 0,
            rpcConnected: false
          });
        }
      }

      setChainData(chainResults);
      setTotalPortfolioValue(totalValue);
      
    } catch (error) {
      console.error('Failed to load wallet balances:', error);
      toast({
        title: "Failed to Load Balances",
        description: "Unable to fetch wallet balances. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    if (hideBalances) return '***';
    if (value < 0.01) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatBalance = (balance: string) => {
    if (hideBalances) return '***';
    return balance;
  };

  useEffect(() => {
    if (isConnected && address) {
      loadWalletBalances();
    }
  }, [isConnected, address, chainId]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Connect Wallet
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Connect your wallet to view your portfolio across all chains
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Portfolio Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your crypto assets across all supported networks
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHideBalances(!hideBalances)}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadWalletBalances}
                disabled={refreshing}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Wallet Info */}
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connected Wallet</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => address && copyAddress(address)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Portfolio Value</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {formatValue(totalPortfolioValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <Activity className="h-5 w-5 animate-pulse" />
              <span className="font-medium">Loading portfolio data across all chains...</span>
            </div>
            <Progress value={60} className="h-3 bg-blue-100 dark:bg-blue-900/30" />
          </div>
        )}

        {/* Chain Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {chainData.map((chain) => (
            <Card 
              key={chain.chainId} 
              className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${chain.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-sm">
                        {chain.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{chain.name}</CardTitle>
                      <p className="text-xs text-gray-500">
                        {chain.balances.length} {chain.balances.length === 1 ? 'asset' : 'assets'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${chain.rpcConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    {chainId === chain.chainId && (
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatValue(chain.totalUSD)}
                    </p>
                    <p className="text-xs text-gray-500">Total Value</p>
                  </div>

                  {chain.balances.length > 0 ? (
                    <div className="space-y-3">
                      {chain.balances.map((balance, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {balance.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{balance.symbol}</p>
                              <p className="text-xs text-gray-500">
                                {balance.isNative ? 'Native' : 'Token'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {formatBalance(balance.formattedBalance)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {balance.usdValue ? formatValue(balance.usdValue) : '--'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No assets found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-blue-600" />
                Quick Swap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Convert your tokens to USDC with the best rates
              </p>
              <Link href="/swap">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Start Swapping
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Fiat Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Withdraw your USDC to your bank account
              </p>
              <Link href="/withdraw">
                <Button variant="outline" className="w-full hover:bg-green-50 dark:hover:bg-green-900/20">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}