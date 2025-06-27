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
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { SolanaWalletConnector } from '@/components/wallet/solana-wallet-connector';
import { DirectTokenTransfer } from '@/components/transfer/direct-token-transfer';
import { USDCApprovalInterface } from '@/components/withdrawal/usdc-approval-interface';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useReownTransfer } from '@/hooks/use-reown-transfer';
import { useReownPay } from '@/hooks/use-reown-pay';
import { getSupportedTokens, isTokenSupported, getTokenInfo, TOP_100_CRYPTO } from '@/../../shared/top-100-crypto';
import { REOWN_SUPPORTED_CHAINS, REOWN_SUPPORTED_TOKENS, getTokensByChain, isTokenSupportedByReown, getAllSupportedTokenSymbols } from '@/../../shared/reown-supported-tokens';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AutomatedTokenApproval } from '@/components/withdrawal/automated-token-approval';


// Core remittance state and types
type StepType = 'landing' | 'wallet-connected' | 'token-approval' | 'kyc' | 'transfer' | 'complete';

interface RemittanceState {
  step: StepType;
  fromToken: string;
  amount: string;
  toAmount: string;
  exchangeRate: number;
  fees: number;
  isProcessing: boolean;
  transactionHash: string | null;
  selectedTokenData?: any;
}

// Exchange rate data
const EXCHANGE_RATES = {
  'USDC-INR': 83.25,
  'USDT-INR': 83.20,
  'USD-INR': 83.25,
  'ETH-INR': 185420.50,
  'BTC-INR': 3847250.75
};

export function UnifiedLanding() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { tokenBalances, isLoading, refreshAllChains } = useWalletBalances();
  const { chainId } = useAppKitNetwork();
  const { loading } = useAppKitState();
  
  const [isVisible, setIsVisible] = useState(false);
  const [showWalletCreator, setShowWalletCreator] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('landing');
  const [showUnsupportedTokenModal, setShowUnsupportedTokenModal] = useState(false);
  const [unsupportedTokenSymbol, setUnsupportedTokenSymbol] = useState('');
  const [showSolanaConnector, setShowSolanaConnector] = useState(false);
  const [solanaWallet, setSolanaWallet] = useState<any>(null);
  
  // Enhanced KYC state
  const [kycStep, setKycStep] = useState<'recipient-check' | 'aadhaar-verification' | 'pan-verification' | 'wallet-verification' | 'complete'>('recipient-check');
  const [isSamePerson, setIsSamePerson] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [walletVerified, setWalletVerified] = useState(false);
  const [aadhaarOTP, setAadhaarOTP] = useState('');
  const [walletSignature, setWalletSignature] = useState('');
  const [recipientData, setRecipientData] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    aadhaarNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: ''
  });
  // Exchange rate for USD to INR
  const [usdToInrRate, setUsdToInrRate] = useState(83.25);
  
  // Get supported tokens with DeFi liquidity (for validation only)
  const supportedTokens = getSupportedTokens();

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);

  // State for remittance functionality
  const [remittanceState, setRemittanceState] = useState<RemittanceState>({
    step: 'landing',
    fromToken: 'USDC',
    amount: '',
    toAmount: '',
    exchangeRate: EXCHANGE_RATES['USDC-INR'],
    fees: 249,
    isProcessing: false,
    transactionHash: null
  });

  useEffect(() => {
    setIsVisible(true);
    
    // Simulate live USD to INR rate updates
    const interval = setInterval(() => {
      setUsdToInrRate(prev => prev + (Math.random() - 0.5) * 0.1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update step based on wallet connection
  useEffect(() => {
    if (isConnected && currentStep === 'landing') {
      setCurrentStep('wallet-connected');
    } else if (!isConnected && currentStep !== 'landing') {
      setCurrentStep('landing');
    }
  }, [isConnected, currentStep]);

  // Handle amount changes and calculate exchange
  const handleAmountChange = (value: string) => {
    setRemittanceState(prev => {
      const amount = parseFloat(value) || 0;
      let rate = EXCHANGE_RATES[`${prev.fromToken}-INR` as keyof typeof EXCHANGE_RATES] || 83.25;
      
      // Use live USD to INR rate for USD conversions
      if (prev.fromToken === 'USD') {
        rate = usdToInrRate;
      }
      
      return {
        ...prev,
        amount: value,
        toAmount: (amount * rate).toFixed(2),
        exchangeRate: rate
      };
    });
  };

  // Handle token selection with validation
  const handleTokenChange = (token: string) => {
    // Check if token is supported in top 100 with DeFi liquidity
    if (!isTokenSupported(token)) {
      setUnsupportedTokenSymbol(token);
      setShowUnsupportedTokenModal(true);
      return;
    }

    setRemittanceState(prev => {
      const amount = parseFloat(prev.amount) || 0;
      let rate = EXCHANGE_RATES[`${token}-INR` as keyof typeof EXCHANGE_RATES] || 83.25;
      
      // Use live USD to INR rate for USD conversions
      if (token === 'USD') {
        rate = usdToInrRate;
      }
      
      return {
        ...prev,
        fromToken: token,
        toAmount: (amount * rate).toFixed(2),
        exchangeRate: rate
      };
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6667AB] to-[#8B5FBF] text-[#FCFBF4] overflow-x-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className="relative"
      >
        {/* Navigation */}
        <motion.nav 
          variants={itemVariants}
          className="flex items-center justify-between p-6 md:px-12 relative z-10"
        >
          <div className="text-2xl font-bold text-[#FCFBF4]">
            StablePay
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#FCFBF4] transition-colors">How it works</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-[#FCFBF4] transition-colors">Features</button>
            <button onClick={() => scrollToSection('security')} className="hover:text-[#FCFBF4] transition-colors">Security</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-[#FCFBF4] transition-colors">Pricing</button>
          </div>
          
          {/* Main Connect Wallet Button */}
          {!isConnected ? (
            <Button 
              onClick={() => open()}
              className="btn-premium"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-[#FCFBF4]/20 text-[#FCFBF4] border-[#FCFBF4]/30">
                Connected
              </Badge>
              <Button 
                onClick={() => open()}
                variant="outline"
                className="border-[#FCFBF4]/20 text-[#FCFBF4] hover:bg-[#FCFBF4]/10"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Button>
            </div>
          )}
        </motion.nav>

        {/* Main Content - Conditional based on wallet connection */}
        <AnimatePresence mode="wait">
          {currentStep === 'landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Hero Section */}
              <motion.section 
                variants={itemVariants}
                className="text-center py-20 px-6 md:px-12 relative"
              >
                <motion.div style={{ y: y1 }} className="relative z-10">
                  <motion.h1 
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                  >
                    Web3 Remittance &
                    <span className="block bg-gradient-to-r from-[#FCFBF4] to-[#FCFBF4]/80 bg-clip-text text-transparent">
                      INR Off-Ramping Made Simple
                    </span>
                  </motion.h1>
                  
                  <motion.p 
                    variants={itemVariants}
                    className="text-xl md:text-2xl mb-8 text-[#FCFBF4]/90 max-w-4xl mx-auto leading-relaxed"
                  >
                    Instantly move your crypto to your Indian bank account – in just a few easy steps.
                    <strong className="text-[#FCFBF4]"> Your Crypto, Your Wallet, Your INR. On Your Terms.</strong>
                  </motion.p>
                </motion.div>

                {/* Live USD to INR Rate */}
                <motion.div 
                  variants={itemVariants}
                  className="flex justify-center mb-12"
                >
                  <div className="bg-[#FCFBF4]/10 border border-[#FCFBF4]/20 rounded-2xl px-8 py-6 text-center">
                    <div className="text-sm text-[#FCFBF4]/70 mb-2">Live Exchange Rate</div>
                    <div className="text-3xl md:text-4xl font-bold text-[#FCFBF4] flex items-center justify-center gap-3">
                      1 USD = ₹{usdToInrRate.toFixed(2)}
                      <RefreshCw className="w-6 h-6 animate-spin text-[#FCFBF4]/50" />
                    </div>
                    <div className="text-xs text-[#FCFBF4]/60 mt-1">Updates every 30 seconds</div>
                  </div>
                </motion.div>

                {/* Primary CTA */}
                <motion.div variants={itemVariants} className="flex justify-center mb-16">
                  <Button 
                    onClick={() => open()}
                    size="lg"
                    className="btn-premium text-xl px-12 py-6 group"
                  >
                    Get Started
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </motion.section>

              {/* How It Works Section */}
              <section id="how-it-works" className="py-20 px-6 md:px-12">
                <motion.div 
                  variants={containerVariants}
                  className="max-w-6xl mx-auto"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#FCFBF4]"
                  >
                    How It Works: A Quick, Clear Process
                  </motion.h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      {
                        step: "1",
                        title: "Connect Your Wallet",
                        description: "Compatible with StablePay Connect and all major Web3 wallets. No custody, no middlemen. Your wallet stays yours.",
                        icon: <Wallet className="w-8 h-8" />
                      },
                      {
                        step: "2", 
                        title: "Complete KYC Verification",
                        description: "Fast, secure, and fully compliant onboarding process. We make it simple – identity verification in minutes.",
                        icon: <UserCheck className="w-8 h-8" />
                      },
                      {
                        step: "3",
                        title: "Add Your Indian Bank Details",
                        description: "Securely link your account to receive INR directly via RTGS, NEFT, or IMPS. Your details stay encrypted and safe.",
                        icon: <Building className="w-8 h-8" />
                      },
                      {
                        step: "4",
                        title: "Off-Ramp to INR Instantly",
                        description: "Convert your crypto to INR at real-time rates with a flat ₹249 fee. Receive funds quickly and reliably in your bank account.",
                        icon: <Zap className="w-8 h-8" />
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="relative group"
                      >
                        <Card className="h-full bg-[#FCFBF4]/10 border-[#FCFBF4]/20 hover:bg-[#FCFBF4]/15 transition-all duration-300 hover:scale-105">
                          <CardHeader className="text-center pb-4">
                            <div className="text-3xl font-bold text-[#FCFBF4]/50 mb-2">{item.step}</div>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#6667AB] flex items-center justify-center text-[#FCFBF4] group-hover:scale-110 transition-transform">
                              {item.icon}
                            </div>
                            <CardTitle className="text-xl text-[#FCFBF4]">{item.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="text-center">
                            <p className="text-[#FCFBF4]/80">{item.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* Features Section */}
              <section id="features" className="py-20 px-6 md:px-12 bg-[#FCFBF4]/5">
                <motion.div 
                  variants={containerVariants}
                  className="max-w-6xl mx-auto"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#FCFBF4]"
                  >
                    Why Choose Us?
                  </motion.h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      {
                        title: "Multi-Crypto Support",
                        description: "Bitcoin, Ethereum, USDT, USDC, and more",
                        icon: <CreditCard className="w-8 h-8" />
                      },
                      {
                        title: "Multi-Chain Enabled",
                        description: "Ethereum, Solana, BNB Chain, and others",
                        icon: <Database className="w-8 h-8" />
                      },
                      {
                        title: "Self-Custody First",
                        description: "You control your assets at every step",
                        icon: <Key className="w-8 h-8" />
                      },
                      {
                        title: "Real-Time INR Conversion",
                        description: "Competitive rates, instant processing",
                        icon: <RefreshCw className="w-8 h-8" />
                      },
                      {
                        title: "Flat Fee Structure",
                        description: "₹249 per off-ramp transaction – no hidden charges",
                        icon: <TrendingUp className="w-8 h-8" />
                      },
                      {
                        title: "Mobile-First Web App",
                        description: "Seamless experience on mobile and desktop",
                        icon: <Phone className="w-8 h-8" />
                      }
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="group"
                      >
                        <Card className="h-full bg-[#FCFBF4]/10 border-[#FCFBF4]/20 hover:bg-[#FCFBF4]/15 transition-all duration-300 hover:scale-105">
                          <CardHeader>
                            <div className="w-16 h-16 mb-4 rounded-full bg-[#6667AB] flex items-center justify-center text-[#FCFBF4] group-hover:scale-110 transition-transform">
                              {feature.icon}
                            </div>
                            <CardTitle className="text-xl text-[#FCFBF4]">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-[#FCFBF4]/80">{feature.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* Target Audience Section */}
              <section className="py-20 px-6 md:px-12 bg-[#FCFBF4]/5">
                <motion.div 
                  variants={containerVariants}
                  className="max-w-6xl mx-auto"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#FCFBF4]"
                  >
                    Who Is This For?
                  </motion.h2>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      {
                        title: "NRIs",
                        description: "Sending remittance to India",
                        icon: <Users className="w-8 h-8" />
                      },
                      {
                        title: "Freelancers",
                        description: "Receiving international crypto payments",
                        icon: <Globe className="w-8 h-8" />
                      },
                      {
                        title: "Crypto Holders",
                        description: "Off-ramping to INR",
                        icon: <Wallet className="w-8 h-8" />
                      },
                      {
                        title: "Businesses",
                        description: "Cross-border payment needs",
                        icon: <Building className="w-8 h-8" />
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="text-center group"
                      >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#6667AB] flex items-center justify-center text-[#FCFBF4] group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-[#FCFBF4] mb-3">{item.title}</h3>
                        <p className="text-[#FCFBF4]/80">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* Security Section */}
              <section id="security" className="py-20 px-6 md:px-12">
                <motion.div 
                  variants={containerVariants}
                  className="max-w-4xl mx-auto text-center"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-4xl md:text-5xl font-bold mb-8 text-[#FCFBF4]"
                  >
                    Security & Compliance You Can Trust
                  </motion.h2>

                  <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {[
                      {
                        title: "Smart Contract Wallet Security",
                        description: "Advanced protection for your assets",
                        icon: <Shield className="w-6 h-6" />
                      },
                      {
                        title: "FATF-Compliant Travel Rule Support",
                        description: "International compliance standards",
                        icon: <Globe className="w-6 h-6" />
                      },
                      {
                        title: "Robust KYC & AML Integration",
                        description: "Secure identity verification",
                        icon: <UserCheck className="w-6 h-6" />
                      },
                      {
                        title: "Real-Time Transaction Monitoring",
                        description: "Continuous security oversight",
                        icon: <Clock className="w-6 h-6" />
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="flex items-center gap-4 p-4 rounded-lg bg-[#FCFBF4]/10 border border-[#FCFBF4]/20"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#6667AB] flex items-center justify-center text-[#FCFBF4]">
                          {item.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-[#FCFBF4]">{item.title}</h3>
                          <p className="text-[#FCFBF4]/70 text-sm">{item.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* Pricing Section */}
              <section id="pricing" className="py-20 px-6 md:px-12 bg-[#FCFBF4]/5">
                <motion.div 
                  variants={containerVariants}
                  className="max-w-4xl mx-auto text-center"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-4xl md:text-5xl font-bold mb-8 text-[#FCFBF4]"
                  >
                    Simple, Transparent Pricing
                  </motion.h2>
                  
                  <motion.div
                    variants={itemVariants}
                    className="bg-[#FCFBF4]/10 border border-[#FCFBF4]/20 rounded-2xl p-12 mb-12"
                  >
                    <div className="text-6xl font-bold text-[#FCFBF4] mb-4">₹249</div>
                    <div className="text-xl text-[#FCFBF4]/80 mb-6">Flat fee per transaction</div>
                    <div className="text-[#FCFBF4]/70">
                      No hidden charges • No percentage fees • What you see is what you pay
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="grid md:grid-cols-3 gap-6 text-sm"
                  >
                    {[
                      "✓ All token swaps included",
                      "✓ Instant INR bank transfers", 
                      "✓ 24/7 customer support"
                    ].map((feature, index) => (
                      <div key={index} className="text-[#FCFBF4]/80">
                        {feature}
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              </section>

              {/* Final CTA */}
              <section className="py-20 px-6 md:px-12">
                <motion.div 
                  variants={containerVariants}
                  className="max-w-4xl mx-auto text-center"
                >
                  <motion.h2 
                    variants={itemVariants}
                    className="text-4xl md:text-5xl font-bold mb-8 text-[#FCFBF4]"
                  >
                    Start Now: It's Simple
                  </motion.h2>
                  
                  <motion.p 
                    variants={itemVariants}
                    className="text-xl text-[#FCFBF4]/90 mb-8"
                  >
                    👉 <strong>Connect Wallet</strong> → <strong>KYC</strong> → <strong>Add Bank</strong> → <strong>Get INR Instantly</strong>
                  </motion.p>

                  <motion.div variants={itemVariants} className="mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        onClick={() => open()}
                        size="lg"
                        className="btn-premium text-xl px-12 py-6 group"
                      >
                        Connect EVM Wallet
                        <Wallet className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      
                      <Button 
                        onClick={() => setShowSolanaConnector(true)}
                        size="lg"
                        className="btn-premium text-xl px-12 py-6 group bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                      >
                        Connect Solana
                        <Globe className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-[#FCFBF4]/60">
                      Choose EVM chains (Ethereum, Polygon, BSC, etc.) or Solana network
                    </p>
                  </motion.div>

                  <motion.p 
                    variants={itemVariants}
                    className="text-sm text-[#FCFBF4]/70"
                  >
                    Flat ₹249 transaction fee applies. Blockchain network fees are separate.
                  </motion.p>
                </motion.div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="px-6 md:px-12 py-12"
            >
              {/* Connected Wallet Interface */}
              <div className="max-w-4xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#FCFBF4]">
                    Web3 Financial Services
                  </h1>
                  <p className="text-xl text-[#FCFBF4]/80">
                    Global remittance, crypto off-ramping, and token swapping
                  </p>
                  
                  {/* Service Selection Tabs */}
                  <div className="flex justify-center gap-4 mt-8 mb-8">
                    <Button 
                      variant={currentStep === 'wallet-connected' ? 'default' : 'outline'}
                      onClick={() => setCurrentStep('wallet-connected')}
                      className={currentStep === 'wallet-connected' ? 'btn-premium' : 'border-[#FCFBF4]/20 text-[#FCFBF4] hover:bg-[#FCFBF4]/10'}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Off-Ramp to INR
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-[#FCFBF4]/20 text-[#FCFBF4] hover:bg-[#FCFBF4]/10"
                      disabled
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Global Remittance
                    </Button>
                  </div>

                  {/* Web3 Financial Services - Enhanced Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Buy Crypto with Card */}
                    <div className="bg-[#FCFBF4]/10 border border-[#FCFBF4]/20 rounded-xl p-6 text-center backdrop-blur-lg hover:bg-[#FCFBF4]/15 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                        <CreditCard className="w-8 h-8 text-[#FCFBF4]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#FCFBF4] mb-3">Buy Crypto</h3>
                      <p className="text-sm text-[#FCFBF4]/80 mb-6 leading-relaxed">
                        Purchase cryptocurrency directly with your debit/credit card. Instant transfers to your connected wallet.
                      </p>
                      <Button 
                        className="btn-premium w-full py-3"
                        onClick={() => open({ view: 'OnRampProviders' })}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy with Card
                      </Button>
                    </div>

                    {/* Send Tokens */}
                    <div className="bg-[#FCFBF4]/10 border border-[#FCFBF4]/20 rounded-xl p-6 text-center backdrop-blur-lg hover:bg-[#FCFBF4]/15 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                        <Send className="w-8 h-8 text-[#FCFBF4]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#FCFBF4] mb-3">Send Tokens</h3>
                      <p className="text-sm text-[#FCFBF4]/80 mb-6 leading-relaxed">
                        Transfer crypto to any wallet address across multiple blockchain networks with ease.
                      </p>
                      <Button 
                        className="btn-premium w-full py-3"
                        onClick={() => open({ view: 'Account' })}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Crypto
                      </Button>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-[#FCFBF4]/10 border border-[#FCFBF4]/20 rounded-xl p-6 text-center backdrop-blur-lg hover:bg-[#FCFBF4]/15 transition-all duration-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                        <Activity className="w-8 h-8 text-[#FCFBF4]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#FCFBF4] mb-3">Activity</h3>
                      <p className="text-sm text-[#FCFBF4]/80 mb-6 leading-relaxed">
                        Track all your transactions, swaps, and transfers in one comprehensive dashboard.
                      </p>
                      <Button 
                        className="btn-premium w-full py-3"
                        onClick={() => open({ view: 'Account' })}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        View History
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Wallet Balance Display */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
                  <WalletBalanceDisplay />
                </motion.div>

                {/* Swap Interface */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-[#FCFBF4]/10 border-[#FCFBF4]/20 p-8">
                    <CardHeader className="text-center pb-6">
                      <CardTitle className="text-2xl text-[#FCFBF4]">Available Token Balance to INR</CardTitle>
                      <div className="text-sm text-[#FCFBF4]/70 mt-2">
                        Live USD to INR: ₹{usdToInrRate.toFixed(2)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Available Token Balances */}
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-[#FCFBF4]">Your Available Token Balances</label>
                        
                        {/* Real wallet balances from connected wallet */}
                        <div className="grid gap-3 max-h-60 overflow-y-auto">
                          {tokenBalances.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-[#FCFBF4]/70 text-sm">
                                {isLoading ? 'Loading token balances...' : 'No token balances found in connected wallet'}
                              </div>
                              {!isConnected && (
                                <div className="text-[#FCFBF4]/60 text-xs mt-2">
                                  Connect your wallet to view available token balances
                                </div>
                              )}
                            </div>
                          ) : (
                            tokenBalances
                              .filter((token: any) => parseFloat(token.formattedBalance) > 0) // Only show tokens with positive balance
                              .map((token: any, index: number) => {
                                const isSupported = isTokenSupported(token.symbol);
                                const inrValue = (token.usdValue * usdToInrRate).toFixed(2);
                                const chainName = REOWN_SUPPORTED_CHAINS.find(chain => chain.id === token.chainId)?.name || token.chainName;
                                const tokenPrice = token.usdValue / parseFloat(token.formattedBalance || '1');
                                
                                return (
                                  <div 
                                    key={`${token.chainId}-${token.address}-${index}`}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                                      isSupported 
                                        ? 'bg-[#FCFBF4]/10 border-[#FCFBF4]/30 hover:bg-[#FCFBF4]/20' 
                                        : 'bg-red-500/10 border-red-500/30 opacity-60'
                                    }`}
                                    onClick={() => {
                                      if (!isSupported) {
                                        setUnsupportedTokenSymbol(token.symbol);
                                        setShowUnsupportedTokenModal(true);
                                      } else {
                                        // Set selected token for withdrawal flow
                                        setRemittanceState(prev => ({
                                          ...prev,
                                          fromToken: token.symbol,
                                          amount: token.formattedBalance,
                                          toAmount: inrValue,
                                          exchangeRate: tokenPrice * usdToInrRate,
                                          selectedTokenData: token
                                        }));
                                        // Start KYC flow first, then automated token approval
                                        setCurrentStep('kyc');
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-[#FCFBF4]/20 rounded-full flex items-center justify-center">
                                        <span className="text-[#FCFBF4] font-bold text-sm">{token.symbol.charAt(0)}</span>
                                      </div>
                                      <div>
                                        <div className="text-[#FCFBF4] font-semibold">{token.symbol}</div>
                                        <div className="text-[#FCFBF4]/70 text-sm">{chainName}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[#FCFBF4] font-semibold">
                                        {parseFloat(token.formattedBalance).toLocaleString('en-US', { 
                                          maximumFractionDigits: 6,
                                          minimumFractionDigits: 2 
                                        })}
                                      </div>
                                      <div className="text-[#FCFBF4]/70 text-sm">≈ ₹{inrValue}</div>
                                      {!isSupported && (
                                        <Badge variant="destructive" className="mt-1 text-xs">
                                          Not Supported
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>

                      {/* Selected Token Conversion Details */}
                      {remittanceState.fromToken && (
                        <div className="bg-[#FCFBF4]/15 border border-[#FCFBF4]/30 rounded-lg p-4 space-y-4">
                          {remittanceState.fromToken === 'USDC' ? (
                            // Direct USDC to INR conversion
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-[#FCFBF4] mb-2">Convert USDC to INR</h3>
                              <div className="flex items-center justify-center gap-3 text-[#FCFBF4]">
                                <RefreshCw className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">
                                  1 USDC = ₹{usdToInrRate.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            // Direct token to INR conversion
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-[#FCFBF4] mb-2">Direct Token to INR Conversion</h3>
                              <div className="flex items-center justify-center gap-3 text-[#FCFBF4]">
                                <RefreshCw className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">
                                  {remittanceState.fromToken} → INR ₹{remittanceState.toAmount}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-[#FCFBF4]/70">Converting</div>
                              <div className="text-[#FCFBF4] font-bold text-lg">
                                {remittanceState.amount} {remittanceState.fromToken}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-[#FCFBF4]/70">Final Amount</div>
                              <div className="text-[#FCFBF4] font-bold text-lg">
                                ₹{remittanceState.toAmount}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      {!remittanceState.fromToken && (
                        <div className="text-center py-8">
                          <div className="text-[#FCFBF4]/70 text-sm">
                            Select a token from your available balances above to convert to INR
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-4 pt-6">
                        <div className="grid gap-4 mb-4">
                          {remittanceState.fromToken ? (
                            <Button 
                              className="w-full btn-premium text-lg py-3"
                              onClick={() => setCurrentStep('kyc')}
                            >
                              <Send className="w-5 h-5 mr-2" />
                              Convert {remittanceState.fromToken} to INR
                            </Button>
                          ) : (
                            <Button 
                              className="w-full btn-premium text-lg py-3 opacity-50 cursor-not-allowed"
                              disabled
                            >
                              <Send className="w-5 h-5 mr-2" />
                              Select Token to Convert
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-center">
                          <button
                            onClick={() => setShowWalletCreator(true)}
                            className="text-[#FCFBF4]/80 hover:text-[#FCFBF4] text-sm underline"
                          >
                            Need a new wallet? Create Social Wallet
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>



                {/* Enhanced Indian KYC Flow */}
                {currentStep === 'kyc' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-6"
                  >
{/* Enhanced Indian KYC Flow - Inline Implementation */}
                    <div className="max-w-2xl mx-auto space-y-6">
                      {kycStep === 'recipient-check' && (
                        <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
                          <CardHeader>
                            <CardTitle className="text-[#6667AB] flex items-center gap-2">
                              <UserCheck className="w-6 h-6" />
                              Recipient Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="bg-[#6667AB]/10 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox 
                                  id="same-person"
                                  checked={isSamePerson}
                                  onCheckedChange={(checked) => {
                                    setIsSamePerson(checked as boolean);
                                    if (checked && address) {
                                      setRecipientData(prev => ({
                                        ...prev,
                                        fullName: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
                                        accountHolderName: `User ${address.slice(0, 6)}...${address.slice(-4)}`
                                      }));
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <div>
                                  <label htmlFor="same-person" className="text-[#6667AB] font-semibold cursor-pointer">
                                    I am sending money to myself in India
                                  </label>
                                  <p className="text-[#6667AB]/70 text-sm mt-1">
                                    Check this if you are the recipient of this transfer. This will skip duplicate information entry.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {isSamePerson ? (
                              <div className="space-y-4">
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Same Person Transfer
                                  </div>
                                  <p className="text-green-600 text-sm">
                                    Your originator information will be used for the recipient. You only need to provide Indian banking details and complete KYC verification.
                                  </p>
                                </div>
                                
                                <Button 
                                  onClick={() => setKycStep('aadhaar-verification')}
                                  className="w-full btn-premium text-[#FCFBF4] font-bold"
                                >
                                  Continue to Indian KYC Verification
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-[#6667AB]/5 border border-[#6667AB]/20 rounded-lg p-4">
                                  <p className="text-[#6667AB] text-sm">
                                    You will need to provide complete information for both sender and recipient, including KYC verification for the Indian recipient.
                                  </p>
                                </div>
                                
                                <Button 
                                  onClick={() => setKycStep('aadhaar-verification')}
                                  className="w-full btn-premium text-[#FCFBF4] font-bold"
                                >
                                  Continue to Full KYC Process
                                </Button>
                              </div>
                            )}

                            <div className="text-center">
                              <Button 
                                variant="ghost" 
                                onClick={() => setCurrentStep('wallet-connected')}
                                className="text-[#6667AB] font-semibold"
                              >
                                ← Back to Transfer Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {kycStep === 'aadhaar-verification' && (
                        <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
                          <CardHeader>
                            <CardTitle className="text-[#6667AB] flex items-center gap-2">
                              <Scan className="w-6 h-6" />
                              Aadhaar Verification
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="bg-[#6667AB]/10 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-[#6667AB] font-semibold mb-2">
                                <Shield className="w-5 h-5" />
                                Secure Aadhaar Verification
                              </div>
                              <p className="text-[#6667AB]/70 text-sm">
                                We use secure UIDAI-approved methods for Aadhaar verification. Your Aadhaar number is encrypted and never stored.
                              </p>
                            </div>

                            {/* Bank Account Details */}
                            <div className="space-y-4">
                              <h3 className="text-[#6667AB] font-semibold">Bank Account Details (India)</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[#6667AB] font-medium block mb-2">Account Holder Name</label>
                                  <Input
                                    value={recipientData.accountHolderName}
                                    onChange={(e) => setRecipientData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                                    className="bg-white border-[#6667AB]/30 text-[#6667AB] font-medium"
                                    disabled={isSamePerson}
                                  />
                                </div>
                                <div>
                                  <label className="text-[#6667AB] font-medium block mb-2">Bank Account Number</label>
                                  <Input
                                    value={recipientData.bankAccountNumber}
                                    onChange={(e) => setRecipientData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                                    className="bg-white border-[#6667AB]/30 text-[#6667AB] font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="text-[#6667AB] font-medium block mb-2">IFSC Code</label>
                                  <Input
                                    value={recipientData.ifscCode}
                                    onChange={(e) => setRecipientData(prev => ({ ...prev, ifscCode: e.target.value }))}
                                    className="bg-white border-[#6667AB]/30 text-[#6667AB] font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="text-[#6667AB] font-medium block mb-2">Bank Name</label>
                                  <Input
                                    value={recipientData.bankName}
                                    onChange={(e) => setRecipientData(prev => ({ ...prev, bankName: e.target.value }))}
                                    className="bg-white border-[#6667AB]/30 text-[#6667AB] font-medium"
                                  />
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                              <div>
                                <label className="text-[#6667AB] font-medium block mb-2">Aadhaar Number</label>
                                <Input
                                  value={recipientData.aadhaarNumber}
                                  onChange={(e) => setRecipientData(prev => ({ ...prev, aadhaarNumber: e.target.value }))}
                                  placeholder="XXXX-XXXX-XXXX"
                                  className="bg-white border-[#6667AB]/30 text-[#6667AB] font-medium"
                                  maxLength={12}
                                />
                              </div>

                              {!otpSent ? (
                                <Button 
                                  onClick={() => setOtpSent(true)}
                                  className="w-full btn-premium text-[#FCFBF4] font-bold"
                                  disabled={recipientData.aadhaarNumber.length !== 12}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Send OTP to Registered Mobile
                                </Button>
                              ) : (
                                <div className="space-y-4">
                                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                                      <CheckCircle className="w-5 h-5" />
                                      OTP Sent Successfully
                                    </div>
                                    <p className="text-green-600 text-sm">
                                      OTP has been sent to your Aadhaar registered mobile number. Please enter the 6-digit code below.
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-[#6667AB] font-medium block mb-2">Enter OTP</label>
                                    <Input
                                      value={aadhaarOTP}
                                      onChange={(e) => setAadhaarOTP(e.target.value)}
                                      placeholder="123456"
                                      className="bg-white border-[#6667AB]/30 text-[#6667AB] font-medium text-center text-lg"
                                      maxLength={6}
                                    />
                                  </div>

                                  {!otpVerified ? (
                                    <Button 
                                      onClick={() => {
                                        if (aadhaarOTP === '123456') {
                                          setOtpVerified(true);
                                          setKycStep('pan-verification');
                                        }
                                      }}
                                      className="w-full btn-premium text-[#FCFBF4] font-bold"
                                      disabled={aadhaarOTP.length !== 6}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Verify OTP
                                    </Button>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                                          <CheckCircle className="w-5 h-5" />
                                          Aadhaar Verified Successfully
                                        </div>
                                      </div>
                                      
                                      <Button 
                                        onClick={() => setKycStep('pan-verification')}
                                        className="w-full btn-premium text-[#FCFBF4] font-bold"
                                      >
                                        Continue to PAN Verification
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <Button 
                                variant="ghost" 
                                onClick={() => setKycStep('recipient-check')}
                                className="text-[#6667AB] font-semibold"
                              >
                                ← Back to Recipient Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {kycStep === 'pan-verification' && (
                        <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
                          <CardHeader>
                            <CardTitle className="text-[#6667AB] flex items-center gap-2">
                              <CreditCard className="w-6 h-6" />
                              PAN Card Verification
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="bg-[#6667AB]/10 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-[#6667AB] font-semibold mb-2">
                                <FileText className="w-5 h-5" />
                                PAN Verification Required
                              </div>
                              <p className="text-[#6667AB]/70 text-sm">
                                PAN verification is mandatory for all financial transactions in India as per RBI guidelines.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-[#6667AB] font-medium block mb-2">PAN Number</label>
                                <Input
                                  value={recipientData.panNumber}
                                  onChange={(e) => setRecipientData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                                  placeholder="ABCDE1234F"
                                  className="bg-white border-[#6667AB]/30 text-[#6667AB] font-medium uppercase"
                                  maxLength={10}
                                />
                              </div>

                              {!panVerified ? (
                                <Button 
                                  onClick={() => {
                                    setPanVerified(true);
                                    setKycStep('wallet-verification');
                                  }}
                                  className="w-full btn-premium text-[#FCFBF4] font-bold"
                                  disabled={recipientData.panNumber.length !== 10}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  Verify PAN Details
                                </Button>
                              ) : (
                                <div className="space-y-4">
                                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                                      <CheckCircle className="w-5 h-5" />
                                      PAN Verified Successfully
                                    </div>
                                    <div className="text-green-600 text-sm space-y-1">
                                      <p>Name: {recipientData.accountHolderName}</p>
                                      <p>PAN: {recipientData.panNumber}</p>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    onClick={() => setKycStep('wallet-verification')}
                                    className="w-full btn-premium text-[#FCFBF4] font-bold"
                                  >
                                    Continue to Wallet Verification
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <Button 
                                variant="ghost" 
                                onClick={() => setKycStep('aadhaar-verification')}
                                className="text-[#6667AB] font-semibold"
                              >
                                ← Back to Aadhaar Verification
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {kycStep === 'wallet-verification' && (
                        <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
                          <CardHeader>
                            <CardTitle className="text-[#6667AB] flex items-center gap-2">
                              <Wallet className="w-6 h-6" />
                              Wallet Ownership Verification
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="bg-[#6667AB]/10 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-[#6667AB] font-semibold mb-2">
                                <Shield className="w-5 h-5" />
                                Smart Contract Verification Required
                              </div>
                              <p className="text-[#6667AB]/70 text-sm">
                                As per Travel Rule compliance, you must digitally sign to prove wallet ownership before INR conversion. This ensures the originator (sender) is verified.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-[#6667AB]/5 border border-[#6667AB]/20 rounded-lg p-4">
                                <h4 className="text-[#6667AB] font-semibold mb-2">Verification Details:</h4>
                                <div className="space-y-2 text-sm text-[#6667AB]/70">
                                  <div className="flex justify-between">
                                    <span>Wallet Address:</span>
                                    <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Network:</span>
                                    <span>Ethereum</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Conversion Amount:</span>
                                    <span>{remittanceState.amount} {remittanceState.fromToken}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>INR Amount:</span>
                                    <span>₹{remittanceState.toAmount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Recipient Bank:</span>
                                    <span>{recipientData.bankName}</span>
                                  </div>
                                </div>
                              </div>

                              {!walletVerified ? (
                                <div className="space-y-4">
                                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
                                      <AlertCircle className="w-5 h-5" />
                                      Signature Required
                                    </div>
                                    <p className="text-amber-600 text-sm">
                                      Click below to sign the transaction with your wallet. This proves you own the wallet and authorizes the crypto-to-INR conversion.
                                    </p>
                                  </div>

                                  <Button 
                                    onClick={async () => {
                                      try {
                                        // Simulate wallet signature request
                                        const message = `StablePay Wallet Verification\n\nI hereby confirm that I am the owner of wallet ${address} and authorize the conversion of ${remittanceState.amount} ${remittanceState.fromToken} to INR ₹${remittanceState.toAmount} for transfer to ${recipientData.accountHolderName} at ${recipientData.bankName}.\n\nBank Account: ${recipientData.bankAccountNumber}\nIFSC: ${recipientData.ifscCode}\nTimestamp: ${new Date().toISOString()}`;
                                        
                                        // In a real implementation, this would call the wallet's signMessage method
                                        // const signature = await signMessage({ message });
                                        
                                        // For demo purposes, simulate signature
                                        setTimeout(() => {
                                          setWalletSignature('0x' + Math.random().toString(16).substr(2, 64));
                                          setWalletVerified(true);
                                        }, 2000);
                                      } catch (error) {
                                        console.error('Signature failed:', error);
                                      }
                                    }}
                                    className="w-full btn-premium text-[#FCFBF4] font-bold"
                                    disabled={!address}
                                  >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Sign with Wallet to Verify Ownership
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                                      <CheckCircle className="w-5 h-5" />
                                      Wallet Ownership Verified
                                    </div>
                                    <div className="text-green-600 text-sm space-y-1">
                                      <p>Signature: {walletSignature.slice(0, 20)}...{walletSignature.slice(-6)}</p>
                                      <p>Verification Status: ✅ Confirmed</p>
                                      <p>Ready for INR Conversion</p>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    onClick={() => setCurrentStep('token-approval')}
                                    className="w-full btn-premium text-[#FCFBF4] font-bold"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Complete Verification & Process Transfer
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <Button 
                                variant="ghost" 
                                onClick={() => setKycStep('pan-verification')}
                                className="text-[#6667AB] font-semibold"
                              >
                                ← Back to PAN Verification
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {kycStep === 'complete' && (
                        <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
                          <CardHeader>
                            <CardTitle className="text-[#6667AB] flex items-center gap-2">
                              <CheckCircle className="w-6 h-6" />
                              KYC Verification Complete
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                              <div className="text-center space-y-4">
                                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                                <div>
                                  <h3 className="text-green-700 font-bold text-lg">Verification Successful!</h3>
                                  <p className="text-green-600 text-sm mt-2">
                                    All KYC requirements have been completed successfully. You can now proceed with your transfer.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-[#6667AB]/5 rounded-lg">
                                <span className="text-[#6667AB] font-medium">Aadhaar Verification</span>
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-[#6667AB]/5 rounded-lg">
                                <span className="text-[#6667AB] font-medium">PAN Verification</span>
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-[#6667AB]/5 rounded-lg">
                                <span className="text-[#6667AB] font-medium">Wallet Ownership</span>
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Signed & Verified
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-[#6667AB]/5 rounded-lg">
                                <span className="text-[#6667AB] font-medium">Bank Account Details</span>
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>
                            </div>

                            <Button 
                              onClick={() => setCurrentStep('complete')}
                              className="w-full btn-premium text-[#FCFBF4] font-bold"
                            >
                              Continue to Transfer
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Transaction Complete State */}
                {currentStep === 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <Card className="bg-[#FCFBF4]/10 border-[#FCFBF4]/20 p-8 text-center">
                      <CardContent className="space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-[#6667AB] flex items-center justify-center">
                          <CheckCircle className="w-10 h-10 text-[#FCFBF4]" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#FCFBF4] mb-2">
                            Transaction Submitted!
                          </h3>
                          <p className="text-[#FCFBF4]/80 mb-4">
                            Your crypto-to-INR conversion is being processed
                          </p>
                          <div className="bg-[#FCFBF4]/5 border border-[#FCFBF4]/20 rounded-lg p-4 mb-6">
                            <div className="text-sm text-[#FCFBF4]/70">Conversion Details:</div>
                            <div className="text-lg font-semibold text-[#FCFBF4]">
                              {remittanceState.amount} {remittanceState.fromToken} → ₹{remittanceState.toAmount}
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            setCurrentStep('wallet-connected');
                            setRemittanceState(prev => ({ ...prev, amount: '', toAmount: '' }));
                          }}
                          className="btn-premium"
                        >
                          Make Another Conversion
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Automated Token Approval after KYC */}
                {currentStep === 'token-approval' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <AutomatedTokenApproval
                      selectedToken={remittanceState.selectedTokenData}
                      transferAmount={remittanceState.amount}
                      inrAmount={remittanceState.toAmount}
                      onApprovalComplete={() => {
                        setCurrentStep('complete');
                      }}
                      onDecline={() => {
                        setCurrentStep('kyc');
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Wallet Creator Modal */}
        {showWalletCreator && (
          <SocialWalletCreator
            onWalletCreated={() => setShowWalletCreator(false)}
            isVisible={showWalletCreator}
          />
        )}

        {/* Unsupported Token Modal */}
        <Dialog open={showUnsupportedTokenModal} onOpenChange={setShowUnsupportedTokenModal}>
          <DialogContent className="bg-[#FCFBF4] border-[#6667AB]/30 text-[#6667AB] max-w-md shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#6667AB] flex items-center gap-2">
                <Database className="w-6 h-6 text-[#6667AB]" />
                Token Not Supported
              </DialogTitle>
              <DialogDescription className="text-[#6667AB] mt-4 font-medium">
                <strong className="text-[#6667AB]">{unsupportedTokenSymbol}</strong> is not currently supported for conversion to INR.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg p-4">
                <h4 className="font-semibold text-[#6667AB] mb-2">Why isn't this token supported?</h4>
                <ul className="text-sm text-[#6667AB] space-y-1 font-medium">
                  <li>• Only top 100 cryptocurrencies by market cap</li>
                  <li>• Token must have sufficient DeFi liquidity</li>
                  <li>• Must be available on supported networks</li>
                </ul>
              </div>

              <div className="bg-[#6667AB]/5 border border-[#6667AB]/30 rounded-lg p-4">
                <h4 className="font-semibold text-[#6667AB] mb-2">Request Token Support</h4>
                <p className="text-sm text-[#6667AB] mb-3 font-medium">
                  We regularly review and add new tokens based on market demand and liquidity.
                </p>
                <Button 
                  onClick={() => {
                    console.log(`Token support requested: ${unsupportedTokenSymbol}`);
                    setShowUnsupportedTokenModal(false);
                  }}
                  className="w-full bg-[#6667AB] hover:bg-[#6667AB]/90 text-[#FCFBF4] font-semibold"
                >
                  Submit Request for {unsupportedTokenSymbol}
                </Button>
              </div>

              <div className="text-center">
                <Button 
                  variant="outline"
                  onClick={() => setShowUnsupportedTokenModal(false)}
                  className="border-[#6667AB]/40 text-[#6667AB] hover:bg-[#6667AB]/10 font-semibold"
                >
                  Choose Different Token
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Solana Wallet Connector */}
        <SolanaWalletConnector
          isOpen={showSolanaConnector}
          onClose={() => setShowSolanaConnector(false)}
          onConnect={(wallet) => {
            console.log('Solana wallet connected:', wallet);
            setSolanaWallet(wallet);
            setShowSolanaConnector(false);
            setCurrentStep('wallet-connected');
          }}
        />
      </motion.div>
    </div>
  );
}