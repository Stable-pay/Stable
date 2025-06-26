import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface WalletTokenBalanceProps {
  onTokenSelect: (token: TokenBalance, amount: string, inrAmount: string) => void;
}

export function WalletTokenBalance({ onTokenSelect }: WalletTokenBalanceProps) {
  const { address, isConnected } = useAppKitAccount();
  const { address: wagmiAddress } = useAccount();
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}` || wagmiAddress,
  });
  
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdToInrRate] = useState(83.25);

  const nativeBalance = balanceData ? parseFloat(balanceData.formatted) : 0;

  // Calculate token amount when INR amount changes
  useEffect(() => {
    if (inrAmount && parseFloat(inrAmount) > 0) {
      // Simple calculation: assume 1 ETH = $3000 for demo
      const ethPriceUsd = 3000;
      const usdAmount = parseFloat(inrAmount) / usdToInrRate;
      const ethAmount = usdAmount / ethPriceUsd;
      setTokenAmount(ethAmount.toFixed(6));
    } else {
      setTokenAmount('');
    }
  }, [inrAmount, usdToInrRate]);

  const handleContinue = () => {
    if (tokenAmount && inrAmount && nativeBalance > 0) {
      const tokenData: TokenBalance = {
        symbol: balanceData?.symbol || 'ETH',
        name: 'Ethereum',
        balance: balanceData?.formatted || '0',
        decimals: balanceData?.decimals || 18,
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
          <p className="text-[#6667AB]">Connect your wallet to view token balances</p>
        </CardContent>
      </Card>
    );
  }

  if (balanceLoading) {
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
          Convert {balanceData?.symbol || 'ETH'} to INR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#6667AB]/10 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[#6667AB]">Available {balanceData?.symbol || 'ETH'}:</span>
            <span className="font-semibold text-[#6667AB]">
              {nativeBalance.toFixed(6)} {balanceData?.symbol || 'ETH'}
            </span>
          </div>
          <div className="text-sm text-[#6667AB]/70 mt-1">
            Connected Address: {address?.slice(0, 8)}...{address?.slice(-6)}
          </div>
        </div>

        {nativeBalance > 0 ? (
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
                  <span className="text-[#6667AB]">{balanceData?.symbol || 'ETH'} Amount:</span>
                  <span className="font-semibold text-[#6667AB]">
                    {tokenAmount} {balanceData?.symbol || 'ETH'}
                  </span>
                </div>
                <div className="text-sm text-[#6667AB]/70 mt-1">
                  Rate: 1 USD = ₹{usdToInrRate} | 1 {balanceData?.symbol || 'ETH'} ≈ $3,000
                </div>
              </div>
            )}

            <Button
              onClick={handleContinue}
              disabled={!inrAmount || !tokenAmount || parseFloat(tokenAmount) > nativeBalance}
              className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90 text-[#FCFBF4]"
            >
              Continue to KYC
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#6667AB]/70">No {balanceData?.symbol || 'ETH'} balance found</p>
            <p className="text-sm text-[#6667AB]/50">Add {balanceData?.symbol || 'ETH'} to your wallet to continue</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WalletTokenBalance;