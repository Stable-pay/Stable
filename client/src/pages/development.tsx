import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Shield, Banknote, Clock, CheckCircle, Zap, Upload, FileText } from 'lucide-react';
import { SimpleWallet } from '@/components/wallet/simple-wallet';
import { useToast } from '@/hooks/use-toast';

interface ConversionState {
  step: 'connect' | 'kyc' | 'convert' | 'complete';
  fromToken: string;
  amount: string;
  usdcAmount: string;
  inrAmount: string;
  isProcessing: boolean;
}

const SUPPORTED_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', price: 2300 },
  { symbol: 'USDC', name: 'USD Coin', price: 1 },
  { symbol: 'USDT', name: 'Tether', price: 1 },
  { symbol: 'DAI', name: 'Dai Stablecoin', price: 1 },
  { symbol: 'MATIC', name: 'Polygon', price: 0.8 }
];

export default function Development() {
  const { toast } = useToast();
  const [walletConnected, setWalletConnected] = useState(false);
  const [state, setState] = useState<ConversionState>({
    step: 'connect',
    fromToken: 'ETH',
    amount: '',
    usdcAmount: '',
    inrAmount: '',
    isProcessing: false
  });
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified'>('none');

  const handleWalletConnect = () => {
    setWalletConnected(true);
    setState(prev => ({ ...prev, step: 'kyc' }));
  };

  const calculateConversion = (amount: string, token: string) => {
    const tokenPrice = SUPPORTED_TOKENS.find(t => t.symbol === token)?.price || 1;
    const usdValue = parseFloat(amount) * tokenPrice;
    const inrValue = usdValue * 83.5; // INR exchange rate
    
    setState(prev => ({
      ...prev,
      amount,
      usdcAmount: usdValue.toFixed(2),
      inrAmount: inrValue.toFixed(2)
    }));
  };

  const handleKycSubmit = () => {
    setKycStatus('pending');
    setState(prev => ({ ...prev, isProcessing: true }));
    
    setTimeout(() => {
      setKycStatus('verified');
      setState(prev => ({ ...prev, step: 'convert', isProcessing: false }));
      toast({
        title: "KYC Verified",
        description: "Your documents have been verified successfully",
      });
    }, 2000);
  };

  const handleConversion = () => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    setTimeout(() => {
      setState(prev => ({ ...prev, step: 'complete', isProcessing: false }));
      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${state.amount} ${state.fromToken} to INR`,
      });
    }, 3000);
  };

  const renderConnectStep = () => (
    <div className="space-y-6">
      <SimpleWallet onConnect={handleWalletConnect} />
      
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Development Mode</h3>
              <p className="text-blue-800 text-sm">
                No domain verification required. Connect instantly and test all features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderKycStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>KYC Verification</span>
            {kycStatus === 'verified' && (
              <Badge className="bg-green-100 text-green-800">Verified</Badge>
            )}
            {kycStatus === 'pending' && (
              <Badge className="bg-amber-100 text-amber-800">Processing</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="Enter your full name" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="pan">PAN Number</Label>
            <Input id="pan" placeholder="ABCDE1234F" />
          </div>

          <div className="space-y-3">
            <Label>Document Upload (Development)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-dashed border-2 border-gray-300 p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">PAN Card (Simulated)</p>
                </div>
              </Card>
              <Card className="border-dashed border-2 border-gray-300 p-4">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Aadhaar Card (Simulated)</p>
                </div>
              </Card>
            </div>
          </div>

          <Button 
            onClick={handleKycSubmit}
            disabled={state.isProcessing}
            className="w-full"
          >
            {state.isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Submit KYC (Development)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderConvertStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Banknote className="h-5 w-5" />
            <span>Token Conversion</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from-token">From Token</Label>
              <Select value={state.fromToken} onValueChange={(value) => setState(prev => ({ ...prev, fromToken: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TOKENS.map(token => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={state.amount}
                onChange={(e) => calculateConversion(e.target.value, state.fromToken)}
              />
            </div>
          </div>

          {state.amount && (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <ArrowDown className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">USD Value:</span>
                  <span className="font-medium">${state.usdcAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">INR Amount:</span>
                  <span className="font-medium text-green-600">₹{state.inrAmount}</span>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleConversion}
            disabled={!state.amount || state.isProcessing}
            className="w-full"
          >
            {state.isProcessing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Processing Conversion...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Convert to INR
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Conversion Successful!</h3>
              <p className="text-green-800">Your crypto has been converted to INR</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-green-700">Converted</p>
                  <p className="font-medium">{state.amount} {state.fromToken}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">USD Value</p>
                  <p className="font-medium">${state.usdcAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">INR Received</p>
                  <p className="font-medium text-green-600">₹{state.inrAmount}</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setState({ step: 'convert', fromToken: 'ETH', amount: '', usdcAmount: '', inrAmount: '', isProcessing: false })}
              variant="outline"
            >
              Make Another Conversion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          StablePay Development
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Convert crypto to INR without domain verification
        </p>
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          Development Mode - No Restrictions
        </Badge>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {['connect', 'kyc', 'convert', 'complete'].map((step, index) => (
            <div key={step} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                state.step === step ? 'bg-blue-600 text-white' :
                ['connect', 'kyc', 'convert', 'complete'].indexOf(state.step) > index ? 'bg-green-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className="text-sm font-medium text-gray-600 capitalize">{step}</span>
              {index < 3 && <ArrowDown className="h-4 w-4 text-gray-400 rotate-[-90deg]" />}
            </div>
          ))}
        </div>
      </div>

      {state.step === 'connect' && renderConnectStep()}
      {state.step === 'kyc' && renderKycStep()}
      {state.step === 'convert' && renderConvertStep()}
      {state.step === 'complete' && renderCompleteStep()}
    </div>
  );
}