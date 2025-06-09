import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Wallet, AlertTriangle, CheckCircle, Loader2, Network } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useWalletTokenBalances, type WalletTokenBalance } from "@/hooks/use-wallet-token-balances";
import { swapService } from "@/lib/swap-service";

// Network configurations for 1inch API
const NETWORK_MAPPING = {
  1: 'ethereum',
  137: 'polygon', 
  42161: 'arbitrum',
  8453: 'base'
} as const;

// Developer wallets for USDC collection
const DEVELOPER_WALLETS = {
  1: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  137: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  42161: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65', 
  8453: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65'
} as const;

export function WalletTokenSwap() {
  const { address, isConnected, chainId: currentChainId } = useAccount();
  const { toast } = useToast();
  const { switchChain } = useSwitchChain();
  
  // Get token balances from connected wallet
  const { balances, isLoading: balancesLoading } = useWalletTokenBalances();
  
  // Swap state
  const [selectedToken, setSelectedToken] = useState<WalletTokenBalance | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [estimatedUSDC, setEstimatedUSDC] = useState<string>('0');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [swapData, setSwapData] = useState<any>(null);
  
  // Transaction handling
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Get swap quote from 1inch API
  const getSwapQuote = async () => {
    if (!address || !selectedToken || !amount || parseFloat(amount) <= 0) return;
    
    setIsLoadingQuote(true);
    try {
      const network = NETWORK_MAPPING[selectedToken.chainId as keyof typeof NETWORK_MAPPING];
      if (!network) {
        throw new Error('Unsupported network');
      }

      // Convert amount to wei based on token decimals
      const amountInWei = parseUnits(amount, selectedToken.decimals).toString();

      const result = await swapService.swapTokenToUSDC({
        userAddress: address,
        network,
        tokenAddress: selectedToken.isNative ? 'native' : selectedToken.address,
        amount: amountInWei,
        slippage: 1
      });

      setSwapData(result);
      setEstimatedUSDC(formatUnits(BigInt(result.expectedUSDC), 6));
      
      toast({
        title: "Quote Retrieved",
        description: `You will receive approximately ${formatUnits(BigInt(result.expectedUSDC), 6)} USDC on ${selectedToken.chainName}`
      });
    } catch (error) {
      console.error('Quote error:', error);
      toast({
        title: "Quote Failed",
        description: "Unable to get swap quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Switch to the required network
  const handleNetworkSwitch = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
      toast({
        title: "Network Switched",
        description: `Switched to ${selectedToken?.chainName || 'target network'}`
      });
    } catch (error) {
      console.error('Network switch error:', error);
      toast({
        title: "Network Switch Failed",
        description: "Please switch network manually in your wallet",
        variant: "destructive"
      });
    }
  };

  // Execute the swap transaction
  const executeSwap = async () => {
    if (!swapData || !address || !selectedToken) return;
    
    // Check if we're on the correct network
    if (currentChainId !== selectedToken.chainId) {
      toast({
        title: "Wrong Network",
        description: `Please switch to ${selectedToken.chainName} to execute this swap`,
        variant: "destructive"
      });
      return;
    }
    
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
    if (isSuccess && selectedToken) {
      toast({
        title: "Swap Successful!",
        description: `${amount} ${selectedToken.symbol} swapped to USDC and sent to developer wallet on ${selectedToken.chainName}`
      });
      setAmount('');
      setEstimatedUSDC('0');
      setSwapData(null);
      setSelectedToken(null);
    }
  }, [isSuccess, selectedToken, amount, toast]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Required
          </CardTitle>
          <CardDescription>
            Connect your wallet to view your token balances and start swapping
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const needsNetworkSwitch = selectedToken && currentChainId !== selectedToken.chainId;

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Wallet Token Swap
          </CardTitle>
          <CardDescription>
            Swap tokens from your connected wallet to USDC using 1inch API
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {balancesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading your wallet token balances...</p>
            </div>
          ) : balances.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No tokens with balances found in your connected wallet on {currentChainId === 137 ? 'Polygon' : 
                currentChainId === 1 ? 'Ethereum' : 
                currentChainId === 42161 ? 'Arbitrum' :
                currentChainId === 8453 ? 'Base' : 'this network'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Current Network Display */}
              <div className="p-3 bg-blue-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Connected Network</div>
                    <div className="text-sm text-gray-600">
                      {currentChainId === 137 ? 'Polygon' : 
                       currentChainId === 1 ? 'Ethereum' : 
                       currentChainId === 42161 ? 'Arbitrum' :
                       currentChainId === 8453 ? 'Base' : `Chain ${currentChainId}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {balances.length} tokens found
                  </Badge>
                </div>
              </div>

              {/* Token Selection */}
              <div className="space-y-2">
                <Label htmlFor="fromToken">Select Token to Swap</Label>
                <Select 
                  value={selectedToken ? `${selectedToken.address}-${selectedToken.chainId}` : ''} 
                  onValueChange={(value) => {
                    const [address, chainId] = value.split('-');
                    const token = balances.find(t => 
                      t.address === address && t.chainId === parseInt(chainId)
                    );
                    setSelectedToken(token || null);
                    setAmount('');
                    setEstimatedUSDC('0');
                    setSwapData(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a token from your wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {balances.map((token) => (
                      <SelectItem 
                        key={`${token.address}-${token.chainId}`}
                        value={`${token.address}-${token.chainId}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.symbol}</span>
                            {token.isNative && <Badge variant="secondary" className="text-xs">Native</Badge>}
                          </div>
                          <span className="text-sm text-gray-600">
                            {token.formattedBalance}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedToken && (
                <>
                  {/* Selected Token Info */}
                  <div className="p-3 bg-green-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{selectedToken.symbol}</div>
                        <div className="text-sm text-gray-600">
                          Available: {selectedToken.formattedBalance}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {selectedToken.chainName}
                      </Badge>
                    </div>
                  </div>

                  {/* Network Switch Warning */}
                  {needsNetworkSwitch && (
                    <Alert>
                      <Network className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span>Switch to {selectedToken.chainName} to swap this token</span>
                          <Button
                            size="sm"
                            onClick={() => handleNetworkSwitch(selectedToken.chainId)}
                            className="ml-2"
                          >
                            Switch Network
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount to Swap</Label>
                    <div className="flex gap-2">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        max={selectedToken.formattedBalance}
                        step="any"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setAmount(selectedToken.formattedBalance)}
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  {/* Estimated Output */}
                  {estimatedUSDC !== '0' && (
                    <div className="p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estimated USDC:</span>
                        <span className="font-semibold text-green-600">{estimatedUSDC} USDC</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      onClick={getSwapQuote} 
                      disabled={!amount || parseFloat(amount) <= 0 || isLoadingQuote || needsNetworkSwitch}
                      className="w-full"
                      variant="outline"
                    >
                      {isLoadingQuote ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting Quote...
                        </>
                      ) : (
                        'Get Swap Quote'
                      )}
                    </Button>

                    <Button 
                      onClick={executeSwap}
                      disabled={!swapData || isPending || isConfirming || needsNetworkSwitch}
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

                  {/* Swap Details */}
                  {swapData && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1 text-sm">
                          <div>Network: {selectedToken.chainName}</div>
                          <div>Estimated Gas: {swapData.estimatedGas}</div>
                          <div>USDC sent to: {DEVELOPER_WALLETS[selectedToken.chainId as keyof typeof DEVELOPER_WALLETS]}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Balance Summary */}
      {balances.length > 0 && (
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Your Wallet Balances</CardTitle>
            <CardDescription>
              Tokens with balances in your connected wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balances.map((token) => (
                <div 
                  key={`${token.address}-${token.chainId}`}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    {token.isNative && <Badge variant="secondary" className="text-xs">Native</Badge>}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{token.formattedBalance}</div>
                    <div className="text-xs text-gray-500">{token.chainName}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}