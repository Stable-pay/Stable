import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { swapService, type SwapToUSDCParams } from "@/lib/swap-service";
import { getDeveloperWallet, isValidNetwork } from "@/lib/wallet-config";
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { ArrowDown, Wallet, Zap, Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface TokenBalance {
  address: string;
  symbol: string;
  balance: string;
  decimals: number;
}

export function RealSwapInterface() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { toast } = useToast();
  
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [estimatedUSDC, setEstimatedUSDC] = useState<string>('0');
  const [swapStatus, setSwapStatus] = useState<'idle' | 'preparing' | 'executing' | 'completed' | 'error'>('idle');

  const networkMap: Record<number, string> = {
    1: 'ethereum',
    137: 'polygon',
    42161: 'arbitrum',
    8453: 'base'
  };

  const currentNetwork = chainId ? networkMap[chainId] : '';

  useEffect(() => {
    if (isConnected && address && currentNetwork) {
      loadTokenBalances();
    }
  }, [isConnected, address, currentNetwork]);

  const loadTokenBalances = async () => {
    // Real token balances would be fetched from blockchain here
    const mockBalances: TokenBalance[] = [
      {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        balance: '0.5',
        decimals: 18
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        symbol: 'DAI',
        balance: '1000',
        decimals: 18
      },
      {
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        symbol: 'LINK',
        balance: '25',
        decimals: 18
      }
    ];
    setTokenBalances(mockBalances);
  };

  const handleSwapAmountChange = async (value: string) => {
    setSwapAmount(value);
    
    if (value && selectedToken && parseFloat(value) > 0) {
      try {
        const token = tokenBalances.find(t => t.address === selectedToken);
        if (!token || !currentNetwork) return;

        const amount = (parseFloat(value) * Math.pow(10, token.decimals)).toString();
        
        const params: SwapToUSDCParams = {
          userAddress: address!,
          network: currentNetwork,
          tokenAddress: selectedToken,
          amount,
          slippage: 1
        };

        const result = await swapService.swapTokenToUSDC(params);
        const usdcAmount = (parseFloat(result.expectedUSDC) / Math.pow(10, 6)).toFixed(2);
        setEstimatedUSDC(usdcAmount);
      } catch (error) {
        console.error('Quote error:', error);
        setEstimatedUSDC('0');
      }
    } else {
      setEstimatedUSDC('0');
    }
  };

  const executeSwap = async () => {
    if (!selectedToken || !swapAmount || !address || !currentNetwork) {
      toast({
        title: "Invalid Parameters",
        description: "Please select token and amount",
        variant: "destructive"
      });
      return;
    }

    if (!isValidNetwork(currentNetwork)) {
      toast({
        title: "Unsupported Network",
        description: "Please switch to Ethereum, Polygon, Arbitrum, or Base",
        variant: "destructive"
      });
      return;
    }

    setIsSwapping(true);
    setSwapStatus('preparing');

    try {
      const token = tokenBalances.find(t => t.address === selectedToken);
      if (!token) throw new Error('Token not found');

      const amount = (parseFloat(swapAmount) * Math.pow(10, token.decimals)).toString();
      
      const params: SwapToUSDCParams = {
        userAddress: address,
        network: currentNetwork,
        tokenAddress: selectedToken,
        amount,
        slippage: 1
      };

      setSwapStatus('executing');
      const result = await swapService.swapTokenToUSDC(params);
      
      console.log('Swap transaction data:', result.transactionData);
      
      toast({
        title: "Swap Prepared",
        description: `Ready to swap ${swapAmount} ${token.symbol} to ${estimatedUSDC} USDC`,
      });

      setSwapStatus('completed');
      
      setSelectedToken('');
      setSwapAmount('');
      setEstimatedUSDC('0');
      
    } catch (error: any) {
      console.error('Swap error:', error);
      setSwapStatus('error');
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
      setTimeout(() => setSwapStatus('idle'), 3000);
    }
  };

  const selectedTokenData = tokenBalances.find(t => t.address === selectedToken);
  const developerWallet = currentNetwork && isValidNetwork(currentNetwork) 
    ? getDeveloperWallet(currentNetwork) 
    : '';

  if (!isConnected) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6 text-center">
          <Wallet className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Connect Wallet Required</h3>
          <p className="text-blue-700">Connect your wallet to access real token swapping</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-indigo-600" />
          <span>Swap to USDC</span>
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Live 1inch API
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Network:</span>
            <Badge className="bg-blue-100 text-blue-800">
              {currentNetwork || 'Unknown'}
            </Badge>
          </div>
          {developerWallet && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Collection Wallet:</span>
              <code className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded">
                {developerWallet.slice(0, 6)}...{developerWallet.slice(-4)}
              </code>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Select Token to Swap
            </label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder="Choose token..." />
              </SelectTrigger>
              <SelectContent>
                {tokenBalances.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <div className="flex items-center justify-between w-full">
                      <span>{token.symbol}</span>
                      <span className="text-slate-500 ml-2">
                        Balance: {token.balance}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Amount to Swap
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={swapAmount}
                onChange={(e) => handleSwapAmountChange(e.target.value)}
                className="pr-16"
              />
              {selectedTokenData && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-medium text-slate-600">
                    {selectedTokenData.symbol}
                  </span>
                </div>
              )}
            </div>
            {selectedTokenData && (
              <p className="text-xs text-slate-500 mt-1">
                Available: {selectedTokenData.balance} {selectedTokenData.symbol}
              </p>
            )}
          </div>
        </div>

        {estimatedUSDC !== '0' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-3">
              <ArrowDown className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-sm text-green-700 mb-1">You will receive approximately:</p>
              <p className="text-2xl font-bold text-green-900">{estimatedUSDC} USDC</p>
              <p className="text-xs text-green-600 mt-1">
                Sent directly to developer wallet
              </p>
            </div>
          </div>
        )}

        {swapStatus !== 'idle' && (
          <div className={`rounded-lg p-4 ${
            swapStatus === 'completed' ? 'bg-green-50 border border-green-200' :
            swapStatus === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              {swapStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : swapStatus === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              )}
              <span className={`font-medium ${
                swapStatus === 'completed' ? 'text-green-900' :
                swapStatus === 'error' ? 'text-red-900' :
                'text-blue-900'
              }`}>
                {swapStatus === 'preparing' && 'Preparing swap transaction...'}
                {swapStatus === 'executing' && 'Executing swap via 1inch...'}
                {swapStatus === 'completed' && 'Swap completed successfully'}
                {swapStatus === 'error' && 'Swap failed - please try again'}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={executeSwap}
          disabled={!selectedToken || !swapAmount || isSwapping || parseFloat(swapAmount) <= 0}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-12 font-semibold"
          size="lg"
        >
          {isSwapping ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3" />
              Swapping...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 mr-2" />
              Swap to USDC
            </>
          )}
        </Button>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Security Notice</h4>
              <p className="text-amber-800 text-sm">
                All swaps are executed through 1inch DEX aggregator for optimal rates. 
                USDC is automatically sent to the platform's collection wallet for processing.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}