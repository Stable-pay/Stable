import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, Zap, DollarSign, AlertTriangle, ExternalLink, Key, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

interface ApiStatus {
  status: 'checking' | 'available' | 'restricted' | 'error';
  message?: string;
  needsUpgrade?: boolean;
}

export function ApiStatusSwap() {
  const { address, isConnected, chainId } = useAccount();
  const { balances, isLoading: balancesLoading } = useComprehensiveWalletBalances();
  const { toast } = useToast();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ status: 'checking' });
  const [checkingApi, setCheckingApi] = useState(false);

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

  const checkApiAccess = async () => {
    if (!chainId) return;
    
    setCheckingApi(true);
    try {
      const testResponse = await fetch(`/api/0x/${chainId}/quote?${new URLSearchParams({
        sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        buyToken: getUSDCAddress(chainId),
        sellAmount: '1000000000000000000',
        takerAddress: address || '0x0000000000000000000000000000000000000000',
        slippagePercentage: '0.01'
      })}`);

      const data = await testResponse.json();

      if (testResponse.status === 403 && data.code === 'INSUFFICIENT_API_ACCESS') {
        setApiStatus({
          status: 'restricted',
          message: 'API key requires upgrade for swap functionality',
          needsUpgrade: true
        });
      } else if (testResponse.ok) {
        setApiStatus({
          status: 'available',
          message: 'Full swap functionality available'
        });
      } else {
        setApiStatus({
          status: 'error',
          message: data.message || 'API connection failed'
        });
      }
    } catch (error) {
      setApiStatus({
        status: 'error',
        message: 'Unable to connect to swap API'
      });
    } finally {
      setCheckingApi(false);
    }
  };

  useEffect(() => {
    if (isConnected && chainId) {
      checkApiAccess();
    }
  }, [isConnected, chainId]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Zap className="h-5 w-5 text-blue-500" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to access the swap interface
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* API Status Alert */}
      {apiStatus.status === 'checking' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Checking API Access</AlertTitle>
          <AlertDescription>
            Verifying 0x Protocol API connectivity...
          </AlertDescription>
        </Alert>
      )}

      {apiStatus.status === 'restricted' && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <Key className="h-4 w-4" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">API Access Limited</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <div className="space-y-2">
              <p>The current 0x Protocol API key has restricted access to swap endpoints.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.open('https://0x.org/pricing', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Upgrade API Key
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {apiStatus.status === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API Connection Error</AlertTitle>
          <AlertDescription>
            {apiStatus.message}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 ml-2"
              onClick={checkApiAccess}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {apiStatus.status === 'available' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <Zap className="h-4 w-4" />
          <AlertTitle className="text-green-800 dark:text-green-200">API Access Confirmed</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Full 0x Protocol swap functionality is available
          </AlertDescription>
        </Alert>
      )}

      {/* Main Swap Interface */}
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
              }}
              disabled={apiStatus.status === 'restricted'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select token to swap" />
              </SelectTrigger>
              <SelectContent>
                {availableTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <div className="flex items-center justify-between w-full">
                      <span>{token.symbol}</span>
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
                onChange={(e) => setSwapAmount(e.target.value)}
                className="pr-16"
                disabled={apiStatus.status === 'restricted'}
              />
              {selectedToken && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 px-2"
                  onClick={() => setSwapAmount(selectedToken.formattedBalance)}
                  disabled={apiStatus.status === 'restricted'}
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

          {/* Conversion Preview */}
          {selectedToken && swapAmount && parseFloat(swapAmount) > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated output</span>
                <Badge variant="outline">Preview</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold">~{swapAmount} USDC</span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                * Actual rates determined by 0x Protocol at execution time
              </p>
            </div>
          )}

          {/* Action Button */}
          {apiStatus.status === 'restricted' ? (
            <div className="space-y-2">
              <Button 
                className="w-full" 
                size="lg" 
                disabled
              >
                <Key className="h-4 w-4 mr-2" />
                API Upgrade Required
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Upgrade your 0x Protocol API key to enable swapping
              </p>
            </div>
          ) : (
            <Button 
              className="w-full"
              size="lg"
              disabled={!selectedToken || !swapAmount || parseFloat(swapAmount) <= 0 || apiStatus.status !== 'available'}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {apiStatus.status === 'available' ? 'Swap' : 'Check API Access'}
            </Button>
          )}

          {/* Network Info */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              Network: {chainId === 1 && 'Ethereum'}
              {chainId === 137 && 'Polygon'}
              {chainId === 42161 && 'Arbitrum'}
              {chainId === 8453 && 'Base'}
              {chainId === 10 && 'Optimism'}
            </p>
            <p>Powered by 0x Protocol</p>
          </div>
        </CardContent>
      </Card>

      {/* API Information Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">About 0x Protocol Integration</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Direct integration with 0x Protocol API</p>
            <p>• Real-time price discovery and optimal routing</p>
            <p>• Multi-chain support across major networks</p>
            <p>• Gasless transactions available with premium access</p>
          </div>
          
          {apiStatus.needsUpgrade && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open('https://0x.org/pricing', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View 0x Pricing Plans
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}