import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
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

interface WalletBalanceFetcherProps {
  onTokenSelect: (token: TokenBalance, amount: string, inrAmount: string) => void;
}

export function WalletBalanceFetcher({ onTokenSelect }: WalletBalanceFetcherProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdToInrRate] = useState(83.25);

  const currentChainId = Number(chainId) || 1;

  const getChainData = () => {
    const chainData: Record<number, { symbol: string; name: string; rpc: string }> = {
      1: { symbol: 'ETH', name: 'Ethereum', rpc: 'https://ethereum-rpc.publicnode.com' },
      137: { symbol: 'MATIC', name: 'Polygon', rpc: 'https://polygon-rpc.com' },
      56: { symbol: 'BNB', name: 'BSC', rpc: 'https://bsc-dataseed1.binance.org' },
      42161: { symbol: 'ETH', name: 'Arbitrum', rpc: 'https://arbitrum-one.publicnode.com' },
      10: { symbol: 'ETH', name: 'Optimism', rpc: 'https://optimism.publicnode.com' },
      8453: { symbol: 'ETH', name: 'Base', rpc: 'https://base-rpc.publicnode.com' },
      43114: { symbol: 'AVAX', name: 'Avalanche', rpc: 'https://avalanche-c-chain.publicnode.com' }
    };
    return chainData[currentChainId] || chainData[1];
  };

  // Fetch balance using direct RPC call
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isConnected) {
        setBalance('0');
        return;
      }
      
      setIsLoading(true);
      try {
        const chainData = getChainData();
        
        const response = await fetch(chainData.rpc, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1
          })
        });

        const data = await response.json();
        if (data.result) {
          // Convert hex to decimal and then to ether
          const balanceWei = BigInt(data.result);
          const balanceEth = Number(balanceWei) / Math.pow(10, 18);
          setBalance(balanceEth.toFixed(6));
        } else {
          setBalance('0');
        }
      } catch (error) {
        console.error('Balance fetch failed:', error);
        setBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [address, isConnected, currentChainId]);

  // Calculate token amount when INR amount changes
  useEffect(() => {
    if (inrAmount && parseFloat(inrAmount) > 0) {
      const ethPriceUsd = 3000;
      const usdAmount = parseFloat(inrAmount) / usdToInrRate;
      const ethAmount = usdAmount / ethPriceUsd;
      setTokenAmount(ethAmount.toFixed(6));
    } else {
      setTokenAmount('');
    }
  }, [inrAmount, usdToInrRate]);

  const handleContinue = () => {
    if (tokenAmount && inrAmount && parseFloat(balance) > 0) {
      const chainData = getChainData();
      const tokenData: TokenBalance = {
        symbol: chainData.symbol,
        name: chainData.name,
        balance: balance,
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        chainId: currentChainId,
        chainName: chainData.name,
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

  const chainData = getChainData();

  return (
    <Card className="max-w-2xl mx-auto bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Convert {chainData.symbol} to INR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#6667AB]/10 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[#6667AB]">Available {chainData.symbol}:</span>
            <span className="font-semibold text-[#6667AB]">
              {parseFloat(balance).toFixed(6)} {chainData.symbol}
            </span>
          </div>
          <div className="text-sm text-[#6667AB]/70 mt-1">
            Network: {chainData.name}
          </div>
          <div className="text-sm text-[#6667AB]/70">
            Address: {address?.slice(0, 8)}...{address?.slice(-6)}
          </div>
        </div>

        {parseFloat(balance) > 0 ? (
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
                  <span className="text-[#6667AB]">{chainData.symbol} Amount:</span>
                  <span className="font-semibold text-[#6667AB]">
                    {tokenAmount} {chainData.symbol}
                  </span>
                </div>
                <div className="text-sm text-[#6667AB]/70 mt-1">
                  Rate: 1 USD = ₹{usdToInrRate} | 1 {chainData.symbol} ≈ $3,000
                </div>
              </div>
            )}

            <Button
              onClick={handleContinue}
              disabled={!inrAmount || !tokenAmount || parseFloat(tokenAmount) > parseFloat(balance)}
              className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90 text-[#FCFBF4] rounded-2xl"
            >
              Continue to KYC
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#6667AB]/70">No {chainData.symbol} balance found</p>
            <p className="text-sm text-[#6667AB]/50">Add {chainData.symbol} to your wallet to continue</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WalletBalanceFetcher;