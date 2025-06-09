import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, Zap, DollarSign, Loader2, CheckCircle, AlertTriangle, RefreshCw, Wallet, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  formattedBalance: string;
  isNative: boolean;
}

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  minimumReceived: string;
  data?: any;
}

export function WorkingWalletSwap() {
  const { address, isConnected, chainId } = useAccount();
  const { data: nativeBalance } = useBalance({ address });
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [swapState, setSwapState] = useState<'idle' | 'getting-quote' | 'ready' | 'swapping' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);

  // USDC addresses for different chains
  const getUSDCAddress = (chainId: number): string => {
    const usdcAddresses: Record<number, string> = {
      1: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',
      137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
    };
    return usdcAddresses[chainId] || '';
  };

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

  // Load wallet balances from wagmi
  const loadBalances = async () => {
    if (!address || !chainId || !nativeBalance) return;
    
    setBalancesLoading(true);
    
    try {
      const balanceResults: TokenBalance[] = [];
      
      // Add native token balance from wagmi
      const formattedBalance = parseFloat(nativeBalance.formatted);
      
      if (formattedBalance > 0.000001) {
        balanceResults.push({
          symbol: nativeBalance.symbol,
          address: 'native',
          balance: nativeBalance.value.toString(),
          decimals: nativeBalance.decimals,
          chainId,
          chainName: getNetworkName(chainId),
          formattedBalance: formattedBalance.toFixed(6),
          isNative: true
        });
      }
      
      setBalances(balanceResults);
      console.log(`Loaded ${balanceResults.length} tokens for ${getNetworkName(chainId)}`);
      
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

  // Get swap quote
  const getSwapQuote = async () => {
    if (!selectedToken || !swapAmount || !address || !chainId) return;

    setSwapState('getting-quote');
    setProgress(20);
    
    try {
      const amountInWei = parseUnits(swapAmount, selectedToken.decimals).toString();
      const fromTokenAddress = selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address;
      const toTokenAddress = getUSDCAddress(chainId);

      if (!toTokenAddress) {
        throw new Error(`USDC not supported on ${getNetworkName(chainId)}`);
      }

      setProgress(50);

      const quoteParams = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amountInWei
      });

      const response = await fetch(`/api/1inch/${chainId}/quote?${quoteParams}`);
      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get quote: ${response.status}`);
      }

      const quoteData = await response.json();
      
      if (!quoteData || !quoteData.dstAmount) {
        throw new Error('Invalid quote response');
      }

      const toAmountFormatted = formatUnits(BigInt(quoteData.dstAmount), 6);
      const rate = parseFloat(toAmountFormatted) / parseFloat(swapAmount);

      setQuote({
        fromAmount: swapAmount,
        toAmount: toAmountFormatted,
        rate,
        minimumReceived: (parseFloat(toAmountFormatted) * 0.99).toFixed(6),
        data: quoteData
      });

      setProgress(100);
      setSwapState('ready');

      toast({
        title: "Quote Ready",
        description: `${swapAmount} ${selectedToken.symbol} → ${toAmountFormatted} USDC`,
      });

    } catch (error) {
      console.error('Quote failed:', error);
      setSwapState('failed');
      
      toast({
        title: "Quote Failed",
        description: error instanceof Error ? error.message : "Unable to get swap quote",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setProgress(0), 1000);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!selectedToken || !quote || !swapAmount || !address || !chainId) return;

    setSwapState('swapping');

    try {
      const amountInWei = parseUnits(swapAmount, selectedToken.decimals).toString();
      const fromTokenAddress = selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address;
      const toTokenAddress = getUSDCAddress(chainId);
      
      const swapParams = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amountInWei,
        from: address,
        slippage: '1'
      });
      
      const response = await fetch(`/api/1inch/${chainId}/swap?${swapParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get swap transaction');
      }

      const swapData = await response.json();
      
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            to: swapData.tx.to,
            data: swapData.tx.data,
            value: swapData.tx.value || '0x0',
            gas: swapData.tx.gas,
            gasPrice: swapData.tx.gasPrice
          }]
        });

        setSwapState('completed');
        
        toast({
          title: "Swap Completed!",
          description: `Successfully swapped ${swapAmount} ${selectedToken.symbol} to USDC`,
        });

        // Reset form and reload balances
        setTimeout(() => {
          setSwapAmount('');
          setQuote(null);
          setSelectedToken(null);
          setSwapState('idle');
          loadBalances();
        }, 3000);
      }
    } catch (error) {
      console.error('Swap failed:', error);
      setSwapState('failed');
      
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive"
      });
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard"
    });
  };

  // Auto-quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedToken && swapAmount && parseFloat(swapAmount) > 0 && swapState === 'idle') {
        getSwapQuote();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedToken, swapAmount]);

  // Load balances when wallet connects or native balance changes
  useEffect(() => {
    if (isConnected && address && chainId && nativeBalance) {
      loadBalances();
    }
  }, [isConnected, address, chainId, nativeBalance]);

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
            <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">
              Connect your wallet to start swapping tokens to USDC
            </p>
            <div className="space-y-3">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect {connector.name}
                </Button>
              ))}
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Token Swap
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Convert tokens to USDC using 1inch Protocol
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBalances}
              disabled={balancesLoading}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${balancesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnect()}
                        className="text-xs"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Network: {getNetworkName(chainId || 1)}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {balances.length} {balances.length === 1 ? 'Token' : 'Tokens'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <ArrowUpDown className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">Swap to USDC</span>
                </CardTitle>
                <CardDescription>
                  Convert your tokens to USDC with the best rates from 1inch Protocol
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Balance Loading State */}
                {balancesLoading && (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Loading wallet balances...</span>
                    </div>
                  </div>
                )}

                {/* Token Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">From Token</label>
                  <Select 
                    value={selectedToken?.address || ''} 
                    onValueChange={(value) => {
                      const token = balances.find(t => t.address === value);
                      setSelectedToken(token || null);
                      setQuote(null);
                      setSwapState('idle');
                    }}
                  >
                    <SelectTrigger className="h-14 text-left">
                      <SelectValue placeholder="Select token to swap" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {balancesLoading ? 'Loading...' : 'No tokens found'}
                        </div>
                      ) : (
                        balances.map((token) => (
                          <SelectItem key={token.address} value={token.address}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {token.symbol.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold">{token.symbol}</p>
                                  <p className="text-xs text-gray-500">{token.chainName}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{token.formattedBalance}</p>
                                <p className="text-xs text-gray-500">Available</p>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Amount</label>
                    {selectedToken && (
                      <button
                        onClick={() => setSwapAmount(selectedToken.formattedBalance)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        MAX: {selectedToken.formattedBalance} {selectedToken.symbol}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={swapAmount}
                      onChange={(e) => {
                        setSwapAmount(e.target.value);
                        setQuote(null);
                        setSwapState('idle');
                      }}
                      className="h-14 text-lg pr-20"
                    />
                    {selectedToken && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        {selectedToken.symbol}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {swapState === 'getting-quote' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Getting quote from 1inch...</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-blue-100 dark:bg-blue-900/30" />
                  </div>
                )}

                {/* Quote Display */}
                {quote && swapState === 'ready' && (
                  <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">You'll receive</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        1inch Protocol
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {quote.toAmount} USDC
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Rate: 1 {selectedToken?.symbol} = {quote.rate.toFixed(4)} USDC
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Minimum Received</p>
                      <p className="font-semibold">{quote.minimumReceived} USDC</p>
                    </div>
                  </div>
                )}

                {/* Swap Button */}
                <Button 
                  onClick={executeSwap}
                  disabled={swapState !== 'ready' || !quote}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
                  size="lg"
                >
                  {swapState === 'idle' && (
                    <>
                      <ArrowUpDown className="h-5 w-5 mr-2" />
                      Enter Amount
                    </>
                  )}
                  {swapState === 'getting-quote' && (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Getting Quote...
                    </>
                  )}
                  {swapState === 'ready' && (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Swap to USDC
                    </>
                  )}
                  {swapState === 'swapping' && (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Confirm in Wallet
                    </>
                  )}
                  {swapState === 'completed' && (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Completed!
                    </>
                  )}
                  {swapState === 'failed' && (
                    <>
                      <ArrowUpDown className="h-5 w-5 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>

                {/* Status Messages */}
                {swapState === 'completed' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Swap completed successfully!</span>
                    </div>
                  </div>
                )}

                {swapState === 'failed' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">Swap failed - Please try again</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Network Info */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Network Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-semibold">{getNetworkName(chainId || 1)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connected</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Best rates from 1inch Protocol
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Summary */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Your Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.length === 0 ? (
                    <p className="text-sm text-gray-500">No tokens found</p>
                  ) : (
                    balances.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {token.symbol.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-sm">{token.symbol}</span>
                        </div>
                        <span className="text-sm font-semibold">{token.formattedBalance}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}