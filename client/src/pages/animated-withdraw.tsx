import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Banknote, 
  Wallet, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  User, 
  Building2,
  Zap,
  Globe,
  Lock,
  DollarSign,
  ArrowUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { Web3PulseLoader, Web3SpinLoader } from '@/components/animations/web3-loader';
import { ModernWalletModal } from '@/components/web3/modern-wallet-modal';

interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  accountHolderName: string;
  verified: boolean;
}

interface WithdrawRequest {
  amount: string;
  currency: 'USD' | 'EUR' | 'GBP';
  method: 'bank' | 'card';
  bankAccountId?: string;
  fees: number;
  estimatedTime: string;
}

type WithdrawStep = 'connect' | 'select-method' | 'bank-details' | 'amount' | 'review' | 'processing' | 'completed';

export default function AnimatedWithdraw() {
  const { connect, address, isConnected, balances } = useParticleWallet();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<WithdrawStep>('connect');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [withdrawRequest, setWithdrawRequest] = useState<WithdrawRequest>({
    amount: '',
    currency: 'USD',
    method: 'bank',
    fees: 0,
    estimatedTime: '1-3 business days'
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      accountNumber: '****1234',
      routingNumber: '021000021',
      accountType: 'checking',
      bankName: 'Chase Bank',
      accountHolderName: 'John Doe',
      verified: true
    }
  ]);

  const [newBankAccount, setNewBankAccount] = useState<{
    accountNumber: string;
    routingNumber: string;
    accountType: 'checking' | 'savings';
    bankName: string;
    accountHolderName: string;
  }>({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    bankName: '',
    accountHolderName: ''
  });

  const [showAddBank, setShowAddBank] = useState(false);

  const steps = [
    { id: 'connect', title: 'Connect Wallet', icon: Wallet },
    { id: 'select-method', title: 'Withdrawal Method', icon: CreditCard },
    { id: 'bank-details', title: 'Bank Details', icon: Building2 },
    { id: 'amount', title: 'Amount', icon: DollarSign },
    { id: 'review', title: 'Review', icon: CheckCircle }
  ];

  const getStepIndex = (step: WithdrawStep) => {
    return steps.findIndex(s => s.id === step);
  };

  const handleWalletConnect = async (walletId: string) => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setShowWalletModal(false);
    setCurrentStep('select-method');
    
    toast({
      title: "Wallet Connected!",
      description: "You can now proceed with withdrawal",
    });
  };

  const calculateFees = (amount: string, method: string) => {
    const amt = parseFloat(amount);
    if (!amt) return 0;
    
    if (method === 'bank') {
      return Math.max(5, amt * 0.01); // $5 or 1%, whichever is higher
    } else {
      return amt * 0.025; // 2.5% for card withdrawals
    }
  };

  const handleMethodSelect = (method: 'bank' | 'card') => {
    setWithdrawRequest(prev => ({
      ...prev,
      method,
      estimatedTime: method === 'bank' ? '1-3 business days' : '24-48 hours'
    }));
    
    if (method === 'bank') {
      setCurrentStep('bank-details');
    } else {
      setCurrentStep('amount');
    }
  };

  const handleAddBankAccount = () => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...newBankAccount,
      accountNumber: `****${newBankAccount.accountNumber.slice(-4)}`,
      verified: false
    };
    
    setBankAccounts(prev => [...prev, newAccount]);
    setShowAddBank(false);
    setNewBankAccount({
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking',
      bankName: '',
      accountHolderName: ''
    });
    
    toast({
      title: "Bank Account Added",
      description: "Your bank account has been added for verification",
    });
  };

  const handleAmountChange = (amount: string) => {
    const fees = calculateFees(amount, withdrawRequest.method);
    setWithdrawRequest(prev => ({
      ...prev,
      amount,
      fees
    }));
  };

  const handleProcessWithdrawal = async () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      setProgress(100);
      setCurrentStep('completed');
      
      toast({
        title: "Withdrawal Initiated!",
        description: `Your withdrawal of $${withdrawRequest.amount} has been processed`,
      });
      
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      clearInterval(progressInterval);
    }
  };

  useEffect(() => {
    if (isConnected && currentStep === 'connect') {
      setCurrentStep('select-method');
    }
  }, [isConnected]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const stepVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            variants={itemVariants}
            className="text-5xl font-bold mb-4" 
            style={{ color: '#6667AB' }}
          >
            Withdraw Funds
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-xl text-gray-600"
          >
            Convert your crypto to fiat and withdraw to your bank account
          </motion.p>
          
          {/* Progress Steps */}
          <motion.div 
            variants={itemVariants}
            className="mt-8"
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              {steps.map((step, index) => {
                const isActive = getStepIndex(currentStep) >= index;
                const isCurrent = steps[getStepIndex(currentStep)]?.id === step.id;
                
                return (
                  <motion.div
                    key={step.id}
                    className="flex items-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive 
                          ? 'bg-[#6667AB] border-[#6667AB] text-white' 
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        boxShadow: isCurrent ? '0 0 20px rgba(102, 103, 171, 0.3)' : '0 0 0px rgba(0,0,0,0)'
                      }}
                    >
                      <step.icon className="h-5 w-5" />
                    </motion.div>
                    {index < steps.length - 1 && (
                      <motion.div
                        className={`w-8 h-0.5 mx-2 transition-colors ${
                          getStepIndex(currentStep) > index ? 'bg-[#6667AB]' : 'bg-gray-300'
                        }`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: getStepIndex(currentStep) > index ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Badge className="bg-[#6667AB] text-white">
                Step {getStepIndex(currentStep) + 1} of {steps.length}
              </Badge>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* Connect Wallet Step */}
          {currentStep === 'connect' && (
            <motion.div
              key="connect"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex justify-center"
            >
              <Card className="w-full max-w-lg shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader className="text-center pb-8 pt-12">
                  <motion.div
                    className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                    style={{ backgroundColor: '#6667AB' }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Wallet className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <CardTitle className="text-3xl font-bold mb-3" style={{ color: '#6667AB' }}>
                    Connect Your Wallet
                  </CardTitle>
                  <p className="text-gray-600 text-lg">
                    Connect your wallet to begin the withdrawal process
                  </p>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <Button
                    onClick={() => setShowWalletModal(true)}
                    className="w-full h-14 text-lg font-semibold bg-[#6667AB] hover:bg-[#5a5b96] text-white shadow-lg"
                    size="lg"
                  >
                    <Wallet className="h-5 w-5 mr-3" />
                    Connect Wallet
                  </Button>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Secure</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Zap className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Fast</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Globe className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Global</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Select Method Step */}
          {currentStep === 'select-method' && (
            <motion.div
              key="select-method"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <CreditCard className="h-6 w-6" />
                    Choose Withdrawal Method
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Select how you'd like to receive your funds
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Transfer */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="cursor-pointer border-2 border-gray-200 hover:border-[#6667AB] transition-colors"
                        onClick={() => handleMethodSelect('bank')}
                      >
                        <CardContent className="p-6 text-center">
                          <motion.div
                            className="w-16 h-16 bg-[#6667AB] rounded-2xl flex items-center justify-center mx-auto mb-4"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Building2 className="h-8 w-8 text-white" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-2" style={{ color: '#6667AB' }}>
                            Bank Transfer
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Direct transfer to your bank account
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Processing time:</span>
                              <span className="font-medium">1-3 business days</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Fee:</span>
                              <span className="font-medium">$5 + 1%</span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 mt-3">
                            Most Popular
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Debit Card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="cursor-pointer border-2 border-gray-200 hover:border-[#6667AB] transition-colors"
                        onClick={() => handleMethodSelect('card')}
                      >
                        <CardContent className="p-6 text-center">
                          <motion.div
                            className="w-16 h-16 bg-[#6667AB] rounded-2xl flex items-center justify-center mx-auto mb-4"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CreditCard className="h-8 w-8 text-white" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-2" style={{ color: '#6667AB' }}>
                            Debit Card
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Instant withdrawal to your debit card
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Processing time:</span>
                              <span className="font-medium">24-48 hours</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Fee:</span>
                              <span className="font-medium">2.5%</span>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 mt-3">
                            Faster
                          </Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Wallet Balance Display */}
                  {balance && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Available Balance</p>
                          <p className="text-2xl font-bold" style={{ color: '#6667AB' }}>
                            {parseFloat(balance.formatted).toFixed(6)} {balance.symbol}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-[#6667AB] rounded-xl flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Bank Details Step */}
          {currentStep === 'bank-details' && (
            <motion.div
              key="bank-details"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <Building2 className="h-6 w-6" />
                    Bank Account Details
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Select or add a bank account for withdrawal
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Existing Bank Accounts */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold" style={{ color: '#6667AB' }}>
                        Saved Bank Accounts
                      </h3>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddBank(true)}
                        className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white"
                      >
                        Add New Account
                      </Button>
                    </div>

                    {bankAccounts.map((account, index) => (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => {
                          setWithdrawRequest(prev => ({ ...prev, bankAccountId: account.id }));
                          setCurrentStep('amount');
                        }}
                      >
                        <Card className={`border-2 transition-colors ${
                          withdrawRequest.bankAccountId === account.id
                            ? 'border-[#6667AB] bg-[#6667AB]/5'
                            : 'border-gray-200 hover:border-[#6667AB]'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#6667AB] rounded-xl flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold">{account.bankName}</p>
                                  <p className="text-gray-600">{account.accountNumber} • {account.accountType}</p>
                                  <p className="text-sm text-gray-500">{account.accountHolderName}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                {account.verified ? (
                                  <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-700">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add New Bank Account Form */}
                  <AnimatePresence>
                    {showAddBank && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Card className="border-2 border-dashed border-[#6667AB]">
                          <CardHeader>
                            <CardTitle className="text-lg">Add New Bank Account</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Account Holder Name</Label>
                                <Input
                                  value={newBankAccount.accountHolderName}
                                  onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountHolderName: e.target.value }))}
                                  className="border-gray-200 focus:border-[#6667AB]"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Bank Name</Label>
                                <Input
                                  value={newBankAccount.bankName}
                                  onChange={(e) => setNewBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
                                  className="border-gray-200 focus:border-[#6667AB]"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Account Number</Label>
                                <Input
                                  value={newBankAccount.accountNumber}
                                  onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                                  className="border-gray-200 focus:border-[#6667AB]"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Routing Number</Label>
                                <Input
                                  value={newBankAccount.routingNumber}
                                  onChange={(e) => setNewBankAccount(prev => ({ ...prev, routingNumber: e.target.value }))}
                                  className="border-gray-200 focus:border-[#6667AB]"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Account Type</Label>
                              <Select 
                                value={newBankAccount.accountType}
                                onValueChange={(value: 'checking' | 'savings') => setNewBankAccount(prev => ({ 
                                  ...prev, 
                                  accountType: value as 'checking' | 'savings'
                                }))}
                              >
                                <SelectTrigger className="border-gray-200 focus:border-[#6667AB]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="checking">Checking Account</SelectItem>
                                  <SelectItem value="savings">Savings Account</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={handleAddBankAccount}
                                className="bg-[#6667AB] hover:bg-[#5a5b96] text-white"
                              >
                                Add Account
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowAddBank(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Amount Step */}
          {currentStep === 'amount' && (
            <motion.div
              key="amount"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <DollarSign className="h-6 w-6" />
                    Withdrawal Amount
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Enter the amount you'd like to withdraw
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={withdrawRequest.amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="h-14 text-xl pl-12 border-gray-200 focus:border-[#6667AB]"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={withdrawRequest.currency}
                        onValueChange={(value: 'USD' | 'EUR' | 'GBP') => setWithdrawRequest(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger className="h-12 border-gray-200 focus:border-[#6667AB]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {withdrawRequest.amount && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-gray-50 rounded-xl space-y-3"
                    >
                      <h3 className="font-semibold" style={{ color: '#6667AB' }}>Transaction Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Withdrawal Amount</span>
                          <span className="font-medium">${withdrawRequest.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processing Fee</span>
                          <span className="font-medium">${withdrawRequest.fees.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-semibold">You'll Receive</span>
                          <span className="font-semibold" style={{ color: '#6667AB' }}>
                            ${(parseFloat(withdrawRequest.amount) - withdrawRequest.fees).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Time</span>
                          <span className="font-medium">{withdrawRequest.estimatedTime}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={() => setCurrentStep('review')}
                    disabled={!withdrawRequest.amount || parseFloat(withdrawRequest.amount) <= 0}
                    className="w-full bg-[#6667AB] hover:bg-[#5a5b96] text-white"
                    size="lg"
                  >
                    Continue to Review
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <motion.div
              key="review"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                    <CheckCircle className="h-6 w-6" />
                    Review Withdrawal
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Please review your withdrawal details before confirming
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    {/* Withdrawal Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5" style={{ color: '#6667AB' }} />
                            Withdrawal Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Amount</span>
                              <span className="font-semibold text-2xl" style={{ color: '#6667AB' }}>
                                ${withdrawRequest.amount} {withdrawRequest.currency}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Method</span>
                              <span className="font-medium capitalize">{withdrawRequest.method} Transfer</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Processing Fee</span>
                              <span className="font-medium">${withdrawRequest.fees.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Estimated Time</span>
                              <span className="font-medium">{withdrawRequest.estimatedTime}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                              <span className="font-semibold">Total You'll Receive</span>
                              <span className="font-semibold text-lg" style={{ color: '#6667AB' }}>
                                ${(parseFloat(withdrawRequest.amount) - withdrawRequest.fees).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Destination Account */}
                    {withdrawRequest.method === 'bank' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Card className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Building2 className="h-5 w-5" style={{ color: '#6667AB' }} />
                              Destination Account
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const account = bankAccounts.find(acc => acc.id === withdrawRequest.bankAccountId);
                              return account ? (
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-[#6667AB] rounded-xl flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{account.bankName}</p>
                                    <p className="text-gray-600">{account.accountNumber} • {account.accountType}</p>
                                    <p className="text-sm text-gray-500">{account.accountHolderName}</p>
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      onClick={handleProcessWithdrawal}
                      className="w-full bg-[#6667AB] hover:bg-[#5a5b96] text-white"
                      size="lg"
                    >
                      Confirm Withdrawal
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <motion.div
              key="processing"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0 max-w-2xl mx-auto">
                <CardContent className="p-12">
                  <Web3PulseLoader size={80} color="#6667AB" />
                  <h2 className="text-3xl font-bold mb-4 mt-8" style={{ color: '#6667AB' }}>
                    Processing Withdrawal
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Your withdrawal is being processed. Please do not close this window.
                  </p>
                  <Progress value={progress} className="max-w-md mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    This may take a few moments...
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Completed Step */}
          {currentStep === 'completed' && (
            <motion.div
              key="completed"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center"
            >
              <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0 max-w-2xl mx-auto">
                <CardContent className="p-12">
                  <motion.div
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{ duration: 1 }}
                  >
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold mb-4" style={{ color: '#6667AB' }}>
                    Withdrawal Complete!
                  </h2>
                  
                  <p className="text-xl text-gray-600 mb-8">
                    Your withdrawal of ${withdrawRequest.amount} has been successfully initiated. 
                    You'll receive the funds in your account within {withdrawRequest.estimatedTime}.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Transaction Details</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Amount: ${withdrawRequest.amount} {withdrawRequest.currency}</p>
                      <p>Fee: ${withdrawRequest.fees.toFixed(2)}</p>
                      <p>Net Amount: ${(parseFloat(withdrawRequest.amount) - withdrawRequest.fees).toFixed(2)}</p>
                      <p>Reference ID: WD{Date.now()}</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8"
                    size="lg"
                  >
                    Return to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wallet Modal */}
      <ModernWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
        isConnecting={isConnecting}
      />
    </div>
  );
}