import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, Zap, DollarSign, Loader2, CheckCircle, AlertTriangle, RefreshCw, Wallet, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
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
  usdValue?: number;
}

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  minimumReceived: string;
  priceImpact: number;
  gasEstimate: string;
  data?: any;
}

interface SwapState {
  status: 'idle' | 'loading-balances' | 'getting-quote' | 'ready' | 'swapping' | 'completed' | 'failed';
  hash?: string;
  error?: string;
}

export function ModernSwapInterface() {
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [swapState, setSwapState] = useState<SwapState>({ status: 'idle' });
  const [progress, setProgress] = useState(0);

  // USDC addresses for different chains
  const getUSDCAddress = (chainId: number): string => {
    const usdcAddresses: Record<number, string> = {
      1: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',      // Ethereum
      137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base
      10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',     // Optimism
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',  // Avalanche
      56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'      // BSC
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

  // Load wallet balances directly from connected wallet
  const loadBalances = async () => {
    if (!address || !chainId) return;
    
    setBalancesLoading(true);
    setSwapState({ status: 'loading-balances' });
    
    // Always use direct wallet balance loading
    await loadNativeBalance();
    setBalancesLoading(false);
  };

  // Load actual wallet balances using Web3 provider
  const loadNativeBalance = async () => {
    if (!address || !chainId || typeof window === 'undefined' || !(window as any).ethereum) {
      setBalances([]);
      setSwapState({ status: 'idle' });
      return;
    }
    
    try {
      console.log(`Loading balance for ${address} on chain ${chainId}`);
      
      const nativeSymbols: Record<number, string> = {
        1: 'ETH',
        137: 'MATIC', 
        42161: 'ETH',
        8453: 'ETH',
        10: 'ETH',
        43114: 'AVAX',
        56: 'BNB'
      };
      
      const nativeSymbol = nativeSymbols[chainId] || 'ETH';
      
      // Get native token balance
      const balance = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      console.log(`Raw balance: ${balance}`);
      
      const balanceInEther = formatUnits(BigInt(balance), 18);
      const formattedBalance = parseFloat(balanceInEther);
      
      console.log(`Formatted balance: ${formattedBalance} ${nativeSymbol}`);
      
      const balanceResults: TokenBalance[] = [];
      
      // Only include if balance is meaningful
      if (formattedBalance > 0.000001) {
        balanceResults.push({
          symbol: nativeSymbol,
          address: 'native',
          balance: balance,
          decimals: 18,
          chainId,
          chainName: getNetworkName(chainId),
          formattedBalance: formattedBalance.toFixed(6),
          isNative: true
        });
      }
      
      // Load common ERC20 tokens for this chain
      await loadERC20Balances(balanceResults);
      
      setBalances(balanceResults);
      setSwapState({ status: 'idle' });
      
      console.log(`Final balance count: ${balanceResults.length}`);
      
    } catch (error) {
      console.error('Failed to get wallet balances:', error);
      setBalances([]);
      setSwapState({ status: 'idle' });
      
      toast({
        title: "Balance Loading Failed",
        description: "Unable to fetch wallet balances. Please check your wallet connection.",
        variant: "destructive"
      });
    }
  };

  // Load ERC20 token balances for common tokens
  const loadERC20Balances = async (balanceResults: TokenBalance[]) => {
    if (!address || !chainId || typeof window === 'undefined' || !(window as any).ethereum) return;
    
    // Common tokens by chain
    const commonTokens: Record<number, Array<{symbol: string, address: string, decimals: number}>> = {
      1: [
        { symbol: 'USDC', address: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B', decimals: 6 },
        { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }
      ],
      137: [
        { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
        { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
        { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 }
      ],
      56: [
        { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
        { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
        { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 }
      ]
    };
    
    const tokens = commonTokens[chainId] || [];
    
    for (const token of tokens) {
      try {
        // ERC20 balanceOf call
        const data = `0x70a08231000000000000000000000000${address.slice(2)}`;
        
        const result = await (window as any).ethereum.request({
          method: 'eth_call',
          params: [{
            to: token.address,
            data: data
          }, 'latest']
        });
        
        if (result && result !== '0x') {
          const balance = BigInt(result);
          const formattedBalance = parseFloat(formatUnits(balance, token.decimals));
          
          if (formattedBalance > 0.000001) {
            balanceResults.push({
              symbol: token.symbol,
              address: token.address,
              balance: balance.toString(),
              decimals: token.decimals,
              chainId,
              chainName: getNetworkName(chainId),
              formattedBalance: formattedBalance.toFixed(6),
              isNative: false
            });
            
            console.log(`Found ${token.symbol} balance: ${formattedBalance}`);
          }
        }
      } catch (error) {
        console.error(`Failed to get ${token.symbol} balance:`, error);
      }
    }
  };

  // Get swap quote
  const getSwapQuote = async () => {
    if (!selectedToken || !swapAmount || !address || !chainId) return;

    setSwapState({ status: 'getting-quote' });
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
      const priceImpact = quoteData.priceImpact || 0;

      setQuote({
        fromAmount: swapAmount,
        toAmount: toAmountFormatted,
        rate,
        minimumReceived: (parseFloat(toAmountFormatted) * 0.99).toFixed(6),
        priceImpact,
        gasEstimate: '200000',
        data: quoteData
      });

      setProgress(100);
      setSwapState({ status: 'ready' });

      toast({
        title: "Quote Ready",
        description: `${swapAmount} ${selectedToken.symbol} → ${toAmountFormatted} USDC`,
      });

    } catch (error) {
      console.error('Quote failed:', error);
      setSwapState({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Failed to get quote' 
      });
      
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

    setSwapState({ status: 'swapping' });

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

        setSwapState({ status: 'completed', hash: txHash });
        
        toast({
          title: "Swap Completed!",
          description: `Successfully swapped ${swapAmount} ${selectedToken.symbol} to USDC`,
        });

        // Reset form and reload balances
        setTimeout(() => {
          setSwapAmount('');
          setQuote(null);
          setSelectedToken(null);
          setSwapState({ status: 'idle' });
          loadBalances();
        }, 3000);
      }
    } catch (error) {
      console.error('Swap failed:', error);
      setSwapState({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Swap failed' 
      });
      
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive"
      });
    }
  };

  // Auto-quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedToken && swapAmount && parseFloat(swapAmount) > 0 && swapState.status === 'idle') {
        getSwapQuote();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedToken, swapAmount]);

  // Load balances when wallet connects
  useEffect(() => {
    if (isConnected && address && chainId) {
      loadBalances();
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
              Connect your wallet to start swapping tokens to USDC with the best rates
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Token Swap
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Swap any token to USDC with 1inch Protocol - Best rates guaranteed
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Swap Interface */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <ArrowUpDown className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl">Swap to USDC</span>
                  </CardTitle>
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
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Balance Loading State */}
                {swapState.status === 'loading-balances' && (
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
                      setSwapState({ status: 'idle' });
                    }}
                  >
                    <SelectTrigger className="h-14 text-left">
                      <SelectValue placeholder="Select token to swap" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {balancesLoading ? 'Loading...' : 'No tokens with balance found'}
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
                        setSwapState({ status: 'idle' });
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
                {swapState.status === 'getting-quote' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Getting best quote from 1inch...</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-blue-100 dark:bg-blue-900/30" />
                  </div>
                )}

                {/* Quote Display */}
                {quote && swapState.status === 'ready' && (
                  <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">You'll receive</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Best Rate
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          1inch
                        </Badge>
                      </div>
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
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">Minimum Received</p>
                        <p className="font-semibold">{quote.minimumReceived} USDC</p>
                      </div>
                      <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">Price Impact</p>
                        <p className="font-semibold">{quote.priceImpact.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Swap Button */}
                <Button 
                  onClick={executeSwap}
                  disabled={swapState.status !== 'ready' || !quote}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
                  size="lg"
                >
                  {swapState.status === 'idle' && (
                    <>
                      <ArrowUpDown className="h-5 w-5 mr-2" />
                      Enter Amount
                    </>
                  )}
                  {swapState.status === 'getting-quote' && (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Getting Quote...
                    </>
                  )}
                  {swapState.status === 'ready' && (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Swap to USDC
                    </>
                  )}
                  {swapState.status === 'swapping' && (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Confirm in Wallet
                    </>
                  )}
                  {swapState.status === 'completed' && (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Completed!
                    </>
                  )}
                  {swapState.status === 'failed' && (
                    <>
                      <ArrowUpDown className="h-5 w-5 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>

                {/* Status Messages */}
                {swapState.status === 'completed' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">Swap completed successfully!</p>
                        {swapState.hash && (
                          <p className="text-sm opacity-75 mt-1">
                            Transaction: {swapState.hash.slice(0, 10)}...{swapState.hash.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {swapState.status === 'failed' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">Swap failed</p>
                        {swapState.error && (
                          <p className="text-sm opacity-75 mt-1">{swapState.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Network Info */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Network Info</CardTitle>
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
                      🔥 Best rates aggregated from all DEXs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Why Choose Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Best Rates</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        1inch aggregates prices from all DEXs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Instant USDC</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Convert any token to stable USDC
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Secure</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Non-custodial and fully decentralized
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}