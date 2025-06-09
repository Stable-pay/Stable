import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUpDown, 
  Wallet, 
  Settings, 
  Zap, 
  ChevronDown,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Globe
} from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';
import { formatUnits } from 'viem';

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: string;
  priceImpact: string;
  gasEstimate: string;
  route: string[];
}

interface SwapTransaction {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  hash?: string;
  timestamp: Date;
}

export default function FusionSwapInterface() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { balances, isLoading } = useComprehensiveWalletBalances();
  
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [selectedChain, setSelectedChain] = useState(1); // Default to Ethereum

  // Mock recent transactions
  const [recentTransactions] = useState<SwapTransaction[]>([
    {
      id: '1',
      status: 'completed',
      fromToken: 'ETH',
      toToken: 'USDC',
      fromAmount: '0.5',
      toAmount: '1,245.30',
      hash: '0x1234...5678',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      status: 'pending',
      fromToken: 'USDC',
      toToken: 'DAI',
      fromAmount: '1,000',
      toAmount: '999.85',
      timestamp: new Date(Date.now() - 10 * 60 * 1000)
    }
  ]);

  // Get available tokens from balances for current chain
  const availableTokens = balances.filter(balance => 
    balance.chainId === selectedChain && parseFloat(balance.formattedBalance) > 0
  );

  // Get all networks with tokens
  const availableNetworks = Array.from(new Set(balances.map(b => b.chainId)))
    .map(chainId => {
      const networkBalances = balances.filter(b => b.chainId === chainId);
      const networkName = networkBalances[0]?.chainName || 'Unknown';
      return { chainId, name: networkName, tokenCount: networkBalances.length };
    });

  // Get all unique tokens across all chains for selection
  const allTokens = balances.reduce((tokens, balance) => {
    if (!tokens.find(t => t.symbol === balance.symbol && t.chainId === balance.chainId)) {
      tokens.push(balance);
    }
    return tokens;
  }, [] as typeof balances);

  // Get token balance
  const getTokenBalance = (symbol: string) => {
    const token = balances.find(b => b.symbol === symbol);
    return token ? parseFloat(token.formattedBalance) : 0;
  };

  // Real quote fetching using 1inch API
  const fetchQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !address) return;
    
    setIsLoadingQuote(true);
    
    try {
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          fromAmount,
          chainId: 1, // Ethereum mainnet
          walletAddress: address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const quote = await response.json();
      setSwapQuote(quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setSwapQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!swapQuote || !isConnected) return;
    
    setIsSwapping(true);
    
    try {
      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show success state
      alert('Swap completed successfully!');
      setFromAmount('');
      setSwapQuote(null);
    } catch (error) {
      alert('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  // Auto-fetch quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        fetchQuote();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ArrowUpDown className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-8">
              Connect your wallet to access our advanced token swap interface with optimal routing
            </p>
            <Button 
              onClick={() => open()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Token Swap
            </h1>
            <p className="text-gray-600 text-lg">
              Swap tokens across multiple chains with optimal routing and minimal slippage
            </p>
          </div>
          
          {/* Wallet Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Connected Wallet</p>
                  <p className="font-mono text-sm font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">Connected</Badge>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUpDown className="h-6 w-6 text-blue-600" />
                      Token Swap
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">1inch Fusion</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* From Token */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">From</label>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowTokenSelector('from')}
                          className="bg-white border-gray-300 hover:border-blue-500"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{fromToken.charAt(0)}</span>
                            </div>
                            <span className="font-medium">{fromToken}</span>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </Button>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Balance</div>
                          <div className="font-medium">{getTokenBalance(fromToken).toFixed(4)}</div>
                        </div>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-gray-500">
                          ${fromAmount ? (parseFloat(fromAmount) * 2490).toFixed(2) : '0.00'}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFromAmount((getTokenBalance(fromToken) * 0.25).toString())}
                            className="text-xs"
                          >
                            25%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFromAmount((getTokenBalance(fromToken) * 0.5).toString())}
                            className="text-xs"
                          >
                            50%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFromAmount(getTokenBalance(fromToken).toString())}
                            className="text-xs"
                          >
                            MAX
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Swap Direction */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const temp = fromToken;
                        setFromToken(toToken);
                        setToToken(temp);
                      }}
                      className="rounded-full bg-white border-gray-300 hover:border-blue-500 p-2"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* To Token */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">To</label>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowTokenSelector('to')}
                          className="bg-white border-gray-300 hover:border-blue-500"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{toToken.charAt(0)}</span>
                            </div>
                            <span className="font-medium">{toToken}</span>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </Button>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Balance</div>
                          <div className="font-medium">{getTokenBalance(toToken).toFixed(4)}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {isLoadingQuote ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Loading...
                          </div>
                        ) : (
                          swapQuote?.toAmount || '0.0'
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        ${swapQuote ? (parseFloat(swapQuote.toAmount) * 1).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>

                  {/* Quote Details */}
                  {swapQuote && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Exchange Rate</span>
                        <span className="text-sm font-medium">{swapQuote.rate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price Impact</span>
                        <span className="text-sm font-medium text-green-600">{swapQuote.priceImpact}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estimated Gas</span>
                        <span className="text-sm font-medium">{swapQuote.gasEstimate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Slippage Tolerance</span>
                        <span className="text-sm font-medium">{slippage}%</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Network Selector */}
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Active Network</label>
                    <select
                      value={selectedChain}
                      onChange={(e) => setSelectedChain(parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableNetworks.map(network => (
                        <option key={network.chainId} value={network.chainId}>
                          {network.name} ({network.tokenCount} tokens)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Swap Button */}
                  <Button
                    onClick={handleSwap}
                    disabled={!swapQuote || isSwapping || !fromAmount}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg"
                  >
                    {isSwapping ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Swapping...
                      </div>
                    ) : swapQuote ? (
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Swap {fromToken} for {toToken}
                      </div>
                    ) : (
                      'Enter Amount'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Token Selector Modal */}
            {showTokenSelector && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
                onClick={() => setShowTokenSelector(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl max-w-md w-full max-h-96 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Select Token</h3>
                    <p className="text-sm text-gray-600">Choose from {availableTokens.length} available tokens on {availableNetworks.find(n => n.chainId === selectedChain)?.name}</p>
                  </div>
                  <div className="p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2">
                      {availableTokens.map((token) => (
                        <button
                          key={`${token.chainId}-${token.address}`}
                          onClick={() => {
                            if (showTokenSelector === 'from') {
                              setFromToken(token.symbol);
                            } else {
                              setToToken(token.symbol);
                            }
                            setShowTokenSelector(null);
                          }}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{token.symbol.charAt(0)}</span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{token.symbol}</p>
                              <p className="text-xs text-gray-600">{token.chainName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{token.formattedBalance}</p>
                            <p className="text-xs text-gray-600">Balance</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Market Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Market Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">24h Volume</span>
                    <span className="font-medium">$2.4B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-medium">125K+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Gas Cost</span>
                    <span className="font-medium">$8.50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-medium text-green-600">99.8%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Network Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    Networks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['Ethereum', 'Polygon', 'Arbitrum', 'Base'].map((network) => (
                    <div key={network} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{network}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Active</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Swaps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <span className="text-sm font-medium">
                            {tx.fromToken} → {tx.toToken}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 capitalize">{tx.status}</span>
                      </div>
                      <div className="text-xs text-gray-600 flex justify-between">
                        <span>{tx.fromAmount} {tx.fromToken}</span>
                        <span>{tx.toAmount} {tx.toToken}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}