import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Coins, ArrowRight, Wallet } from 'lucide-react';

interface BalanceDisplayProps {
  onTokenSelect: (token: any, amount: string, inrAmount: string) => void;
}

export function BalanceDisplay({ onTokenSelect }: BalanceDisplayProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');

  const chainData: Record<number, { symbol: string; name: string }> = {
    1: { symbol: 'ETH', name: 'Ethereum' },
    137: { symbol: 'MATIC', name: 'Polygon' },
    56: { symbol: 'BNB', name: 'BSC' },
    42161: { symbol: 'ETH', name: 'Arbitrum' },
    10: { symbol: 'ETH', name: 'Optimism' },
    8453: { symbol: 'ETH', name: 'Base' },
    43114: { symbol: 'AVAX', name: 'Avalanche' }
  };

  const currentChain = chainData[Number(chainId) || 1] || chainData[1];

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isConnected) {
        setBalance('0');
        return;
      }
      
      setIsLoading(true);
      
      // Simulate balance fetch - replace with actual RPC call
      setTimeout(() => {
        setBalance('0.0');
        setIsLoading(false);
      }, 1000);
    };

    fetchBalance();
  }, [address, isConnected, chainId]);

  useEffect(() => {
    if (inrAmount && parseFloat(inrAmount) > 0) {
      const ethPrice = 3000;
      const usdAmount = parseFloat(inrAmount) / 83.25;
      const tokenAmountCalc = usdAmount / ethPrice;
      setTokenAmount(tokenAmountCalc.toFixed(6));
    } else {
      setTokenAmount('');
    }
  }, [inrAmount]);

  const handleContinue = () => {
    if (tokenAmount && inrAmount) {
      const tokenData = {
        symbol: currentChain.symbol,
        name: currentChain.name,
        balance: balance,
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        chainId: Number(chainId) || 1,
        chainName: currentChain.name,
        usdValue: 3000
      };
      
      onTokenSelect(tokenData, tokenAmount, inrAmount);
    }
  };

  if (!isConnected) {
    return (
      <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-8 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-[#6667AB]/50" />
          <p className="text-[#6667AB]">Connect your wallet to view token balances</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#6667AB]" />
          <p className="text-[#6667AB]">Fetching your token balances...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Convert {currentChain.symbol} to INR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#6667AB]/10 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[#6667AB]">Available {currentChain.symbol}:</span>
            <span className="font-semibold text-[#6667AB]">
              {balance} {currentChain.symbol}
            </span>
          </div>
          <div className="text-sm text-[#6667AB]/70 mt-1">
            Network: {currentChain.name}
          </div>
          <div className="text-sm text-[#6667AB]/70">
            Address: {address?.slice(0, 8)}...{address?.slice(-6)}
          </div>
        </div>

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
              <span className="text-[#6667AB]">{currentChain.symbol} Amount:</span>
              <span className="font-semibold text-[#6667AB]">
                {tokenAmount} {currentChain.symbol}
              </span>
            </div>
            <div className="text-sm text-[#6667AB]/70 mt-1">
              Rate: 1 USD = ₹83.25 | 1 {currentChain.symbol} ≈ $3,000
            </div>
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={!inrAmount || !tokenAmount}
          className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90 text-[#FCFBF4] rounded-2xl"
        >
          Continue to KYC
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default BalanceDisplay;