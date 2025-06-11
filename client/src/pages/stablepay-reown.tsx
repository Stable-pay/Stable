import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Shield, Banknote, Clock, CheckCircle, Wallet, Zap, ExternalLink } from 'lucide-react';
import { useReownWallet } from '@/hooks/use-reown-wallet';

interface ConversionState {
  step: 'connect' | 'kyc' | 'convert' | 'complete';
  fromToken: string;
  amount: string;
  usdcAmount: string;
  inrAmount: string;
  isProcessing: boolean;
}

export function StablePayReown() {
  const wallet = useReownWallet();
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

  // Calculate real-time conversion rates
  useEffect(() => {
    const calculateConversion = async () => {
      if (!state.amount || !wallet.isConnected) return;

      try {
        const quote = await wallet.getSwapQuote(state.fromToken, 'USDC', state.amount);
        const inrValue = (parseFloat(quote.toAmount) * INR_RATE).toFixed(2);
        
        setState(prev => ({
          ...prev,
          usdcAmount: quote.toAmount,
          inrAmount: inrValue
        }));
      } catch (error) {
        console.error('Failed to calculate conversion:', error);
      }
    };

    if (state.amount && wallet.isConnected) {
      const timer = setTimeout(calculateConversion, 500);
      return () => clearTimeout(timer);
    }
  }, [state.amount, state.fromToken, wallet.isConnected, wallet]);

  // Update step based on wallet connection
  useEffect(() => {
    if (wallet.isConnected && state.step === 'connect') {
      setState(prev => ({ ...prev, step: 'kyc' }));
    } else if (!wallet.isConnected) {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [wallet.isConnected, state.step]);

  const handleKycStart = async () => {
    if (!wallet.address) return;

    try {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: wallet.address })
      });
      
      if (response.ok) {
        setKycStatus('pending');
        setTimeout(() => {
          setKycStatus('verified');
          setState(prev => ({ ...prev, step: 'convert' }));
        }, 3000);
      }
    } catch (error) {
      console.error('KYC initiation failed:', error);
    }
  };

  const handleConversion = async () => {
    if (!wallet.address || !state.amount) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Step 1: Get swap quote
      const quote = await wallet.getSwapQuote(state.fromToken, 'USDC', state.amount);

      // Step 2: Execute swap
      const swapTxHash = await wallet.executeSwap(quote);

      // Step 3: Auto-transfer to custody wallet
      await fetch('/api/custody/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: wallet.address,
          usdcAmount: quote.toAmount,
          chainId: wallet.chainId,
          swapTxHash
        })
      });

      // Step 4: Initiate INR withdrawal
      await fetch('/api/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: wallet.address,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Banknote className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">StablePay</CardTitle>
            <p className="text-white/80 text-lg">Powered by Reown WalletConnect</p>
            <p className="text-white/60 text-sm">Multi-chain crypto-to-INR conversion platform</p>
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
                <p className="text-xs text-white/80">Swap</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Banknote className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-white/80">Receive INR</p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <h3 className="text-white font-medium mb-2">Supported Wallets:</h3>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• MetaMask, Rainbow, Coinbase Wallet</li>
                <li>• Trust Wallet, WalletConnect</li>
                <li>• Multi-chain support (Ethereum, Polygon, BSC)</li>
                <li>• Hardware wallets (Ledger, Trezor)</li>
              </ul>
            </div>
            
            <Button 
              onClick={wallet.connect}
              disabled={wallet.isConnecting}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
            
            <div className="text-center text-white/60 text-sm">
              Connect with 350+ wallets via WalletConnect
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'kyc') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">KYC Verification Required</CardTitle>
            <p className="text-white/80">Complete identity verification for INR withdrawals</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-medium">Connected Wallet</h3>
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Wallet Connected</p>
                      <p className="text-white/60 text-sm">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</p>
                      <p className="text-white/60 text-sm">Network: {wallet.chainId}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-medium">KYC Status</h3>
                <div className={`p-4 border rounded-lg ${
                  kycStatus === 'verified' ? 'bg-green-500/20 border-green-500/30' :
                  kycStatus === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30' :
                  'bg-gray-500/20 border-gray-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {kycStatus === 'verified' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                     kycStatus === 'pending' ? <Clock className="w-5 h-5 text-yellow-400" /> :
                     <Shield className="w-5 h-5 text-gray-400" />}
                    <div>
                      <p className="text-white font-medium">
                        {kycStatus === 'verified' ? 'Verified' :
                         kycStatus === 'pending' ? 'Processing...' :
                         'Not Started'}
                      </p>
                      <p className="text-white/60 text-sm">
                        {kycStatus === 'verified' ? 'Ready for withdrawals' :
                         kycStatus === 'pending' ? 'Verifying documents...' :
                         'Click to start verification'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {kycStatus === 'none' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Required Documents:</h4>
                  <ul className="text-white/80 text-sm space-y-1">
                    <li>• Government-issued photo ID (Aadhaar, PAN, Passport)</li>
                    <li>• Bank account details for INR withdrawals</li>
                    <li>• Address proof (utility bill, bank statement)</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleKycStart}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Start KYC Verification
                </Button>
              </div>
            )}

            {kycStatus === 'verified' && (
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'convert' }))}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Continue to Conversion
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'convert') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Convert Crypto to INR</CardTitle>
            <p className="text-white/80">Swap any crypto to USDC, then convert to Indian Rupees</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h3 className="text-white font-medium mb-2">Portfolio Value</h3>
                <p className="text-2xl font-bold text-white">${wallet.getTotalValue().toFixed(2)}</p>
                <p className="text-white/60 text-sm">{wallet.balances.length} tokens</p>
              </div>
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <h3 className="text-white font-medium mb-2">Network</h3>
                <p className="text-white font-bold">{wallet.chainId === 1 ? 'Ethereum' : wallet.chainId === 137 ? 'Polygon' : 'BSC'}</p>
                <p className="text-white/60 text-sm">Chain ID: {wallet.chainId}</p>
              </div>
            </div>

            {/* Conversion Form */}
            <div className="space-y-4">
              <div className="p-6 bg-gray-800/50 rounded-lg space-y-4">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">From Token</label>
                  <Select value={state.fromToken} onValueChange={(value) => setState(prev => ({ ...prev, fromToken: value }))}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wallet.balances.map((token) => (
                        <SelectItem key={token.address} value={token.symbol}>
                          {token.symbol} - {token.formattedBalance} (${(token.usdValue || 0).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={state.amount}
                    onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-6 h-6 text-white/60" />
                </div>

                <div className="space-y-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-white">USDC Amount:</span>
                    <span className="text-white font-bold">{state.usdcAmount || '0.00'} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">INR Amount:</span>
                    <span className="text-white font-bold">₹{state.inrAmount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Exchange Rate:</span>
                    <span className="text-white/60">1 USDC = ₹{INR_RATE}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Bank Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Account Number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="IFSC Code"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Account Holder Name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600 text-white md:col-span-2"
                  />
                </div>
              </div>

              <Button 
                onClick={handleConversion}
                disabled={!state.amount || !bankDetails.accountNumber || state.isProcessing}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {state.isProcessing ? 'Processing Conversion...' : 'Convert to INR'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Conversion Complete!</CardTitle>
            <p className="text-white/80">Your INR transfer is being processed</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-white">Converted Amount:</span>
                  <span className="text-white font-bold">₹{state.inrAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Bank Account:</span>
                  <span className="text-white/60 text-sm">***{bankDetails.accountNumber.slice(-4)}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h4 className="text-white font-medium mb-2">What's Next:</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Swap executed on blockchain</li>
                  <li>• USDC transferred to custody wallet</li>
                  <li>• INR transfer initiated to your bank</li>
                  <li>• Funds will arrive in 2-3 business days</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'convert' }))}
                variant="outline"
                className="flex-1"
              >
                New Conversion
              </Button>
              <Button 
                onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                className="flex-1"
              >
                View on Explorer <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}