import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, ArrowRight, Wallet } from 'lucide-react';

interface CleanBalanceProps {
  onTokenSelect: (token: any, amount: string, inrAmount: string) => void;
}

export function CleanBalance({ onTokenSelect }: CleanBalanceProps) {
  const { address, isConnected } = useAppKitAccount();
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');

  const handleInrChange = (value: string) => {
    setInrAmount(value);
    if (value && parseFloat(value) > 0) {
      const ethPrice = 3000;
      const usdAmount = parseFloat(value) / 83.25;
      const ethAmount = usdAmount / ethPrice;
      setTokenAmount(ethAmount.toFixed(6));
    } else {
      setTokenAmount('');
    }
  };

  const handleContinue = () => {
    if (tokenAmount && inrAmount) {
      const tokenData = {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '1.0',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        chainId: 1,
        chainName: 'Ethereum',
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
          Convert ETH to INR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#6667AB]/10 p-4 rounded-xl border border-[#6667AB]/20">
          <div className="text-sm text-[#6667AB]/70 mb-2">Connected Wallet</div>
          <div className="text-[#6667AB] font-mono text-sm font-medium">
            {address?.slice(0, 12)}...{address?.slice(-10)}
          </div>
        </div>

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

        {tokenAmount && (
          <div className="bg-gradient-to-r from-[#6667AB]/10 to-[#6667AB]/5 p-6 rounded-xl border border-[#6667AB]/20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[#6667AB] font-medium">ETH Amount:</span>
              <span className="font-bold text-[#6667AB] text-lg">
                {tokenAmount} ETH
              </span>
            </div>
            <div className="text-sm text-[#6667AB]/70 bg-[#FCFBF4] p-2 rounded-lg">
              Rate: 1 USD = ₹83.25 | 1 ETH ≈ $3,000
            </div>
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={!inrAmount || !tokenAmount}
          className="w-full bg-gradient-to-r from-[#6667AB] to-[#6667AB]/90 hover:from-[#6667AB]/90 hover:to-[#6667AB]/80 text-[#FCFBF4] rounded-2xl h-14 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          Continue to KYC Verification
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default CleanBalance;