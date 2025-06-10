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

  // Simulate quote calculation
  useEffect(() => {
    if (amount && fromToken && parseFloat(amount) > 0) {
      const simulatedQuote = {
        fromAmount: amount,
        toAmount: (parseFloat(amount) * 0.98).toFixed(6), // 2% slippage
        priceImpact: '0.15%',
        gasless: true,
        paymaster: true
      };
      setSwapQuote(simulatedQuote);
    } else {
      setSwapQuote(null);
    }
  }, [amount, fromToken]);

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
                    <span>{balance.symbol}</span>
                    <span className="text-sm text-gray-500">
                      {balance.formattedBalance}
                    </span>
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
              className="pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-sm text-gray-500">{fromToken}</span>
            </div>
          </div>
          {fromToken && (
            <p className="text-xs text-gray-500">
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

        {/* Swap Quote */}
        {swapQuote && (
          <Alert className="border-green-200 bg-green-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>You'll receive:</span>
                  <span className="font-medium">{swapQuote.toAmount} USDC</span>
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