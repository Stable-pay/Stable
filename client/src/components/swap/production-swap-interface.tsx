import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpDown, 
  RefreshCw, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { useToast } from '@/hooks/use-toast';

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  priceImpact: number;
  gasFee: string;
  slippage: number;
}

export default function ProductionSwapInterface() {
  const { 
    isConnected, 
    address, 
    balances, 
    swapTokens: executeSwapTransaction, 
    refreshBalances 
  } = useParticleWallet();
  
  const { toast } = useToast();
  
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [slippage, setSlippage] = useState(0.5);

  // Available tokens for swapping
  const availableTokens = [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8435b662da5e1a0d5d9d3B7B3e' },
    { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' }
  ];

  // Get token balance
  const getTokenBalance = (symbol: string) => {
    const balance = balances.find(b => b.symbol === symbol);
    return balance ? parseFloat(balance.formattedBalance) : 0;
  };

  // Fetch swap quote
  const fetchQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken) return;

    setIsLoadingQuote(true);
    try {
      const response = await fetch('/api/particle/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount: fromAmount,
          chainId: 1,
          userAddress: address
        })
      });

      const data = await response.json();
      if (data.success) {
        const swapQuote: SwapQuote = {
          fromAmount,
          toAmount: data.toAmount || '0',
          rate: data.rate || 1,
          priceImpact: data.priceImpact || 0.1,
          gasFee: data.gasFee || '0.002',
          slippage
        };
        setQuote(swapQuote);
        setToAmount(swapQuote.toAmount);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      toast({
        title: "Quote Failed",
        description: "Failed to fetch swap quote",
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!quote || !isConnected) return;

    const fromBalance = getTokenBalance(fromToken);
    if (parseFloat(fromAmount) > fromBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken}`,
        variant: "destructive"
      });
      return;
    }

    setIsSwapping(true);
    try {
      const fromTokenAddress = availableTokens.find(t => t.symbol === fromToken)?.address || '';
      const toTokenAddress = availableTokens.find(t => t.symbol === toToken)?.address || '';

      const result = await executeSwapTransaction(fromTokenAddress, toTokenAddress, fromAmount);
      
      if (result.success) {
        toast({
          title: "Swap Successful",
          description: `Successfully swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`,
        });
        
        // Reset form
        setFromAmount('');
        setToAmount('');
        setQuote(null);
        
        // Refresh balances
        await refreshBalances();
      }
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Swap token positions
  const swapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    setQuote(null);
  };

  // Auto-fetch quote when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromAmount && fromToken && toToken) {
        fetchQuote();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, slippage]);

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your wallet to start swapping tokens
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card className="border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-cyan-500" />
            Token Swap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium">From</label>
            <div className="flex gap-2">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
              <span>Balance: {getTokenBalance(fromToken).toFixed(4)}</span>
              <button 
                onClick={() => setFromAmount(getTokenBalance(fromToken).toString())}
                className="text-cyan-500 hover:text-cyan-600"
              >
                Max
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={swapTokens}
              className="rounded-full h-8 w-8 p-0"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <div className="flex gap-2">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="flex-1 bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Balance: {getTokenBalance(toToken).toFixed(4)}
            </div>
          </div>

          {/* Quote Information */}
          {quote && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span>Exchange Rate</span>
                <span>1 {fromToken} = {quote.rate.toFixed(4)} {toToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Price Impact</span>
                <span className={quote.priceImpact > 3 ? 'text-red-500' : 'text-green-500'}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network Fee</span>
                <span>{quote.gasFee} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Slippage</span>
                <span>{quote.slippage}%</span>
              </div>
            </motion.div>
          )}

          {/* Slippage Settings */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Slippage Tolerance</label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 text-xs rounded ${
                    slippage === value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="w-20 h-7 text-xs"
              />
            </div>
          </div>

          {/* Swap Button */}
          <Button
            onClick={executeSwap}
            disabled={!quote || isSwapping || isLoadingQuote || parseFloat(fromAmount) <= 0}
            className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600"
          >
            {isSwapping ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : isLoadingQuote ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : quote ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Swap Tokens
              </>
            ) : (
              'Enter Amount'
            )}
          </Button>

          {/* Warnings */}
          {quote && quote.priceImpact > 3 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                High price impact warning
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Swaps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your swap history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}