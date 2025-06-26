import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Coins, ArrowRight, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  contractAddress: string;
  chainId: number;
  chainName: string;
  usdValue?: number;
  inrValue?: number;
}

interface TokenSelectionInterfaceProps {
  onTransferComplete: (transferData: any) => void;
}

const TokenSelectionInterface = ({ onTransferComplete }: TokenSelectionInterfaceProps) => {
  const { address } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  // Fetch all token balances across all chains
  const { data: balanceData, isLoading: balancesLoading, error: balanceError } = useQuery({
    queryKey: ['/api/balance/all', address],
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Fetch live exchange rates
  const { data: rateData } = useQuery({
    queryKey: ['/api/remittance/rates'],
    queryFn: async () => {
      if (!selectedToken?.symbol) return null;
      const response = await fetch(`/api/remittance/rates?from=${selectedToken.symbol}&to=inr`);
      return response.json();
    },
    enabled: !!selectedToken?.symbol,
    refetchInterval: 10000,
  });

  // Execute transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await fetch('/api/transfer/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transfer failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer Prepared",
        description: "Your token transfer is ready for execution.",
      });
      onTransferComplete(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update exchange rate when rate data changes
  useEffect(() => {
    if (rateData && typeof rateData === 'object' && 'inrRate' in rateData) {
      setExchangeRate((rateData as any).inrRate);
    }
  }, [rateData]);

  // Convert INR to token amount
  useEffect(() => {
    if (inrAmount && exchangeRate && selectedToken) {
      const inrValue = parseFloat(inrAmount);
      const tokenValue = inrValue / exchangeRate;
      setTokenAmount(tokenValue.toFixed(6));
    } else {
      setTokenAmount('');
    }
  }, [inrAmount, exchangeRate, selectedToken]);

  // Filter valid tokens with positive balances
  const validTokens = (balanceData as any)?.balances?.filter((token: TokenBalance) => {
    return parseFloat(token.balance) > 0;
  }) || [];

  const handleTokenSelect = (tokenKey: string) => {
    const token = validTokens.find((t: TokenBalance) => 
      `${t.symbol}-${t.chainId}-${t.contractAddress}` === tokenKey
    );
    setSelectedToken(token || null);
    setInrAmount('');
    setTokenAmount('');
  };

  const handleTransfer = () => {
    if (!selectedToken || !tokenAmount || !address) {
      toast({
        title: "Missing Information",
        description: "Please select a token and enter an amount.",
        variant: "destructive",
      });
      return;
    }

    const tokenAmountFloat = parseFloat(tokenAmount);
    const availableBalance = parseFloat(selectedToken.balance);

    if (tokenAmountFloat > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${selectedToken.balance} ${selectedToken.symbol} available.`,
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      walletAddress: address,
      tokenAddress: selectedToken.contractAddress,
      amount: tokenAmount,
      chainId: selectedToken.chainId,
      inrAmount: inrAmount,
      exchangeRate: exchangeRate,
    });
  };

  if (balancesLoading) {
    return (
      <Card className="w-full bg-[#FCFBF4] border border-[#6667AB]/20">
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#6667AB]" />
            <p className="text-[#6667AB] font-medium">Loading your token balances...</p>
            <p className="text-[#6667AB]/70 text-sm">Fetching from all supported chains</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balanceError) {
    return (
      <Card className="w-full bg-[#FCFBF4] border border-red-200">
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-red-600 font-medium">Failed to load token balances</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/balance/all', address] })}
              variant="outline"
              className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-[#FCFBF4]"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validTokens.length) {
    return (
      <Card className="w-full bg-[#FCFBF4] border border-[#6667AB]/20">
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <Wallet className="h-8 w-8 text-[#6667AB]/50" />
            <p className="text-[#6667AB] font-medium">No supported tokens found</p>
            <p className="text-[#6667AB]/70 text-sm text-center">
              Connect a wallet with supported tokens to begin converting to INR
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Selection */}
      <Card className="bg-[#FCFBF4] border border-[#6667AB]/20">
        <CardHeader>
          <CardTitle className="text-[#6667AB] flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Select Token for INR Conversion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token-select" className="text-[#6667AB] font-medium">
              Available Tokens ({validTokens.length})
            </Label>
            <Select onValueChange={handleTokenSelect}>
              <SelectTrigger className="bg-white border-[#6667AB]/30 text-[#6667AB]">
                <SelectValue placeholder="Choose a token to convert" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#6667AB]/30">
                {validTokens.map((token: TokenBalance) => (
                  <SelectItem 
                    key={`${token.symbol}-${token.chainId}-${token.contractAddress}`}
                    value={`${token.symbol}-${token.chainId}-${token.contractAddress}`}
                    className="text-[#6667AB] hover:bg-[#6667AB]/10"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-[#6667AB]/70">{token.chainName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{parseFloat(token.balance).toFixed(4)}</div>
                        <div className="text-xs text-[#6667AB]/70">
                          ₹{(parseFloat(token.balance) * (token.inrValue || 0)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedToken && (
            <div className="p-4 bg-white rounded-lg border border-[#6667AB]/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#6667AB]">{selectedToken.symbol}</h3>
                  <p className="text-sm text-[#6667AB]/70">{selectedToken.name}</p>
                  <p className="text-xs text-[#6667AB]/60">{selectedToken.chainName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-[#6667AB]">
                    {parseFloat(selectedToken.balance).toFixed(4)}
                  </p>
                  <p className="text-sm text-[#6667AB]/70">Available Balance</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* INR Input and Conversion */}
      {selectedToken && (
        <Card className="bg-[#FCFBF4] border border-[#6667AB]/20">
          <CardHeader>
            <CardTitle className="text-[#6667AB] flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Convert to Indian Rupees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inr-amount" className="text-[#6667AB] font-medium">
                  INR Amount
                </Label>
                <Input
                  id="inr-amount"
                  type="number"
                  placeholder="Enter INR amount"
                  value={inrAmount}
                  onChange={(e) => setInrAmount(e.target.value)}
                  className="bg-white border-[#6667AB]/30 text-[#6667AB] placeholder:text-[#6667AB]/50"
                />
                <p className="text-xs text-[#6667AB]/60 mt-1">
                  Minimum: ₹100 | Maximum: ₹10,00,000
                </p>
              </div>

              <div>
                <Label htmlFor="token-amount" className="text-[#6667AB] font-medium">
                  {selectedToken.symbol} Amount
                </Label>
                <Input
                  id="token-amount"
                  type="text"
                  value={tokenAmount}
                  readOnly
                  className="bg-[#6667AB]/5 border-[#6667AB]/30 text-[#6667AB]"
                />
                <p className="text-xs text-[#6667AB]/60 mt-1">
                  Rate: 1 {selectedToken.symbol} = ₹{exchangeRate.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {tokenAmount && (
              <div className="p-4 bg-white rounded-lg border border-[#6667AB]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6667AB] font-medium">Conversion Summary</span>
                  {rateData && (
                    <span className="text-xs text-[#6667AB]/60">
                      Live rates • Updated {new Date().toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6667AB]/70">You will transfer:</span>
                    <span className="font-medium text-[#6667AB]">
                      {tokenAmount} {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6667AB]/70">You will receive:</span>
                    <span className="font-medium text-[#6667AB]">
                      ₹{parseFloat(inrAmount || '0').toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6667AB]/70">Remaining balance:</span>
                    <span className="font-medium text-[#6667AB]">
                      {(parseFloat(selectedToken.balance) - parseFloat(tokenAmount || '0')).toFixed(4)} {selectedToken.symbol}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleTransfer}
              disabled={!inrAmount || !tokenAmount || transferMutation.isPending}
              className="w-full bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 hover:from-[#6667AB]/90 hover:to-[#6667AB]/70 text-[#FCFBF4] rounded-2xl h-12 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Preparing Transfer...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Approve Transfer to Admin Wallet
                </>
              )}
            </Button>

            <p className="text-xs text-[#6667AB]/60 text-center">
              Your tokens will be transferred to our secure admin wallet for INR conversion processing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TokenSelectionInterface;