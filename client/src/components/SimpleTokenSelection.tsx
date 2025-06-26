import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Coins, ArrowRight, Wallet } from 'lucide-react';

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

interface SimpleTokenSelectionProps {
  onTokenSelect: (token: TokenBalance, amount: string, inrAmount: string) => void;
}

export function SimpleTokenSelection({ onTokenSelect }: SimpleTokenSelectionProps) {
  const { address } = useAccount();
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdToInrRate] = useState(83.25);

  // Fetch token balances
  const { data: tokenBalances = [], isLoading } = useQuery({
    queryKey: ['token-balances', address],
    queryFn: async (): Promise<TokenBalance[]> => {
      if (!address) return [];
      const response = await fetch(`/api/balance/all/${address}`);
      if (!response.ok) throw new Error('Failed to fetch balances');
      return response.json();
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Calculate token amount when INR amount changes
  useEffect(() => {
    if (selectedToken && inrAmount && selectedToken.usdValue) {
      const usdAmount = parseFloat(inrAmount) / usdToInrRate;
      const tokenAmount = usdAmount / selectedToken.usdValue;
      setTokenAmount(tokenAmount.toFixed(6));
    }
  }, [inrAmount, selectedToken, usdToInrRate]);

  const handleTokenSelect = (tokenSymbol: string) => {
    const token = tokenBalances.find(t => t.symbol === tokenSymbol);
    if (token) {
      setSelectedToken(token);
      setInrAmount('');
      setTokenAmount('');
    }
  };

  const handleContinue = () => {
    if (selectedToken && inrAmount && tokenAmount) {
      onTokenSelect(selectedToken, tokenAmount, inrAmount);
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#6667AB]" />
          <p className="text-[#6667AB]">Loading your token balances...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Select Token for INR Conversion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {tokenBalances.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-[#6667AB]/50" />
            <p className="text-[#6667AB]/70">No token balances found</p>
            <p className="text-sm text-[#6667AB]/50">Make sure your wallet has tokens on supported networks</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-[#6667AB]">Select Token</Label>
              <Select onValueChange={handleTokenSelect}>
                <SelectTrigger className="border-[#6667AB]/30">
                  <SelectValue placeholder="Choose a token from your wallet" />
                </SelectTrigger>
                <SelectContent>
                  {tokenBalances.map((token) => (
                    <SelectItem key={`${token.chainId}-${token.symbol}`} value={token.symbol}>
                      <div className="flex items-center justify-between w-full">
                        <span>{token.name} ({token.symbol})</span>
                        <span className="text-sm text-gray-500">
                          {parseFloat(token.balance).toFixed(4)} | {token.chainName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedToken && (
              <>
                <div className="space-y-2">
                  <Label className="text-[#6667AB]">Amount in INR</Label>
                  <Input
                    type="number"
                    placeholder="Enter INR amount"
                    value={inrAmount}
                    onChange={(e) => setInrAmount(e.target.value)}
                    className="border-[#6667AB]/30"
                  />
                </div>

                {tokenAmount && (
                  <div className="bg-[#6667AB]/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6667AB]">Token Amount:</span>
                      <span className="font-semibold text-[#6667AB]">
                        {tokenAmount} {selectedToken.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[#6667AB]/70">Available:</span>
                      <span className="text-[#6667AB]/70">
                        {parseFloat(selectedToken.balance).toFixed(4)} {selectedToken.symbol}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleContinue}
                  disabled={!inrAmount || !tokenAmount || parseFloat(tokenAmount) > parseFloat(selectedToken.balance)}
                  className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90 text-[#FCFBF4]"
                >
                  Continue to KYC
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SimpleTokenSelection;