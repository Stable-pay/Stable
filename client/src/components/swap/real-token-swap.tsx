import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRealSwappableTokens } from '@/hooks/use-real-wallet-data';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { swapService } from '@/lib/swap-service';
import { transactionMonitor } from '@/lib/transaction-monitor';
import { useToast } from '@/hooks/use-toast';
import { ArrowDown, Zap, DollarSign, Clock, AlertTriangle } from 'lucide-react';

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  gasEstimate: string;
  minimumReceived: string;
  priceImpact: number;
}

export function RealTokenSwap() {
  const { isConnected, address } = useWalletConnection();
  const { data: swappableTokens, isLoading: tokensLoading } = useRealSwappableTokens();
  const { toast } = useToast();
  
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);

  const networkColors = {
    'Ethereum': 'bg-blue-500',
    'Polygon': 'bg-purple-500',
    'Arbitrum': 'bg-cyan-500',
    'Base': 'bg-indigo-500'
  };

  const getSwapQuote = async () => {
    if (!selectedToken || !swapAmount || parseFloat(swapAmount) <= 0 || !address) return;

    setIsGettingQuote(true);
    try {
      const params = {
        userAddress: address,
        network: selectedToken.network.toLowerCase(),
        tokenAddress: selectedToken.address === 'NATIVE' ? 'native' : selectedToken.address,
        amount: swapAmount,
        slippage: 1
      };

      const result = await swapService.swapTokenToUSDC(params);
      
      setQuote({
        fromAmount: swapAmount,
        toAmount: result.expectedUSDC,
        rate: parseFloat(result.expectedUSDC) / parseFloat(swapAmount),
        gasEstimate: result.estimatedGas,
        minimumReceived: (parseFloat(result.expectedUSDC) * 0.99).toFixed(6),
        priceImpact: 0.1
      });
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      toast({
        title: "Quote Error",
        description: "Failed to get swap quote. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsGettingQuote(false);
    }
  };

  const executeSwap = async () => {
    if (!selectedToken || !quote || !swapAmount || !address) return;

    setIsSwapping(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        
        // Get transaction data from swap service
        const params = {
          userAddress: address,
          network: selectedToken.network.toLowerCase(),
          tokenAddress: selectedToken.address === 'NATIVE' ? 'native' : selectedToken.address,
          amount: swapAmount,
          slippage: 1
        };

        const swapData = await swapService.swapTokenToUSDC(params);
        
        // Execute transaction
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            to: swapData.transactionData.to,
            data: swapData.transactionData.data,
            value: swapData.transactionData.value || '0x0',
            gas: swapData.transactionData.gasLimit,
            from: address
          }]
        });

        // Monitor transaction
        await transactionMonitor.monitorTransaction(
          txHash,
          selectedToken.network.toLowerCase(),
          selectedToken.symbol,
          'USDC',
          swapAmount,
          quote.toAmount
        );

        toast({
          title: "Swap Initiated",
          description: `Swapping ${swapAmount} ${selectedToken.symbol} to USDC. Transaction: ${txHash.slice(0, 10)}...`,
        });

        // Reset form
        setSwapAmount('');
        setQuote(null);
        setSelectedToken(null);

      } else {
        throw new Error('No wallet provider found');
      }
    } catch (error: any) {
      console.error('Swap failed:', error);
      toast({
        title: "Swap Failed",
        description: error.message || "Transaction failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    if (selectedToken && swapAmount && parseFloat(swapAmount) > 0) {
      const debounceTimer = setTimeout(getSwapQuote, 1000);
      return () => clearTimeout(debounceTimer);
    } else {
      setQuote(null);
    }
  }, [selectedToken, swapAmount]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
          <p className="text-gray-600">Connect your wallet to access token swapping</p>
        </CardContent>
      </Card>
    );
  }

  if (tokensLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedTokens = swappableTokens?.reduce((acc: any, token) => {
    if (!acc[token.network]) acc[token.network] = [];
    acc[token.network].push(token);
    return acc;
  }, {}) || {};

  const hasTokens = swappableTokens && swappableTokens.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <span>Token to USDC Swap</span>
          <Badge className="bg-green-100 text-green-800">Live 1inch API</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasTokens ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No tokens found</p>
            <p className="text-sm">Make sure your wallet has tokens on supported networks</p>
          </div>
        ) : (
          <>
            {/* Token Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">From Token</label>
              <Select onValueChange={(value) => {
                const token = swappableTokens?.find(t => `${t.network}-${t.symbol}-${t.address}` === value);
                setSelectedToken(token);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token to swap" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedTokens).map(([network, tokens]: [string, any]) => (
                    <div key={network}>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${networkColors[network as keyof typeof networkColors]}`}></div>
                        <span>{network}</span>
                      </div>
                      {tokens.map((token: any) => (
                        <SelectItem 
                          key={`${token.network}-${token.symbol}-${token.address}`} 
                          value={`${token.network}-${token.symbol}-${token.address}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{token.symbol}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {parseFloat(token.balance).toFixed(4)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            {selectedToken && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Amount</label>
                  <span className="text-xs text-gray-500">
                    Balance: {parseFloat(selectedToken.balance).toFixed(4)} {selectedToken.symbol}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="pr-16"
                    max={selectedToken.balance}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 px-2 text-xs"
                    onClick={() => setSwapAmount(selectedToken.balance)}
                  >
                    MAX
                  </Button>
                </div>
              </div>
            )}

            {/* Swap Arrow */}
            {selectedToken && (
              <div className="flex justify-center">
                <div className="p-2 bg-gray-100 rounded-full">
                  <ArrowDown className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            )}

            {/* To Token (USDC) */}
            {selectedToken && (
              <div className="space-y-3">
                <label className="text-sm font-medium">To Token</label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium">USDC</span>
                    <Badge className="bg-green-100 text-green-800">Stablecoin</Badge>
                  </div>
                  {quote && (
                    <div className="mt-2 text-lg font-bold text-green-800">
                      {parseFloat(quote.toAmount).toFixed(6)} USDC
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quote Details */}
            {quote && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">Swap Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span>1 {selectedToken.symbol} = {quote.rate.toFixed(6)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Received:</span>
                    <span>{quote.minimumReceived} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${networkColors[selectedToken.network as keyof typeof networkColors]}`}></div>
                      <span>{selectedToken.network}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Gas:</span>
                    <span>{quote.gasEstimate} ETH</span>
                  </div>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={executeSwap}
              disabled={!quote || isSwapping || isGettingQuote || !selectedToken}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSwapping ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Swapping...</span>
                </div>
              ) : isGettingQuote ? (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Getting Quote...</span>
                </div>
              ) : quote ? (
                `Swap to USDC`
              ) : (
                'Enter Amount'
              )}
            </Button>

            {/* Auto-Collection Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900">Automatic USDC Collection</div>
                  <div className="text-blue-700">
                    USDC will be automatically sent to developer wallet after swap
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}