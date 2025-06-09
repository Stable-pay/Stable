import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, Zap, DollarSign, Loader2, CheckCircle, AlertTriangle, Fuel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
// Using direct API calls instead of problematic SDK
// import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';

interface FusionQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  gasless: boolean;
  minimumReceived: string;
  order?: any;
}

interface SwapState {
  status: 'idle' | 'getting-quote' | 'ready' | 'swapping' | 'completed' | 'failed';
  hash?: string;
  error?: string;
}

export function FusionSDKSwap() {
  const { address, isConnected, chainId } = useAccount();
  const { balances, isLoading: balancesLoading } = useComprehensiveWalletBalances();
  const { toast } = useToast();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<FusionQuote | null>(null);
  const [swapState, setSwapState] = useState<SwapState>({ status: 'idle' });
  const [progress, setProgress] = useState(0);
  // Network mapping for 1inch API
  const getNetworkId = (chainId: number): number => {
    const networkMap: Record<number, number> = {
      1: 1,      // Ethereum
      137: 137,  // Polygon
      42161: 42161, // Arbitrum
      8453: 8453,   // Base
      10: 10,       // Optimism
      43114: 43114  // Avalanche
    };
    return networkMap[chainId] || 1;
  };

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
      const fromTokenAddress = selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address;
      const toTokenAddress = getUSDCAddress(chainId);

      if (!toTokenAddress) {
        throw new Error(`USDC not supported on this network`);
      }

      setProgress(50);

      // Get quote using backend proxy for 1inch API
      const networkId = getNetworkId(chainId);
      const quoteParams = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amountInWei
      });

      console.log('Getting 1inch quote via backend proxy:', quoteParams.toString());
      
      const response = await fetch(`/api/1inch/${networkId}/quote?${quoteParams}`);

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }

      const oneInchQuote = await response.json();
      
      if (!oneInchQuote || !oneInchQuote.dstAmount) {
        throw new Error('Invalid quote response from 1inch');
      }

      const toAmountFormatted = formatUnits(BigInt(oneInchQuote.dstAmount), 6);
      const rate = parseFloat(toAmountFormatted) / parseFloat(swapAmount);

      setQuote({
        fromAmount: swapAmount,
        toAmount: toAmountFormatted,
        rate,
        gasless: false,
        minimumReceived: (parseFloat(toAmountFormatted) * 0.99).toFixed(6),
        order: oneInchQuote
      });

      setProgress(100);
      setSwapState({ status: 'ready' });

      toast({
        title: "1inch Quote Ready",
        description: `Swap ${swapAmount} ${selectedToken.symbol} → ${toAmountFormatted} USDC`,
      });

    } catch (error) {
      console.error('Fusion quote failed:', error);
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

        console.log('Executing 1inch Fusion swap...');
        
        // Get swap transaction data from 1inch API
        const networkId = getNetworkId(chainId);
        const fromTokenAddress = selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address;
        const toTokenAddress = getUSDCAddress(chainId);
        const amountInWei = parseUnits(swapAmount, selectedToken.decimals).toString();
        
        const swapParams = new URLSearchParams({
          src: fromTokenAddress,
          dst: toTokenAddress,
          amount: amountInWei,
          from: address,
          slippage: '1'
        });
        
        const response = await fetch(`/api/1inch/${networkId}/swap?${swapParams}`);

        if (response.ok) {
          const swapData = await response.json();
          
          // Execute the transaction using wallet
          const txHash = await ethereum.request({
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

          // Reset form after completion
          setTimeout(() => {
            setSwapAmount('');
            setQuote(null);
            setSelectedToken(null);
            setSwapState({ status: 'idle' });
          }, 3000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get swap transaction');
        }

      } else {
        throw new Error('No wallet provider found');
      }
    } catch (error) {
      console.error('Fusion swap failed:', error);
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
            <Fuel className="h-5 w-5 text-purple-500" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to start gasless swapping with 1inch Fusion
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Swap to USDC
          </CardTitle>
          <CardDescription>
            Convert tokens to USDC using 1inch Protocol - Best rates guaranteed
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
                <span className="text-sm">Getting Fusion gasless quote...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Quote Display */}
          {quote && swapState.status === 'ready' && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You'll receive</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    <Zap className="h-3 w-3 mr-1" />
                    Best Rate
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    1inch Protocol
                  </Badge>
                </div>
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
              
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">
                <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300">
                  <Zap className="h-3 w-3" />
                  <span className="font-medium">Best price aggregation - Powered by 1inch Protocol</span>
                </div>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button 
            onClick={executeSwap}
            disabled={swapState.status !== 'ready' || !quote}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                <Zap className="h-4 w-4 mr-2" />
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
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {chainId === 1 && 'Ethereum Network'}
              {chainId === 137 && 'Polygon Network'}
              {chainId === 42161 && 'Arbitrum Network'}
              {chainId === 8453 && 'Base Network'}
              {chainId === 10 && 'Optimism Network'}
              {chainId === 43114 && 'Avalanche Network'}
            </p>
            <p className="text-xs text-muted-foreground">
              Best rates aggregated from all DEXs
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Live Trading</p>
            <p className="text-xs text-muted-foreground">
              1inch Protocol
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}