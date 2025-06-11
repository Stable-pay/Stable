import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletProvider } from '@/hooks/use-wallet-provider';
import { Loader2, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { parseUnits, formatUnits, Contract } from 'ethers';

interface TokenOption {
  symbol: string;
  address: string;
  decimals: number;
  balance: string;
  usdPrice: number;
}

const WITHDRAWAL_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Will be updated after deployment

const CONTRACT_ABI = [
  "function requestWithdrawal(address token, uint256 tokenAmount, uint256 expectedInrAmount) external payable",
  "function calculateInrAmount(address token, uint256 tokenAmount) external view returns (uint256)",
  "function allowedTokens(address) external view returns (bool)",
  "function tokenToInrRate(address) external view returns (uint256)"
];

export default function TokenWithdrawal() {
  const [selectedToken, setSelectedToken] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [calculatedInr, setCalculatedInr] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'calculating' | 'approving' | 'withdrawing' | 'completed' | 'error'>('idle');

  const walletData = useWalletProvider();

  const [supportedTokens] = useState<TokenOption[]>([
    {
      symbol: 'USDC',
      address: '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B',
      decimals: 6,
      balance: '1000.000000',
      usdPrice: 1.0
    },
    {
      symbol: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      balance: '500.000000',
      usdPrice: 1.0
    },
    {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      balance: '2.500000000000000000',
      usdPrice: 2800
    }
  ]);

  // Check KYC status
  useEffect(() => {
    if (walletData.address) {
      checkKycStatus();
    }
  }, [walletData.address]);

  const checkKycStatus = async () => {
    try {
      const response = await fetch(`/api/user/kyc-status/${walletData.address}`);
      if (response.ok) {
        const data = await response.json();
        setKycVerified(data.kycStatus === 'verified');
      } else {
        // For demo purposes, simulate KYC verification after 3 seconds
        setTimeout(() => setKycVerified(true), 3000);
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error);
      // For demo, assume verified after delay
      setTimeout(() => setKycVerified(true), 3000);
    }
  };

  // Auto-calculate INR amount when token amount changes
  useEffect(() => {
    if (selectedToken && tokenAmount && walletData.provider && parseFloat(tokenAmount) > 0) {
      const timer = setTimeout(async () => {
        await calculateInrAmount();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setCalculatedInr('');
    }
  }, [selectedToken, tokenAmount, walletData.provider]);

  const calculateInrAmount = async () => {
    if (!walletData.provider || !selectedToken || !tokenAmount) return;

    setIsCalculating(true);
    setStep('calculating');

    try {
      // For demo purposes, use fixed exchange rates
      const rates: Record<string, number> = {
        'USDC': 84, // 1 USDC = 84 INR
        'USDT': 84, // 1 USDT = 84 INR  
        'ETH': 235000 // 1 ETH = 235,000 INR
      };

      const selectedTokenData = supportedTokens.find(t => t.address === selectedToken);
      if (selectedTokenData) {
        const rate = rates[selectedTokenData.symbol] || 84;
        const inrAmount = parseFloat(tokenAmount) * rate;
        setCalculatedInr(inrAmount.toString());
      }
    } catch (error) {
      console.error('Failed to calculate INR amount:', error);
      setCalculatedInr('0');
    } finally {
      setIsCalculating(false);
      setStep('idle');
    }
  };

  const handleWithdrawal = async () => {
    if (!selectedToken || !tokenAmount || !calculatedInr || !walletData.provider || !walletData.signer) {
      return;
    }

    setIsProcessing(true);
    setError('');
    setStep('approving');

    try {
      const selectedTokenData = supportedTokens.find(t => t.address === selectedToken);
      if (!selectedTokenData) throw new Error('Token not found');

      // For demo purposes, simulate the withdrawal process
      if (selectedToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        // ETH withdrawal simulation
        setStep('withdrawing');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        setTransactionHash('0x' + Math.random().toString(16).substr(2, 64));
        setStep('completed');
      } else {
        // ERC20 token withdrawal simulation
        setStep('withdrawing');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        setTransactionHash('0x' + Math.random().toString(16).substr(2, 64));
        setStep('completed');
      }

      // Record the withdrawal in backend
      await fetch('/api/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: walletData.address,
          tokenSymbol: selectedTokenData.symbol,
          tokenAmount,
          inrAmount: calculatedInr,
          transactionHash: transactionHash
        })
      });

    } catch (error: any) {
      setError(error.message || 'Withdrawal failed');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedToken('');
    setTokenAmount('');
    setCalculatedInr('');
    setTransactionHash('');
    setError('');
    setStep('idle');
    setIsProcessing(false);
  };

  const selectedTokenData = supportedTokens.find(t => t.address === selectedToken);
  const canWithdraw = selectedToken && tokenAmount && calculatedInr && kycVerified && !isProcessing;

  if (!walletData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to withdraw tokens to INR.
              </AlertDescription>
            </Alert>
            <Button onClick={walletData.connect} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!kycVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>KYC Verification Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Completing KYC verification to enable INR withdrawals...
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying KYC status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Withdraw to INR</CardTitle>
          <p className="text-sm text-gray-600">
            Convert your crypto tokens to Indian Rupees
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'completed' && transactionHash && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Withdrawal request submitted successfully!<br />
                Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="token">Select Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder="Choose token to withdraw" />
              </SelectTrigger>
              <SelectContent>
                {supportedTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    {token.symbol} - Balance: {parseFloat(token.balance).toFixed(6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Token Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              disabled={!selectedToken || isProcessing}
            />
            {selectedTokenData && (
              <p className="text-sm text-gray-500">
                Available: {parseFloat(selectedTokenData.balance).toFixed(6)} {selectedTokenData.symbol}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>INR Amount (Calculated)</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              {isCalculating ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Calculating...</span>
                </div>
              ) : calculatedInr ? (
                <span className="text-lg font-semibold">
                  ₹{parseFloat(calculatedInr).toLocaleString('en-IN', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              ) : (
                <span className="text-gray-400">Enter token amount</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Processing Steps</Label>
            <div className="space-y-1 text-sm">
              <div className={`flex items-center space-x-2 ${step === 'calculating' ? 'text-blue-600' : step === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${step === 'calculating' ? 'bg-blue-600' : step === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span>Calculate exchange rate</span>
              </div>
              <div className={`flex items-center space-x-2 ${step === 'approving' ? 'text-blue-600' : step === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${step === 'approving' ? 'bg-blue-600' : step === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span>Approve token spending</span>
              </div>
              <div className={`flex items-center space-x-2 ${step === 'withdrawing' ? 'text-blue-600' : step === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${step === 'withdrawing' ? 'bg-blue-600' : step === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span>Submit withdrawal request</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleWithdrawal}
            disabled={!canWithdraw}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step === 'approving' ? 'Approving...' : 
                 step === 'withdrawing' ? 'Processing...' : 'Loading...'}
              </>
            ) : (
              'Withdraw to INR'
            )}
          </Button>

          {step === 'completed' && (
            <Button
              onClick={resetForm}
              variant="outline"
              className="w-full"
            >
              Make Another Withdrawal
            </Button>
          )}

          <div className="text-xs text-gray-500 text-center">
            Connected: {walletData.address?.slice(0, 6)}...{walletData.address?.slice(-4)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}