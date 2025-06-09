import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, Zap, DollarSign, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

interface ZxSwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  gasEstimate: string;
  minimumReceived: string;
  transactionData: any;
}

interface SwapState {
  status: 'idle' | 'getting-quote' | 'ready' | 'swapping' | 'completed' | 'failed';
  hash?: string;
  error?: string;
}

export function ZxProtocolSwap() {
  const { address, isConnected, chainId } = useAccount();
  const { balances, isLoading: balancesLoading } = useComprehensiveWalletBalances();
  const { toast } = useToast();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<ZxSwapQuote | null>(null);
  const [swapState, setSwapState] = useState<SwapState>({ status: 'idle' });
  const [progress, setProgress] = useState(0);

  // Filter tokens with positive balances
  const availableTokens = balances.filter(token => 
    parseFloat(token.formattedBalance) > 0.000001
  );

  // USDC contract addresses for each chain
  const getUSDCAddress = (chainId: number): string => {
    const usdcAddresses: Record<number, string> = {
      1: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',      // Ethereum
      137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base
      10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',     // Optimism
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'   // Avalanche
    };
    return usdcAddresses[chainId] || '';
  };

  const getSwapQuote = async () => {
    if (!selectedToken || !swapAmount || !address || !chainId) return;

    setSwapState({ status: 'getting-quote' });
    setProgress(20);
    
    try {
      const amountInWei = parseUnits(swapAmount, selectedToken.decimals).toString();
      const sellToken = selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address;
      const buyToken = getUSDCAddress(chainId);

      if (!buyToken) {
        throw new Error(`USDC not supported on this network`);
      }

      setProgress(50);

      // Get quote from 0x Protocol
      const response = await fetch(`/api/0x/${chainId}/quote?${new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount: amountInWei,
        takerAddress: address,
        slippagePercentage: '0.01'
      })}`);

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.code === 'INSUFFICIENT_API_ACCESS') {
          // Handle API access restriction with clear user guidance
          setSwapState({ status: 'failed', error: 'API key requires upgrade for swap access' });
          toast({
            title: "API Access Required",
            description: "Your 0x Protocol API key needs to be upgraded to access swap endpoints. Visit 0x.org/pricing to upgrade.",
            variant: "destructive"
          });
          return;
        }
        
        throw new Error(errorData.message || 'Failed to get quote from 0x Protocol');
      }

      const data = await response.json();
      
      if (!data.buyAmount) {
        throw new Error('Invalid quote response from 0x Protocol');
      }

      const buyAmountFormatted = formatUnits(BigInt(data.buyAmount), 6);
      const rate = parseFloat(buyAmountFormatted) / parseFloat(swapAmount);

      setQuote({
        fromAmount: swapAmount,
        toAmount: buyAmountFormatted,
        rate,
        gasEstimate: data.estimatedGas || '200000',
        minimumReceived: (parseFloat(buyAmountFormatted) * 0.99).toFixed(6),
        transactionData: data
      });

      setProgress(100);
      setSwapState({ status: 'ready' });

      toast({
        title: "Quote Ready",
        description: `Swap ${swapAmount} ${selectedToken.symbol} → ${buyAmountFormatted} USDC`,
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

  const executeSwap = async () => {
    if (!selectedToken || !quote || !swapAmount || !address || !chainId) return;

    setSwapState({ status: 'swapping' });

    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;

        // Execute 0x swap transaction
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            to: quote.transactionData.to,
            data: quote.transactionData.data,
            value: quote.transactionData.value || '0x0',
            gas: quote.transactionData.gas,
            gasPrice: quote.transactionData.gasPrice
          }]
        });

        setSwapState({ status: 'completed', hash: txHash });
        
        toast({
          title: "Swap Completed!",
          description: `Successfully swapped ${swapAmount} ${selectedToken.symbol} to USDC`,
        });

        // Reset form after completion
        setTimeout(() => {
          setSwapAmount('');
          setQuote(null);
          setSelectedToken(null);
          setSwapState({ status: 'idle' });
        }, 3000);

      } else {
        throw new Error('No wallet provider found');
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

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Zap className="h-5 w-5 text-blue-500" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to start swapping tokens to USDC
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Swap to USDC
          </CardTitle>
          <CardDescription>
            Convert tokens to USDC using 0x Protocol
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">From Token</label>
            <Select 
              value={selectedToken?.address || ''} 
              onValueChange={(value) => {
                const token = availableTokens.find(t => t.address === value);
                setSelectedToken(token);
                setQuote(null);
                setSwapState({ status: 'idle' });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select token to swap" />
              </SelectTrigger>
              <SelectContent>
                {availableTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {parseFloat(token.formattedBalance).toFixed(4)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
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
                className="pr-16"
              />
              {selectedToken && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 px-2"
                  onClick={() => setSwapAmount(selectedToken.formattedBalance)}
                >
                  MAX
                </Button>
              )}
            </div>
            {selectedToken && (
              <p className="text-xs text-muted-foreground">
                Available: {parseFloat(selectedToken.formattedBalance).toFixed(4)} {selectedToken.symbol}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {swapState.status === 'getting-quote' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Getting 0x Protocol quote...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Quote Display */}
          {quote && swapState.status === 'ready' && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You'll receive</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  0x Protocol
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold">{quote.toAmount} USDC</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Rate</span>
                  <p className="font-medium">1 {selectedToken?.symbol} = {quote.rate.toFixed(4)} USDC</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Received</span>
                  <p className="font-medium">{quote.minimumReceived} USDC</p>
                </div>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button 
            onClick={executeSwap}
            disabled={swapState.status !== 'ready' || !quote}
            className="w-full"
            size="lg"
          >
            {swapState.status === 'idle' && (
              <>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Enter Amount
              </>
            )}
            {swapState.status === 'getting-quote' && (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            )}
            {swapState.status === 'ready' && (
              <>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Swap to USDC
              </>
            )}
            {swapState.status === 'swapping' && (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirm in Wallet
              </>
            )}
            {swapState.status === 'completed' && (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed!
              </>
            )}
            {swapState.status === 'failed' && (
              <>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>

          {/* Status Messages */}
          {swapState.status === 'completed' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Swap completed successfully!</span>
              </div>
              {swapState.hash && (
                <p className="mt-1 text-xs opacity-75">
                  Transaction: {swapState.hash.slice(0, 10)}...
                </p>
              )}
            </div>
          )}

          {swapState.status === 'failed' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Swap failed</span>
              </div>
              {swapState.error && (
                <p className="mt-1 text-xs opacity-75">{swapState.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Info */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {chainId === 1 && 'Ethereum Network'}
              {chainId === 137 && 'Polygon Network'}
              {chainId === 42161 && 'Arbitrum Network'}
              {chainId === 8453 && 'Base Network'}
              {chainId === 10 && 'Optimism Network'}
            </p>
            <p className="text-xs text-muted-foreground">
              Direct 0x Protocol integration
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Live Swaps</p>
            <p className="text-xs text-muted-foreground">
              0x Protocol API
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}