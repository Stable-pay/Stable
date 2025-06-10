import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  CreditCard, 
  Globe, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Banknote,
  Building,
  User,
  AlertTriangle,
  Clock,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProductionWallet } from "@/hooks/use-production-wallet";

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountType: string;
  country: string;
}

interface WithdrawFormData {
  amount: string;
  bankAccountId: string;
  purpose: string;
  recipientName: string;
  recipientCountry: string;
}

type WithdrawStep = 'verify' | 'amount' | 'bank' | 'review' | 'processing' | 'completed';

export default function WithdrawDark() {
  const { balances, isKycVerified, canWithdraw } = useProductionWallet();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<WithdrawStep>('verify');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  
  const [formData, setFormData] = useState<WithdrawFormData>({
    amount: '',
    bankAccountId: '',
    purpose: '',
    recipientName: '',
    recipientCountry: ''
  });

  const [newBankAccount, setNewBankAccount] = useState({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    accountType: 'checking',
    country: 'US'
  });

  const steps = [
    { id: 'verify', title: 'Verify KYC', icon: Shield },
    { id: 'amount', title: 'Enter Amount', icon: Banknote },
    { id: 'bank', title: 'Select Bank', icon: Building },
    { id: 'review', title: 'Review', icon: CheckCircle },
    { id: 'processing', title: 'Processing', icon: Clock }
  ];

  // Get USDC balance
  const usdcBalance = balances.find(b => b.symbol === "USDC");
  const availableAmount = usdcBalance ? parseFloat(usdcBalance.formattedBalance) : 0;

  useEffect(() => {
    if (canWithdraw && currentStep === 'verify') {
      setCurrentStep('amount');
      setProgress(20);
    }
    fetchBankAccounts();
  }, [canWithdraw, currentStep]);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts/1');
      if (response.ok) {
        const accounts = await response.json();
        setBankAccounts(accounts);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const addBankAccount = async () => {
    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          ...newBankAccount
        })
      });

      if (response.ok) {
        const account = await response.json();
        setBankAccounts(prev => [...prev, account]);
        setShowAddBank(false);
        setNewBankAccount({
          accountName: '',
          accountNumber: '',
          routingNumber: '',
          bankName: '',
          accountType: 'checking',
          country: 'US'
        });
        toast({
          title: "Bank Account Added",
          description: "Your bank account has been added successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bank account",
        variant: "destructive"
      });
    }
  };

  const processWithdrawal = async () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    setProgress(80);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          type: 'withdrawal',
          fromToken: 'USDC',
          fromAmount: formData.amount,
          toAmount: formData.amount,
          toCurrency: 'USD',
          status: 'processing',
          network: 'ethereum',
          metadata: {
            bankAccountId: formData.bankAccountId,
            purpose: formData.purpose,
            recipientName: formData.recipientName,
            recipientCountry: formData.recipientCountry
          }
        })
      });

      if (response.ok) {
        setTimeout(() => {
          setCurrentStep('completed');
          setProgress(100);
          toast({
            title: "Withdrawal Initiated",
            description: "Your withdrawal request has been processed",
          });
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Failed to process withdrawal",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    const stepOrder: WithdrawStep[] = ['verify', 'amount', 'bank', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      setProgress((currentIndex + 2) * 20);
    }
  };

  const prevStep = () => {
    const stepOrder: WithdrawStep[] = ['verify', 'amount', 'bank', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      setProgress(currentIndex * 20);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            USDC Withdrawal
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Convert your USDC to fiat currency and withdraw to your bank account
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`mt-2 text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'verify' && (
              <Card className="max-w-md mx-auto bg-card border-border">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl text-foreground">
                    <Shield className="h-8 w-8" />
                    KYC Verification Required
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Complete KYC verification to enable withdrawals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!canWithdraw ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                        <div>
                          <p className="font-medium text-foreground">KYC Required</p>
                          <p className="text-sm text-muted-foreground">
                            Complete your identity verification first
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => window.location.href = '/kyc'}
                        className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Shield className="mr-2 h-5 w-5" />
                        Complete KYC Verification
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        <div>
                          <p className="font-medium text-foreground">KYC Verified</p>
                          <p className="text-sm text-muted-foreground">
                            You can now proceed with withdrawals
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={nextStep}
                        className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 'amount' && (
              <Card className="max-w-2xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                    <Banknote className="h-6 w-6" />
                    Withdrawal Amount
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Enter the amount you want to withdraw
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="bg-secondary p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Available Balance</span>
                      <span className="text-2xl font-bold text-foreground">
                        {availableAmount.toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ≈ ${availableAmount.toFixed(2)} USD
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">Withdrawal Amount (USDC)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      max={availableAmount}
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="h-14 text-2xl bg-input border-border text-foreground text-center"
                      placeholder="0.00"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, amount: (availableAmount * 0.25).toFixed(2) }))}
                        className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      >
                        25%
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, amount: (availableAmount * 0.5).toFixed(2) }))}
                        className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      >
                        50%
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, amount: (availableAmount * 0.75).toFixed(2) }))}
                        className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      >
                        75%
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, amount: availableAmount.toFixed(2) }))}
                        className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose" className="text-foreground">Purpose of Withdrawal</Label>
                    <Select 
                      value={formData.purpose}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
                    >
                      <SelectTrigger className="h-12 bg-input border-border text-foreground">
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal_use">Personal Use</SelectItem>
                        <SelectItem value="business_expense">Business Expense</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="bill_payment">Bill Payment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      onClick={nextStep}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={!formData.amount || parseFloat(formData.amount) <= 0 || !formData.purpose}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'bank' && (
              <Card className="max-w-4xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                    <Building className="h-6 w-6" />
                    Bank Account Selection
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Select or add a bank account for withdrawal
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {bankAccounts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Saved Bank Accounts</h3>
                      <div className="grid gap-4">
                        {bankAccounts.map((account) => (
                          <div 
                            key={account.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              formData.bankAccountId === account.id 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border bg-input hover:bg-secondary'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, bankAccountId: account.id }))}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-foreground">{account.bankName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {account.accountType} - ****{account.accountNumber.slice(-4)}
                                </p>
                                <p className="text-sm text-muted-foreground">{account.accountName}</p>
                              </div>
                              {formData.bankAccountId === account.id && (
                                <CheckCircle className="h-6 w-6 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!showAddBank ? (
                    <Button 
                      onClick={() => setShowAddBank(true)}
                      variant="outline"
                      className="w-full h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Add New Bank Account
                    </Button>
                  ) : (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-input">
                      <h3 className="text-lg font-semibold text-foreground">Add New Bank Account</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground">Account Name</Label>
                          <Input
                            value={newBankAccount.accountName}
                            onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountName: e.target.value }))}
                            className="h-12 bg-background border-border text-foreground"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-foreground">Bank Name</Label>
                          <Input
                            value={newBankAccount.bankName}
                            onChange={(e) => setNewBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
                            className="h-12 bg-background border-border text-foreground"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-foreground">Account Number</Label>
                          <Input
                            value={newBankAccount.accountNumber}
                            onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                            className="h-12 bg-background border-border text-foreground"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-foreground">Routing Number</Label>
                          <Input
                            value={newBankAccount.routingNumber}
                            onChange={(e) => setNewBankAccount(prev => ({ ...prev, routingNumber: e.target.value }))}
                            className="h-12 bg-background border-border text-foreground"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => setShowAddBank(false)}
                          variant="outline"
                          className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={addBankAccount}
                          className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Add Account
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      onClick={nextStep}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={!formData.bankAccountId}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'review' && (
              <Card className="max-w-2xl mx-auto bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                    <CheckCircle className="h-6 w-6" />
                    Review Withdrawal
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Please review your withdrawal details
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold text-foreground">{formData.amount} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">USD Value:</span>
                      <span className="font-semibold text-foreground">${formData.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing Fee:</span>
                      <span className="font-semibold text-foreground">$2.50</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">You'll Receive:</span>
                      <span className="font-bold text-foreground text-lg">
                        ${(parseFloat(formData.amount) - 2.5).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-secondary p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Bank Account Details</h4>
                    {bankAccounts.find(acc => acc.id === formData.bankAccountId) && (
                      <div className="text-sm text-muted-foreground">
                        <p>{bankAccounts.find(acc => acc.id === formData.bankAccountId)?.bankName}</p>
                        <p>****{bankAccounts.find(acc => acc.id === formData.bankAccountId)?.accountNumber.slice(-4)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button 
                      onClick={processWithdrawal}
                      className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Process Withdrawal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 'processing' && (
              <Card className="max-w-md mx-auto bg-card border-border">
                <CardContent className="text-center py-12">
                  <Clock className="h-20 w-20 mx-auto mb-6 text-primary animate-pulse" />
                  <h2 className="text-2xl font-bold mb-4 text-foreground">Processing Withdrawal</h2>
                  <p className="text-muted-foreground mb-6">
                    Your withdrawal is being processed. Please wait...
                  </p>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            )}

            {currentStep === 'completed' && (
              <Card className="max-w-md mx-auto bg-card border-border">
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-20 w-20 mx-auto mb-6 text-green-500" />
                  <h2 className="text-2xl font-bold mb-4 text-foreground">Withdrawal Successful!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your withdrawal has been processed. Funds will arrive in 1-3 business days.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Return to Wallet
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}