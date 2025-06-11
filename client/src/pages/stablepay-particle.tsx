import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Shield, Banknote, Clock, CheckCircle, Wallet, Zap } from 'lucide-react';
import { useParticleReal } from '@/hooks/use-particle-real';

interface ConversionState {
  step: 'connect' | 'kyc' | 'convert' | 'complete';
  fromToken: string;
  amount: string;
  usdcAmount: string;
  inrAmount: string;
  isProcessing: boolean;
}

export function StablePayParticle() {
  const particleWallet = useParticleReal();
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

  // Calculate real-time conversion using Particle Network
  useEffect(() => {
    const calculateConversion = async () => {
      if (!state.amount || !particleWallet.isConnected) return;

      try {
        const quote = await particleWallet.getSwapQuote(state.fromToken, 'USDC', state.amount);
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

    if (state.amount && particleWallet.isConnected) {
      const timer = setTimeout(calculateConversion, 500);
      return () => clearTimeout(timer);
    }
  }, [state.amount, state.fromToken, particleWallet.isConnected, particleWallet]);

  // Update step based on wallet connection
  useEffect(() => {
    if (particleWallet.isConnected && state.step === 'connect') {
      setState(prev => ({ ...prev, step: 'kyc' }));
    } else if (!particleWallet.isConnected) {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [particleWallet.isConnected, state.step]);

  const handleKycStart = async () => {
    if (!particleWallet.address) return;

    try {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: particleWallet.address })
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
    if (!particleWallet.isConnected || !state.amount) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Step 1: Get swap quote from Particle Network
      const quote = await particleWallet.getSwapQuote(state.fromToken, 'USDC', state.amount);

      // Step 2: Execute gasless swap using Particle's Account Abstraction
      const swapTxHash = await particleWallet.executeSwap(quote);

      // Step 3: Auto-transfer to custody wallet
      await fetch('/api/custody/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: particleWallet.address,
          usdcAmount: quote.toAmount,
          chainId: particleWallet.chainId,
          swapTxHash
        })
      });

      // Step 4: Initiate INR withdrawal
      await fetch('/api/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: particleWallet.address,
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
            <p className="text-white/80 text-lg">Powered by Particle Network</p>
            <p className="text-white/60 text-sm">Gasless crypto-to-INR conversion with Account Abstraction</p>
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
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-xs text-white/80">Gasless Swap</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Banknote className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-white/80">Receive INR</p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <h3 className="text-white font-medium mb-2">Particle Network Features:</h3>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• Social login (Google, Apple, Twitter)</li>
                <li>• Gasless transactions with paymaster</li>
                <li>• Account Abstraction smart wallets</li>
                <li>• Multi-chain support</li>
              </ul>
            </div>
            
            <Button 
              onClick={particleWallet.connect} 
              disabled={particleWallet.isLoading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {particleWallet.isLoading ? 'Connecting...' : 'Connect with Particle'}
            </Button>
            
            <div className="text-center text-white/60 text-sm">
              Login with email, Google, Apple, or other social accounts
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
            <div className="text-sm text-white/60">
              Wallet: {particleWallet.address?.slice(0, 6)}...{particleWallet.address?.slice(-4)}
            </div>
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
                      <li>• Gasless transactions powered by Particle</li>
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
                <p className="text-white/80">You can now convert crypto to INR with gasless transactions</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Gasless Crypto to INR</h1>
            <div className="text-white/80 space-y-1">
              <p>Wallet: {particleWallet.address?.slice(0, 6)}...{particleWallet.address?.slice(-4)}</p>
              <p className="text-sm">Powered by Particle Network Account Abstraction</p>
            </div>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Gasless Conversion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance Display */}
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                <h3 className="text-white font-medium mb-2">Your Balances</h3>
                <div className="space-y-2">
                  {particleWallet.balances.map((token, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-white/80">{token.symbol}:</span>
                      <span className="text-white">{token.formattedBalance}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-white/80">Total Value:</span>
                      <span className="text-green-400">${particleWallet.getTotalValue().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

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
                <div className="text-center text-white/60 text-sm space-y-1">
                  <p>Exchange Rate: 1 USDC = ₹{INR_RATE} • Processing Fee: 1.5%</p>
                  <p className="text-yellow-400">⚡ Gas fees sponsored by Particle Network</p>
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
                {state.isProcessing ? 'Converting...' : `⚡ Gasless Convert to ₹${state.inrAmount || '0.00'}`}
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
                  <p>Your INR will be transferred directly to your bank account within 24 hours of conversion. No gas fees required thanks to Particle Network's paymaster.</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Gasless Conversion Successful!</h2>
              <p className="text-white/80">Your cryptocurrency has been converted to INR without any gas fees</p>
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
                <span className="text-white/80">Gas Fees:</span>
                <span className="text-yellow-400 font-bold">⚡ Sponsored by Particle</span>
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