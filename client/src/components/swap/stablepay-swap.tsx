import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, Loader2, CheckCircle, AlertTriangle, RefreshCw, Wallet, Fuel, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';
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
  gasless: boolean;
  networkFee: string;
  data?: any;
}

export function StablePaySwap() {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();
  const { data: nativeBalance } = useBalance({ address });
  const { toast } = useToast();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [swapState, setSwapState] = useState<'idle' | 'getting-quote' | 'ready' | 'swapping' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);

  const getUSDCAddress = (chainId: number): string => {
    const usdcAddresses: Record<number, string> = {
      1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
      137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC on Optimism
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
      56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' // USDC on BSC
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

  const loadBalances = async () => {
    if (!address || !chainId || !nativeBalance) return;
    
    setBalancesLoading(true);
    
    try {
      const balanceResults: TokenBalance[] = [];
      
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

  const getFusionQuote = async () => {
    if (!selectedToken || !swapAmount || !address || !chainId) return;

    setSwapState('getting-quote');
    setProgress(20);
    
    try {
      const amountInWei = parseUnits(swapAmount, selectedToken.decimals).toString();
      const fromTokenAddress = selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address;
      const toTokenAddress = getUSDCAddress(chainId);

      if (!toTokenAddress) {
        throw new Error(`Stablecoin not supported on ${getNetworkName(chainId)}`);
      }

      setProgress(50);

      let quoteData;
      let isGasless = false;
      
      try {
        const fusionParams = new URLSearchParams({
          src: fromTokenAddress,
          dst: toTokenAddress,
          amount: amountInWei,
          from: address,
          gasless: 'true'
        });

        const fusionResponse = await fetch(`/api/1inch/${chainId}/fusion/quote?${fusionParams}`);
        
        if (fusionResponse.ok) {
          quoteData = await fusionResponse.json();
          isGasless = true;
          setProgress(80);
        } else {
          throw new Error('Fusion API unavailable');
        }
      } catch (fusionError) {
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

        quoteData = await response.json();
        isGasless = false;
      }

      if (!quoteData || !quoteData.dstAmount) {
        throw new Error('Invalid quote response');
      }

      const toAmountFormatted = formatUnits(BigInt(quoteData.dstAmount), 6);
      const rate = parseFloat(toAmountFormatted) / parseFloat(swapAmount);
      const stablecoinSymbol = chainId === 1 ? 'USDT' : 'USDC';

      setQuote({
        fromAmount: swapAmount,
        toAmount: toAmountFormatted,
        rate,
        minimumReceived: (parseFloat(toAmountFormatted) * 0.99).toFixed(6),
        gasless: isGasless,
        networkFee: isGasless ? '0.00' : '~$3-5',
        data: quoteData
      });

      setProgress(100);
      setSwapState('ready');

      toast({
        title: isGasless ? "Gasless Quote Ready!" : "Quote Ready",
        description: `${swapAmount} ${selectedToken.symbol} → ${toAmountFormatted} ${stablecoinSymbol} ${isGasless ? '(No Gas Fees!)' : ''}`,
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

  const executeSwap = async () => {
    if (!selectedToken || !quote || !swapAmount || !address || !chainId) return;

    setSwapState('swapping');

    try {
      const amountInWei = parseUnits(swapAmount, selectedToken.decimals).toString();
      const fromTokenAddress = selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address;
      const toTokenAddress = getUSDCAddress(chainId);
      
      let swapData;
      
      if (quote.gasless) {
        const fusionParams = new URLSearchParams({
          src: fromTokenAddress,
          dst: toTokenAddress,
          amount: amountInWei,
          from: address,
          slippage: '1',
          gasless: 'true'
        });
        
        const response = await fetch(`/api/1inch/${chainId}/fusion/swap?${fusionParams}`);
        
        if (!response.ok) {
          throw new Error('Gasless swap failed');
        }
        
        swapData = await response.json();
        
        toast({
          title: "Gasless Swap Initiated",
          description: "Your swap is being processed without gas fees",
        });
        
      } else {
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

        swapData = await response.json();
        
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
        }
      }

      setSwapState('completed');
      
      const stablecoinSymbol = chainId === 1 ? 'USDT' : 'USDC';
      
      toast({
        title: "Swap Completed!",
        description: `Successfully swapped ${swapAmount} ${selectedToken.symbol} to ${stablecoinSymbol} ${quote.gasless ? 'with no gas fees!' : ''}`,
      });

      setTimeout(() => {
        setSwapAmount('');
        setQuote(null);
        setSelectedToken(null);
        setSwapState('idle');
        loadBalances();
      }, 3000);
      
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedToken && swapAmount && parseFloat(swapAmount) > 0 && swapState === 'idle') {
        getFusionQuote();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedToken, swapAmount]);

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
              Access multi-chain swaps with gasless transactions
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
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4" style={{ color: '#6667AB' }} />
                Gasless Swaps
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" style={{ color: '#6667AB' }} />
                Best Rates
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#6667AB' }}>
                Token Swap
              </h1>
              <p className="text-gray-600 text-lg">
                Trade tokens with gasless transactions across multiple chains
              </p>
            </div>
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

          {/* Wallet Info */}
          <Card className="shadow-lg bg-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#6667AB' }}
                  >
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Connected Wallet</p>
                    <p className="font-mono text-lg" style={{ color: '#6667AB' }}>
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">Network</p>
                  <p className="text-lg font-semibold" style={{ color: '#6667AB' }}>
                    {getNetworkName(chainId || 1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Swap Interface */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-xl bg-white border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#6667AB' }}
                  >
                    <ArrowUpDown className="h-5 w-5 text-white" />
                  </div>
                  <span>Swap to Stablecoin</span>
                  {quote?.gasless && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <Fuel className="h-3 w-3 mr-1" />
                      Gasless
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Convert tokens with the best rates using 1inch Protocol
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {balancesLoading && (
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3" style={{ color: '#6667AB' }}>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Loading wallet balances...</span>
                    </div>
                  </div>
                )}

                {/* Token Selection */}
                <div className="space-y-3">
                  <label className="text-lg font-semibold" style={{ color: '#6667AB' }}>From Token</label>
                  <Select 
                    value={selectedToken?.address || ''} 
                    onValueChange={(value) => {
                      const token = balances.find(t => t.address === value);
                      setSelectedToken(token || null);
                      setQuote(null);
                      setSwapState('idle');
                    }}
                  >
                    <SelectTrigger className="h-14 border-gray-200 hover:border-[#6667AB] focus:border-[#6667AB]">
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
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: '#6667AB' }}
                                >
                                  {token.symbol.charAt(0)}
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
                    <label className="text-lg font-semibold" style={{ color: '#6667AB' }}>Amount</label>
                    {selectedToken && (
                      <button
                        onClick={() => setSwapAmount(selectedToken.formattedBalance)}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: '#6667AB' }}
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
                      className="h-14 text-lg border-gray-200 focus:border-[#6667AB] pr-20"
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
                    <div className="flex items-center gap-3" style={{ color: '#6667AB' }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Getting best quote from 1inch...</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Quote Display */}
                {quote && swapState === 'ready' && (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium" style={{ color: '#6667AB' }}>You'll receive</span>
                      <div className="flex gap-2">
                        <Badge className="bg-white border-[#6667AB] text-[#6667AB]">
                          1inch Protocol
                        </Badge>
                        {quote.gasless && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <Fuel className="h-3 w-3 mr-1" />
                            No Gas Fees
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#6667AB' }}
                      >
                        <span className="text-white font-bold">$</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold" style={{ color: '#6667AB' }}>
                          {quote.toAmount} {chainId === 1 ? 'USDT' : 'USDC'}
                        </p>
                        <p className="text-gray-600">
                          Rate: 1 {selectedToken?.symbol} = {quote.rate.toFixed(4)} {chainId === 1 ? 'USDT' : 'USDC'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Minimum Received</p>
                        <p className="font-semibold" style={{ color: '#6667AB' }}>
                          {quote.minimumReceived} {chainId === 1 ? 'USDT' : 'USDC'}
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-sm text-gray-500 mb-1">Network Fee</p>
                        <p className="font-semibold" style={{ color: '#6667AB' }}>
                          {quote.networkFee}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Swap Button */}
                <Button 
                  onClick={executeSwap}
                  disabled={swapState !== 'ready' || !quote}
                  className="w-full h-14 text-lg font-semibold bg-[#6667AB] hover:bg-[#5a5b96] text-white shadow-lg"
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
                      <ArrowUpDown className="h-5 w-5 mr-2" />
                      {quote?.gasless ? 'Swap (Gasless)' : `Swap to ${chainId === 1 ? 'USDT' : 'USDC'}`}
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
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Swap completed successfully!</span>
                    </div>
                  </div>
                )}

                {swapState === 'failed' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3 text-red-700">
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
            {/* Network Status */}
            <Card className="shadow-lg bg-white border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg" style={{ color: '#6667AB' }}>Network Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-semibold" style={{ color: '#6667AB' }}>
                        {getNetworkName(chainId || 1)}
                      </p>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      Gasless swaps available
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Summary */}
            <Card className="shadow-lg bg-white border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg" style={{ color: '#6667AB' }}>Your Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.length === 0 ? (
                    <p className="text-gray-500">No tokens found</p>
                  ) : (
                    balances.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: '#6667AB' }}
                          >
                            {token.symbol.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{token.symbol}</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#6667AB' }}>
                          {token.formattedBalance}
                        </span>
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