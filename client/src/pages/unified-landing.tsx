import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Wallet,
  TrendingUp,
  Clock,
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
  ChevronDown,
  Play,
  Send,
  RefreshCw,
  FileText,
  Scan,
  UserCheck,
  Key,
  Database,
  Lock,
  MapPin,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitState } from '@reown/appkit/react';
import { SocialWalletCreator } from '@/components/reown/social-wallet-creator';
import { TravelRuleForm } from '@/components/compliance/travel-rule-form';
import WalletBalanceFetcher from '@/components/WalletBalanceFetcher';
import { SolanaWalletConnector } from '@/components/wallet/solana-wallet-connector';
import { DirectTokenTransfer } from '@/components/transfer/direct-token-transfer';
import { USDCApprovalInterface } from '@/components/withdrawal/usdc-approval-interface';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useReownTransfer } from '@/hooks/use-reown-transfer';
import { useReownPay } from '@/hooks/use-reown-pay';
import { getSupportedTokens, isTokenSupported, getTokenInfo, TOP_100_CRYPTO } from '@/../../shared/top-100-crypto';
import { REOWN_SUPPORTED_CHAINS, REOWN_SUPPORTED_TOKENS } from '@/../../shared/reown-supported-tokens';
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';

type FlowStep = 'token-selection' | 'kyc' | 'bank-details' | 'travel-rule' | 'withdrawal' | 'success';
type KYCStep = 'personal-info' | 'document-upload' | 'bank-account' | 'verification';

interface RecipientData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  dateOfBirth: string;
  nationality: string;
  aadhaarNumber: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

interface RemittanceState {
  fromToken: string;
  amount: string;
  toAmount: string;
  exchangeRate: number;
  recipient: string;
  bankDetails: any;
  selectedTokenData?: any;
}

const UnifiedLandingPage = () => {
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();
  const [currentStep, setCurrentStep] = useState<FlowStep | 'landing'>('landing');

  // Auto-redirect to token selection when wallet connects
  useEffect(() => {
    if (isConnected && address && currentStep === 'landing') {
      setCurrentStep('token-selection');
    }
  }, [isConnected, address, currentStep]);
  const [kycStep, setKycStep] = useState<KYCStep>('personal-info');
  const [usdToInrRate, setUsdToInrRate] = useState(83.25);
  const [showWalletCreator, setShowWalletCreator] = useState(false);
  const [showUnsupportedTokenModal, setShowUnsupportedTokenModal] = useState(false);
  const [unsupportedTokenSymbol, setUnsupportedTokenSymbol] = useState('');
  const [showSolanaConnector, setShowSolanaConnector] = useState(false);
  const [solanaWallet, setSolanaWallet] = useState<any>(null);
  const [isSamePerson, setIsSamePerson] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [aadhaarOTP, setAadhaarOTP] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [walletSignature, setWalletSignature] = useState('');
  const [walletVerified, setWalletVerified] = useState(false);

  const [recipientData, setRecipientData] = useState<RecipientData>({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    dateOfBirth: '',
    nationality: 'Indian',
    aadhaarNumber: '',
    panNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const [remittanceState, setRemittanceState] = useState<RemittanceState>({
    fromToken: '',
    amount: '',
    toAmount: '',
    exchangeRate: 0,
    recipient: '',
    bankDetails: null
  });

  const { tokenBalances, isLoading } = useWalletBalances();

  // Handle wallet connection redirect
  useEffect(() => {
    if (isConnected && address && currentStep === 'landing') {
      setCurrentStep('token-selection');
    }
  }, [isConnected, address, currentStep]);

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch USD to INR rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates && data.rates.INR) {
          setUsdToInrRate(data.rates.INR);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    };

    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderConnectedInterface = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6667AB] via-[#6667AB]/95 to-[#6667AB]/90 text-[#FCFBF4] overflow-hidden relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FCFBF4]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FCFBF4]/10 rounded-full blur-3xl"></div>
        </div>

        <AnimatePresence mode="wait">
          {/* Token Selection Step */}
          {currentStep === 'token-selection' && (
            <motion.div
              key="token-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
            >
              <div className="w-full max-w-4xl">
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-3xl font-bold text-[#FCFBF4] mb-2">
                    Select Token for INR Conversion
                  </h1>
                  <p className="text-[#FCFBF4]/70">
                    Choose from your available token balances to convert to Indian Rupees
                  </p>
                </motion.div>

                {/* Token Selection Interface */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <WalletBalanceFetcher 
                    onTokenSelect={(token, tokenAmount, inrAmount) => {
                      setRemittanceState(prev => ({
                        ...prev,
                        fromToken: token.symbol,
                        amount: tokenAmount,
                        toAmount: inrAmount,
                        selectedTokenData: token
                      }));
                      setCurrentStep('kyc');
                    }}
                  />
                </motion.div>

                {/* USD to INR Rate Display */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <Card className="bg-[#FCFBF4]/10 border-[#FCFBF4]/20 p-4">
                    <div className="text-center">
                      <div className="text-sm text-[#FCFBF4]/70">
                        Live USD to INR Rate: ₹{usdToInrRate.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#FCFBF4]/50 mt-1">
                        Updated every 30 seconds
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* KYC Step */}
          {currentStep === 'kyc' && (
            <motion.div
              key="kyc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
            >
              <Card className="w-full max-w-2xl bg-[#FCFBF4] border-0 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl text-[#6667AB]">Complete Your KYC Verification</CardTitle>
                  <p className="text-[#6667AB]/70 mt-2">
                    Secure verification for regulatory compliance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-[#6667AB]">KYC verification interface</p>
                    <Button 
                      onClick={() => setCurrentStep('bank-details')}
                      className="mt-4 bg-[#6667AB] text-[#FCFBF4] hover:bg-[#6667AB]/90"
                    >
                      Continue to Bank Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Bank Details Step */}
          {currentStep === 'bank-details' && (
            <motion.div
              key="bank-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
            >
              <Card className="w-full max-w-2xl bg-[#FCFBF4] border-0 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl text-[#6667AB]">Bank Account Details</CardTitle>
                  <p className="text-[#6667AB]/70 mt-2">
                    Add your bank account for INR withdrawal
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-[#6667AB]">Bank details form</p>
                    <Button 
                      onClick={() => setCurrentStep('withdrawal')}
                      className="mt-4 bg-[#6667AB] text-[#FCFBF4] hover:bg-[#6667AB]/90"
                    >
                      Continue to Withdrawal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Withdrawal Step */}
          {currentStep === 'withdrawal' && (
            <motion.div
              key="withdrawal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
            >
              <Card className="w-full max-w-2xl bg-[#FCFBF4] border-0 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl text-[#6667AB]">Execute Withdrawal</CardTitle>
                  <p className="text-[#6667AB]/70 mt-2">
                    Transfer tokens and receive INR
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-[#6667AB]">Withdrawal processing interface</p>
                    <Button 
                      onClick={() => setCurrentStep('success')}
                      className="mt-4 bg-[#6667AB] text-[#FCFBF4] hover:bg-[#6667AB]/90"
                    >
                      Complete Transaction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
            >
              <Card className="w-full max-w-2xl bg-[#FCFBF4] border-0 shadow-2xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl text-[#6667AB]">Transaction Successful!</CardTitle>
                  <p className="text-[#6667AB]/70 mt-2">
                    Your crypto has been converted to INR
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-[#6667AB]">INR will be deposited to your bank account within 2-4 hours</p>
                    <Button 
                      onClick={() => setCurrentStep('token-selection')}
                      className="mt-4 bg-[#6667AB] text-[#FCFBF4] hover:bg-[#6667AB]/90"
                    >
                      Start New Transaction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FCFBF4]">
      {!isConnected ? (
        <div className="min-h-screen bg-gradient-to-br from-[#6667AB] via-[#6667AB]/95 to-[#6667AB]/90 text-[#FCFBF4] overflow-hidden relative">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FCFBF4]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FCFBF4]/10 rounded-full blur-3xl"></div>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 flex items-center justify-between p-6 lg:px-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#FCFBF4] rounded-lg flex items-center justify-center mr-3">
                <span className="text-[#6667AB] font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-[#FCFBF4]">StablePay</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-[#FCFBF4]/80 hover:text-[#FCFBF4] transition-colors"
              >
                How it works
              </button>
              <button 
                onClick={() => scrollToSection('benefits')}
                className="text-[#FCFBF4]/80 hover:text-[#FCFBF4] transition-colors"
              >
                Benefits
              </button>
            </div>
          </nav>

          {/* Landing Page Content */}
          <main className="relative z-10 px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-4xl font-bold tracking-tight text-[#FCFBF4] sm:text-6xl mb-6"
                >
                  Convert Crypto to INR
                  <span className="block text-[#FCFBF4]/80 text-3xl sm:text-4xl mt-2">
                    Lightning Fast & Secure
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-xl text-[#FCFBF4]/90 max-w-3xl mx-auto mb-8"
                >
                  The fastest way to convert your cryptocurrency to Indian Rupees. 
                  Complete KYC, connect your wallet, and get INR in your bank account.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                >
                  <WalletConnectButton />
                  <SolanaWalletConnector 
                    isOpen={showSolanaConnector}
                    onClose={() => setShowSolanaConnector(false)}
                    onConnect={(wallet) => setSolanaWallet(wallet)} 
                  />
                </motion.div>
              </div>

              {/* How it Works Section */}
              <section id="how-it-works" className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-[#FCFBF4] mb-4">How StablePay Works</h2>
                  <p className="text-[#FCFBF4]/70 text-lg max-w-2xl mx-auto">
                    Four simple steps to convert your crypto to INR
                  </p>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                  {[
                    { step: 1, title: "Connect Wallet", desc: "Link your crypto wallet", icon: Wallet },
                    { step: 2, title: "Complete KYC", desc: "Verify your identity", icon: UserCheck },
                    { step: 3, title: "Add Bank Details", desc: "Link your bank account", icon: Building },
                    { step: 4, title: "Off-Ramp to INR", desc: "Receive money instantly", icon: TrendingUp }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-[#FCFBF4] rounded-full flex items-center justify-center mx-auto mb-4">
                        <item.icon className="w-8 h-8 text-[#6667AB]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#FCFBF4] mb-2">{item.title}</h3>
                      <p className="text-[#FCFBF4]/70">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Benefits Section */}
              <section id="benefits" className="mb-20">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-[#FCFBF4] mb-4">Why Choose StablePay?</h2>
                  <p className="text-[#FCFBF4]/70 text-lg max-w-2xl mx-auto">
                    Experience the future of crypto-to-fiat conversion
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { title: "Lightning Fast", desc: "Convert crypto to INR in minutes", icon: Zap },
                    { title: "Bank Grade Security", desc: "Enterprise-level security standards", icon: Shield },
                    { title: "Global Support", desc: "Multi-chain and multi-currency support", icon: Globe }
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-[#FCFBF4]/10 backdrop-blur-lg rounded-2xl p-8 border border-[#FCFBF4]/20"
                    >
                      <benefit.icon className="w-12 h-12 text-[#FCFBF4] mb-4" />
                      <h3 className="text-xl font-semibold text-[#FCFBF4] mb-2">{benefit.title}</h3>
                      <p className="text-[#FCFBF4]/70">{benefit.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      ) : (
        renderConnectedInterface()
      )}
    </div>
  );
};

export default UnifiedLandingPage;
export { UnifiedLandingPage as UnifiedLanding };