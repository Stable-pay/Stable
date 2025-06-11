import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Clock, Shield, Banknote, ChevronRight } from 'lucide-react';
import { useWeb3Connection } from '@/hooks/use-web3-connection';
import { DexIntegration } from '@/lib/dex-integration';

interface ConversionStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
}

interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export function StablePayConversion() {
  const walletData = useWeb3Connection();
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [tokenAmount, setTokenAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [inrAmount, setInrAmount] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified'>('none');

  const conversionSteps: ConversionStep[] = [
    { id: 'connect', title: 'Connect Wallet', status: walletData.isConnected ? 'completed' : 'active' },
    { id: 'kyc', title: 'Complete KYC', status: kycStatus === 'verified' ? 'completed' : kycStatus === 'pending' ? 'active' : 'pending' },
    { id: 'convert', title: 'Convert to USDC', status: 'pending' },
    { id: 'transfer', title: 'Auto-transfer to Custody', status: 'pending' },
    { id: 'withdraw', title: 'INR Bank Transfer', status: 'pending' }
  ];

  // Real-time INR conversion rate (1 USDC = ~83 INR)
  const usdToInrRate = 83.25;

  // Calculate conversions in real-time
  useEffect(() => {
    const calculateConversion = async () => {
      if (!tokenAmount || !walletData.provider || !walletData.chainId) return;

      try {
        const dex = new DexIntegration(walletData.chainId, walletData.provider);
        const quote = await dex.getSwapQuote({
          fromToken: selectedToken,
          toToken: 'USDC',
          amount: tokenAmount,
          slippage: 0.5,
          userAddress: walletData.address!
        });
        
        setUsdcAmount(quote.toAmount);
        setInrAmount((parseFloat(quote.toAmount) * usdToInrRate).toFixed(2));
      } catch (error) {
        console.error('Conversion calculation failed:', error);
      }
    };

    const debounceTimer = setTimeout(calculateConversion, 500);
    return () => clearTimeout(debounceTimer);
  }, [tokenAmount, selectedToken, walletData.provider, walletData.chainId, walletData.address]);

  const handleConversion = async () => {
    if (!walletData.isConnected || !tokenAmount || kycStatus !== 'verified') return;

    setIsConverting(true);
    try {
      // Step 1: Convert token to USDC
      const dex = new DexIntegration(walletData.chainId!, walletData.provider!);
      const quote = await dex.getSwapQuote({
        fromToken: selectedToken,
        toToken: 'USDC',
        amount: tokenAmount,
        slippage: 0.5,
        userAddress: walletData.address!
      });

      const swapTxHash = await dex.executeSwap(quote, walletData.address!);
      console.log('Swap completed:', swapTxHash);

      // Step 2: Auto-transfer USDC to custody wallet
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
          inrAmount,
          bankDetails
        })
      });

      alert(`Conversion successful! ₹${inrAmount} will be transferred to your bank account within 24 hours.`);
      
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const initiateKyc = async () => {
    try {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: walletData.address })
      });
      
      if (response.ok) {
        setKycStatus('pending');
        alert('KYC verification initiated. Please complete the process to enable INR withdrawals.');
      }
    } catch (error) {
      console.error('KYC initiation failed:', error);
    }
  };

  if (!walletData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">StablePay</CardTitle>
            <p className="text-white/80">Convert Crypto to INR Instantly</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={walletData.connect} className="w-full" size="lg">
              Connect Wallet to Start
            </Button>
            <div className="text-center text-white/70 text-sm">
              Supported: MetaMask, WalletConnect, and more
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">StablePay</h1>
          <p className="text-white/80">Convert any crypto to Indian Rupees in your bank account</p>
        </div>

        {/* Progress Steps */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {conversionSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'active' ? 'bg-blue-500 text-white' :
                    'bg-white/20 text-white/60'
                  }`}>
                    {step.status === 'completed' ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    step.status === 'completed' ? 'text-green-400' :
                    step.status === 'active' ? 'text-blue-400' :
                    'text-white/60'
                  }`}>
                    {step.title}
                  </span>
                  {index < conversionSteps.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-4 text-white/40" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Interface */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Banknote className="w-5 h-5 mr-2" />
                Crypto to INR Conversion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Token Selection */}
              <div className="space-y-2">
                <label className="text-white/80 text-sm">Select Token</label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
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
                <label className="text-white/80 text-sm">Amount to Convert</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-white/60" />
              </div>

              {/* Conversion Preview */}
              <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between">
                  <span className="text-white/80">USDC Amount:</span>
                  <span className="text-white font-medium">{usdcAmount || '0.00'} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">INR Amount:</span>
                  <span className="text-green-400 font-bold text-lg">₹{inrAmount || '0.00'}</span>
                </div>
                <div className="text-xs text-white/60 text-center">
                  Rate: 1 USDC = ₹{usdToInrRate}
                </div>
              </div>

              {/* KYC Status */}
              {kycStatus !== 'verified' && (
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center text-yellow-400 mb-2">
                    <Shield className="w-4 h-4 mr-2" />
                    KYC Required
                  </div>
                  <p className="text-white/80 text-sm mb-3">
                    Complete KYC verification to enable INR withdrawals
                  </p>
                  <Button onClick={initiateKyc} size="sm" variant="outline">
                    {kycStatus === 'pending' ? 'KYC Pending...' : 'Start KYC'}
                  </Button>
                </div>
              )}

              {/* Bank Details */}
              {kycStatus === 'verified' && (
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Bank Details</h4>
                  <Input
                    placeholder="Account Number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Input
                    placeholder="IFSC Code"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Input
                    placeholder="Account Holder Name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              )}

              <Button 
                onClick={handleConversion}
                disabled={!tokenAmount || kycStatus !== 'verified' || isConverting}
                className="w-full"
                size="lg"
              >
                {isConverting ? 'Converting...' : `Convert to ₹${inrAmount || '0.00'}`}
              </Button>
            </CardContent>
          </Card>

          {/* Features & Info */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">How StablePay Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-white/80">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-white">Connect & Convert</h4>
                    <p className="text-sm">Connect your wallet and convert any crypto to USDC</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-white">Auto-Transfer</h4>
                    <p className="text-sm">USDC automatically transferred to our custody wallet</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-white">INR Transfer</h4>
                    <p className="text-sm">Receive INR directly in your bank account within 24 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Transaction Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/80 space-y-2">
                <div className="flex justify-between">
                  <span>Daily Limit:</span>
                  <span className="text-white">₹50,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Transactions/Day:</span>
                  <span className="text-white">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Time:</span>
                  <span className="text-white">T+0 to T+1</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="text-white">1.5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}