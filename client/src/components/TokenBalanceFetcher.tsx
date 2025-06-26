import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, ArrowRight, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

interface TokenBalanceFetcherProps {
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
}

export function TokenBalanceFetcher({ onTokenSelect }: TokenBalanceFetcherProps) {
  const { address, isConnected } = useAppKitAccount();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');

  const fetchTokenBalances = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/balance/all/${address}`);
      if (response.ok) {
        const balances = await response.json();
        setTokenBalances(balances);
      } else {
        console.error('Failed to fetch token balances');
      }
    } catch (error) {
      console.error('Error fetching token balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchTokenBalances();
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
      const usdAmount = parseFloat(value) / 83.25; // INR to USD
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

  if (!isConnected) {
    return (
      <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-8 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-[#6667AB]/50" />
          <p className="text-[#6667AB]">Connect your wallet to continue</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-[#FCFBF4] border-0 shadow-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl text-[#6667AB] flex items-center justify-center gap-3">
          <Coins className="w-6 h-6" />
          Select Token for INR Conversion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Info */}
        <div className="bg-[#6667AB]/10 p-4 rounded-xl border border-[#6667AB]/20">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[#6667AB]/70 mb-1">Connected Wallet</div>
              <div className="text-[#6667AB] font-mono text-sm font-medium">
                {address?.slice(0, 12)}...{address?.slice(-10)}
              </div>
            </div>
            <Button
              onClick={fetchTokenBalances}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-[#6667AB]/30 text-[#6667AB]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Token Selection */}
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-[#6667AB] animate-spin" />
            <p className="text-[#6667AB]">Fetching token balances...</p>
          </div>
        ) : tokenBalances.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-[#6667AB] text-base font-medium">Available Tokens</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {tokenBalances.map((token, index) => (
                <div
                  key={`${token.chainId}-${token.symbol}-${index}`}
                  onClick={() => handleTokenSelect(token)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedToken?.symbol === token.symbol && selectedToken?.chainId === token.chainId
                      ? 'border-[#6667AB] bg-[#6667AB]/10'
                      : 'border-[#6667AB]/30 hover:border-[#6667AB]/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-[#6667AB]">{token.symbol}</div>
                      <div className="text-sm text-[#6667AB]/70">{token.chainName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[#6667AB]">{parseFloat(token.balance).toFixed(4)}</div>
                      <div className="text-sm text-[#6667AB]/70">
                        ${(parseFloat(token.balance) * token.usdValue).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[#6667AB]/50" />
            <p className="text-[#6667AB]">No token balances found</p>
            <p className="text-sm text-[#6667AB]/70">Make sure you have tokens in your wallet</p>
          </div>
        )}

        {/* INR Amount Input */}
        {selectedToken && (
          <div className="space-y-3">
            <Label className="text-[#6667AB] text-base font-medium">Amount in INR (₹)</Label>
            <Input
              type="number"
              placeholder="Enter amount in INR"
              value={inrAmount}
              onChange={(e) => handleInrChange(e.target.value)}
              className="border-[#6667AB]/30 bg-white text-[#6667AB] placeholder:text-[#6667AB]/50 h-12 text-lg rounded-xl"
            />
          </div>
        )}

        {/* Conversion Display */}
        {selectedToken && tokenAmount && (
          <div className="bg-gradient-to-r from-[#6667AB]/10 to-[#6667AB]/5 p-6 rounded-xl border border-[#6667AB]/20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[#6667AB] font-medium">{selectedToken.symbol} Amount:</span>
              <span className="font-bold text-[#6667AB] text-lg">
                {tokenAmount} {selectedToken.symbol}
              </span>
            </div>
            <div className="text-sm text-[#6667AB]/70 bg-[#FCFBF4] p-2 rounded-lg">
              Rate: 1 USD = ₹83.25 | 1 {selectedToken.symbol} ≈ ${selectedToken.usdValue}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedToken || !inrAmount || !tokenAmount}
          className="w-full bg-gradient-to-r from-[#6667AB] to-[#6667AB]/90 hover:from-[#6667AB]/90 hover:to-[#6667AB]/80 text-[#FCFBF4] rounded-2xl h-14 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          Continue to KYC Verification
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default TokenBalanceFetcher;