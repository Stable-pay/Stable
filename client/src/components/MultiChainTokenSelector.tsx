import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowRight, Wallet, RefreshCw, AlertCircle, Zap } from 'lucide-react';

interface MultiChainTokenSelectorProps {
  onTokenSelect: (token: any, amount: string, inrAmount: string) => void;
}

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address: string;
  chainId: number;
  chainName: string;
  usdValue: number;
  logo?: string;
}

export function MultiChainTokenSelector({ onTokenSelect }: MultiChainTokenSelectorProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllTokenBalances = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      console.log(`Fetching balances for address: ${address}`);
      const response = await fetch(`/api/balance/all/${address}`);
      
      if (response.ok) {
        const balances = await response.json();
        console.log('Fetched balances:', balances);
        
        // Filter out zero balances and format the data
        const formattedBalances = balances
          .filter((balance: any) => parseFloat(balance.balance) > 0)
          .map((balance: any) => ({
            ...balance,
            usdValue: balance.usdValue || getTokenPriceEstimate(balance.symbol)
          }));
        
        setTokenBalances(formattedBalances);
      } else {
        console.error('Failed to fetch token balances:', response.status);
        setTokenBalances([]);
      }
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setTokenBalances([]);
    } finally {
      setLoading(false);
    }
  };

  const getTokenPriceEstimate = (symbol: string): number => {
    const prices: Record<string, number> = {
      'ETH': 3000,
      'BTC': 45000,
      'USDC': 1,
      'USDT': 1,
      'BNB': 300,
      'MATIC': 0.8,
      'AVAX': 35,
      'LINK': 15,
      'UNI': 8,
      'AAVE': 80,
      'WBTC': 45000,
      'DAI': 1,
      'BUSD': 1
    };
    return prices[symbol] || 1;
  };

  const refreshBalances = async () => {
    setRefreshing(true);
    await fetchAllTokenBalances();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchAllTokenBalances();
    }
  }, [isConnected, address]);

  const handleTokenSelect = (token: TokenBalance) => {
    setSelectedToken(token);
    setInrAmount('');
    setTokenAmount('');
  };

  const handleInrChange = (value: string) => {
    setInrAmount(value);
    if (value && parseFloat(value) > 0 && selectedToken) {
      const usdAmount = parseFloat(value) / 83.25; // INR to USD conversion
      const tokenAmountCalc = usdAmount / selectedToken.usdValue;
      setTokenAmount(tokenAmountCalc.toFixed(6));
    } else {
      setTokenAmount('');
    }
  };

  const handleContinue = () => {
    if (selectedToken && tokenAmount && inrAmount) {
      onTokenSelect(selectedToken, tokenAmount, inrAmount);
    }
  };

  const getChainColor = (chainId: number): string => {
    const colors: Record<number, string> = {
      1: 'bg-blue-500',     // Ethereum
      137: 'bg-purple-500', // Polygon
      56: 'bg-yellow-500',  // BSC
      42161: 'bg-blue-400', // Arbitrum
      10: 'bg-red-500',     // Optimism
      8453: 'bg-blue-600',  // Base
      43114: 'bg-red-600'   // Avalanche
    };
    return colors[chainId] || 'bg-gray-500';
  };

  if (!isConnected) {
    return (
      <Card className="max-w-3xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30 shadow-2xl">
        <CardContent className="p-12 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-6 text-[#6667AB]/50" />
          <h3 className="text-xl font-semibold text-[#6667AB] mb-3">Connect Your Wallet</h3>
          <p className="text-[#6667AB]/70">Connect your wallet to view token balances across all supported chains</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-[#FCFBF4] border-0 shadow-2xl">
      <CardHeader className="text-center pb-6 bg-gradient-to-r from-[#6667AB]/5 to-[#6667AB]/10">
        <CardTitle className="text-3xl text-[#6667AB] flex items-center justify-center gap-3">
          <Coins className="w-8 h-8" />
          Select Token for INR Conversion
        </CardTitle>
        <p className="text-[#6667AB]/70 text-lg mt-2">
          Choose from your available tokens across all supported chains
        </p>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Wallet Info & Refresh */}
        <div className="bg-gradient-to-r from-[#6667AB]/10 to-[#6667AB]/5 p-6 rounded-2xl border border-[#6667AB]/20">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[#6667AB]/70 mb-2">Connected Wallet</div>
              <div className="text-[#6667AB] font-mono text-lg font-semibold">
                {address?.slice(0, 16)}...{address?.slice(-12)}
              </div>
              <div className="text-sm text-[#6667AB]/60 mt-1">
                {tokenBalances.length} tokens found across {new Set(tokenBalances.map(t => t.chainId)).size} chains
              </div>
            </div>
            <Button
              onClick={refreshBalances}
              disabled={refreshing}
              className="bg-[#6667AB]/20 hover:bg-[#6667AB]/30 text-[#6667AB] border-[#6667AB]/30 rounded-xl px-6 py-3"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Token Selection */}
        {loading ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <RefreshCw className="w-12 h-12 text-[#6667AB] animate-spin" />
                <Zap className="w-6 h-6 text-[#6667AB] absolute top-3 left-3" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#6667AB] mb-2">Fetching Your Tokens</h3>
                <p className="text-[#6667AB]/70">Scanning all supported chains for your token balances...</p>
              </div>
            </div>
          </div>
        ) : tokenBalances.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-[#6667AB] text-xl font-semibold">Available Tokens</Label>
              <Badge className="bg-[#6667AB]/10 text-[#6667AB] border-[#6667AB]/30 px-4 py-2 text-sm">
                {tokenBalances.length} tokens
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {tokenBalances.map((token, index) => (
                <div
                  key={`${token.chainId}-${token.symbol}-${index}`}
                  onClick={() => handleTokenSelect(token)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedToken?.symbol === token.symbol && selectedToken?.chainId === token.chainId
                      ? 'border-[#6667AB] bg-gradient-to-r from-[#6667AB]/20 to-[#6667AB]/10 shadow-lg transform scale-105'
                      : 'border-[#6667AB]/20 hover:border-[#6667AB]/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#6667AB]/20 to-[#6667AB]/10 rounded-full flex items-center justify-center">
                        <span className="text-[#6667AB] font-bold text-lg">{token.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-bold text-[#6667AB] text-lg">{token.symbol}</div>
                        <div className="text-sm text-[#6667AB]/70">{token.name}</div>
                      </div>
                    </div>
                    <Badge 
                      className={`${getChainColor(token.chainId)} text-white text-xs px-3 py-1 rounded-full`}
                    >
                      {token.chainName}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6667AB]/70 text-sm">Balance:</span>
                      <span className="font-bold text-[#6667AB] text-lg">
                        {parseFloat(token.balance).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#6667AB]/70 text-sm">USD Value:</span>
                      <span className="font-semibold text-[#6667AB]">
                        ${(parseFloat(token.balance) * token.usdValue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto mb-6 text-[#6667AB]/50" />
            <h3 className="text-xl font-semibold text-[#6667AB] mb-3">No Tokens Found</h3>
            <p className="text-[#6667AB]/70 mb-6">
              No token balances found in your connected wallet across supported chains
            </p>
            <Button
              onClick={refreshBalances}
              className="bg-[#6667AB] hover:bg-[#6667AB]/90 text-[#FCFBF4] rounded-xl px-8 py-3"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh Balances
            </Button>
          </div>
        )}

        {/* INR Amount Input */}
        {selectedToken && (
          <div className="bg-gradient-to-r from-[#6667AB]/5 to-[#6667AB]/10 p-8 rounded-2xl border border-[#6667AB]/20">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[#6667AB] mb-2">
                  Convert {selectedToken.symbol} to INR
                </h3>
                <p className="text-[#6667AB]/70">Enter the amount you want to convert to Indian Rupees</p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[#6667AB] text-lg font-semibold">Amount in INR (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount in INR"
                  value={inrAmount}
                  onChange={(e) => handleInrChange(e.target.value)}
                  className="border-[#6667AB]/30 bg-white text-[#6667AB] placeholder:text-[#6667AB]/50 h-16 text-xl rounded-2xl px-6"
                />
              </div>

              {tokenAmount && (
                <div className="bg-gradient-to-r from-[#6667AB]/10 to-[#6667AB]/5 p-6 rounded-2xl border border-[#6667AB]/30">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[#6667AB] font-semibold text-lg">
                      {selectedToken.symbol} Amount:
                    </span>
                    <span className="font-bold text-[#6667AB] text-2xl">
                      {tokenAmount} {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="text-sm text-[#6667AB]/70 bg-[#FCFBF4] p-4 rounded-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>Rate: 1 USD = ₹83.25</div>
                      <div>1 {selectedToken.symbol} ≈ ${selectedToken.usdValue}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedToken || !inrAmount || !tokenAmount}
          className="w-full bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 hover:from-[#6667AB]/90 hover:to-[#6667AB]/70 text-[#FCFBF4] rounded-2xl h-16 text-xl font-bold shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-105"
        >
          Continue to KYC Verification
          <ArrowRight className="w-6 h-6 ml-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default MultiChainTokenSelector;