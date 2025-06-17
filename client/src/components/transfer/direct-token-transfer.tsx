import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  Wallet,
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Info,
  Send
} from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { 
  getBinanceTokensByChain,
  getBinanceChainById,
  isTokenSupportedByBinance,
  getDeveloperWallet
} from '@/../../shared/binance-supported-tokens';

interface DirectTokenTransferProps {
  onTransferComplete?: (result: any) => void;
  onTransferError?: (error: string) => void;
}

interface TransferResult {
  transactionHash: string;
  tokenSymbol: string;
  amount: string;
  developerWallet: string;
  status: 'pending' | 'completed' | 'failed';
}

export function DirectTokenTransfer({ onTransferComplete, onTransferError }: DirectTokenTransferProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { tokenBalances, isLoading: isLoadingBalances } = useWalletBalances();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [isExecutingTransfer, setIsExecutingTransfer] = useState(false);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usdToInrRate, setUsdToInrRate] = useState(84.25);

  // Filter for Binance-supported tokens only
  const currentChainId = chainId as number || 1;
  const binanceSupportedTokens = tokenBalances.filter((token: any) => {
    return isTokenSupportedByBinance(token.symbol, currentChainId) && 
           parseFloat(token.formattedBalance) > 0;
  });

  const currentChain = getBinanceChainById(currentChainId);
  const developerWallet = getDeveloperWallet(currentChainId);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates && data.rates.INR) {
          setUsdToInrRate(data.rates.INR);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    };

    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 30000);
    return () => clearInterval(interval);
  }, []);

  const executeDirectTransfer = async () => {
    if (!selectedToken || !transferAmount || !address || !currentChainId || !developerWallet) {
      setError('Missing required parameters for transfer');
      return;
    }

    if (!isTokenSupportedByBinance(selectedToken.symbol, currentChainId)) {
      setError('Selected token is not supported by Binance');
      return;
    }

    setIsExecutingTransfer(true);
    setError(null);

    try {
      console.log('Executing direct transfer:', {
        chainId,
        token: selectedToken.symbol,
        amount: transferAmount,
        from: address,
        to: developerWallet
      });

      if (!window.ethereum) {
        throw new Error('No wallet provider found');
      }

      const decimals = selectedToken.decimals || 18;
      const amountInWei = (parseFloat(transferAmount) * Math.pow(10, decimals)).toString();

      let transactionHash: string;

      if (selectedToken.symbol === 'ETH' || selectedToken.symbol === 'BNB' || selectedToken.symbol === 'MATIC' || selectedToken.symbol === 'AVAX') {
        const txParams = {
          from: address,
          to: developerWallet,
          value: '0x' + BigInt(amountInWei).toString(16),
          gas: '0x5208',
        };

        transactionHash = await (window.ethereum as any).request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });
      } else {
        const tokenContract = selectedToken.address;
        const transferData = `0xa9059cbb000000000000000000000000${developerWallet.slice(2)}${BigInt(amountInWei).toString(16).padStart(64, '0')}`;

        const txParams = {
          from: address,
          to: tokenContract,
          data: transferData,
          gas: '0x15F90',
        };

        transactionHash = await (window.ethereum as any).request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });
      }

      const result: TransferResult = {
        transactionHash,
        tokenSymbol: selectedToken.symbol,
        amount: transferAmount,
        developerWallet,
        status: 'completed'
      };

      setTransferResult(result);
      onTransferComplete?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer execution failed';
      setError(errorMessage);
      onTransferError?.(errorMessage);
    } finally {
      setIsExecutingTransfer(false);
    }
  };

  const resetTransfer = () => {
    setTransferResult(null);
    setError(null);
    setTransferAmount('');
    setSelectedToken(null);
  };

  const handleTokenSelect = (tokenAddress: string) => {
    const token = binanceSupportedTokens.find(t => t.address === tokenAddress);
    if (token) {
      setSelectedToken(token);
      setTransferAmount('');
      setError(null);
    }
  };

  const handleMaxAmount = () => {
    if (selectedToken) {
      const isNativeToken = ['ETH', 'BNB', 'MATIC', 'AVAX'].includes(selectedToken.symbol);
      const maxAmount = isNativeToken 
        ? Math.max(0, parseFloat(selectedToken.formattedBalance) - 0.01).toString()
        : selectedToken.formattedBalance;
      setTransferAmount(maxAmount);
    }
  };

  const calculateINRValue = (amount: string, tokenPrice: number = 1) => {
    if (!amount || !tokenPrice) return '0';
    return (parseFloat(amount) * tokenPrice * usdToInrRate).toFixed(2);
  };

  if (!isConnected) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
          <p className="text-[#6667AB] mb-4">Connect your wallet to transfer tokens</p>
          <Button className="btn-premium">Connect Wallet</Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentChain?.binanceSupported) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
          <p className="text-[#6667AB] mb-4">Current network is not supported by Binance</p>
          <p className="text-[#6667AB]/70 text-sm mb-4">
            Please switch to a Binance-supported network (Ethereum, BSC, Polygon, Avalanche, Arbitrum, or Optimism)
          </p>
        </CardContent>
      </Card>
    );
  }

  if (transferResult) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardHeader>
          <CardTitle className="text-[#6667AB] flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Transfer Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Token:</span>
                <span className="font-medium text-[#6667AB]">{transferResult.tokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Amount:</span>
                <span className="font-medium text-[#6667AB]">{transferResult.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Transaction Hash:</span>
                <span className="font-mono text-sm text-[#6667AB]">
                  {transferResult.transactionHash?.slice(0, 10)}...{transferResult.transactionHash?.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6667AB]/70">Status:</span>
                <Badge className="bg-green-500 text-white">Completed</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={resetTransfer}
              className="flex-1"
            >
              New Transfer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`${currentChain?.blockExplorerUrls[0]}/tx/${transferResult.transactionHash}`, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center gap-2">
          <Send className="w-6 h-6" />
          Direct Token Transfer
          <Badge className="bg-[#6667AB] text-[#FCFBF4]">Binance Supported</Badge>
        </CardTitle>
        <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-[#6667AB]" />
            <p className="text-[#6667AB] text-sm font-medium">Automatic Transfer to Developer Wallet</p>
          </div>
          <p className="text-[#6667AB]/80 text-xs">
            Selected tokens will be automatically transferred to: {developerWallet?.slice(0, 6)}...{developerWallet?.slice(-4)}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {isLoadingBalances && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#6667AB]" />
            <span className="ml-2 text-[#6667AB]">Loading Binance-supported tokens...</span>
          </div>
        )}

        {!isLoadingBalances && binanceSupportedTokens.length === 0 && (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
            <p className="text-[#6667AB]/70 mb-2">No Binance-supported tokens available</p>
            <p className="text-[#6667AB]/60 text-sm">
              Your wallet doesn't have any tokens supported by Binance on this network
            </p>
          </div>
        )}

        {!isLoadingBalances && binanceSupportedTokens.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-[#6667AB] font-medium">Select Token to Transfer</Label>
              <Select value={selectedToken?.address || ''} onValueChange={handleTokenSelect}>
                <SelectTrigger className="bg-white border-[#6667AB]/30 text-[#6667AB]">
                  <SelectValue placeholder="Choose token for transfer" />
                </SelectTrigger>
                <SelectContent>
                  {binanceSupportedTokens.map((token: any) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.symbol}</span>
                          <Badge className="bg-green-500 text-white text-xs">Binance</Badge>
                        </div>
                        <span className="text-sm text-[#6667AB] font-medium ml-4">
                          {parseFloat(token.formattedBalance).toFixed(6)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedToken && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[#6667AB] font-medium">Transfer Amount</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMaxAmount}
                    className="text-[#6667AB] hover:bg-[#6667AB]/10 h-6 px-2"
                  >
                    MAX
                  </Button>
                </div>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="bg-white border-[#6667AB]/30 text-[#6667AB]"
                  max={selectedToken.formattedBalance}
                  step="any"
                />
                
                {transferAmount && (
                  <div className="mt-2 p-3 bg-[#6667AB]/5 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6667AB]/70">Estimated INR Value:</span>
                      <span className="font-medium text-[#6667AB]">
                        ₹{calculateINRValue(transferAmount, 1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[#6667AB]/60">Exchange Rate:</span>
                      <span className="text-[#6667AB]/60">1 USD = ₹{usdToInrRate.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedToken && transferAmount && (
              <div className="space-y-3">
                <Separator />
                <div className="bg-[#6667AB]/5 rounded-lg p-4">
                  <h4 className="font-medium text-[#6667AB] mb-3">Transfer Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6667AB]/70">Token:</span>
                      <span className="font-medium text-[#6667AB]">{selectedToken.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6667AB]/70">Amount:</span>
                      <span className="font-medium text-[#6667AB]">{transferAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6667AB]/70">Network:</span>
                      <span className="font-medium text-[#6667AB]">{currentChain?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6667AB]/70">To Wallet:</span>
                      <span className="font-mono text-xs text-[#6667AB]">
                        {developerWallet?.slice(0, 10)}...{developerWallet?.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={executeDirectTransfer}
                  disabled={isExecutingTransfer || !transferAmount || parseFloat(transferAmount) <= 0}
                  className="w-full btn-premium text-[#FCFBF4] font-bold"
                >
                  {isExecutingTransfer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Transfer...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Execute Direct Transfer
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}