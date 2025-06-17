import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowDownUp, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  RefreshCw,
  Wallet,
  Shield,
  Info
} from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';

interface ZeroXProductionSwapProps {
  onSwapComplete?: (result: any) => void;
  onSwapError?: (error: string) => void;
}

interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  sources: any[];
  permit2?: {
    eip712: any;
    signature?: string;
  };
  transaction?: {
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export function ZeroXProductionSwap({ onSwapComplete, onSwapError }: ZeroXProductionSwapProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { tokenBalances, isLoading: isLoadingBalances } = useWalletBalances();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedTokens, setSupportedTokens] = useState<any[]>([]);
  const [permit2Signature, setPermit2Signature] = useState<string | null>(null);

  // Available tokens from wallet balances
  const availableTokens = tokenBalances.filter((token: any) => 
    parseFloat(token.formattedBalance) > 0 && token.symbol !== 'USDC'
  );

  // Load supported tokens for the current chain
  useEffect(() => {
    if (chainId) {
      loadSupportedTokens();
    }
  }, [chainId]);

  const loadSupportedTokens = async () => {
    try {
      const response = await fetch(`/api/0x/tokens/${chainId}`);
      if (response.ok) {
        const data = await response.json();
        setSupportedTokens(data.tokens || []);
      }
    } catch (error) {
      console.error('Failed to load supported tokens:', error);
    }
  };

  const getLiveQuote = async () => {
    if (!selectedToken || !sellAmount || !address || !chainId) {
      setError('Missing required parameters for quote');
      return;
    }

    setIsLoadingQuote(true);
    setError(null);
    setQuote(null);

    try {
      console.log('Getting live 0x quote:', {
        chainId,
        sellToken: selectedToken.address,
        sellAmount: (parseFloat(sellAmount) * Math.pow(10, selectedToken.decimals || 18)).toString(),
        takerAddress: address
      });

      const response = await fetch('/api/0x/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          sellToken: selectedToken.address,
          sellAmount: (parseFloat(sellAmount) * Math.pow(10, selectedToken.decimals || 18)).toString(),
          slippagePercentage: '0.01',
          takerAddress: address
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get quote from 0x API');
      }

      const data = await response.json();
      console.log('0x Quote received:', data);
      
      if (data.success && data.quote) {
        setQuote(data.quote);
      } else {
        throw new Error('Invalid quote response');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      setError(errorMessage);
      onSwapError?.(errorMessage);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const signPermit2 = async () => {
    if (!quote || !quote.permit2 || !window.ethereum || !address) {
      setError('Permit2 signature requirements not met');
      return;
    }

    try {
      setError(null);
      
      // Sign the Permit2 EIP-712 message
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify(quote.permit2.eip712)]
      });

      setPermit2Signature(signature);
      console.log('Permit2 signature obtained:', signature);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign Permit2';
      setError(errorMessage);
      onSwapError?.(errorMessage);
    }
  };

  const executeSwap = async () => {
    if (!quote || !address || !chainId || !selectedToken) {
      setError('Missing requirements for swap execution');
      return;
    }

    setIsExecutingSwap(true);
    setError(null);

    try {
      console.log('Executing 0x swap:', {
        chainId,
        sellToken: selectedToken.address,
        sellAmount: (parseFloat(sellAmount) * Math.pow(10, selectedToken.decimals || 18)).toString(),
        takerAddress: address,
        permit2Signature
      });

      const response = await fetch('/api/0x/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          sellToken: selectedToken.address,
          sellAmount: (parseFloat(sellAmount) * Math.pow(10, selectedToken.decimals || 18)).toString(),
          slippagePercentage: '0.01',
          takerAddress: address,
          permit2Signature
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute swap');
      }

      const data = await response.json();
      console.log('0x Swap response:', data);

      if (data.success && data.transaction) {
        // Execute the transaction via user's wallet
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: data.transaction.to,
            data: data.transaction.data,
            value: data.transaction.value,
            gasPrice: data.transaction.gasPrice,
            gas: data.transaction.gas
          }]
        });

        setSwapResult({
          transactionHash: txHash,
          ...data.transaction
        });
        
        onSwapComplete?.({
          transactionHash: txHash,
          sellToken: selectedToken.symbol,
          buyToken: 'USDC',
          sellAmount,
          buyAmount: data.transaction.buyAmount
        });

      } else {
        throw new Error('Invalid swap response');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Swap execution failed';
      setError(errorMessage);
      onSwapError?.(errorMessage);
    } finally {
      setIsExecutingSwap(false);
    }
  };

  const resetSwap = () => {
    setQuote(null);
    setSwapResult(null);
    setError(null);
    setSellAmount('');
    setSelectedToken(null);
    setPermit2Signature(null);
  };

  const handleTokenSelect = (tokenAddress: string) => {
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setSelectedToken(token);
      setSellAmount('');
      setQuote(null);
      setError(null);
      setPermit2Signature(null);
    }
  };

  const handleMaxAmount = () => {
    if (selectedToken) {
      setSellAmount(selectedToken.formattedBalance);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
          <p className="text-[#6667AB] mb-4">Connect your wallet to use StablePay swaps</p>
          <Button className="btn-premium">Connect Wallet</Button>
        </CardContent>
      </Card>
    );
  }

  if (swapResult) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardHeader>
          <CardTitle className="text-[#6667AB] flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            StablePay Swap Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Transaction Hash:</span>
                <span className="font-mono text-sm text-[#6667AB]">
                  {swapResult.transactionHash?.slice(0, 10)}...{swapResult.transactionHash?.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Status:</span>
                <Badge className="bg-green-500 text-white">Completed</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={resetSwap}
              className="flex-1"
            >
              New Swap
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://etherscan.io/tx/${swapResult.transactionHash}`, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center gap-2">
          <Zap className="w-6 h-6" />
          StablePay Gasless Swap
          <Badge className="bg-[#6667AB] text-[#FCFBF4]">Live</Badge>
        </CardTitle>
        <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-[#6667AB]" />
            <p className="text-[#6667AB] text-sm font-medium">StablePay Swap Technology</p>
          </div>
          <p className="text-[#6667AB]/80 text-xs">
            Advanced swap infrastructure with optimal gas efficiency and MEV protection
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {isLoadingBalances && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#6667AB]" />
            <span className="ml-2 text-[#6667AB]">Loading wallet balances...</span>
          </div>
        )}

        {!isLoadingBalances && availableTokens.length === 0 && (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
            <p className="text-[#6667AB]/70 mb-2">No tokens available for swapping</p>
            <p className="text-[#6667AB]/60 text-sm">
              Your wallet doesn't have any token balances (excluding USDC)
            </p>
          </div>
        )}

        {!isLoadingBalances && availableTokens.length > 0 && (
          <div className="space-y-4">
            {/* Token Selection */}
            <div>
              <Label className="text-[#6667AB] font-medium">From Token</Label>
              <Select value={selectedToken?.address || ''} onValueChange={handleTokenSelect}>
                <SelectTrigger className="bg-white border-[#6667AB]/30 text-[#6667AB]">
                  <SelectValue placeholder="Select token to swap" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token: any) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.symbol}</span>
                        </div>
                        <span className="text-sm text-[#6667AB] font-medium ml-4">
                          {parseFloat(token.formattedBalance).toFixed(6)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            {selectedToken && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[#6667AB] font-medium">Amount</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMaxAmount}
                    className="text-[#6667AB] hover:bg-[#6667AB]/10 h-6 px-2"
                  >
                    MAX
                  </Button>
                </div>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  className="bg-white border-[#6667AB]/30 text-[#6667AB]"
                  max={selectedToken.formattedBalance}
                />
                <div className="mt-1 text-sm text-[#6667AB]/70">
                  Available: {parseFloat(selectedToken.formattedBalance).toFixed(6)} {selectedToken.symbol}
                </div>
              </div>
            )}

            {/* To Token (Always USDC) */}
            <div>
              <Label className="text-[#6667AB] font-medium">To Token</Label>
              <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6667AB] rounded-full flex items-center justify-center">
                    <span className="text-[#FCFBF4] font-bold text-sm">U</span>
                  </div>
                  <span className="text-[#6667AB] font-medium">USDC</span>
                  <Badge className="bg-[#6667AB] text-[#FCFBF4] text-xs">Target</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {selectedToken && sellAmount && !quote && (
                <Button 
                  className="btn-premium w-full"
                  onClick={getLiveQuote}
                  disabled={isLoadingQuote}
                >
                  {isLoadingQuote ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Live Quote...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Get 0x Quote
                    </>
                  )}
                </Button>
              )}

              {quote && (
                <div className="space-y-3">
                  <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-4">
                    <h4 className="text-[#6667AB] font-medium mb-2">Quote Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6667AB]/70">You Pay:</span>
                        <span className="text-[#6667AB]">{sellAmount} {selectedToken?.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6667AB]/70">You Receive:</span>
                        <span className="text-[#6667AB]">
                          {(parseFloat(quote.buyAmount) / 1000000).toFixed(6)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6667AB]/70">Price Impact:</span>
                        <span className="text-[#6667AB]">{quote.estimatedPriceImpact}%</span>
                      </div>
                    </div>
                  </div>

                  {quote.permit2 && !permit2Signature && (
                    <Button 
                      className="btn-premium w-full"
                      onClick={signPermit2}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Sign Permit2 (Required)
                    </Button>
                  )}

                  {(permit2Signature || !quote.permit2) && (
                    <Button 
                      className="btn-premium w-full"
                      onClick={executeSwap}
                      disabled={isExecutingSwap}
                    >
                      {isExecutingSwap ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Executing Swap...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Execute Swap
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}