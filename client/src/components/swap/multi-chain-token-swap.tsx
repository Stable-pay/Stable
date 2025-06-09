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
import { useMultiChainBalances, type TokenBalance } from "@/hooks/use-multi-chain-wallet";
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

export function MultiChainTokenSwap() {
  const { address, isConnected, chainId: currentChainId } = useAccount();
  const { toast } = useToast();
  const { switchChain } = useSwitchChain();
  
  // Multi-chain balances
  const { balances, isLoading: balancesLoading } = useMultiChainBalances();
  
  // Swap state
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [estimatedUSDC, setEstimatedUSDC] = useState<string>('0');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [swapData, setSwapData] = useState<any>(null);
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);
  
  // Transaction handling
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check if we need to switch networks
  useEffect(() => {
    if (selectedToken && currentChainId !== selectedToken.chainId) {
      setNeedsNetworkSwitch(true);
    } else {
      setNeedsNetworkSwitch(false);
    }
  }, [selectedToken, currentChainId]);

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
  const handleNetworkSwitch = async () => {
    if (!selectedToken) return;
    
    try {
      await switchChain({ chainId: selectedToken.chainId });
      toast({
        title: "Network Switched",
        description: `Switched to ${selectedToken.chainName}`
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
            Connect your wallet to view tokens across all chains and start swapping
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group balances by chain for better display
  const balancesByChain = balances.reduce((acc, token) => {
    if (!acc[token.chainId]) {
      acc[token.chainId] = [];
    }
    acc[token.chainId].push(token);
    return acc;
  }, {} as Record<number, TokenBalance[]>);

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Multi-Chain Token Swap
          </CardTitle>
          <CardDescription>
            Swap any token from any supported chain to USDC using 1inch API
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {balancesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading token balances across all chains...</p>
            </div>
          ) : balances.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No tokens with balances found across supported networks (Ethereum, Polygon, Arbitrum, Base)
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Token Selection */}
              <div className="space-y-2">
                <Label htmlFor="fromToken">Select Token to Swap</Label>
                <Select 
                  value={selectedToken ? `${selectedToken.chainId}-${selectedToken.address}` : ''} 
                  onValueChange={(value) => {
                    const [chainId, address] = value.split('-');
                    const token = balances.find(t => 
                      t.chainId === parseInt(chainId) && t.address === address
                    );
                    setSelectedToken(token || null);
                    setAmount('');
                    setEstimatedUSDC('0');
                    setSwapData(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a token to swap" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(balancesByChain).map(([chainId, tokens]) => (
                      <div key={chainId}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b">
                          {tokens[0]?.chainName}
                        </div>
                        {tokens.map((token) => (
                          <SelectItem 
                            key={`${token.chainId}-${token.address}`}
                            value={`${token.chainId}-${token.address}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{token.symbol}</span>
                                <Badge variant="outline" className="text-xs">
                                  {token.chainName}
                                </Badge>
                              </div>
                              <span className="text-sm text-gray-600">
                                {token.formattedBalance}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedToken && (
                <>
                  {/* Selected Token Info */}
                  <div className="p-3 bg-blue-50 rounded-lg border">
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
                            onClick={handleNetworkSwitch}
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
            <CardTitle className="text-lg">Token Balance Summary</CardTitle>
            <CardDescription>
              All tokens with balances across supported networks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(balancesByChain).map(([chainId, tokens]) => (
                <div key={chainId} className="border-l-2 border-blue-200 pl-3">
                  <div className="font-medium text-sm text-gray-700 mb-2">
                    {tokens[0]?.chainName} ({tokens.length} tokens)
                  </div>
                  <div className="space-y-1">
                    {tokens.map((token) => (
                      <div 
                        key={`${token.chainId}-${token.address}`}
                        className="flex justify-between text-sm"
                      >
                        <span>{token.symbol}</span>
                        <span className="font-mono">{token.formattedBalance}</span>
                      </div>
                    ))}
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