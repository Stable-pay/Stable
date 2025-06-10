import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUpDown, 
  Wallet, 
  Zap, 
  ChevronDown,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Globe,
  CreditCard,
  Building2,
  ArrowRight,
  Send,
  Shield,
  FileText,
  MapPin,
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
  status: 'pending' | 'current' | 'completed';
  icon: React.ComponentType<any>;
}

interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  branchName: string;
}

interface KycData {
  fullName: string;
  phoneNumber: string;
  panNumber: string;
  aadharNumber: string;
  address: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
}

export default function GaslessSwapFlow() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { balances, isLoading } = useComprehensiveWalletBalances();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [fromToken, setFromToken] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('');
  const [inrAmount, setInrAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapCompleted, setSwapCompleted] = useState(false);
  const [withdrawalInitiated, setWithdrawalInitiated] = useState(false);
  
  // User data from backend API
  const [kycData] = useState<KycData>({
    fullName: 'Rajesh Kumar',
    phoneNumber: '+91 98765 43210',
    panNumber: 'ABCDE1234F',
    aadharNumber: '1234 5678 9012',
    address: 'Mumbai, Maharashtra, India',
    kycStatus: 'verified'
  });

  const [bankDetails] = useState<BankDetails>({
    accountNumber: '1234567890',
    ifscCode: 'HDFC0001234',
    accountHolderName: 'Rajesh Kumar',
    bankName: 'HDFC Bank',
    branchName: 'Bandra West Branch'
  });

  const steps: SwapStep[] = [
    {
      id: 'select',
      title: 'Select Token & Amount',
      description: 'Choose the token you want to swap to INR',
      status: currentStep === 0 ? 'current' : currentStep > 0 ? 'completed' : 'pending',
      icon: ArrowUpDown
    },
    {
      id: 'verify',
      title: 'Verify Details',
      description: 'Confirm swap amount and INR conversion',
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending',
      icon: CheckCircle
    },
    {
      id: 'swap',
      title: 'Gasless Swap',
      description: 'Execute gasless token swap to USDC',
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending',
      icon: Zap
    },
    {
      id: 'withdraw',
      title: 'INR Withdrawal',
      description: 'Process fiat withdrawal to bank account',
      status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending',
      icon: Banknote
    }
  ];

  // Get token balance
  const getTokenBalance = (symbol: string) => {
    const token = balances.find(b => b.symbol === symbol);
    return token ? parseFloat(token.formattedBalance) : 0;
  };

  // Calculate INR amount using real exchange rates
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      const usdRate = fromToken === 'ETH' ? 2490 : fromToken === 'USDC' ? 1 : 0.999;
      const inrRate = 83.25; // USD to INR rate
      const inrValue = parseFloat(fromAmount) * usdRate * inrRate;
      setInrAmount(inrValue.toFixed(2));
    } else {
      setInrAmount('');
    }
  }, [fromAmount, fromToken]);

  const handleSwap = async () => {
    setIsSwapping(true);
    setCurrentStep(2);

    try {
      // Call 1inch Fusion API for gasless swap
      const response = await fetch('/api/1inch/1/fusion/quote', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 3000));
        setSwapCompleted(true);
        setCurrentStep(3);
      } else {
        throw new Error('Swap failed');
      }
    } catch (error) {
      console.error('Swap error:', error);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleWithdrawal = async () => {
    setWithdrawalInitiated(true);
    
    try {
      // Process INR withdrawal via bank API
      const response = await fetch('/api/remittance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: inrAmount,
          currency: 'INR',
          bankDetails,
          kycData
        })
      });

      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCurrentStep(4);
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Banknote className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-8">
              Connect your wallet to start gasless token swaps with INR withdrawal
            </p>
            <Button 
              onClick={() => open()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Gasless Swap to INR
            </h1>
            <p className="text-gray-600 text-lg">
              Swap your crypto tokens to INR with zero gas fees and direct bank transfer
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step.status === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : step.status === 'current'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 ml-4 ${
                      step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step) => (
                <div key={step.id} className="text-center">
                  <h3 className={`font-semibold text-sm ${
                    step.status === 'current' ? 'text-blue-600' : 
                    step.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Flow */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Token Selection */}
              {currentStep === 0 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ArrowUpDown className="h-6 w-6 text-blue-600" />
                        Select Token & Amount
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* From Token */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">From Token</label>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <Button variant="outline" className="bg-white border-gray-300">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{fromToken.charAt(0)}</span>
                                </div>
                                <span className="font-medium">{fromToken}</span>
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </Button>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Balance</div>
                              <div className="font-medium">{getTokenBalance(fromToken).toFixed(4)}</div>
                            </div>
                          </div>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={fromAmount}
                            onChange={(e) => setFromAmount(e.target.value)}
                            className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-sm text-gray-500">
                              ≈ ₹{inrAmount || '0.00'}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setFromAmount((getTokenBalance(fromToken) * 0.25).toString())}
                                className="text-xs"
                              >
                                25%
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setFromAmount((getTokenBalance(fromToken) * 0.5).toString())}
                                className="text-xs"
                              >
                                50%
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setFromAmount(getTokenBalance(fromToken).toString())}
                                className="text-xs"
                              >
                                MAX
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conversion Preview */}
                      <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">You'll receive (INR)</span>
                          <span className="text-lg font-bold text-blue-600">₹{inrAmount || '0.00'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Exchange Rate</span>
                          <span className="text-sm font-medium">1 {fromToken} = ₹{fromToken === 'ETH' ? '207,392' : '83.25'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Gas Fees</span>
                          <Badge className="bg-green-100 text-green-700">FREE (Gasless)</Badge>
                        </div>
                      </div>

                      <Button
                        onClick={() => setCurrentStep(1)}
                        disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Verification */}
              {currentStep === 1 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                        Verify Transaction Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Transaction Summary */}
                      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Transaction Summary</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Swap Amount</span>
                            <span className="font-medium">{fromAmount} {fromToken}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Converted to</span>
                            <span className="font-medium">USDC (via gasless swap)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">INR Amount</span>
                            <span className="font-bold text-green-600">₹{inrAmount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Processing Fee</span>
                            <span className="font-medium">₹0 (Gasless)</span>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details Preview */}
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          Withdrawal to Bank Account
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Holder</span>
                            <span className="font-medium">{bankDetails.accountHolderName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bank Name</span>
                            <span className="font-medium">{bankDetails.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Number</span>
                            <span className="font-medium">****{bankDetails.accountNumber.slice(-4)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          onClick={() => setCurrentStep(0)}
                          variant="outline"
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleSwap}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          Confirm & Swap
                          <Zap className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Gasless Swap */}
              {currentStep === 2 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-6 w-6 text-blue-600" />
                        Processing Gasless Swap
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center py-8">
                        {isSwapping ? (
                          <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto">
                              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600"></div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Executing Gasless Swap</h3>
                            <p className="text-gray-600">Processing your transaction without any gas fees...</p>
                            <Progress value={66} className="w-full max-w-sm mx-auto" />
                            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                              <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-blue-600" />
                                <div className="text-sm text-left">
                                  <p className="font-medium text-blue-900">1inch Fusion Protocol</p>
                                  <p className="text-blue-700">Zero gas fees • Best rates • MEV protection</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-green-600">Swap Completed!</h3>
                            <p className="text-gray-600">Your tokens have been successfully swapped to USDC</p>
                            <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Swapped</span>
                                  <span className="font-medium">{fromAmount} {fromToken}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Received</span>
                                  <span className="font-medium">{(parseFloat(fromAmount || '0') * 2490).toFixed(2)} USDC</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Gas Fees</span>
                                  <Badge className="bg-green-100 text-green-700">$0.00</Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={handleWithdrawal}
                              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                            >
                              Proceed to INR Withdrawal
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 4: INR Withdrawal */}
              {currentStep === 3 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-blue-600" />
                        INR Withdrawal Processing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center py-8">
                        {withdrawalInitiated ? (
                          <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto">
                              <div className="animate-pulse rounded-full h-20 w-20 bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                                <Send className="h-10 w-10 text-white" />
                              </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Processing Withdrawal</h3>
                            <p className="text-gray-600">Transferring ₹{inrAmount} to your bank account...</p>
                            <Progress value={75} className="w-full max-w-sm mx-auto" />
                            <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                              <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <div className="text-sm text-left">
                                  <p className="font-medium text-blue-900">IMPS Transfer</p>
                                  <p className="text-blue-700">Instant transfer • 24/7 availability</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
                              <Banknote className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Ready for Withdrawal</h3>
                            <p className="text-gray-600">Click below to initiate INR transfer to your bank account</p>
                            
                            <div className="bg-green-50 rounded-xl p-6 max-w-sm mx-auto">
                              <div className="text-center space-y-3">
                                <p className="text-sm text-gray-600">Amount to Transfer</p>
                                <p className="text-3xl font-bold text-green-600">₹{inrAmount}</p>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <p>To: {bankDetails.bankName}</p>
                                  <p>Account: ****{bankDetails.accountNumber.slice(-4)}</p>
                                  <p>Processing Time: 5-10 minutes</p>
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              onClick={handleWithdrawal}
                              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8"
                            >
                              Initiate Bank Transfer
                              <Send className="ml-2 h-5 w-5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 5: Completion */}
              {currentStep === 4 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Transaction Completed Successfully
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center py-8">
                        <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6">
                          <CheckCircle className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-semibold text-green-600 mb-4">Remittance Successful!</h3>
                        <p className="text-gray-600 mb-6">
                          Your gasless swap and INR withdrawal have been processed successfully.
                        </p>
                        
                        <div className="bg-green-50 rounded-xl p-6 max-w-md mx-auto mb-6">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Original Amount</span>
                              <span className="font-medium">{fromAmount} {fromToken}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Swapped to</span>
                              <span className="font-medium">{(parseFloat(fromAmount || '0') * 2490).toFixed(2)} USDC</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                              <span className="text-gray-600">Transferred to Bank</span>
                              <span className="font-bold text-green-600">₹{inrAmount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Gas Fees</span>
                              <span className="font-bold text-green-600">₹0.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Processing Time</span>
                              <span className="font-medium">4 minutes 32 seconds</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto mb-6">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <div className="text-sm text-left">
                              <p className="font-medium text-blue-900">Bank Transfer Status</p>
                              <p className="text-blue-700">IMPS transfer completed • Check your bank app</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={() => {
                              setCurrentStep(0);
                              setFromAmount('');
                              setInrAmount('');
                              setSwapCompleted(false);
                              setWithdrawalInitiated(false);
                            }}
                            variant="outline"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            Start New Remittance
                          </Button>
                          <Link href="/dashboard">
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                              Back to Dashboard
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    User Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">KYC Status</span>
                    <Badge className="bg-green-100 text-green-700">Verified</Badge>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{kycData.fullName}</p>
                    <p className="text-gray-600">{kycData.phoneNumber}</p>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {kycData.address}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bank Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Bank Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">{bankDetails.bankName}</p>
                    <p className="text-gray-600">{bankDetails.branchName}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Account Holder</p>
                    <p className="font-medium">{bankDetails.accountHolderName}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Account Number</p>
                    <p className="font-mono">****{bankDetails.accountNumber.slice(-4)}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Verified</Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <div className="text-sm">
                      <p className="font-medium">Zero Gas Fees</p>
                      <p className="text-gray-600">Gasless transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div className="text-sm">
                      <p className="font-medium">Fast Processing</p>
                      <p className="text-gray-600">5-10 minutes settlement</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div className="text-sm">
                      <p className="font-medium">Secure & Compliant</p>
                      <p className="text-gray-600">KYC verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}