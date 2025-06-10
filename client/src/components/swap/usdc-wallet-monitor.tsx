
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Wallet, RefreshCw, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';

interface USDCBalance {
  chainId: number;
  networkName: string;
  balance: string;
  formattedBalance: string;
  usdcAddress: string;
}

const USDC_ADDRESSES = {
  1: '0xA0b86a33E6441ED88A30C99A7a9449Aa84174',      // Ethereum USDC
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon USDC
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum USDC
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base USDC
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',     // Optimism USDC
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'   // Avalanche USDC
};

const NETWORK_NAMES = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  8453: 'Base',
  10: 'Optimism',
  43114: 'Avalanche'
};

export function USDCWalletMonitor() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [usdcBalances, setUsdcBalances] = useState<USDCBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const fetchUSDCBalances = async () => {
    if (!address) return;

    setIsLoading(true);
    const balances: USDCBalance[] = [];

    try {
      for (const [chainId, usdcAddress] of Object.entries(USDC_ADDRESSES)) {
        try {
          const response = await fetch(`/api/wallet/token-balance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address,
              tokenAddress: usdcAddress,
              chainId: parseInt(chainId)
            })
          });

          if (response.ok) {
            const data = await response.json();
            const formattedBalance = formatUnits(BigInt(data.balance || '0'), 6);
            
            balances.push({
              chainId: parseInt(chainId),
              networkName: NETWORK_NAMES[parseInt(chainId) as keyof typeof NETWORK_NAMES],
              balance: data.balance || '0',
              formattedBalance,
              usdcAddress
            });
          }
        } catch (error) {
          console.error(`Failed to fetch USDC balance for chain ${chainId}:`, error);
        }
      }

      setUsdcBalances(balances);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getTotalUSDC = () => {
    return usdcBalances.reduce((total, balance) => 
      total + parseFloat(balance.formattedBalance), 0
    ).toFixed(6);
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUSDCBalances();
    }
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Wallet className="h-5 w-5 text-blue-500" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to view USDC balances across all networks
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              USDC Portfolio
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUSDCBalances}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Your USDC balances across all supported networks
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Total USDC */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total USDC</span>
              <span className="text-2xl font-bold text-green-600">${getTotalUSDC()}</span>
            </div>
          </div>

          {/* Connected Wallet */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Connected Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(address!, 'Wallet address')}
              >
                {copiedAddress === address ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Network Balances */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Network Balances</h4>
            {usdcBalances.map((balance) => (
              <div key={balance.chainId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {balance.networkName}
                  </Badge>
                  <span className="text-sm text-muted-foreground">USDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{parseFloat(balance.formattedBalance).toFixed(4)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(balance.usdcAddress, `${balance.networkName} USDC address`)}
                  >
                    {copiedAddress === balance.usdcAddress ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <ExternalLink className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading balances...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
