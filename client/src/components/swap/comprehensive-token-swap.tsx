import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Wallet, AlertTriangle, CheckCircle, Loader2, Network, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useComprehensiveWalletBalances, type ComprehensiveTokenBalance } from "@/hooks/use-comprehensive-wallet-balances";
import { swapService } from "@/lib/swap-service";

// Network configurations for 1inch API and swapping
const NETWORK_MAPPING = {
  1: 'ethereum',
  137: 'polygon', 
  42161: 'arbitrum',
  8453: 'base',
  10: 'optimism',
  56: 'bsc',
  43114: 'avalanche'
} as const;

// Developer wallets for USDC collection across all networks
const DEVELOPER_WALLETS = {
  1: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  137: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  42161: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65', 
  8453: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  10: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  56: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65',
  43114: '0x742d35Cc6634C0532925a3b8D93B443A38A73f65'
} as const;

export function ComprehensiveTokenSwap() {
  const { address, isConnected, chainId: currentChainId } = useAccount();
  const { toast } = useToast();
  const { switchChain } = useSwitchChain();
  
  // Get comprehensive token balances from connected wallet
  const { 
    balances, 
    isLoading: balancesLoading, 
    currentChainName,
    supportedNetworks,
    totalTokensFound,
    nativeTokenFound,
    erc20TokensFound
  } = useComprehensiveWalletBalances();
  
  // Swap state
  const [selectedToken, setSelectedToken] = useState<ComprehensiveTokenBalance | null>(null);
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
        throw new Error(`Network ${selectedToken.chainName} not supported for swapping`);
      }

      // Convert amount to wei based on token decimals
      const amountInWei = parseUnits(amount, selectedToken.decimals).toString();

      console.log('Getting 1inch quote for:', {
        network,
        tokenAddress: selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address,
        amount: amountInWei,
        symbol: selectedToken.symbol
      });

      const result = await swapService.swapTokenToUSDC({
        userAddress: address,
        network,
        tokenAddress: selectedToken.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : selectedToken.address,
        amount: amountInWei,
        slippage: 1
      });

      setSwapData(result);
      setEstimatedUSDC(formatUnits(BigInt(result.expectedUSDC), 6));
      
      toast({
        title: "Live 1inch Quote Retrieved",
        description: `${formatUnits(BigInt(result.expectedUSDC), 6)} USDC will be sent to developer wallet on ${selectedToken.chainName}`
      });
    } catch (error) {
      console.error('1inch API error:', error);
      toast({
        title: "1inch API Error",
        description: `${error instanceof Error ? error.message : 'Unknown error'}. Check network connectivity and try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Switch to the required network for swapping
  const handleNetworkSwitch = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
      toast({
        title: "Network Switched",
        description: `Switched to ${selectedToken?.chainName || 'target network'} for token swapping`
      });
    } catch (error) {
      console.error('Network switch error:', error);
      toast({
        title: "Network Switch Failed",
        description: "Please switch network manually in your wallet to continue",
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
      console.log('Executing 1inch swap transaction:', swapData.transactionData);
      
      // Send the raw transaction data from 1inch API
      const txRequest = {
        to: swapData.transactionData.to,
        data: swapData.transactionData.data,
        value: swapData.transactionData.value,
        gasLimit: swapData.transactionData.gasLimit || swapData.transactionData.gas,
        gasPrice: swapData.transactionData.gasPrice
      };

      // Use window.ethereum to send the transaction directly
      if (window.ethereum) {
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: txRequest.to,
            data: txRequest.data,
            value: txRequest.value,
            gas: txRequest.gasLimit,
            gasPrice: txRequest.gasPrice
          }]
        });
        
        console.log('Transaction sent:', txHash);
        
        toast({
          title: "Transaction Submitted",
          description: `Swap transaction submitted to ${selectedToken.chainName} network`
        });
      }
    } catch (error) {
      console.error('Swap execution error:', error);
      toast({
        title: "Swap Failed",
        description: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && selectedToken) {
      toast({
        title: "Swap Completed Successfully!",
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet Required
          </CardTitle>
          <CardDescription>
            Connect your wallet to access comprehensive token swapping across all supported networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 mb-4">
              Supported Networks: {supportedNetworks.join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const needsNetworkSwitch = selectedToken && currentChainId !== selectedToken.chainId;
  const isSwappingSupported = selectedToken && NETWORK_MAPPING[selectedToken.chainId as keyof typeof NETWORK_MAPPING];

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Comprehensive Token Swap
          </CardTitle>
          <CardDescription>
            Swap any token from your wallet to USDC across all supported networks using 1inch API
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {balancesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Scanning your wallet for tokens across all networks...</p>
            </div>
          ) : balances.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No tokens with balances found in your wallet on {currentChainName}. 
                Switch to a different network to see tokens from other chains.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Wallet Overview */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="font-semibold text-lg">{totalTokensFound}</div>
                    <div className="text-xs text-gray-600">Total Tokens</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{erc20TokensFound}</div>
                    <div className="text-xs text-gray-600">ERC20 Tokens</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{currentChainName}</div>
                    <div className="text-xs text-gray-600">Current Network</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{nativeTokenFound ? 'Yes' : 'No'}</div>
                    <div className="text-xs text-gray-600">Native Token</div>
                  </div>
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
                  <SelectContent className="max-h-60">
                    {balances.map((token) => (
                      <SelectItem 
                        key={`${token.address}-${token.chainId}`}
                        value={`${token.address}-${token.chainId}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {token.chainName}
                            </Badge>
                            {token.isNative && <Badge variant="secondary" className="text-xs">Native</Badge>}
                          </div>
                          <span className="text-sm text-gray-600 ml-4">
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
                  {/* Selected Token Details */}
                  <div className="p-4 bg-green-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-lg">{selectedToken.symbol}</div>
                        <div className="text-sm text-gray-600">
                          Available: {selectedToken.formattedBalance}
                        </div>
                        <div className="text-xs text-gray-500">
                          Decimals: {selectedToken.decimals} | {selectedToken.isNative ? 'Native Token' : 'ERC20 Token'}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {selectedToken.chainName}
                        </Badge>
                        {isSwappingSupported ? (
                          <div className="text-xs text-green-600">✓ Swapping Supported</div>
                        ) : (
                          <div className="text-xs text-orange-600">⚠ Limited Support</div>
                        )}
                      </div>
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

                  {/* Swapping Not Supported Warning */}
                  {!isSwappingSupported && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Token swapping is not currently supported on {selectedToken.chainName}. 
                        Supported networks: Ethereum, Polygon, Arbitrum, Base, Optimism, BNB Chain, Avalanche.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Amount Input */}
                  {isSwappingSupported && (
                    <>
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
                            disabled={needsNetworkSwitch}
                          />
                          <Button
                            variant="outline"
                            onClick={() => setAmount(selectedToken.formattedBalance)}
                            disabled={needsNetworkSwitch}
                          >
                            Max
                          </Button>
                        </div>
                      </div>

                      {/* Estimated Output */}
                      {estimatedUSDC !== '0' && (
                        <div className="p-4 bg-green-50 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Estimated USDC Output:</span>
                            <span className="font-semibold text-green-600 text-lg">{estimatedUSDC} USDC</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            On {selectedToken.chainName} network
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
                              Getting Quote from 1inch...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Get Swap Quote
                            </>
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
                              {isPending ? 'Confirming Transaction...' : 'Processing Swap...'}
                            </>
                          ) : (
                            <>
                              <ArrowUpDown className="h-4 w-4 mr-2" />
                              Execute Token Swap
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Swap Transaction Details */}
                      {swapData && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1 text-sm">
                              <div><strong>Network:</strong> {selectedToken.chainName}</div>
                              <div><strong>Estimated Gas:</strong> {swapData.estimatedGas}</div>
                              <div><strong>USDC Destination:</strong> {DEVELOPER_WALLETS[selectedToken.chainId as keyof typeof DEVELOPER_WALLETS]}</div>
                              <div><strong>Slippage:</strong> 1.0%</div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}