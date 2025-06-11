import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWithdrawalContract } from '@/hooks/use-withdrawal-contract';
import { useWalletProvider } from '@/hooks/use-wallet-provider';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface WithdrawalFormProps {
  onSuccess?: (requestId: string) => void;
}

export function WithdrawalForm({ onSuccess }: WithdrawalFormProps) {
  const [selectedToken, setSelectedToken] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [calculatedInr, setCalculatedInr] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);

  const { state, supportedTokens, calculateInrAmount, initiateWithdrawal, resetState } = useWithdrawalContract();
  const walletData = useWalletProvider();

  // Check KYC status
  useEffect(() => {
    if (walletData.address) {
      checkKycStatus();
    }
  }, [walletData.address]);

  const checkKycStatus = async () => {
    try {
      const response = await fetch(`/api/user/kyc-status/${walletData.address}`);
      const data = await response.json();
      setKycVerified(data.kycStatus === 'verified');
    } catch (error) {
      console.error('Failed to check KYC status:', error);
    }
  };

  // Auto-calculate INR amount when token amount changes
  useEffect(() => {
    if (selectedToken && tokenAmount && walletData.provider && parseFloat(tokenAmount) > 0) {
      const timer = setTimeout(async () => {
        setIsCalculating(true);
        try {
          const inrAmount = await calculateInrAmount(selectedToken, tokenAmount, walletData.provider);
          setCalculatedInr(inrAmount);
        } catch (error) {
          console.error('Failed to calculate INR amount:', error);
          setCalculatedInr('0');
        } finally {
          setIsCalculating(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setCalculatedInr('');
    }
  }, [selectedToken, tokenAmount, walletData.provider, calculateInrAmount]);

  const handleWithdrawal = async () => {
    if (!selectedToken || !tokenAmount || !calculatedInr || !walletData.provider || !walletData.signer) {
      return;
    }

    try {
      const requestId = await initiateWithdrawal(
        selectedToken,
        tokenAmount,
        calculatedInr,
        walletData.provider,
        walletData.signer
      );

      if (onSuccess) {
        onSuccess(requestId);
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  const selectedTokenData = supportedTokens.find(t => t.address === selectedToken);
  const canWithdraw = selectedToken && tokenAmount && calculatedInr && kycVerified && !state.isProcessing;

  if (!walletData.isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to withdraw tokens to INR.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!kycVerified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>KYC Verification Required</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete KYC verification before withdrawing to INR.
            </AlertDescription>
          </Alert>
          <Button className="w-full mt-4" onClick={() => window.location.href = '/kyc'}>
            Complete KYC
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Withdraw to INR</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state.step === 'completed' && state.requestId && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Withdrawal request submitted successfully! Request ID: {state.requestId}
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
            disabled={!selectedToken || state.isProcessing}
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
            <div className={`flex items-center space-x-2 ${state.step === 'calculating' ? 'text-blue-600' : state.step === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${state.step === 'calculating' ? 'bg-blue-600' : state.step === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
              <span>Calculate exchange rate</span>
            </div>
            <div className={`flex items-center space-x-2 ${state.step === 'approving' ? 'text-blue-600' : state.step === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${state.step === 'approving' ? 'bg-blue-600' : state.step === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
              <span>Approve token spending</span>
            </div>
            <div className={`flex items-center space-x-2 ${state.step === 'withdrawing' ? 'text-blue-600' : state.step === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${state.step === 'withdrawing' ? 'bg-blue-600' : state.step === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
              <span>Submit withdrawal request</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleWithdrawal}
          disabled={!canWithdraw}
          className="w-full"
        >
          {state.isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {state.step === 'approving' ? 'Approving...' : 
               state.step === 'withdrawing' ? 'Processing...' : 'Loading...'}
            </>
          ) : (
            'Withdraw to INR'
          )}
        </Button>

        {state.step === 'completed' && (
          <Button
            onClick={() => {
              resetState();
              setTokenAmount('');
              setCalculatedInr('');
              setSelectedToken('');
            }}
            variant="outline"
            className="w-full"
          >
            Make Another Withdrawal
          </Button>
        )}
      </CardContent>
    </Card>
  );
}