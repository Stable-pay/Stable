import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, Zap, DollarSign, Fuel, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';
import { useAccount } from 'wagmi';
import { zxApiService, type ZxQuoteResponse, type ZxGaslessQuote, type ZxGaslessPrice } from '@/lib/zx-api';
import { formatUnits, parseUnits } from 'viem';

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  gasEstimate: string;
  minimumReceived: string;
  isGasless: boolean;
}

export function ZxTokenSwap() {
  const { address, isConnected, chainId } = useAccount();
  const { balances, isLoading: balancesLoading } = useComprehensiveWalletBalances();
  const { toast } = useToast();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [useGasless, setUseGasless] = useState(false);
  const [gaslessQuote, setGaslessQuote] = useState<ZxGaslessQuote | null>(null);
  const [regularQuote, setRegularQuote] = useState<ZxQuoteResponse | null>(null);
  const [swapStatus, setSwapStatus] = useState<'idle' | 'pending' | 'confirmed' | 'failed'>('idle');

  // Filter tokens with positive balances
  const availableTokens = balances.filter(token => 
    parseFloat(token.formattedBalance) > 0.000001
  );

  // Get USDC address for current chain
  const getUSDCAddress = (chainId: number): string => {
    const usdcAddresses: Record<number, string> = {
      1: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',
      137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
    };
    return usdcAddresses[chainId] || '';
  };

  const getSwapQuote = async () => {
    if (!selectedToken || !swapAmount || !address || !chainId) return;

    setIsGettingQuote(true);
    try {
      const amountInWei = parseUnits(swapAmount, selectedToken.decimals).toString();
      const sellToken = selectedToken.isNative ? 'native' : selectedToken.address;
      const buyToken = getUSDCAddress(chainId);

      if (useGasless && zxApiService.isGaslessSupported(chainId)) {
        // Check gasless availability first
        try {
          const gaslessResponse = await zxApiService.getGaslessQuote({
            sellToken,
            buyToken,
            sellAmount: amountInWei,
            takerAddress: address,
            chainId
          });

          setGaslessQuote(gaslessResponse);

          const buyAmountFormatted = formatUnits(BigInt(gaslessResponse.buyAmount), 6);
          const rate = parseFloat(buyAmountFormatted) / parseFloat(swapAmount);

          setQuote({
            fromAmount: swapAmount,
            toAmount: buyAmountFormatted,
            rate,
            gasEstimate: '0',
            minimumReceived: (parseFloat(buyAmountFormatted) * 0.99).toFixed(6),
            isGasless: true
          });

          toast({
            title: "Gasless Quote Retrieved",
            description: `Ready to swap ${swapAmount} ${selectedToken.symbol} to USDC without gas fees`,
          });
        } catch (gaslessError) {
          console.log('Gasless not available, falling back to regular swap');
          setUseGasless(false);
          // Fall through to regular quote
        }
      }
      
      if (!useGasless || !zxApiService.isGaslessSupported(chainId)) {
        // Get regular quote
        const response = await zxApiService.getQuote({
          sellToken,
          buyToken,
          sellAmount: amountInWei,
          takerAddress: address,
          chainId
        });

        setRegularQuote(response);

        const buyAmountFormatted = formatUnits(BigInt(response.buyAmount), 6);
        const rate = parseFloat(buyAmountFormatted) / parseFloat(swapAmount);

        setQuote({
          fromAmount: swapAmount,
          toAmount: buyAmountFormatted,
          rate,
          gasEstimate: response.estimatedGas,
          minimumReceived: (parseFloat(buyAmountFormatted) * 0.99).toFixed(6),
          isGasless: false
        });

        toast({
          title: "Quote Retrieved",
          description: `Ready to swap ${swapAmount} ${selectedToken.symbol} to USDC`,
        });
      }
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      toast({
        title: "Quote Error",
        description: "Failed to get swap quote. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsGettingQuote(false);
    }
  };

  const executeSwap = async () => {
    if (!selectedToken || !quote || !swapAmount || !address || !chainId) return;

    setIsSwapping(true);
    setSwapStatus('pending');
    
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;

        if (quote.isGasless && gaslessQuote) {
          // Execute 0x Gasless v2 swap
          
          // Handle approval if required
          if (gaslessQuote.approval.isRequired && gaslessQuote.approval.eip712) {
            const approvalSignature = await ethereum.request({
              method: 'eth_signTypedData_v4',
              params: [address, JSON.stringify(gaslessQuote.approval.eip712)]
            });
            console.log('Approval signature:', approvalSignature);
          }

          // Sign the trade
          const tradeSignature = await ethereum.request({
            method: 'eth_signTypedData_v4',
            params: [address, JSON.stringify(gaslessQuote.trade.eip712)]
          });

          // Submit the gasless swap
          const submitResponse = await zxApiService.submitGaslessSwap(
            chainId,
            tradeSignature,
            gaslessQuote.trade
          );

          toast({
            title: "Gasless Swap Submitted",
            description: `Swapping ${swapAmount} ${selectedToken.symbol} to USDC without gas fees`,
          });

          // Monitor status
          const tradeHash = submitResponse.tradeHash;
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes with 5-second intervals

          const checkStatus = async () => {
            try {
              const status = await zxApiService.getGaslessStatus(chainId, tradeHash);
              
              if (status.status === 'confirmed') {
                setSwapStatus('confirmed');
                toast({
                  title: "Gasless Swap Confirmed",
                  description: "Your swap has been completed successfully!",
                });
                return true;
              } else if (status.status === 'failed') {
                setSwapStatus('failed');
                toast({
                  title: "Gasless Swap Failed",
                  description: "Your swap could not be completed.",
                  variant: "destructive"
                });
                return true;
              }
              
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(checkStatus, 5000);
              } else {
                setSwapStatus('failed');
                toast({
                  title: "Swap Status Unknown",
                  description: "Unable to confirm swap status. Check your wallet.",
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error('Status check failed:', error);
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(checkStatus, 5000);
              }
            }
          };

          setTimeout(checkStatus, 5000);

        } else if (regularQuote) {
          // Execute regular 0x swap
          const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              to: regularQuote.to,
              data: regularQuote.data,
              value: regularQuote.value,
              gas: regularQuote.gas,
              gasPrice: regularQuote.gasPrice
            }]
          });

          setSwapStatus('confirmed');
          toast({
            title: "Swap Initiated",
            description: `Transaction submitted: ${txHash}`,
          });

          console.log('Swap transaction hash:', txHash);
        }

        // Reset form after successful submission
        setSwapAmount('');
        setQuote(null);
        setGaslessQuote(null);
        setRegularQuote(null);
        setSelectedToken(null);

      } else {
        throw new Error('No wallet provider found');
      }
    } catch (error) {
      console.error('Swap failed:', error);
      setSwapStatus('failed');
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Transaction failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Auto-quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedToken && swapAmount && parseFloat(swapAmount) > 0) {
        getSwapQuote();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedToken, swapAmount, useGasless]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            0x Token Swap
          </CardTitle>
          <CardDescription>Connect your wallet to start swapping</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Please connect your wallet to access the swap feature.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          0x Token Swap
        </CardTitle>
        <CardDescription>
          Swap any token to USDC with {useGasless ? 'gasless' : 'regular'} transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gasless Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Gasless Swap</span>
          </div>
          <Button
            variant={useGasless ? "default" : "outline"}
            size="sm"
            onClick={() => setUseGasless(!useGasless)}
          >
            {useGasless ? "Enabled" : "Disabled"}
          </Button>
        </div>

        {/* Token Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">From Token</label>
          <Select onValueChange={(value) => {
            const token = availableTokens.find(t => `${t.symbol}-${t.address}` === value);
            setSelectedToken(token);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select token to swap" />
            </SelectTrigger>
            <SelectContent>
              {balancesLoading ? (
                <SelectItem value="loading" disabled>Loading tokens...</SelectItem>
              ) : availableTokens.length === 0 ? (
                <SelectItem value="empty" disabled>No tokens with balance found</SelectItem>
              ) : (
                availableTokens.map((token) => (
                  <SelectItem 
                    key={`${token.symbol}-${token.address}`} 
                    value={`${token.symbol}-${token.address}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{token.symbol}</span>
                      <Badge variant="secondary" className="ml-2">
                        {token.formattedBalance}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        {selectedToken && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                className="pr-20"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8"
                onClick={() => setSwapAmount(selectedToken.formattedBalance)}
              >
                MAX
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {selectedToken.formattedBalance} {selectedToken.symbol} on {selectedToken.chainName}
            </p>
          </div>
        )}

        <Separator />

        {/* To Token (Always USDC) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">To Token</label>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">USDC</span>
            </div>
            <Badge variant="outline">Stablecoin</Badge>
          </div>
        </div>

        {/* Quote Display */}
        {quote && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You'll receive:</span>
                <span className="font-medium">{quote.toAmount} USDC</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Exchange rate:</span>
                <span className="text-sm">1 {selectedToken?.symbol} = {quote.rate.toFixed(4)} USDC</span>
              </div>

              {useGasless ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gas fee:</span>
                  <Badge variant="secondary" className="text-green-600">
                    <Zap className="w-3 h-3 mr-1" />
                    Gasless
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated gas:</span>
                  <span className="text-sm">{quote.gasEstimate}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Minimum received:</span>
                <span className="text-sm">{quote.minimumReceived} USDC</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Swap Button */}
        <Button
          className="w-full"
          onClick={quote ? executeSwap : getSwapQuote}
          disabled={!selectedToken || !swapAmount || isGettingQuote || isSwapping}
        >
          {isSwapping ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              {useGasless ? 'Processing Gasless Swap...' : 'Processing Swap...'}
            </>
          ) : isGettingQuote ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Getting Quote...
            </>
          ) : quote ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {useGasless ? 'Execute Gasless Swap' : 'Execute Swap'}
            </>
          ) : (
            'Get Quote'
          )}
        </Button>

        {/* Powered by 0x */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Powered by</span>
          <Badge variant="outline" className="text-xs">0x Protocol</Badge>
        </div>
      </CardContent>
    </Card>
  );
}