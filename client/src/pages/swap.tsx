import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { getTokensForNetwork, type NetworkKey, type TokenInfo } from "@/lib/tokens";
import { pricingService, type SwapQuote } from "@/lib/pricing";
import { ArrowUpDown, Settings, TrendingUp, Clock, Shield, Zap } from "lucide-react";

export default function Swap() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider();
  const { toast } = useToast();

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>('ethereum');
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const [slippage, setSlippage] = useState("0.5");
  const [isSwapping, setIsSwapping] = useState(false);

  // Load tokens for selected network
  useEffect(() => {
    const tokens = getTokensForNetwork(selectedNetwork);
    setAvailableTokens(tokens);
    if (tokens.length > 0 && !fromToken) {
      setFromToken(tokens[0]);
    }
  }, [selectedNetwork, fromToken]);

  // Get quote when amount or token changes
  useEffect(() => {
    const getQuote = async () => {
      if (!fromToken || !fromAmount || parseFloat(fromAmount) <= 0) {
        setQuote(null);
        return;
      }

      setIsLoadingQuote(true);
      try {
        const swapQuote = await pricingService.getSwapQuote(
          fromToken.symbol,
          'USDC',
          fromAmount,
          selectedNetwork
        );
        setQuote(swapQuote);
      } catch (error) {
        console.error('Failed to get quote:', error);
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const debounceTimer = setTimeout(getQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [fromToken, fromAmount, selectedNetwork]);

  const handleNetworkChange = (network: NetworkKey) => {
    setSelectedNetwork(network);
    setFromToken(null);
    setFromAmount("");
    setQuote(null);
  };

  const handleTokenSelect = (tokenSymbol: string) => {
    const token = availableTokens.find(t => t.symbol === tokenSymbol);
    if (token) {
      setFromToken(token);
    }
  };

  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to swap tokens",
        variant: "destructive",
      });
      return;
    }

    if (!quote || !fromToken) {
      toast({
        title: "Invalid Swap",
        description: "Please select tokens and enter an amount",
        variant: "destructive",
      });
      return;
    }

    setIsSwapping(true);

    try {
      // In production, this would execute the actual swap transaction
      const txHash = await executeSwapTransaction();
      
      toast({
        title: "Swap Successful",
        description: `Successfully swapped ${fromAmount} ${fromToken.symbol} to ${quote.toAmount} USDC`,
      });

      // Reset form
      setFromAmount("");
      setQuote(null);
    } catch (error: any) {
      toast({
        title: "Swap Failed",
        description: error.message || "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const executeSwapTransaction = async (): Promise<string> => {
    // Production swap execution would happen here
    await new Promise(resolve => setTimeout(resolve, 3000));
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  };

  const getNetworkIcon = (network: NetworkKey) => {
    const icons: Record<NetworkKey, string> = {
      ethereum: 'from-blue-500 to-blue-600',
      polygon: 'from-purple-500 to-purple-600',
      bsc: 'from-yellow-400 to-yellow-500',
      base: 'from-blue-400 to-indigo-500',
      arbitrum: 'from-blue-500 to-cyan-500',
      optimism: 'from-red-500 to-pink-500',
      avalanche: 'from-red-500 to-red-600'
    };
    return icons[network] || 'from-gray-500 to-gray-600';
  };

  const networkOptions: { value: NetworkKey; label: string }[] = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'bsc', label: 'BNB Chain' },
    { value: 'base', label: 'Base' },
    { value: 'arbitrum', label: 'Arbitrum' },
    { value: 'optimism', label: 'Optimism' },
    { value: 'avalanche', label: 'Avalanche' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
          Multi-Chain Token Swap
        </h1>
        <p className="text-xl text-slate-600">
          Swap any supported token to USDC with real-time pricing and automatic custody transfer
        </p>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Connect Your Wallet</h3>
                <p className="text-amber-700">Connect your wallet to start swapping tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Swap Card */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-slate-900">Token Swap</CardTitle>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Network Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700">Network</Label>
            <Select value={selectedNetwork} onValueChange={(value: NetworkKey) => handleNetworkChange(value)}>
              <SelectTrigger className="h-12 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {networkOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 bg-gradient-to-r ${getNetworkIcon(option.value)} rounded-full`}></div>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Token */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700">From</Label>
            <div className="border-2 border-slate-200 rounded-2xl p-6 focus-within:border-indigo-300 bg-slate-50/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-500">You pay</span>
                <span className="text-sm text-slate-500">
                  Balance: {isConnected ? '2.5432' : '0.00'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="border-0 text-3xl font-bold p-0 h-auto bg-transparent focus-visible:ring-0 text-slate-900"
                />
                <Select value={fromToken?.symbol || ""} onValueChange={handleTokenSelect}>
                  <SelectTrigger className="w-40 border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map(token => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                          <span>{token.symbol}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
              <ArrowUpDown className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* To USDC */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700">To</Label>
            <div className="border-2 border-slate-200 rounded-2xl p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-500">You receive</span>
                <span className="text-sm text-slate-500">Balance: 0.00</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold text-slate-900 flex-1">
                  {isLoadingQuote ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                      <span className="text-lg">Loading...</span>
                    </div>
                  ) : (
                    quote?.toAmount || "0.00"
                  )}
                </div>
                <div className="flex items-center space-x-2 bg-white rounded-xl px-4 py-2 shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <span className="font-semibold">USDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          {quote && (
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
              <h4 className="font-semibold text-slate-900 mb-3">Swap Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Rate
                  </span>
                  <span className="text-sm font-semibold">
                    1 {fromToken?.symbol} = {quote.rate.toFixed(6)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Price Impact
                  </span>
                  <Badge 
                    variant={quote.priceImpact > 0.01 ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {(quote.priceImpact * 100).toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Network Fee
                  </span>
                  <span className="text-sm font-semibold">{quote.gasEstimate} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Minimum Received</span>
                  <span className="text-sm font-semibold">{quote.minimumReceived} USDC</span>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Send Toggle */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <Switch
                id="auto-send"
                checked={autoSend}
                onCheckedChange={setAutoSend}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="auto-send" className="font-semibold text-indigo-900 cursor-pointer text-base">
                  Auto-transfer to custody wallet
                </Label>
                <p className="text-sm text-indigo-700 mt-2 leading-relaxed">
                  Automatically transfer swapped USDC to secure custody wallet for INR withdrawal eligibility
                </p>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={!isConnected || !quote || !fromAmount || parseFloat(fromAmount) <= 0 || isSwapping}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isSwapping ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                Processing Swap...
              </>
            ) : !isConnected ? (
              "Connect Wallet to Swap"
            ) : !quote ? (
              "Enter Amount"
            ) : (
              "Execute Swap"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
