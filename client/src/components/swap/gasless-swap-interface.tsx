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
  RefreshCw
} from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

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

  const [sellToken, setSellToken] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedTokens, setSupportedTokens] = useState<any[]>([]);

  // Common tokens for quick selection
  const commonTokens = [
    { symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', name: 'Ethereum' },
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether USD' },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'Dai Stablecoin' },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', name: 'Wrapped Bitcoin' },
    { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', name: 'Uniswap' }
  ];

  // Load supported tokens for current chain
  useEffect(() => {
    if (chainId) {
      loadSupportedTokens();
    }
  }, [chainId]);

  const loadSupportedTokens = async () => {
    try {
      const response = await fetch(`/api/swap/tokens/${chainId}`);
      if (response.ok) {
        const data = await response.json();
        setSupportedTokens(data.tokens || []);
      }
    } catch (error) {
      console.error('Failed to load supported tokens:', error);
    }
  };

  const getSwapQuote = async () => {
    if (!sellToken || !sellAmount || !address || !chainId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoadingQuote(true);
    setError(null);

    try {
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          sellToken,
          sellAmount: (parseFloat(sellAmount) * Math.pow(10, 18)).toString(), // Convert to wei
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
      setBuyAmount((parseFloat(data.quote.buyAmount) / Math.pow(10, 6)).toFixed(6)); // Convert from wei to USDC
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get swap quote');
      onSwapError?.(error instanceof Error ? error.message : 'Failed to get swap quote');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const executeGaslessSwap = async () => {
    if (!quote || !address || !chainId) {
      setError('No quote available');
      return;
    }

    setIsExecutingSwap(true);
    setError(null);

    try {
      const response = await fetch('/api/swap/gasless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          sellToken,
          sellAmount: (parseFloat(sellAmount) * Math.pow(10, 18)).toString(),
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
  };

  if (!isConnected) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
          <p className="text-[#6667AB] mb-4">Connect your wallet to use gasless swaps</p>
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
            Gasless Swap Completed
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
                <span className="text-[#6667AB]">{sellAmount} {swapResult.sellTokenSymbol} → {buyAmount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Network:</span>
                <span className="text-[#6667AB]">{swapResult.chainName}</span>
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
          Gasless Swap to USDC
          <Badge className="bg-green-500 text-white">0x Protocol</Badge>
        </CardTitle>
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

        <div className="space-y-4">
          {/* Sell Token Selection */}
          <div>
            <Label className="text-[#6667AB] font-medium">From Token</Label>
            <Select value={sellToken} onValueChange={setSellToken}>
              <SelectTrigger className="bg-white border-[#6667AB]/30 text-[#6667AB]">
                <SelectValue placeholder="Select token to swap" />
              </SelectTrigger>
              <SelectContent>
                {commonTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-sm text-gray-600">{token.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sell Amount */}
          <div>
            <Label className="text-[#6667AB] font-medium">Amount</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="bg-white border-[#6667AB]/30 text-[#6667AB]"
            />
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="p-2 border border-[#6667AB]/30 rounded-full bg-white">
              <ArrowDownUp className="w-4 h-4 text-[#6667AB]" />
            </div>
          </div>

          {/* Buy Token (Always USDC) */}
          <div>
            <Label className="text-[#6667AB] font-medium">To Token</Label>
            <div className="p-3 border border-[#6667AB]/30 rounded-md bg-gray-50 flex items-center justify-between">
              <span className="text-[#6667AB] font-medium">USDC</span>
              <Badge className="bg-[#6667AB] text-[#FCFBF4]">Stablecoin</Badge>
            </div>
          </div>

          {/* Buy Amount */}
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

          <Separator />

          {/* Quote Information */}
          {quote && (
            <div className="bg-[#6667AB]/5 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-[#6667AB]">Swap Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6667AB]/70">Rate:</span>
                  <span className="text-[#6667AB]">1 {quote.sellTokenSymbol} = {parseFloat(quote.price).toFixed(6)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6667AB]/70">Network Fee:</span>
                  <span className="text-green-600 font-medium">$0.00 (Gasless)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6667AB]/70">Protocol Fee:</span>
                  <span className="text-[#6667AB]">{(parseFloat(quote.protocolFee || '0') / Math.pow(10, 18)).toFixed(6)} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={getSwapQuote}
              disabled={!sellToken || !sellAmount || isLoadingQuote}
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
                    Execute Gasless Swap
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-[#6667AB]/60">
            Powered by 0x Protocol • Zero gas fees • Instant execution
          </div>
        </div>
      </CardContent>
    </Card>
  );
}