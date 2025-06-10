import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowUpDown, 
  Wallet, 
  Shield, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Zap,
  DollarSign,
  User,
  Building2
} from 'lucide-react';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { useQuery } from '@tanstack/react-query';

interface Token {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  formattedBalance: string;
}

interface KycData {
  fullName: string;
  phoneNumber: string;
  panNumber: string;
  aadharNumber: string;
  address: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
}

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  isPrimary: boolean;
}

export function ParticleRemittanceFlow() {
  const { 
    address, 
    isConnected, 
    balances, 
    connect, 
    swapToUSDC
  } = useParticleWallet();
  
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [inrAmount, setInrAmount] = useState('0');
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [kycData, setKycData] = useState<KycData>({
    fullName: '',
    phoneNumber: '',
    panNumber: '',
    aadharNumber: '',
    address: '',
    kycStatus: 'pending'
  });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    isPrimary: true
  });
  const [isSwapping, setIsSwapping] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);

  // Fetch exchange rates
  const { data: rateData } = useQuery({
    queryKey: ['/api/remittance/rates', selectedToken?.symbol, 'INR'],
    enabled: !!selectedToken,
  });

  useEffect(() => {
    if (rateData?.rate && swapAmount) {
      const rate = rateData.rate;
      setExchangeRate(rate);
      setInrAmount((parseFloat(swapAmount) * rate).toFixed(2));
    }
  }, [rateData, swapAmount]);

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Particle Network",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTokenSwap = async () => {
    if (!selectedToken || !swapAmount || !isConnected) {
      toast({
        title: "Missing Information",
        description: "Please select a token and enter an amount",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSwapping(true);
      const result = await swapToUSDC(selectedToken.symbol, swapAmount);
      
      toast({
        title: "Swap Successful",
        description: `Swapped ${result.fromAmount} ${selectedToken.symbol} to ${result.toAmount} USDC (Gasless)`,
      });

      setCurrentStep(1); // Move to KYC step
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: "Failed to execute swap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleKycSubmit = async () => {
    if (!kycData.fullName || !kycData.phoneNumber || !kycData.panNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required KYC fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate KYC submission
      setKycData(prev => ({ ...prev, kycStatus: 'approved' }));
      setCurrentStep(2); // Move to bank details step
      
      toast({
        title: "KYC Submitted",
        description: "Your KYC information has been submitted for verification",
      });
    } catch (error) {
      toast({
        title: "KYC Submission Failed",
        description: "Failed to submit KYC information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBankDetailsSubmit = async () => {
    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required bank details",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate withdrawal initiation
      const mockWithdrawalId = 'WD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      setWithdrawalId(mockWithdrawalId);
      setCurrentStep(3); // Move to confirmation step
      
      toast({
        title: "Withdrawal Initiated",
        description: `Withdrawal request created: ${mockWithdrawalId}`,
      });
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Failed to initiate withdrawal. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Particle Network Remittance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to start the crypto-to-fiat remittance process with gasless transactions
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="font-medium">Account Abstraction</span>
              </div>
              <p className="text-sm text-gray-600">
                Smart account with gasless transactions
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="font-medium">Zero Gas Fees</span>
              </div>
              <p className="text-sm text-gray-600">
                All transactions sponsored by paymaster
              </p>
            </div>
          </div>

          <Button 
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="lg"
          >
            Connect Particle Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { title: 'Token Swap', icon: ArrowUpDown, description: 'Convert crypto to USDC' },
    { title: 'KYC Verification', icon: User, description: 'Identity verification' },
    { title: 'Bank Details', icon: Building2, description: 'Add withdrawal account' },
    { title: 'Confirmation', icon: CheckCircle, description: 'Complete withdrawal' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentStep 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : 'border-gray-300 text-gray-300'
            }`}>
              <step.icon className="w-5 h-5" />
            </div>
            {index < steps.length - 1 && (
              <div className={`w-24 h-0.5 mx-4 ${
                index < currentStep ? 'bg-purple-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5" />
              Swap to USDC (Gasless)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Token to Swap</Label>
              <Select onValueChange={(value) => {
                const token = balances.find(b => b.symbol === value);
                if (token) setSelectedToken(token);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose token" />
                </SelectTrigger>
                <SelectContent>
                  {balances.filter(b => b.symbol !== 'USDC').map((balance) => (
                    <SelectItem key={balance.symbol} value={balance.symbol}>
                      <div className="flex items-center justify-between w-full">
                        <span>{balance.symbol}</span>
                        <span className="text-sm text-gray-500 ml-4">
                          {balance.formattedBalance}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount to Swap</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
              />
              {selectedToken && (
                <p className="text-xs text-gray-500">
                  Available: {selectedToken.formattedBalance} {selectedToken.symbol}
                </p>
              )}
            </div>

            {exchangeRate > 0 && swapAmount && (
              <Alert className="border-green-200 bg-green-50">
                <DollarSign className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Exchange Rate:</span>
                      <span className="font-medium">1 {selectedToken?.symbol} = ₹{exchangeRate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>You'll receive:</span>
                      <span className="font-medium">₹{parseFloat(inrAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleTokenSwap}
              disabled={!selectedToken || !swapAmount || isSwapping}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              {isSwapping ? 'Swapping...' : 'Swap to USDC (Gasless)'}
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              KYC Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={kycData.fullName}
                  onChange={(e) => setKycData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={kycData.phoneNumber}
                  onChange={(e) => setKycData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PAN Number</Label>
                <Input
                  value={kycData.panNumber}
                  onChange={(e) => setKycData(prev => ({ ...prev, panNumber: e.target.value }))}
                  placeholder="Enter PAN number"
                />
              </div>
              <div className="space-y-2">
                <Label>Aadhar Number</Label>
                <Input
                  value={kycData.aadharNumber}
                  onChange={(e) => setKycData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                  placeholder="Enter Aadhar number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={kycData.address}
                onChange={(e) => setKycData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your address"
              />
            </div>

            <Button 
              onClick={handleKycSubmit}
              className="w-full"
              size="lg"
            >
              Submit KYC Information
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Bank Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="Enter account holder name"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter account number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                  placeholder="Enter IFSC code"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Enter bank name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input
                value={bankDetails.branchName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, branchName: e.target.value }))}
                placeholder="Enter branch name"
              />
            </div>

            <Button 
              onClick={handleBankDetailsSubmit}
              className="w-full"
              size="lg"
            >
              Add Bank Account
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && withdrawalId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Withdrawal Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Withdrawal Initiated Successfully!</h3>
              <p className="text-gray-600">Your crypto has been converted and withdrawal request created.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Withdrawal ID:</span>
                <span className="font-medium">{withdrawalId}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">₹{parseFloat(inrAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Time:</span>
                <span className="font-medium">1-3 business days</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge className="bg-blue-100 text-blue-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Processing
                </Badge>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="font-semibold">Transaction completed with Particle Network</div>
                <div className="text-sm text-blue-700 mt-1">
                  Your swap was processed gaslessly using Account Abstraction and paymaster sponsorship.
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}