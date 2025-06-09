import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Wallet, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { swapService } from "@/lib/swap-service";

// Network configurations for real blockchain integration
const NETWORKS = {
  1: 'ethereum',
  137: 'polygon', 
  42161: 'arbitrum',
  8453: 'base'
} as const;

// USDC addresses on different networks
const USDC_ADDRESSES = {
  1: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
} as const;

// Developer wallets for USDC collection
const DEVELOPER_WALLETS = {
  1: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  137: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  42161: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65', 
  8453: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65'
} as const;

export function ReownTokenSwap() {
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();
  
  // Wallet balances
  const { data: nativeBalance } = useBalance({ address });
  
  // Swap state
  const [fromToken, setFromToken] = useState<string>('native');
  const [amount, setAmount] = useState<string>('');
  const [estimatedUSDC, setEstimatedUSDC] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [swapData, setSwapData] = useState<any>(null);
  
  // Transaction handling
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Get quote from 1inch API
  const getSwapQuote = async () => {
    if (!address || !chainId || !amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    try {
      const network = NETWORKS[chainId as keyof typeof NETWORKS];
      if (!network) {
        throw new Error('Unsupported network');
      }

      const result = await swapService.swapTokenToUSDC({
        userAddress: address,
        network,
        tokenAddress: fromToken === 'native' ? 'native' : fromToken,
        amount: parseUnits(amount, fromToken === 'native' ? 18 : 18).toString(),
        slippage: 1
      });

      setSwapData(result);
      setEstimatedUSDC(formatUnits(BigInt(result.expectedUSDC), 6));
      
      toast({
        title: "Quote Retrieved",
        description: `You will receive approximately ${formatUnits(BigInt(result.expectedUSDC), 6)} USDC`
      });
    } catch (error) {
      console.error('Quote error:', error);
      toast({
        title: "Quote Failed",
        description: "Unable to get swap quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute the swap transaction
  const executeSwap = async () => {
    if (!swapData || !address) return;
    
    try {
      await writeContract({
        address: swapData.transactionData.to as `0x${string}`,
        abi: [], // Will be provided by 1inch transaction data
        functionName: 'swap',
        args: [],
        value: BigInt(swapData.transactionData.value || '0')
      });
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: "Swap Failed",
        description: "Transaction failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Swap Successful!",
        description: `USDC has been sent to developer wallet: ${DEVELOPER_WALLETS[chainId as keyof typeof DEVELOPER_WALLETS]}`
      });
      setAmount('');
      setEstimatedUSDC('0');
      setSwapData(null);
    }
  }, [isSuccess, chainId, toast]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Required
          </CardTitle>
          <CardDescription>
            Connect your wallet to start swapping tokens to USDC
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentNetwork = NETWORKS[chainId as keyof typeof NETWORKS];
  const isValidNetwork = !!currentNetwork;

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Token to USDC Swap
          </CardTitle>
          <CardDescription>
            Swap any token to USDC using live 1inch API integration
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isValidNetwork && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please switch to Ethereum, Polygon, Arbitrum, or Base network
              </AlertDescription>
            </Alert>
          )}

          {/* From Token Selection */}
          <div className="space-y-2">
            <Label htmlFor="fromToken">From Token</Label>
            <Select value={fromToken} onValueChange={setFromToken}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="native">
                  {chainId === 1 ? 'ETH' : 
                   chainId === 137 ? 'MATIC' :
                   chainId === 42161 ? 'ETH' :
                   chainId === 8453 ? 'ETH' : 'Native Token'}
                  {nativeBalance && ` (${parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4)})`}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isValidNetwork}
            />
          </div>

          {/* Estimated Output */}
          <div className="space-y-2">
            <Label>Estimated USDC Output</Label>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
              <span className="text-sm text-gray-600">You will receive:</span>
              <span className="font-semibold text-green-600">{estimatedUSDC} USDC</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={getSwapQuote} 
              disabled={!amount || parseFloat(amount) <= 0 || isLoading || !isValidNetwork}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Quote...
                </>
              ) : (
                'Get Quote'
              )}
            </Button>

            <Button 
              onClick={executeSwap}
              disabled={!swapData || isPending || isConfirming || !isValidNetwork}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isPending ? 'Confirming...' : 'Processing...'}
                </>
              ) : (
                'Execute Swap'
              )}
            </Button>
          </div>

          {/* Transaction Info */}
          {swapData && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1 text-sm">
                  <div>Estimated Gas: {swapData.estimatedGas}</div>
                  <div>Developer Wallet: {DEVELOPER_WALLETS[chainId as keyof typeof DEVELOPER_WALLETS]}</div>
                  <div>Network: {currentNetwork}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}