
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';

interface USDCValidationResult {
  chainId: number;
  chainName: string;
  usdcAddress: string;
  isValid: boolean;
  error?: string;
}

export function USDCAddressMonitor() {
  const { chainId } = useAccount();
  const [validationResults, setValidationResults] = useState<USDCValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const USDC_ADDRESSES = {
    1: '0xA0b86a33E6441ED88A30C99A7a9449Aa84174',      // Ethereum USDC
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon USDC
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum USDC
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base USDC
    10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',     // Optimism USDC
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'   // Avalanche USDC
  };

  const CHAIN_NAMES = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    8453: 'Base',
    10: 'Optimism',
    43114: 'Avalanche'
  };

  const validateUSDCAddresses = async () => {
    setIsValidating(true);
    const results: USDCValidationResult[] = [];

    for (const [chainIdStr, usdcAddress] of Object.entries(USDC_ADDRESSES)) {
      const networkId = parseInt(chainIdStr);
      try {
        const response = await fetch(`/api/1inch/${networkId}/quote?src=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dst=${usdcAddress}&amount=1000000000000000000`);
        
        results.push({
          chainId: networkId,
          chainName: CHAIN_NAMES[networkId as keyof typeof CHAIN_NAMES],
          usdcAddress,
          isValid: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`
        });
      } catch (error) {
        results.push({
          chainId: networkId,
          chainName: CHAIN_NAMES[networkId as keyof typeof CHAIN_NAMES],
          usdcAddress,
          isValid: false,
          error: 'Network error'
        });
      }
    }

    setValidationResults(results);
    setIsValidating(false);
  };

  useEffect(() => {
    validateUSDCAddresses();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          USDC Address Validation
          <Badge variant="outline" className="ml-auto">
            {chainId && CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isValidating ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validating USDC addresses with 1inch API...
          </div>
        ) : (
          <div className="space-y-3">
            {validationResults.map((result) => (
              <div key={result.chainId} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.chainName}</span>
                    {result.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.usdcAddress}
                  </div>
                  {result.error && (
                    <div className="text-xs text-red-500 mt-1">
                      Error: {result.error}
                    </div>
                  )}
                </div>
                <Badge variant={result.isValid ? "default" : "destructive"}>
                  {result.isValid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Current Network Status</span>
          </div>
          <p className="mt-1 text-blue-600 dark:text-blue-400">
            {chainId && validationResults.find(r => r.chainId === chainId)?.isValid 
              ? `✅ ${CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES]} USDC address is valid for swapping`
              : `⚠️ Current network may have issues with USDC swapping`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
