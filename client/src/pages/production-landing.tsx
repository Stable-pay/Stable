import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Wallet,
  TrendingUp,
  CheckCircle,
  Shield,
  Globe,
  Users,
  Zap,
  Star,
  CreditCard,
  Phone,
  Building,
  Award,
  RefreshCw,
  FileText,
  Scan,
  UserCheck,
  Key,
  Lock,
  MapPin,
  AlertCircle,
  Activity,
  Plus,
  Loader2,
  DollarSign,
  Send,
  ChevronDown
} from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { SocialWalletCreator } from '@/components/wallet/social-wallet-creator';
import { ProductionBalanceFetcher } from '@/components/wallet/production-balance-fetcher';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Production-ready types
interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
  usdValue: number;
  inrValue: number;
  chainId: number;
  chainName: string;
}

interface KYCData {
  fullName: string;
  dateOfBirth: string;
  aadhaarNumber: string;
  panNumber: string;
  address: string;
  phoneNumber: string;
  isVerified: boolean;
}

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

type FlowStep = 'landing' | 'wallet-connected' | 'token-selected' | 'kyc' | 'bank-details' | 'processing' | 'complete';

export function ProductionLanding() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  
  // Core state
  const [currentStep, setCurrentStep] = useState<FlowStep>('landing');
  const [selectedNetwork, setSelectedNetwork] = useState<'EVM' | 'SOLANA'>('EVM');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [inrAmount, setInrAmount] = useState(0);
  
  // Modal states
  const [showSocialCreator, setShowSocialCreator] = useState(false);
  const [showKYCForm, setShowKYCForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  
  // Form data
  const [kycData, setKycData] = useState<KYCData>({
    fullName: '',
    dateOfBirth: '',
    aadhaarNumber: '',
    panNumber: '',
    address: '',
    phoneNumber: '',
    isVerified: false
  });
  
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: ''
  });
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Update step when wallet connects
  useEffect(() => {
    if (isConnected && address && currentStep === 'landing') {
      setCurrentStep('wallet-connected');
    }
  }, [isConnected, address, currentStep]);

  // Handle token selection from balance fetcher
  const handleTokenSelect = (token: TokenBalance, amount: string) => {
    setSelectedToken(token);
    setTransferAmount(amount);
    setInrAmount(parseFloat(amount) * token.inrValue / parseFloat(token.balance));
    setCurrentStep('token-selected');
  };

  // Handle network change
  const handleNetworkChange = (network: 'EVM' | 'SOLANA') => {
    setSelectedNetwork(network);
    setSelectedToken(null);
    setTransferAmount('');
    setInrAmount(0);
  };

  // Smart contract transfer function
  const executeTokenTransfer = async () => {
    if (!selectedToken || !transferAmount || !address) return;

    setIsProcessing(true);
    try {
      // This would integrate with your smart contract
      console.log('Executing token transfer:', {
        token: selectedToken.symbol,
        amount: transferAmount,
        from: address,
        to: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3'
      });
      
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setTransactionHash('0x1234567890abcdef...');
      setCurrentStep('complete');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Complete KYC flow
  const handleKYCSubmit = () => {
    setKycData(prev => ({ ...prev, isVerified: true }));
    setShowKYCForm(false);
    setCurrentStep('bank-details');
  };

  // Complete bank details
  const handleBankSubmit = () => {
    setShowBankForm(false);
    setCurrentStep('processing');
    executeTokenTransfer();
  };

  // Render landing page content
  const renderLandingContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#6667AB] to-[#8B5CF6]">
      {/* Hero Section */}
      <section className="px-6 py-20 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Convert Crypto to INR
            <span className="block text-[#FCFBF4]">Instantly</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-[#FCFBF4]/90">
            Seamless crypto-to-fiat conversion with social wallet creation, 
            multi-chain support, and instant INR withdrawals
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => setShowSocialCreator(true)}
              size="lg"
              className="bg-[#FCFBF4] text-[#6667AB] hover:bg-[#FCFBF4]/90 px-8 py-4 text-lg rounded-2xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Wallet (Social Login)
            </Button>
            <Button
              onClick={() => open()}
              variant="outline"
              size="lg"
              className="border-[#FCFBF4] text-[#FCFBF4] hover:bg-[#FCFBF4]/10 px-8 py-4 text-lg rounded-2xl"
            >
              <Wallet className="h-5 w-5 mr-2" />
              Connect Existing Wallet
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-[#FCFBF4]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#6667AB] mb-12">
            Why Choose StablePay?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-[#6667AB]/20">
              <CardHeader>
                <Shield className="h-12 w-12 text-[#6667AB] mb-4" />
                <CardTitle className="text-[#6667AB]">Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Bank-grade security with full KYC compliance and Travel Rule implementation
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-[#6667AB]/20">
              <CardHeader>
                <Zap className="h-12 w-12 text-[#6667AB] mb-4" />
                <CardTitle className="text-[#6667AB]">Gasless Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Zero gas fees with account abstraction and sponsored transactions
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-[#6667AB]/20">
              <CardHeader>
                <Globe className="h-12 w-12 text-[#6667AB] mb-4" />
                <CardTitle className="text-[#6667AB]">Multi-Chain Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Support for Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, and Solana
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );

  // Render wallet connected state
  const renderWalletConnected = () => (
    <div className="min-h-screen bg-[#FCFBF4] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#6667AB] mb-4">
            Welcome to StablePay
          </h1>
          <p className="text-gray-600 text-lg">
            Select tokens from your wallet to convert to INR
          </p>
          <Badge className="bg-green-100 text-green-700 mt-2">
            <CheckCircle className="h-4 w-4 mr-1" />
            Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </Badge>
        </motion.div>

        <ProductionBalanceFetcher
          selectedNetwork={selectedNetwork}
          onNetworkChange={handleNetworkChange}
          onTokenSelect={handleTokenSelect}
        />
      </div>
    </div>
  );

  // Render token selected state
  const renderTokenSelected = () => (
    <div className="min-h-screen bg-[#FCFBF4] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#6667AB]">
                <DollarSign className="h-6 w-6" />
                Conversion Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedToken && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">From</p>
                      <p className="font-semibold text-lg">
                        {transferAmount} {selectedToken.symbol}
                      </p>
                      <p className="text-sm text-gray-500">{selectedToken.chainName}</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-[#6667AB]" />
                    <div>
                      <p className="text-sm text-gray-600">To</p>
                      <p className="font-semibold text-lg text-[#6667AB]">
                        ₹{inrAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">Indian Rupees</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <p className="text-gray-600">
                      To proceed with INR withdrawal, please complete KYC verification
                    </p>
                    <Button
                      onClick={() => setShowKYCForm(true)}
                      className="bg-[#6667AB] hover:bg-[#6667AB]/90 px-8 py-3 rounded-2xl"
                    >
                      <UserCheck className="h-5 w-5 mr-2" />
                      Complete KYC Verification
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );

  // Render KYC form
  const renderKYCForm = () => (
    <Dialog open={showKYCForm} onOpenChange={setShowKYCForm}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            KYC Verification
          </DialogTitle>
          <DialogDescription>
            Please provide your details for Indian KYC compliance
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={kycData.fullName}
                onChange={(e) => setKycData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="As per Aadhaar"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={kycData.dateOfBirth}
                onChange={(e) => setKycData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
            <Input
              id="aadhaarNumber"
              value={kycData.aadhaarNumber}
              onChange={(e) => setKycData(prev => ({ ...prev, aadhaarNumber: e.target.value }))}
              placeholder="12-digit Aadhaar number"
              maxLength={12}
            />
          </div>
          
          <div>
            <Label htmlFor="panNumber">PAN Number</Label>
            <Input
              id="panNumber"
              value={kycData.panNumber}
              onChange={(e) => setKycData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
              placeholder="10-character PAN"
              maxLength={10}
            />
          </div>
          
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={kycData.phoneNumber}
              onChange={(e) => setKycData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+91 XXXXXXXXXX"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={kycData.address}
              onChange={(e) => setKycData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Complete address as per Aadhaar"
              rows={3}
            />
          </div>
          
          <Button
            onClick={handleKYCSubmit}
            className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
            disabled={!kycData.fullName || !kycData.aadhaarNumber || !kycData.panNumber}
          >
            Verify & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Render bank details form
  const renderBankForm = () => (
    <Dialog open={showBankForm} onOpenChange={setShowBankForm}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Account Details
          </DialogTitle>
          <DialogDescription>
            Add your Indian bank account for INR withdrawal
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              value={bankDetails.accountHolderName}
              onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
              placeholder="As per bank records"
            />
          </div>
          
          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="Bank account number"
            />
          </div>
          
          <div>
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input
              id="ifscCode"
              value={bankDetails.ifscCode}
              onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
              placeholder="11-character IFSC code"
              maxLength={11}
            />
          </div>
          
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
              placeholder="Bank name"
            />
          </div>
          
          <div>
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              value={bankDetails.branchName}
              onChange={(e) => setBankDetails(prev => ({ ...prev, branchName: e.target.value }))}
              placeholder="Branch name"
            />
          </div>
          
          <Button
            onClick={handleBankSubmit}
            className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
            disabled={!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode}
          >
            Complete Setup & Transfer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Render processing state
  const renderProcessing = () => (
    <div className="min-h-screen bg-[#FCFBF4] flex items-center justify-center px-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <Loader2 className="h-16 w-16 text-[#6667AB] mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#6667AB] mb-4">
            Processing Transfer
          </h2>
          <p className="text-gray-600 mb-6">
            Your crypto is being converted and transferred to your bank account
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[#6667AB] rounded-full animate-pulse" />
              <span>Executing smart contract</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Converting to INR</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span>Initiating bank transfer</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render completion state
  const renderComplete = () => (
    <div className="min-h-screen bg-[#FCFBF4] flex items-center justify-center px-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Transfer Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your crypto has been successfully converted to INR
          </p>
          {selectedToken && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">Amount Transferred</p>
              <p className="font-semibold text-lg">
                ₹{inrAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
          {transactionHash && (
            <p className="text-xs text-gray-500 mb-6">
              Transaction: {transactionHash}
            </p>
          )}
          <Button
            onClick={() => {
              setCurrentStep('wallet-connected');
              setSelectedToken(null);
              setTransferAmount('');
              setInrAmount(0);
            }}
            className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90"
          >
            Make Another Transfer
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Handle step progression
  useEffect(() => {
    if (currentStep === 'kyc' && kycData.isVerified) {
      setShowBankForm(true);
    }
  }, [currentStep, kycData.isVerified]);

  // Main render
  return (
    <div className="min-h-screen">
      {/* Render based on current step */}
      {!isConnected && currentStep === 'landing' && renderLandingContent()}
      {isConnected && currentStep === 'wallet-connected' && renderWalletConnected()}
      {currentStep === 'token-selected' && renderTokenSelected()}
      {currentStep === 'processing' && renderProcessing()}
      {currentStep === 'complete' && renderComplete()}

      {/* Modals */}
      <SocialWalletCreator
        isOpen={showSocialCreator}
        onClose={() => setShowSocialCreator(false)}
        onSuccess={(walletAddress) => {
          console.log('Wallet created:', walletAddress);
          setShowSocialCreator(false);
        }}
      />

      {renderKYCForm()}
      {renderBankForm()}
    </div>
  );
}