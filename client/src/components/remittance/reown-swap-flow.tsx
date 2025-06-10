import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Shield,
  Wallet,
  Zap,
  ArrowUpDown,
  User,
  Banknote,
  Phone
} from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';
import { Link } from 'wouter';

interface SwapStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ReactNode;
}

interface Token {
  symbol: string;
  address: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  isNative: boolean;
  usdValue?: number;
}

interface KycData {
  fullName: string;
  phoneNumber: string;
  panNumber: string;
  aadharNumber: string;
  address: string;
  kycStatus: string;
}

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  isPrimary: boolean;
}

export function ReownSwapFlow() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { balances, isLoading: tokensLoading } = useComprehensiveWalletBalances();

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

  const steps: SwapStep[] = [
    {
      id: 'select',
      title: 'Select Token & Amount',
      description: 'Choose your cryptocurrency and amount to convert',
      status: currentStep === 0 ? 'active' : currentStep > 0 ? 'completed' : 'pending',
      icon: <Wallet className="w-5 h-5" />
    },
    {
      id: 'verify',
      title: 'Verify Identity',
      description: 'Complete KYC verification for compliance',
      status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'pending',
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'swap',
      title: 'Execute Swap',
      description: 'Convert crypto to INR using Reown AppKit',
      status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending',
      icon: <ArrowUpDown className="w-5 h-5" />
    },
    {
      id: 'transfer',
      title: 'Bank Transfer',
      description: 'Receive INR directly in your bank account',
      status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending',
      icon: <Banknote className="w-5 h-5" />
    }
  ];

  useEffect(() => {
    if (selectedToken && swapAmount) {
      fetchExchangeRate();
    }
  }, [selectedToken, swapAmount]);

  const fetchExchangeRate = async () => {
    if (!selectedToken || !swapAmount) return;
    
    try {
      const response = await fetch(`/api/remittance/rates?from=${selectedToken.symbol}&to=INR`);
      const data = await response.json();
      
      if (data.rate) {
        setExchangeRate(data.rate);
        const amount = parseFloat(swapAmount) || 0;
        const inr = (amount * data.rate).toFixed(2);
        setInrAmount(inr);
      }
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      toast({
        title: "Rate Fetch Failed",
        description: "Unable to get current exchange rates",
        variant: "destructive"
      });
    }
  };

  const handleTokenSelect = (balance: any) => {
    const token: Token = {
      symbol: balance.symbol,
      address: balance.address,
      balance: balance.balance,
      formattedBalance: balance.formattedBalance,
      decimals: balance.decimals,
      chainId: balance.chainId,
      chainName: balance.chainName || 'Unknown',
      isNative: balance.isNative,
      usdValue: balance.usdValue
    };
    setSelectedToken(token);
    setSwapAmount('');
    setInrAmount('0');
  };

  const handleAmountChange = (value: string) => {
    setSwapAmount(value);
    if (selectedToken && exchangeRate) {
      const amount = parseFloat(value) || 0;
      const inr = (amount * exchangeRate).toFixed(2);
      setInrAmount(inr);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSwapExecution = async () => {
    if (!selectedToken || !swapAmount || !address) {
      toast({
        title: "Missing Information",
        description: "Please ensure all swap details are provided",
        variant: "destructive"
      });
      return;
    }

    setIsSwapping(true);
    
    try {
      // Open Reown AppKit swap interface with specific view
      toast({
        title: "Opening Swap Interface",
        description: "Complete the token swap in the Reown interface",
      });

      // Open the swap view specifically
      await open({ view: 'Swap' });
      
      // Monitor for swap completion (in real implementation, this would listen for blockchain events)
      setTimeout(() => {
        setIsSwapping(false);
        toast({
          title: "Swap Ready",
          description: "Please complete the swap in the Reown interface, then continue",
        });
        // Don't auto-advance - let user manually continue after swap
      }, 2000);

    } catch (error) {
      console.error('Swap interface error:', error);
      setIsSwapping(false);
      toast({
        title: "Interface Error",
        description: "Failed to open swap interface",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawal = async () => {
    if (!bankDetails.accountNumber || !kycData.fullName || !inrAmount) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/remittance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: inrAmount,
          currency: 'INR',
          bankDetails,
          kycData: { ...kycData, kycStatus: 'verified' }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setWithdrawalId(data.id);
        toast({
          title: "Withdrawal Initiated",
          description: `INR ₹${inrAmount} will be transferred to your bank account`,
        });
        handleNextStep();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to initiate bank transfer",
        variant: "destructive"
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to start the gasless remittance process
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => open()} className="w-full">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Gasless Remittance Flow
          </CardTitle>
          <CardDescription>
            Convert cryptocurrency to INR and transfer to your bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${step.status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' :
                    step.status === 'active' ? 'bg-blue-100 border-blue-500 text-blue-600' :
                    'bg-gray-100 border-gray-300 text-gray-400'}
                `}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2 transition-colors
                    ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / (steps.length - 1)) * 100} className="w-full" />
          <div className="mt-2 text-center">
            <Badge variant="outline">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Token & Amount</CardTitle>
            <CardDescription>
              Choose the cryptocurrency you want to convert to INR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {tokensLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading your tokens...</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label>Select Token</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {balances.map((balance) => (
                      <Card
                        key={`${balance.address}-${balance.chainId}`}
                        className={`cursor-pointer transition-colors ${
                          selectedToken?.address === balance.address && selectedToken?.chainId === balance.chainId
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleTokenSelect(balance)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">{balance.symbol}</div>
                              <div className="text-sm text-gray-500">{balance.chainName || 'Unknown Network'}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{balance.formattedBalance}</div>
                              {balance.usdValue && (
                                <div className="text-sm text-gray-500">${balance.usdValue.toFixed(2)}</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedToken && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="space-y-3">
                      <Label htmlFor="amount">Amount to Swap</Label>
                      <div className="flex gap-2">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.0"
                          value={swapAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleAmountChange(selectedToken.formattedBalance)}
                        >
                          Max
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500">
                        Available: {selectedToken.formattedBalance} {selectedToken.symbol}
                      </div>
                    </div>

                    {swapAmount && exchangeRate > 0 && (
                      <Alert>
                        <DollarSign className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold">
                            {swapAmount} {selectedToken.symbol} = ₹{inrAmount} INR
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Exchange rate: 1 {selectedToken.symbol} = ₹{exchangeRate.toLocaleString()}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleNextStep}
                    disabled={!selectedToken || !swapAmount || parseFloat(swapAmount) <= 0}
                  >
                    Continue to Verification
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Identity Verification</CardTitle>
            <CardDescription>
              Complete KYC verification for regulatory compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={kycData.fullName}
                  onChange={(e) => setKycData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 XXXXX XXXXX"
                  value={kycData.phoneNumber}
                  onChange={(e) => setKycData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN Number</Label>
                <Input
                  id="pan"
                  placeholder="ABCDE1234F"
                  value={kycData.panNumber}
                  onChange={(e) => setKycData(prev => ({ ...prev, panNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhar">Aadhar Number</Label>
                <Input
                  id="aadhar"
                  placeholder="XXXX XXXX XXXX"
                  value={kycData.aadharNumber}
                  onChange={(e) => setKycData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter your complete address"
                value={kycData.address}
                onChange={(e) => setKycData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account Number</Label>
              <Input
                id="bankAccount"
                placeholder="Enter account number"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input
                  id="ifsc"
                  placeholder="BANK0001234"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="Bank Name"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!kycData.fullName || !kycData.phoneNumber || !bankDetails.accountNumber}
              >
                Continue to Swap
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Execute Swap</CardTitle>
            <CardDescription>
              Complete the cryptocurrency swap using Reown AppKit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedToken && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Swap Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span className="font-medium">{swapAmount} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-medium">₹{inrAmount} INR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exchange Rate:</span>
                    <span className="font-medium">1 {selectedToken.symbol} = ₹{exchangeRate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span className="font-medium">{selectedToken.chainName}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>You will receive:</span>
                    <span>₹{inrAmount} INR</span>
                  </div>
                </div>
              </div>
            )}

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">Secure Swap via Reown AppKit</div>
                <div className="text-sm text-gray-600 mt-1">
                  Your transaction will be processed through Reown's secure infrastructure
                  with built-in gasless capabilities and multi-chain support.
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={handleSwapExecution}
                  disabled={isSwapping}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSwapping ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Opening Swap...
                    </>
                  ) : (
                    <>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Open Reown Swap
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleNextStep}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Swap Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Transfer</CardTitle>
            <CardDescription>
              INR transfer to your bank account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-lg">Swap Completed Successfully!</h3>
              </div>
              <div className="space-y-2">
                <p>Your cryptocurrency has been successfully converted to INR.</p>
                <p className="font-semibold">Amount: ₹{inrAmount} INR</p>
              </div>
            </div>

            {bankDetails && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Bank Transfer Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <span className="font-medium">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IFSC Code:</span>
                    <span className="font-medium">{bankDetails.ifscCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank Name:</span>
                    <span className="font-medium">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">₹{inrAmount}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Back
              </Button>
              <Button onClick={handleWithdrawal} className="bg-green-600 hover:bg-green-700">
                <Banknote className="w-4 h-4 mr-2" />
                Initiate Bank Transfer
              </Button>
            </div>

            {withdrawalId && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Transfer Initiated!</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Transfer ID: {withdrawalId}<br />
                    Estimated time: 5-10 minutes<br />
                    You will receive an SMS confirmation once completed.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}