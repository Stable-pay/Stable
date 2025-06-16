import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  MapPin
} from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitState } from '@reown/appkit/react';
import { SocialWalletCreator } from '@/components/reown/social-wallet-creator';
import { TravelRuleForm } from '@/components/compliance/travel-rule-form';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useReownTransfer } from '@/hooks/use-reown-transfer';
import { useReownPay } from '@/hooks/use-reown-pay';
import { getSupportedTokens, isTokenSupported, getTokenInfo, TOP_100_CRYPTO } from '@/../../shared/top-100-crypto';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Core remittance state and types
type StepType = 'landing' | 'wallet-connected' | 'swap' | 'kyc' | 'transfer' | 'complete';

interface RemittanceState {
  step: StepType;
  fromToken: string;
  amount: string;
  toAmount: string;
  exchangeRate: number;
  fees: number;
  isProcessing: boolean;
  transactionHash: string | null;
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
  const { chainId } = useAppKitNetwork();
  const { loading } = useAppKitState();
  
  const [isVisible, setIsVisible] = useState(false);
  const [showWalletCreator, setShowWalletCreator] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('landing');
  const [showUnsupportedTokenModal, setShowUnsupportedTokenModal] = useState(false);
  const [unsupportedTokenSymbol, setUnsupportedTokenSymbol] = useState('');
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
                        description: "Compatible with Particle Network, Reown AppKit, and all major Web3 wallets. No custody, no middlemen. Your wallet stays yours.",
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

                  <motion.div variants={itemVariants} className="mb-8">
                    <Button 
                      onClick={() => open()}
                      size="lg"
                      className="btn-premium text-xl px-12 py-6 group"
                    >
                      Get Started
                      <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
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
                      <CardTitle className="text-2xl text-[#FCFBF4]">Crypto to INR Off-Ramping</CardTitle>
                      <div className="text-sm text-[#FCFBF4]/70 mt-2">
                        Live USD to INR: ₹{usdToInrRate.toFixed(2)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* From Token Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#FCFBF4]">From Crypto</label>
                        <div className="flex gap-4">
                          <Select value={remittanceState.fromToken} onValueChange={handleTokenChange}>
                            <SelectTrigger className="w-32 bg-[#FCFBF4] text-[#6667AB] border-[#6667AB]/30 font-medium">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#FCFBF4] border-[#6667AB]/30 max-h-60 shadow-lg">
                              {supportedTokens.slice(0, 20).map(token => (
                                <SelectItem 
                                  key={token.symbol} 
                                  value={token.symbol}
                                  className="text-[#6667AB] font-medium hover:bg-[#6667AB]/10 focus:bg-[#6667AB]/10"
                                >
                                  {token.symbol} - {token.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={remittanceState.amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="flex-1 bg-[#FCFBF4] text-[#6667AB] border-[#6667AB]/30 placeholder:text-[#6667AB]/60 font-medium focus:border-[#6667AB] focus:ring-[#6667AB]"
                          />
                        </div>
                      </div>

                      {/* Exchange Rate Display */}
                      <div className="flex items-center justify-center py-4">
                        <div className="flex items-center gap-3 text-[#FCFBF4] bg-[#FCFBF4]/10 rounded-lg px-4 py-2 border border-[#FCFBF4]/20">
                          <RefreshCw className="w-4 h-4 animate-pulse text-[#FCFBF4]" />
                          <span className="text-sm font-medium">
                            1 {remittanceState.fromToken} = ₹{remittanceState.fromToken === 'USD' ? usdToInrRate.toFixed(2) : remittanceState.exchangeRate.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* To Amount Display */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#FCFBF4]">To Indian Rupees</label>
                        <div className="flex gap-4">
                          <div className="w-32 h-10 bg-[#FCFBF4]/30 border border-[#FCFBF4]/40 rounded-md flex items-center justify-center text-[#FCFBF4] font-bold shadow-sm">
                            INR
                          </div>
                          <div className="flex-1 h-10 bg-[#FCFBF4]/30 border border-[#FCFBF4]/40 rounded-md flex items-center px-3 text-[#FCFBF4] font-bold shadow-sm">
                            ₹{remittanceState.toAmount || '0.00'}
                          </div>
                        </div>
                      </div>

                      {/* Fee Display */}
                      <div className="bg-[#FCFBF4]/15 border border-[#FCFBF4]/30 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[#FCFBF4] font-medium">Service Fee</span>
                          <span className="text-[#FCFBF4] font-bold">₹{remittanceState.fees}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span className="text-[#FCFBF4]">You'll Receive</span>
                          <span className="text-[#FCFBF4]">
                            ₹{remittanceState.toAmount ? (parseFloat(remittanceState.toAmount) - remittanceState.fees).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-4 pt-6">
                        <Button 
                          className="w-full btn-premium text-lg py-3"
                          disabled={!remittanceState.amount || parseFloat(remittanceState.amount) <= 0}
                          onClick={() => setCurrentStep('swap')}
                        >
                          Continue to KYC
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        
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

                {/* Travel Rule and KYC Components */}
                {currentStep === 'swap' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-6"
                  >
                    <TravelRuleForm 
                      onSubmit={(data) => {
                        console.log('Travel rule data:', data);
                        setCurrentStep('complete');
                      }}
                      onBack={() => setCurrentStep('wallet-connected')}
                      amount={remittanceState.amount}
                      currency={remittanceState.fromToken}
                    />
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
      </motion.div>
    </div>
  );
}