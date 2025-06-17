import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useAutoTransferWithdrawal } from '@/hooks/use-auto-transfer-withdrawal';
import { isTokenSupportedByBinance } from '@/../../shared/binance-supported-tokens';

export function SimpleLanding() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { tokenBalances, isLoading } = useWalletBalances();
  const { withdrawalState, executeAutoTransferWithdrawal } = useAutoTransferWithdrawal();
  
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });
  const [kycCompleted, setKycCompleted] = useState(false);
  const [step, setStep] = useState<'landing' | 'token-selection' | 'kyc' | 'withdrawal'>('landing');

  const handleTokenSelect = (token: any) => {
    const isSupported = isTokenSupportedByBinance(token.symbol, token.chainId);
    if (!isSupported) {
      alert(`${token.symbol} is not supported for INR conversion`);
      return;
    }
    setSelectedToken(token);
    setStep('kyc');
  };

  const handleKycComplete = () => {
    setKycCompleted(true);
    setStep('withdrawal');
  };

  const handleWithdrawal = async () => {
    if (!selectedToken || !kycCompleted) return;
    
    const inrAmount = (parseFloat(selectedToken.formattedBalance) * 83.25).toFixed(2);
    
    const success = await executeAutoTransferWithdrawal(
      {
        symbol: selectedToken.symbol,
        address: selectedToken.address,
        chainId: selectedToken.chainId,
        amount: selectedToken.formattedBalance,
        decimals: selectedToken.decimals
      },
      bankDetails,
      inrAmount
    );
    
    if (success) {
      alert('Token transfer and INR withdrawal initiated successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">StablePay</h1>
          <p className="text-white/80">Convert your crypto to INR automatically</p>
        </div>

        {step === 'landing' && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <Button onClick={() => open()} className="w-full">
                  Connect Wallet
                </Button>
              ) : (
                <Button onClick={() => setStep('token-selection')} className="w-full">
                  View Token Balances
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'token-selection' && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Select Token to Convert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-white">Loading token balances...</div>
                ) : tokenBalances.length === 0 ? (
                  <div className="text-white">No token balances found</div>
                ) : (
                  tokenBalances
                    .filter((token: any) => parseFloat(token.formattedBalance) > 0)
                    .map((token: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10"
                        onClick={() => handleTokenSelect(token)}
                      >
                        <div>
                          <div className="text-white font-semibold">{token.symbol}</div>
                          <div className="text-white/70 text-sm">Balance: {token.formattedBalance}</div>
                        </div>
                        <div className="text-white">
                          ≈ ₹{(parseFloat(token.formattedBalance) * 83.25).toFixed(2)}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'kyc' && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Complete KYC & Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm">Account Number</label>
                  <Input
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-white text-sm">IFSC Code</label>
                  <Input
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-white text-sm">Account Holder Name</label>
                  <Input
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-white text-sm">Bank Name</label>
                  <Input
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white"
                  />
                </div>
              </div>
              <Button 
                onClick={handleKycComplete}
                className="w-full"
                disabled={!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName}
              >
                Complete KYC
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'withdrawal' && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Withdraw to INR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedToken && (
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-white">
                    <div className="font-semibold">Selected Token: {selectedToken.symbol}</div>
                    <div>Amount: {selectedToken.formattedBalance}</div>
                    <div>INR Value: ₹{(parseFloat(selectedToken.formattedBalance) * 83.25).toFixed(2)}</div>
                    <div className="text-sm text-white/70 mt-2">
                      Will transfer to developer wallet: 0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleWithdrawal}
                className="w-full"
                disabled={withdrawalState.isProcessing}
              >
                {withdrawalState.isProcessing ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full"></div>
                    {withdrawalState.currentStep === 'transferring' && 'Transferring Token...'}
                    {withdrawalState.currentStep === 'converting' && 'Processing INR Transfer...'}
                  </>
                ) : (
                  'Complete Verification & Convert to INR'
                )}
              </Button>

              {withdrawalState.currentStep === 'complete' && (
                <div className="bg-green-500/20 border border-green-500/30 p-4 rounded-lg">
                  <div className="text-green-400 font-semibold">
                    Transfer Complete!
                  </div>
                  <div className="text-white/80 text-sm">
                    Transaction Hash: {withdrawalState.transactionHash}
                  </div>
                  <div className="text-white/80 text-sm">
                    INR Amount: ₹{withdrawalState.inrAmount}
                  </div>
                </div>
              )}

              {withdrawalState.error && (
                <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg">
                  <div className="text-red-400">
                    Error: {withdrawalState.error}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}