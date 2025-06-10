import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Shield, Banknote, Clock, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useWeb3Connection } from '@/hooks/use-web3-connection';
import { DexIntegration } from '@/lib/dex-integration';

interface ConversionState {
  step: 'connect' | 'kyc' | 'convert' | 'complete';
  fromToken: string;
  amount: string;
  usdcAmount: string;
  inrAmount: string;
  isProcessing: boolean;
}

export function StablePayMain() {
  const walletData = useWeb3Connection();
  const [state, setState] = useState<ConversionState>({
    step: 'connect',
    fromToken: 'ETH',
    amount: '',
    usdcAmount: '',
    inrAmount: '',
    isProcessing: false
  });

  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const INR_RATE = 83.25; // 1 USDC = 83.25 INR

  // Calculate real-time conversion
  useEffect(() => {
    const calculateConversion = async () => {
      if (!state.amount || !walletData.provider || !walletData.chainId) return;

      try {
        const dex = new DexIntegration(walletData.chainId, walletData.provider);
        const quote = await dex.getSwapQuote({
          fromToken: state.fromToken,
          toToken: 'USDC',
          amount: state.amount,
          slippage: 0.5,
          userAddress: walletData.address!
        });
        
        const inrValue = (parseFloat(quote.toAmount) * INR_RATE).toFixed(2);
        setState(prev => ({
          ...prev,
          usdcAmount: quote.toAmount,
          inrAmount: inrValue
        }));
      } catch (error) {
        console.error('Conversion calculation failed:', error);
      }
    };

    if (state.amount && walletData.isConnected) {
      const timer = setTimeout(calculateConversion, 500);
      return () => clearTimeout(timer);
    }
  }, [state.amount, state.fromToken, walletData.provider, walletData.chainId, walletData.address, walletData.isConnected]);

  // Update step based on wallet connection
  useEffect(() => {
    if (walletData.isConnected && state.step === 'connect') {
      setState(prev => ({ ...prev, step: 'kyc' }));
    } else if (!walletData.isConnected) {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [walletData.isConnected, state.step]);

  const handleKycStart = async () => {
    if (!walletData.address) return;

    try {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: walletData.address })
      });
      
      if (response.ok) {
        setKycStatus('pending');
        // Simulate KYC completion after 3 seconds
        setTimeout(() => {
          setKycStatus('verified');
          setState(prev => ({ ...prev, step: 'convert' }));
        }, 3000);
      }
    } catch (error) {
      console.error('KYC failed:', error);
    }
  };

  const handleConversion = async () => {
    if (!walletData.provider || !walletData.address || !state.amount) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Step 1: Convert crypto to USDC
      const dex = new DexIntegration(walletData.chainId!, walletData.provider);
      const quote = await dex.getSwapQuote({
        fromToken: state.fromToken,
        toToken: 'USDC',
        amount: state.amount,
        slippage: 0.5,
        userAddress: walletData.address
      });

      const swapTxHash = await dex.executeSwap(quote, walletData.address);

      // Step 2: Auto-transfer to custody wallet
      await fetch('/api/custody/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: walletData.address,
          usdcAmount: quote.toAmount,
          chainId: walletData.chainId,
          swapTxHash
        })
      });

      // Step 3: Initiate INR withdrawal
      await fetch('/api/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: walletData.address,
          usdcAmount: quote.toAmount,
          inrAmount: state.inrAmount,
          bankDetails
        })
      });

      setState(prev => ({ ...prev, step: 'complete', isProcessing: false }));
      
    } catch (error) {
      console.error('Conversion failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      alert('Conversion failed. Please try again.');
    }
  };

  if (state.step === 'connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Banknote className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">StablePay</CardTitle>
            <p className="text-white/80 text-lg">Convert Crypto to INR Instantly</p>
            <p className="text-white/60 text-sm">The simplest way to cash out your crypto to Indian Rupees</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs text-white/80">Connect</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <ArrowDown className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-xs text-white/80">Convert</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Banknote className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-white/80">Receive INR</p>
              </div>
            </div>
            
            <Button 
              onClick={walletData.connect} 
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Connect Wallet to Start
            </Button>
            
            <div className="text-center text-white/60 text-sm">
              Supports MetaMask, WalletConnect, and other Web3 wallets
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'kyc') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
              <Shield className="w-6 h-6 mr-2" />
              KYC Verification
            </CardTitle>
            <p className="text-white/80">Required for INR withdrawals to Indian bank accounts</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {kycStatus === 'none' && (
              <>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <h3 className="text-white font-medium mb-2">Required Documents:</h3>
                    <ul className="text-white/80 text-sm space-y-1">
                      <li>• Aadhaar Card</li>
                      <li>• PAN Card</li>
                      <li>• Live Selfie for verification</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <h3 className="text-white font-medium mb-2">Benefits:</h3>
                    <ul className="text-white/80 text-sm space-y-1">
                      <li>• Withdraw up to ₹50,000 per day</li>
                      <li>• Direct bank transfers in 24 hours</li>
                      <li>• Secure and compliant process</li>
                    </ul>
                  </div>
                </div>

                <Button 
                  onClick={handleKycStart}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Start KYC Verification
                </Button>
              </>
            )}

            {kycStatus === 'pending' && (
              <div className="text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-white">Processing your KYC verification...</p>
                <p className="text-white/60 text-sm">This usually takes 2-3 minutes</p>
              </div>
            )}

            {kycStatus === 'verified' && (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-white text-lg font-medium">KYC Verified Successfully!</p>
                <p className="text-white/80">You can now convert crypto to INR</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'convert') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Convert Crypto to INR</h1>
            <p className="text-white/80">Wallet: {walletData.address?.slice(0, 6)}...{walletData.address?.slice(-4)}</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Conversion Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Select Cryptocurrency</label>
                <Select value={state.fromToken} onValueChange={(value) => setState(prev => ({ ...prev, fromToken: value }))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">ETH - Ethereum</SelectItem>
                    <SelectItem value="BTC">BTC - Bitcoin</SelectItem>
                    <SelectItem value="USDT">USDT - Tether</SelectItem>
                    <SelectItem value="DAI">DAI - Dai Stablecoin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm font-medium">Amount to Convert</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={state.amount}
                  onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-lg"
                />
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-white/60" />
              </div>

              {/* Conversion Preview */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">USDC Amount:</span>
                  <span className="text-white font-bold text-lg">{state.usdcAmount || '0.00'} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">INR Amount:</span>
                  <span className="text-green-400 font-bold text-2xl">₹{state.inrAmount || '0.00'}</span>
                </div>
                <div className="text-center text-white/60 text-sm">
                  Exchange Rate: 1 USDC = ₹{INR_RATE} • Processing Fee: 1.5%
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Bank Account Details</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="Account Holder Name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    placeholder="Account Number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    placeholder="IFSC Code"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>

              <Button 
                onClick={handleConversion}
                disabled={!state.amount || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName || state.isProcessing}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
              >
                {state.isProcessing ? 'Converting...' : `Convert to ₹${state.inrAmount || '0.00'}`}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3 text-sm">
                <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-white/80">
                  <p className="font-medium text-white">Settlement Time: 24 hours</p>
                  <p>Your INR will be transferred directly to your bank account within 24 hours of conversion.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (state.step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center space-y-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Conversion Successful!</h2>
              <p className="text-white/80">Your cryptocurrency has been converted to INR</p>
            </div>
            
            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-white/80">Amount Converted:</span>
                <span className="text-white font-bold">{state.amount} {state.fromToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">INR Amount:</span>
                <span className="text-green-400 font-bold text-xl">₹{state.inrAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Bank Account:</span>
                <span className="text-white">****{bankDetails.accountNumber.slice(-4)}</span>
              </div>
            </div>

            <div className="text-center text-white/80 text-sm">
              <p>Your INR will be transferred within 24 hours</p>
              <p>You'll receive an SMS confirmation once the transfer is complete</p>
            </div>

            <Button 
              onClick={() => setState({ step: 'convert', fromToken: 'ETH', amount: '', usdcAmount: '', inrAmount: '', isProcessing: false })}
              className="w-full"
            >
              Convert More Crypto
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}