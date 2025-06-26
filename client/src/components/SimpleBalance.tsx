import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Coins, ArrowRight, Wallet } from 'lucide-react';

interface SimpleBalanceProps {
  onTokenSelect: (token: any, amount: string, inrAmount: string) => void;
}

export function SimpleBalance({ onTokenSelect }: SimpleBalanceProps) {
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
    <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Convert ETH to INR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#6667AB]/10 p-4 rounded-lg">
          <div className="text-sm text-[#6667AB]/70 mb-2">Connected Wallet</div>
          <div className="text-[#6667AB] font-mono text-sm">
            {address?.slice(0, 10)}...{address?.slice(-8)}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[#6667AB]">Amount in INR</Label>
          <Input
            type="number"
            placeholder="Enter INR amount"
            value={inrAmount}
            onChange={(e) => handleInrChange(e.target.value)}
            className="border-[#6667AB]/30"
          />
        </div>

        {tokenAmount && (
          <div className="bg-[#6667AB]/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-[#6667AB]">ETH Amount:</span>
              <span className="font-semibold text-[#6667AB]">
                {tokenAmount} ETH
              </span>
            </div>
            <div className="text-sm text-[#6667AB]/70 mt-1">
              Rate: 1 USD = ₹83.25 | 1 ETH ≈ $3,000
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

export default SimpleBalance;