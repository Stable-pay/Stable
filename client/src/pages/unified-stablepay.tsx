import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  TrendingUp,
  Users,
  CreditCard,
  Smartphone,
  CheckCircle,
  Star,
  Award,
  ChevronDown,
  Play,
  Wallet,
  Send,
  DollarSign,
  Clock,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { ReownSwapFlow } from '@/components/remittance/reown-swap-flow';
import { ModernWalletModal } from '@/components/web3/modern-wallet-modal';

export function UnifiedStablePay() {
  const { open } = useAppKit();
  const [isVisible, setIsVisible] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentSection, setCurrentSection] = useState('hero');
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'features', 'app', 'security', 'pricing'];
      const currentPos = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (currentPos >= offsetTop && currentPos < offsetTop + offsetHeight) {
            setCurrentSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartTrading = () => {
    setShowWalletModal(true);
  };

  const handleConnect = (walletId: string) => {
    setIsConnecting(true);
    // Handle wallet connection logic
    setTimeout(() => {
      setIsConnecting(false);
      setShowWalletModal(false);
    }, 2000);
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
      transition: {
        duration: 0.5
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF4]">
      {/* Enhanced Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#6667AB]/95 backdrop-blur-md border-b border-[#FCFBF4]/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="text-2xl font-bold text-[#FCFBF4]"
              whileHover={{ scale: 1.05 }}
            >
              StablePay
            </motion.div>
            
            <div className="hidden md:flex space-x-8 text-[#FCFBF4]/80">
              <button 
                onClick={() => scrollToSection('hero')}
                className={`hover:text-[#FCFBF4] transition-colors ${currentSection === 'hero' ? 'text-[#FCFBF4]' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className={`hover:text-[#FCFBF4] transition-colors ${currentSection === 'features' ? 'text-[#FCFBF4]' : ''}`}
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('app')}
                className={`hover:text-[#FCFBF4] transition-colors ${currentSection === 'app' ? 'text-[#FCFBF4]' : ''}`}
              >
                Platform
              </button>
              <button 
                onClick={() => scrollToSection('security')}
                className={`hover:text-[#FCFBF4] transition-colors ${currentSection === 'security' ? 'text-[#FCFBF4]' : ''}`}
              >
                Security
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className={`hover:text-[#FCFBF4] transition-colors ${currentSection === 'pricing' ? 'text-[#FCFBF4]' : ''}`}
              >
                Pricing
              </button>
            </div>
            
            <Button 
              onClick={handleStartTrading}
              className="btn-premium"
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#6667AB] via-[#6667AB]/90 to-[#6667AB]/80">
        {/* Animated Background Elements */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-20 left-10 w-32 h-32 bg-[#FCFBF4]/10 rounded-full blur-xl"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-20 right-10 w-48 h-48 bg-[#FCFBF4]/5 rounded-full blur-2xl"
          variants={floatingVariants}
          animate="animate"
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="text-center"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <Badge className="bg-[#FCFBF4]/20 text-[#FCFBF4] border-[#FCFBF4]/30 mb-6">
                ₹2.5Cr+ Volume Processed • 10,000+ Happy Users
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold text-[#FCFBF4] mb-6 leading-tight">
                Convert Crypto to
                <span className="bg-gradient-to-r from-[#FCFBF4] to-[#FCFBF4]/80 bg-clip-text text-transparent block">
                  INR Instantly
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-[#FCFBF4]/80 max-w-3xl mx-auto leading-relaxed">
                India's most trusted Web3 off-ramping platform. Convert your crypto holdings to INR with{' '}
                <strong className="text-[#FCFBF4]">live rates</strong>, {' '}
                <strong className="text-[#FCFBF4]">instant transfers</strong>, and {' '}
                <strong className="text-[#FCFBF4]">complete transparency</strong>.
                <br className="hidden sm:block" />
                <strong className="text-[#FCFBF4]">Your Crypto, Your Wallet, Your INR. On Your Terms.</strong>
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                onClick={handleStartTrading}
                size="lg"
                className="btn-premium text-lg px-8 py-4 group"
              >
                Start Off-Ramping Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-[#FCFBF4]/20 text-[#FCFBF4] hover:bg-[#FCFBF4]/10 text-lg px-8 py-4 group"
                onClick={() => scrollToSection('features')}
              >
                <Play className="w-5 h-5 mr-2" />
                Learn How It Works
              </Button>
            </motion.div>

            {/* Live Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { label: "Volume Processed", value: "₹2.5Cr+", icon: TrendingUp },
                { label: "Active Users", value: "10,000+", icon: Users },
                { label: "Avg. Processing Time", value: "< 5 min", icon: Clock }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-[#FCFBF4]/10 backdrop-blur-sm rounded-2xl p-6 border border-[#FCFBF4]/20"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <stat.icon className="w-8 h-8 text-[#FCFBF4] mx-auto mb-4" />
                  <div className="text-3xl font-bold text-[#FCFBF4] mb-2">{stat.value}</div>
                  <div className="text-[#FCFBF4]/80">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-[#FCFBF4]/60" />
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="py-20 bg-[#FCFBF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#6667AB] mb-6">
              How StablePay Works
            </h2>
            <p className="text-xl text-[#6667AB]/70 max-w-3xl mx-auto">
              Four simple steps to convert your crypto to INR
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Link your Web3 wallet or create a new social wallet",
                icon: Wallet,
                color: "from-[#6667AB] to-[#6667AB]/80"
              },
              {
                step: "02", 
                title: "Select Crypto",
                description: "Choose from 50+ supported tokens across 7 chains",
                icon: CreditCard,
                color: "from-[#6667AB]/90 to-[#6667AB]/70"
              },
              {
                step: "03",
                title: "Get Live Rate",
                description: "See real-time INR conversion with transparent fees",
                icon: DollarSign,
                color: "from-[#6667AB]/80 to-[#6667AB]/60"
              },
              {
                step: "04",
                title: "Receive INR",
                description: "Get instant INR transfer to your bank account",
                icon: Send,
                color: "from-[#6667AB]/70 to-[#6667AB]/50"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="relative"
              >
                <Card className="h-full bg-white border-[#6667AB]/10 hover:border-[#6667AB]/30 transition-all duration-300 hover:shadow-xl">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-[#6667AB]/60 mb-2">STEP {item.step}</div>
                    <CardTitle className="text-[#6667AB] text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#6667AB]/70 text-center">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Application Section */}
      <section id="app" className="py-20 bg-gradient-to-br from-[#6667AB]/5 to-[#FCFBF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#6667AB] mb-6">
              Trade Crypto to INR
            </h2>
            <p className="text-xl text-[#6667AB]/70 max-w-3xl mx-auto">
              Connect your wallet and start converting crypto to INR with live rates
            </p>
          </motion.div>

          {/* Embedded Trading Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-[#6667AB]/20 shadow-2xl">
              <CardContent className="p-8">
                <ReownSwapFlow />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features & Benefits Section */}
      <section className="py-20 bg-[#FCFBF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#6667AB] mb-6">
              Why Choose StablePay
            </h2>
            <p className="text-xl text-[#6667AB]/70 max-w-3xl mx-auto">
              Built for the modern crypto user who values security, speed, and transparency
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Bank-Grade Security",
                description: "Multi-layer security with smart contract audits and cold storage protection"
              },
              {
                icon: Zap,
                title: "Instant Settlements",
                description: "Receive INR in your bank account within minutes, not hours or days"
              },
              {
                icon: Globe,
                title: "Multi-Chain Support",
                description: "Trade across Ethereum, Polygon, BSC, Arbitrum, and 4 more chains"
              },
              {
                icon: Eye,
                title: "Complete Transparency",
                description: "Live exchange rates, clear fee structure, and real-time transaction tracking"
              },
              {
                icon: Lock,
                title: "KYC Compliant",
                description: "Fully compliant with Indian regulations and international standards"
              },
              {
                icon: TrendingUp,
                title: "Best Rates",
                description: "Competitive exchange rates with minimal spreads and transparent pricing"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="h-full bg-white border-[#6667AB]/10 hover:border-[#6667AB]/30 transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-[#6667AB]">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#6667AB]/70">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section id="security" className="py-20 bg-gradient-to-br from-[#6667AB]/10 to-[#FCFBF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#6667AB] mb-6">
              Security & Compliance
            </h2>
            <p className="text-xl text-[#6667AB]/70 max-w-3xl mx-auto">
              Your funds and data are protected by industry-leading security measures
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Smart Contract Audited", description: "Multiple security audits" },
              { icon: Lock, title: "KYC/AML Compliant", description: "Full regulatory compliance" },
              { icon: Award, title: "ISO 27001 Certified", description: "International security standards" },
              { icon: CheckCircle, title: "FATF Travel Rule", description: "Global compliance framework" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#6667AB] mb-2">{item.title}</h3>
                <p className="text-[#6667AB]/70">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#FCFBF4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#6667AB] mb-6">
              Transparent Pricing
            </h2>
            <p className="text-xl text-[#6667AB]/70 max-w-3xl mx-auto">
              No hidden fees. What you see is what you pay.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-white border-[#6667AB]/20 shadow-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-[#6667AB]">Simple Flat Fee</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-5xl font-bold text-[#6667AB] mb-4">₹249</div>
                <p className="text-[#6667AB]/70 mb-6">per transaction, regardless of amount</p>
                <div className="space-y-4">
                  {[
                    "Live market rates with 0% markup",
                    "No minimum transaction amount", 
                    "Instant INR bank transfers",
                    "24/7 customer support",
                    "Multi-chain support included"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-[#6667AB] mr-3" />
                      <span className="text-[#6667AB]/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#6667AB] via-[#6667AB]/90 to-[#6667AB]/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#FCFBF4] mb-6">
              Ready to Convert Your Crypto?
            </h2>
            <p className="text-xl text-[#FCFBF4]/80 mb-12 max-w-2xl mx-auto">
              Join thousands of users who trust StablePay for secure, fast crypto-to-INR conversions
            </p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 items-center justify-center"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
            >
              <div className="flex items-center space-x-4 mb-6 sm:mb-0">
                <span className="flex items-center text-[#FCFBF4]/90">
                  <Shield className="w-5 h-5 mr-2" />
                  Secure & Compliant
                </span>
                <span className="flex items-center text-[#FCFBF4]/90">
                  <Zap className="w-5 h-5 mr-2" />
                  Get INR Instantly
                </span>
              </div>
              <Button 
                onClick={handleStartTrading}
                size="lg"
                className="btn-premium text-xl px-12 py-6 group"
              >
                Get Started Now
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Background Elements */}
        <motion.div 
          className="absolute top-10 left-10 w-32 h-32 bg-[#FCFBF4]/10 rounded-full blur-xl"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-48 h-48 bg-[#FCFBF4]/5 rounded-full blur-2xl"
          variants={floatingVariants}
          animate="animate"
        />
      </section>

      {/* Wallet Modal */}
      <ModernWalletModal 
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleConnect}
        isConnecting={isConnecting}
      />
    </div>
  );
}