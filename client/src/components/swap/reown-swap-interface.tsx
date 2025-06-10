import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, Wallet, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';

export function ReownSwapInterface() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { balances, isLoading } = useComprehensiveWalletBalances();

  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [amount, setAmount] = useState('');

  const handleOpenSwap = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    open({ view: 'Swap' });
    
    toast({
      title: "Swap Interface Opened",
      description: "Complete your swap in the Reown interface",
    });
  };

  const popularTokens = [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'BTC', name: 'Bitcoin' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-blue-600" />
          Token Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* From Token */}
          <div className="space-y-2">
            <Label>From Token</Label>
            <Select value={fromToken} onValueChange={setFromToken}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {balances.slice(0, 5).map((balance) => (
                  <SelectItem key={balance.address} value={balance.symbol}>
                    {balance.symbol} - {balance.formattedBalance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <Label>To Token</Label>
            <Select value={toToken} onValueChange={setToToken}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {popularTokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Swap Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">Fast</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Secure</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">Best Rate</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <ArrowUpDown className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700">Multi-Chain</span>
          </div>
        </div>

        {/* Status Alert */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold">Powered by Reown AppKit</div>
            <div className="text-sm text-gray-600 mt-1">
              Secure, decentralized swapping with optimal routing across multiple DEXs.
              For gasless swaps with INR withdrawal, use the Remittance flow.
            </div>
          </AlertDescription>
        </Alert>

        {/* Swap Button */}
        <Button 
          onClick={handleOpenSwap}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Open Reown Swap
        </Button>

        {!isConnected && (
          <div className="text-center">
            <Button 
              onClick={() => open()}
              variant="outline"
              className="w-full"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex justify-center gap-4 text-sm">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Reown Active
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Multi-Chain Ready
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}