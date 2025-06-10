import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, Wallet, Zap, Shield, TrendingUp, Sparkles } from 'lucide-react';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { supportedChains } from '@/lib/particle-config';

export function ParticleSwapInterface() {
  const { 
    address, 
    isConnected, 
    isLoading,
    balances, 
    connect, 
    disconnect, 
    switchChain, 
    swapToUSDC,
    chainId 
  } = useParticleWallet();
  
  const { toast } = useToast();

  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});

  // Fetch live rates for available tokens
  useEffect(() => {
    const fetchLiveRates = async () => {
      if (balances.length === 0) return;
      
      try {
        const { productionPriceAPI } = await import('@/lib/production-price-api');
        const symbols = balances.map(token => token.symbol);
        const rates = await productionPriceAPI.getMultiplePrices(symbols);
        
        const rateMap: Record<string, number> = {};
        Object.entries(rates).forEach(([symbol, data]) => {
          rateMap[symbol] = data.price;
        });
        
        setLiveRates(rateMap);
      } catch (error) {
        console.error('Failed to fetch live rates:', error);
      }
    };

    fetchLiveRates();
    // Update rates every 30 seconds
    const interval = setInterval(fetchLiveRates, 30000);
    return () => clearInterval(interval);
  }, [balances]);

  // Calculate swap quote when amount or tokens change
  useEffect(() => {
    const calculateQuote = async () => {
      if (!fromToken || !amount || parseFloat(amount) <= 0) {
        setSwapQuote(null);
        return;
      }

      try {
        const { productionPriceAPI } = await import('@/lib/production-price-api');
        const quote = await productionPriceAPI.getSwapQuote(fromToken, toToken, amount);
        setSwapQuote(quote);
      } catch (error) {
        console.error('Failed to calculate quote:', error);
        setSwapQuote(null);
      }
    };

    const debounceTimer = setTimeout(calculateQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [fromToken, toToken, amount]);

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Particle Network",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Particle Network",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet.",
        variant: "destructive"
      });
    }
  };

  const handleSwap = async () => {
    if (!fromToken || !amount || !isConnected) {
      toast({
        title: "Missing Information",
        description: "Please select a token and enter an amount",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSwapping(true);
      const result = await swapToUSDC(fromToken, amount);
      
      toast({
        title: "Swap Successful",
        description: `Swapped ${result.fromAmount} ${fromToken} to ${result.toAmount} USDC (Gasless)`,
      });

      // Reset form
      setAmount('');
      setSwapQuote(null);
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: "Failed to execute swap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleChainSwitch = async (chainId: string) => {
    try {
      await switchChain(parseInt(chainId));
      toast({
        title: "Chain Switched",
        description: `Switched to ${supportedChains.find(c => c.id.toString() === chainId)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Chain Switch Failed",
        description: "Failed to switch chain. Please try again.",
        variant: "destructive"
      });
    }
  };



  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Particle Network Swap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to access Particle Network's gasless swap functionality
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Account Abstraction</span>
                </div>
                <p className="text-sm text-gray-600">
                  Smart account with gasless transactions
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium">Paymaster</span>
                </div>
                <p className="text-sm text-gray-600">
                  Sponsored gas fees for all swaps
                </p>
              </div>
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? 'Connecting...' : 'Connect Particle Wallet'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Particle Network Swap
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            Gasless
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Info */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Connected Wallet</p>
              <p className="text-xs text-gray-500 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {supportedChains.find(c => c.id === chainId)?.name || 'Ethereum'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
                className="mt-1"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>

        {/* Chain Selection */}
        <div className="space-y-2">
          <Label>Network</Label>
          <Select value={chainId?.toString()} onValueChange={handleChainSwitch}>
            <SelectTrigger>
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {supportedChains.map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  {chain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Token */}
        <div className="space-y-2">
          <Label>From Token</Label>
          <Select value={fromToken} onValueChange={setFromToken}>
            <SelectTrigger>
              <SelectValue placeholder="Select token to swap" />
            </SelectTrigger>
            <SelectContent>
              {balances.map((balance) => (
                <SelectItem key={balance.address} value={balance.symbol}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{balance.symbol}</span>
                      <span className="text-xs text-muted-foreground">{balance.name}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-sm">{balance.formattedBalance}</span>
                      {balance.usdValue && (
                        <span className="text-xs text-muted-foreground">
                          ${balance.usdValue.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20 text-lg font-medium"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-sm text-muted-foreground">{fromToken}</span>
            </div>
          </div>
          {fromToken && amount && liveRates[fromToken] && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Balance: {balances.find(b => b.symbol === fromToken)?.formattedBalance || '0'} {fromToken}
              </span>
              <span className="text-muted-foreground">
                ≈ ${(parseFloat(amount) * liveRates[fromToken]).toFixed(2)}
              </span>
            </div>
          )}
          {fromToken && !amount && (
            <p className="text-xs text-muted-foreground">
              Balance: {balances.find(b => b.symbol === fromToken)?.formattedBalance || '0'} {fromToken}
            </p>
          )}
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <div className="p-2 border rounded-full bg-gray-50">
            <ArrowUpDown className="w-4 h-4 text-gray-600" />
          </div>
        </div>

        {/* To Token (Fixed to USDC) */}
        <div className="space-y-2">
          <Label>To Token</Label>
          <div className="p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">USDC</span>
              <span className="text-sm text-gray-500">USD Coin</span>
            </div>
          </div>
        </div>

        {/* Live Swap Quote */}
        {swapQuote && (
          <Alert className="border-primary/20 bg-primary/5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">You'll receive:</span>
                  <span className="font-semibold text-lg">{swapQuote.toAmount} USDC</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between">
                    <span>Exchange rate:</span>
                    <span className="font-medium">1 {fromToken} = {swapQuote.rate?.toFixed(4)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum received:</span>
                    <span className="font-medium">{swapQuote.minimumReceived} USDC</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price impact:</span>
                  <span>{swapQuote.priceImpact}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Shield className="w-3 h-3" />
                  <span>Gasless transaction with paymaster</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Swap Button */}
        <Button 
          onClick={handleSwap}
          disabled={!fromToken || !amount || isSwapping || !swapQuote}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="lg"
        >
          {isSwapping ? 'Swapping...' : 'Swap to USDC (Gasless)'}
        </Button>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <Shield className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xs font-medium">Account Abstraction</p>
            <p className="text-xs text-gray-500">Smart contract wallet</p>
          </div>
          <div className="text-center">
            <Zap className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-xs font-medium">Sponsored Gas</p>
            <p className="text-xs text-gray-500">Zero gas fees</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}