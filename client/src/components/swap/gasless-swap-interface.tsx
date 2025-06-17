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
  Percent
} from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';

interface GaslessSwapInterfaceProps {
  onSwapComplete?: (result: any) => void;
  onSwapError?: (error: string) => void;
}

interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  estimatedGas: string;
  protocolFee: string;
  minimumProtocolFee: string;
  sources: any[];
  chainId: number;
  chainName: string;
  sellTokenSymbol: string;
  buyTokenSymbol: string;
}

export function GaslessSwapInterface({ onSwapComplete, onSwapError }: GaslessSwapInterfaceProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { tokenBalances, isLoading: isLoadingBalances } = useWalletBalances();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyToken, setBuyToken] = useState('USDC'); // Force USDC as target token
  const [buyAmount, setBuyAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter tokens with positive balances for swapping
  const availableTokens = tokenBalances.filter((token: any) => 
    parseFloat(token.formattedBalance) > 0
  );

  const getSwapQuote = async () => {
    if (!selectedToken || !sellAmount || !address || !chainId) {
      setError('Please select a token and enter amount');
      return;
    }

    setIsLoadingQuote(true);
    setError(null);

    try {
      const decimals = selectedToken.decimals || 18;
      const sellAmountWei = (parseFloat(sellAmount) * Math.pow(10, decimals)).toString();
      
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          sellToken: selectedToken.address,
          sellAmount: sellAmountWei,
          takerAddress: address,
          slippagePercentage: '0.01'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get swap quote');
      }

      const data = await response.json();
      setQuote(data.quote);
      setBuyAmount((parseFloat(data.quote.buyAmount) / Math.pow(10, 6)).toFixed(6));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get swap quote');
      onSwapError?.(error instanceof Error ? error.message : 'Failed to get swap quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const executeGaslessSwap = async () => {
    if (!quote || !address || !chainId || !selectedToken) {
      setError('No quote available');
      return;
    }

    setIsExecutingSwap(true);
    setError(null);

    try {
      const decimals = selectedToken.decimals || 18;
      const sellAmountWei = (parseFloat(sellAmount) * Math.pow(10, decimals)).toString();
      
      const response = await fetch('/api/swap/gasless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          sellToken: selectedToken.address,
          sellAmount: sellAmountWei,
          takerAddress: address,
          slippagePercentage: '0.01'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute gasless swap');
      }

      const data = await response.json();
      setSwapResult(data.transaction);
      onSwapComplete?.(data.transaction);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to execute gasless swap');
      onSwapError?.(error instanceof Error ? error.message : 'Failed to execute gasless swap');
    } finally {
      setIsExecutingSwap(false);
    }
  };

  const resetSwap = () => {
    setQuote(null);
    setSwapResult(null);
    setError(null);
    setSellAmount('');
    setBuyAmount('');
    setSelectedToken(null);
  };

  const handleTokenSelect = (tokenAddress: string) => {
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setSelectedToken(token);
      setSellAmount('');
      setBuyAmount('');
      setQuote(null);
      setError(null);
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
          <p className="text-[#6667AB] mb-4">Connect your wallet to use instant swaps</p>
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
            Instant Swap Completed
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
                <span className="text-[#6667AB]/70">Swapped:</span>
                <span className="text-[#6667AB]">{sellAmount} {selectedToken?.symbol} → {buyAmount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Network:</span>
                <span className="text-[#6667AB]">{swapResult.chainName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Gas Fee:</span>
                <span className="text-green-600 font-medium">$0.00 (Zero Gas)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={resetSwap} className="btn-premium flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              New Swap
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://etherscan.io/tx/${swapResult.transactionHash}`, '_blank')}
              className="flex-1 border-[#6667AB]/30 text-[#6667AB]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Transaction
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
          Step 1: Convert to USDC
          <Badge className="bg-[#6667AB] text-[#FCFBF4]">Zero Gas</Badge>
        </CardTitle>
        <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-3 mt-3">
          <p className="text-[#6667AB] text-sm font-medium mb-2">Mandatory USDC Conversion</p>
          <p className="text-[#6667AB]/80 text-xs">
            All tokens must be converted to USDC first before INR conversion. This ensures optimal rates and compliance with our banking partners.
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

        {/* Show loading state for wallet balances */}
        {isLoadingBalances && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#6667AB]" />
            <span className="ml-2 text-[#6667AB]">Loading wallet balances...</span>
          </div>
        )}

        {/* Show message when no tokens available */}
        {!isLoadingBalances && availableTokens.length === 0 && (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
            <p className="text-[#6667AB]/70 mb-2">No tokens available for swapping</p>
            <p className="text-[#6667AB]/60 text-sm">
              Your connected wallet doesn't have any token balances to swap
            </p>
          </div>
        )}

        {/* Token selection and swap interface */}
        {!isLoadingBalances && availableTokens.length > 0 && (
          <div className="space-y-4">
            {/* Available Token Selection */}
            <div>
              <Label className="text-[#6667AB] font-medium">From Token (Available Balance)</Label>
              <Select value={selectedToken?.address || ''} onValueChange={handleTokenSelect}>
                <SelectTrigger className="bg-white border-[#6667AB]/30 text-[#6667AB]">
                  <SelectValue placeholder="Select token from your wallet" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token: any) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.symbol}</span>
                          <span className="text-sm text-gray-600">{token.name}</span>
                        </div>
                        <span className="text-sm text-[#6667AB] font-medium ml-4">
                          {parseFloat(token.formattedBalance).toFixed(6)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedToken && (
                <div className="mt-2 text-sm text-[#6667AB]/70">
                  Available: {parseFloat(selectedToken.formattedBalance).toFixed(6)} {selectedToken.symbol}
                </div>
              )}
            </div>

            {/* Sell Amount */}
            {selectedToken && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[#6667AB] font-medium">Amount to Swap</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMaxAmount}
                    className="text-[#6667AB] hover:bg-[#6667AB]/10 h-6 px-2"
                  >
                    <Percent className="w-3 h-3 mr-1" />
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
                <div className="mt-1 text-xs text-[#6667AB]/60">
                  Max: {parseFloat(selectedToken.formattedBalance).toFixed(6)} {selectedToken.symbol}
                </div>
              </div>
            )}

            {/* Swap Arrow */}
            {selectedToken && (
              <div className="flex justify-center">
                <div className="p-2 border border-[#6667AB]/30 rounded-full bg-white">
                  <ArrowDownUp className="w-4 h-4 text-[#6667AB]" />
                </div>
              </div>
            )}

            {/* Buy Token (Always USDC) */}
            {selectedToken && (
              <div>
                <Label className="text-[#6667AB] font-medium">To Token</Label>
                <div className="p-3 border border-[#6667AB]/30 rounded-md bg-gray-50 flex items-center justify-between">
                  <span className="text-[#6667AB] font-medium">USDC</span>
                  <Badge className="bg-[#6667AB] text-[#FCFBF4]">Stablecoin</Badge>
                </div>
              </div>
            )}

            {/* Buy Amount */}
            {selectedToken && (
              <div>
                <Label className="text-[#6667AB] font-medium">You will receive</Label>
                <Input
                  type="text"
                  placeholder="0.0"
                  value={buyAmount}
                  readOnly
                  className="bg-gray-50 border-[#6667AB]/30 text-[#6667AB]"
                />
              </div>
            )}

            {selectedToken && <Separator />}

            {/* Quote Information */}
            {quote && selectedToken && (
              <div className="bg-[#6667AB]/5 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-[#6667AB]">Swap Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6667AB]/70">Rate:</span>
                    <span className="text-[#6667AB]">1 {selectedToken.symbol} = {parseFloat(quote.price).toFixed(6)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6667AB]/70">Network Fee:</span>
                    <span className="text-green-600 font-medium">$0.00 (Zero Gas)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6667AB]/70">Slippage:</span>
                    <span className="text-[#6667AB]">1%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedToken && (
              <div className="flex gap-3">
                <Button
                  onClick={getSwapQuote}
                  disabled={!sellAmount || isLoadingQuote}
                  className="flex-1 btn-premium"
                >
                  {isLoadingQuote ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Quote...
                    </>
                  ) : (
                    'Get Quote'
                  )}
                </Button>

                {quote && (
                  <Button
                    onClick={executeGaslessSwap}
                    disabled={isExecutingSwap}
                    className="flex-1 btn-premium bg-green-600 hover:bg-green-700"
                  >
                    {isExecutingSwap ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Swapping...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Execute Instant Swap
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            <div className="text-center text-sm text-[#6667AB]/60">
              Powered by StablePay • Zero gas fees • Instant execution
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}