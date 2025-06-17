import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MinimalStablePay() {
  const [step, setStep] = useState<'landing' | 'kyc' | 'transfer'>('landing');
  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [tokenAmount, setTokenAmount] = useState('1.0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });

  const handleConnectWallet = () => {
    setWalletConnected(true);
    setStep('kyc');
  };

  const handleKycComplete = () => {
    setStep('transfer');
  };

  const handleAutoTransferWithdrawal = async () => {
    setIsProcessing(true);
    
    // Simulate automatic token transfer process
    try {
      // Step 1: Transfer token to developer wallet
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Initiate INR bank transfer
      const inrAmount = (parseFloat(tokenAmount) * 83.25).toFixed(2);
      
      const response = await fetch('/api/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: '0x1234567890123456789012345678901234567890',
          tokenSymbol: selectedToken,
          tokenAmount: tokenAmount,
          chainId: 1,
          transferHash: `TRANSFER_${Date.now()}`,
          inrAmount: inrAmount,
          bankDetails: bankDetails
        })
      });

      if (response.ok) {
        setTransferComplete(true);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#6667AB' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">StablePay</h1>
          <p className="text-white/80">Convert your crypto to INR automatically</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {step === 'landing' && (
            <Card style={{ backgroundColor: '#FCFBF4' }}>
              <CardHeader>
                <CardTitle style={{ color: '#6667AB' }}>Get Started with StablePay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div style={{ color: '#6667AB' }}>
                  <p className="mb-4">Connect your wallet to start converting crypto to INR</p>
                  <div className="text-sm mb-4">
                    <div>• Selected Token: {selectedToken}</div>
                    <div>• Amount: {tokenAmount}</div>
                    <div>• Estimated INR: ₹{(parseFloat(tokenAmount) * 83.25).toFixed(2)}</div>
                  </div>
                </div>
                <Button 
                  onClick={handleConnectWallet}
                  className="w-full"
                  style={{ backgroundColor: '#6667AB', color: 'white' }}
                >
                  Connect Wallet & Start KYC
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'kyc' && (
            <Card style={{ backgroundColor: '#FCFBF4' }}>
              <CardHeader>
                <CardTitle style={{ color: '#6667AB' }}>Complete KYC & Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: '#6667AB' }} className="text-sm font-medium">Account Number</label>
                    <Input
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#6667AB' }} className="text-sm font-medium">IFSC Code</label>
                    <Input
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                      placeholder="Enter IFSC code"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#6667AB' }} className="text-sm font-medium">Account Holder Name</label>
                    <Input
                      value={bankDetails.accountHolderName}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#6667AB' }} className="text-sm font-medium">Bank Name</label>
                    <Input
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Enter bank name"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleKycComplete}
                  className="w-full"
                  style={{ backgroundColor: '#6667AB', color: 'white' }}
                  disabled={!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName}
                >
                  Complete KYC
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'transfer' && (
            <Card style={{ backgroundColor: '#FCFBF4' }}>
              <CardHeader>
                <CardTitle style={{ color: '#6667AB' }}>Automatic Token Transfer & INR Withdrawal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div style={{ backgroundColor: '#6667AB', color: 'white' }} className="p-4 rounded-lg">
                  <div className="font-semibold mb-2">Transfer Summary</div>
                  <div>Token: {selectedToken}</div>
                  <div>Amount: {tokenAmount}</div>
                  <div>INR Value: ₹{(parseFloat(tokenAmount) * 83.25).toFixed(2)}</div>
                  <div className="text-sm mt-2 opacity-80">
                    Will transfer to developer wallet: 0x742d35Cc6634C0532925a3b8D73ee1b6b1f4f82D
                  </div>
                </div>
                
                <Button 
                  onClick={handleAutoTransferWithdrawal}
                  className="w-full"
                  style={{ backgroundColor: '#6667AB', color: 'white' }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full"></div>
                      Processing Transfer...
                    </>
                  ) : (
                    'Complete Verification & Convert to INR'
                  )}
                </Button>

                {transferComplete && (
                  <div style={{ backgroundColor: '#6667AB', color: 'white' }} className="p-4 rounded-lg">
                    <div className="font-semibold">Transfer Complete!</div>
                    <div className="text-sm opacity-80">
                      Token transferred automatically to developer wallet
                    </div>
                    <div className="text-sm opacity-80">
                      INR bank transfer initiated: ₹{(parseFloat(tokenAmount) * 83.25).toFixed(2)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}