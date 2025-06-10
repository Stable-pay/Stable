import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowUpDown, 
  Zap, 
  TrendingUp, 
  Clock, 
  Shield, 
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProductionWallet } from "@/hooks/use-production-wallet";

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  priceImpact: string;
  estimatedGas: string;
  orderHash: string;
}

type SwapStep = 'select' | 'quote' | 'confirm' | 'processing' | 'completed';

export default function SwapDark() {
  const { balances, isConnected, address } = useProductionWallet();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<SwapStep>('select');
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [progress, setProgress] = useState(0);

  // Get available tokens from balances
  const availableTokens = balances.filter(token => parseFloat(token.formattedBalance) > 0);

  const steps = [
    { id: 'select', title: 'Select Tokens', icon: ArrowUpDown },
    { id: 'quote', title: 'Get Quote', icon: TrendingUp },
    { id: 'confirm', title: 'Confirm Swap', icon: CheckCircle },
    { id: 'processing', title: 'Processing', icon: Clock }
  ];

  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      getQuote();
    }
  }, [fromToken, toToken, fromAmount]);

  const getQuote = async () => {
    if (!fromToken || !toToken || !fromAmount || !address) return;
    
    setIsLoading(true);
    setCurrentStep('quote');
    setProgress(25);

    try {
      const response = await fetch('/api/fusion/quote', {
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

      const quoteData = await response.json();
      setQuote(quoteData);
      setCurrentStep('confirm');
      setProgress(50);
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: "Quote Error",
        description: "Failed to get exchange rate",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote) return;
    
    setIsSwapping(true);
    setCurrentStep('processing');
    setProgress(75);

    try {
      const response = await fetch('/api/fusion/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderHash: quote.orderHash,
          userAddress: address
        })
      });

      if (response.ok) {
        setTimeout(() => {
          setCurrentStep('completed');
          setProgress(100);
          toast({
            title: "Swap Successful",
            description: `Swapped ${fromAmount} ${fromToken} for ${quote.toAmount} ${toToken}`,
          });
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: "Failed to execute swap",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const resetSwap = () => {
    setFromToken('');
    setToToken('USDC');
    setFromAmount('');
    setQuote(null);
    setCurrentStep('select');
    setProgress(0);
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setQuote(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Token Swap
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Swap your tokens instantly with gasless transactions powered by 1inch Fusion
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`mt-2 text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Main Swap Interface */}
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                <Zap className="h-5 w-5" />
                Gasless Swap
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                No gas fees required - powered by 1inch Fusion
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* From Token */}
              <div className="space-y-3">
                <Label className="text-foreground">From</Label>
                <div className="bg-input border border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Select value={fromToken} onValueChange={setFromToken}>
                      <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTokens.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fromToken && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Balance</div>
                        <div className="text-sm font-medium text-foreground">
                          {availableTokens.find(t => t.symbol === fromToken)?.formattedBalance || '0'}
                        </div>
                      </div>
                    )}
                  </div>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="text-2xl font-bold border-0 bg-transparent text-foreground p-0 h-auto"
                  />
                  {fromToken && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const balance = availableTokens.find(t => t.symbol === fromToken)?.formattedBalance || '0';
                          setFromAmount((parseFloat(balance) * 0.25).toFixed(6));
                        }}
                        className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      >
                        25%
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const balance = availableTokens.find(t => t.symbol === fromToken)?.formattedBalance || '0';
                          setFromAmount((parseFloat(balance) * 0.5).toFixed(6));
                        }}
                        className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      >
                        50%
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const balance = availableTokens.find(t => t.symbol === fromToken)?.formattedBalance || '0';
                          setFromAmount(balance);
                        }}
                        className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      >
                        Max
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={swapTokens}
                  className="rounded-full bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-3">
                <Label className="text-foreground">To</Label>
                <div className="bg-input border border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <Select value={toToken} onValueChange={setToToken}>
                      <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="DAI">DAI</SelectItem>
                        <SelectItem value="WETH">WETH</SelectItem>
                        <SelectItem value="WBTC">WBTC</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Balance</div>
                      <div className="text-sm font-medium text-foreground">
                        {balances.find(t => t.symbol === toToken)?.formattedBalance || '0'}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {quote ? quote.toAmount : '0.0'}
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              {quote && (
                <motion.div 
                  className="bg-secondary p-4 rounded-lg space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="text-foreground">1 {fromToken} = {quote.rate} {toToken}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span className="text-foreground">{quote.priceImpact}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="text-green-500 font-medium">$0.00 (Gasless)</span>
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              <AnimatePresence mode="wait">
                {currentStep === 'select' && (
                  <Button
                    onClick={getQuote}
                    disabled={!fromToken || !toToken || !fromAmount || !isConnected}
                    className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {!isConnected ? 'Connect Wallet' : 'Get Quote'}
                  </Button>
                )}

                {(currentStep === 'quote' || currentStep === 'confirm') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      onClick={executeSwap}
                      disabled={!quote || isLoading}
                      className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Getting Quote...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Swap {fromAmount} {fromToken}
                        </div>
                      )}
                    </Button>
                  </motion.div>
                )}

                {currentStep === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-foreground">Processing swap...</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </motion.div>
                )}

                {currentStep === 'completed' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                  >
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Swap Completed!</h3>
                      <p className="text-muted-foreground">
                        Successfully swapped {fromAmount} {fromToken} for {quote?.toAmount} {toToken}
                      </p>
                    </div>
                    <Button
                      onClick={resetSwap}
                      className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Make Another Swap
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Banner */}
              <div className="bg-secondary p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Gasless Trading</p>
                    <p>This swap is executed without gas fees using 1inch Fusion technology. Your transaction will be processed by professional market makers.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Swaps */}
        <motion.div 
          className="mt-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Swaps</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No recent swaps</p>
                <p className="text-sm text-muted-foreground">Your swap history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}