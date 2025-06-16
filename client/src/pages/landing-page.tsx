import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  CheckCircle, 
  Wallet, 
  Building, 
  Clock,
  Star,
  Users,
  TrendingUp,
  Lock,
  Smartphone,
  CreditCard,
  Target,
  Award,
  ChevronDown,
  Play
} from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { useLocation } from 'wouter';

export function LandingPage() {
  const { open } = useAppKit();
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    setLocation('/app');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Compatible with Particle Network, Reown AppKit, and all major Web3 wallets. No custody, no middlemen. Your wallet stays yours.",
      icon: Wallet,
      color: "from-[#6667AB] to-[#6667AB]/80"
    },
    {
      number: "02", 
      title: "Complete KYC Verification",
      description: "Fast, secure, and fully compliant onboarding process. Identity verification completed in minutes.",
      icon: Shield,
      color: "from-[#6667AB]/80 to-[#6667AB]/60"
    },
    {
      number: "03",
      title: "Add Your Indian Bank Details", 
      description: "Securely link your account to receive INR directly via RTGS, NEFT, or IMPS. Your details stay encrypted and safe.",
      icon: Building,
      color: "from-[#6667AB]/60 to-[#6667AB]/40"
    },
    {
      number: "04",
      title: "Off-Ramp to INR Instantly",
      description: "Convert your crypto to INR at real-time rates with a flat ₹249 fee. Receive funds quickly in your bank account.",
      icon: Zap,
      color: "from-[#6667AB]/40 to-[#6667AB]/20"
    }
  ];

  const features = [
    {
      icon: Globe,
      title: "Multi-Crypto Support",
      description: "Bitcoin, Ethereum, USDT, USDC, and more"
    },
    {
      icon: Zap,
      title: "Multi-Chain Enabled", 
      description: "Ethereum, Polygon, BSC, Arbitrum, and others"
    },
    {
      icon: Lock,
      title: "Self-Custody First",
      description: "You control your assets at every step"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Conversion",
      description: "Competitive rates, instant processing"
    },
    {
      icon: CreditCard,
      title: "Flat Fee Structure",
      description: "₹249 per transaction – no hidden charges"
    },
    {
      icon: Award,
      title: "Fully Compliant",
      description: "FIU-IND registered, FATF-aligned"
    }
  ];

  const userTypes = [
    {
      icon: Users,
      title: "NRIs & Expats",
      description: "Sending remittance to India with ease"
    },
    {
      icon: Smartphone,
      title: "Freelancers",
      description: "Receiving international crypto payments"
    },
    {
      icon: Wallet,
      title: "Crypto Holders",
      description: "Off-ramping digital assets to INR"
    },
    {
      icon: Building,
      title: "Businesses",
      description: "Cross-border payment solutions"
    }
  ];

  const stats = [
    { number: "₹2.5Cr+", label: "Total Volume Processed" },
    { number: "10,000+", label: "Successful Transactions" },
    { number: "2-5min", label: "Average Settlement Time" },
    { number: "99.9%", label: "Platform Uptime" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6667AB] via-[#6667AB]/95 to-[#5A5B9F] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          style={{ y: y1 }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#FCFBF4]/10 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FCFBF4]/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6 md:px-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#FCFBF4] to-[#FCFBF4]/80 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-[#6667AB]" />
            </div>
            <span className="text-[#FCFBF4] font-bold text-xl">StablePay</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[#FCFBF4]/80">
            <a href="#how-it-works" className="hover:text-[#FCFBF4] transition-colors">How it Works</a>
            <a href="#features" className="hover:text-[#FCFBF4] transition-colors">Features</a>
            <a href="#security" className="hover:text-[#FCFBF4] transition-colors">Security</a>
            <a href="#pricing" className="hover:text-[#FCFBF4] transition-colors">Pricing</a>
          </div>
          <Button 
            onClick={handleGetStarted}
            className="btn-premium"
          >
            Get Started
          </Button>
        </motion.nav>

        {/* Hero Section */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="px-6 md:px-12 py-20 text-center"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <Badge className="bg-[#FCFBF4]/10 text-[#FCFBF4] border-[#FCFBF4]/20 mb-6">
              🚀 Web3 Remittance Revolution
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#FCFBF4] mb-6 leading-tight">
              Web3 Remittance &<br />
              <span className="bg-gradient-to-r from-[#FCFBF4] to-[#FCFBF4]/80 bg-clip-text text-transparent">
                INR Off-Ramping
              </span><br />
              Made Simple
            </h1>
            <p className="text-xl md:text-2xl text-[#FCFBF4]/80 mb-12 max-w-4xl mx-auto leading-relaxed">
              Instantly move your crypto to your Indian bank account – in just a few easy steps.
              <br />
              <strong className="text-[#FCFBF4]">Your Crypto, Your Wallet, Your INR. On Your Terms.</strong>
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              onClick={handleGetStarted}
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
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-bold text-[#FCFBF4] mb-2">{stat.number}</div>
                <div className="text-[#FCFBF4]/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex justify-center pb-12"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-[#FCFBF4]/60"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>

        {/* How It Works Section */}
        <section id="how-it-works" className="px-6 md:px-12 py-20 bg-[#FCFBF4]/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-[#FCFBF4] mb-6">
                How It Works: A Quick, Clear Process
              </h2>
              <p className="text-xl text-[#FCFBF4]/80 max-w-3xl mx-auto">
                From wallet connection to INR in your bank account – experience the future of remittance
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ y: -5 }}
                  className="relative"
                >
                  <Card className="bg-[#FCFBF4]/10 backdrop-blur-md border-[#FCFBF4]/20 h-full hover:bg-[#FCFBF4]/15 transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <step.icon className="w-8 h-8 text-[#FCFBF4]" />
                      </div>
                      <div className="text-3xl font-bold text-[#6667AB] mb-2">{step.number}</div>
                      <h3 className="text-xl font-semibold text-[#FCFBF4] mb-3">{step.title}</h3>
                      <p className="text-[#FCFBF4]/70 text-sm leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#FCFBF4]/50 to-transparent"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 md:px-12 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-[#FCFBF4] mb-6">
                Why Choose StablePay?
              </h2>
              <p className="text-xl text-[#FCFBF4]/80 max-w-3xl mx-auto">
                Built for the modern crypto economy with enterprise-grade security and compliance
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="group"
                >
                  <Card className="bg-[#FCFBF4]/10 backdrop-blur-md border-[#FCFBF4]/20 h-full hover:bg-[#FCFBF4]/15 transition-all duration-300 group-hover:shadow-2xl">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon className="w-6 h-6 text-[#FCFBF4]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#FCFBF4] mb-2">{feature.title}</h3>
                      <p className="text-[#FCFBF4]/70 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Target Users Section */}
        <section className="px-6 md:px-12 py-20 bg-[#FCFBF4]/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-[#FCFBF4] mb-6">
                Who Is This For?
              </h2>
              <p className="text-xl text-[#FCFBF4]/80 max-w-3xl mx-auto">
                Designed for modern professionals and businesses operating in the global crypto economy
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {userTypes.map((user, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -10 }}
                  className="text-center group"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <user.icon className="w-10 h-10 text-[#FCFBF4]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#FCFBF4] mb-2">{user.title}</h3>
                  <p className="text-[#FCFBF4]/70 text-sm">{user.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="px-6 md:px-12 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-[#FCFBF4] mb-6">
                Security & Compliance You Can Trust
              </h2>
              <p className="text-xl text-[#FCFBF4]/80 max-w-3xl mx-auto">
                Enterprise-grade security meets regulatory compliance for complete peace of mind
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {[
                  { icon: Shield, text: "Smart contract wallet security" },
                  { icon: Award, text: "FATF-compliant Travel Rule support" },
                  { icon: Lock, text: "Robust KYC & AML integration" },
                  { icon: Clock, text: "Real-time transaction monitoring" },
                  { icon: CheckCircle, text: "Fully regulated and FIU-IND registered" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#FCFBF4]" />
                    </div>
                    <span className="text-[#FCFBF4] text-lg">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative bg-[#FCFBF4]/10 backdrop-blur-md border-[#FCFBF4]/20 rounded-2xl p-8 text-center">
                  <Lock className="w-16 h-16 text-[#6667AB] mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-[#FCFBF4] mb-4">Military-Grade Encryption</h3>
                  <p className="text-[#FCFBF4]/70">
                    Your data and transactions are protected with the same level of security used by financial institutions worldwide.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 md:px-12 py-20 bg-[#FCFBF4]/5 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-[#FCFBF4] mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-[#FCFBF4]/80 max-w-2xl mx-auto">
                No hidden fees, no surprises. Just a flat fee structure that scales with your needs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="bg-[#FCFBF4]/10 backdrop-blur-md border-[#FCFBF4]/20 p-8 md:p-12">
                <CardContent className="text-center">
                  <div className="text-6xl md:text-7xl font-bold text-[#FCFBF4] mb-4">₹249</div>
                  <div className="text-2xl text-[#FCFBF4]/80 mb-8">per off-ramp transaction</div>
                  <div className="text-[#FCFBF4]/70 mb-8">
                    <p className="mb-2">✓ No hidden charges</p>
                    <p className="mb-2">✓ Real-time competitive rates</p>
                    <p className="mb-2">✓ Instant bank transfers</p>
                    <p>✓ 24/7 customer support</p>
                  </div>
                  <p className="text-sm text-[#FCFBF4]/60">
                    *Blockchain network fees are separate and vary by network
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 md:px-12 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-[#FCFBF4]">
                Start Now: It's Simple
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-4 text-[#FCFBF4]/80 text-lg">
                <span className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </span>
                <ArrowRight className="w-5 h-5" />
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  KYC
                </span>
                <ArrowRight className="w-5 h-5" />
                <span className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Add Bank
                </span>
                <ArrowRight className="w-5 h-5" />
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Get INR Instantly
                </span>
              </div>
              <Button 
                onClick={() => open()}
                size="lg"
                className="btn-premium text-xl px-12 py-6 group"
              >
                Get Started Now
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-12 bg-[#FCFBF4]/5 backdrop-blur-sm border-t border-[#FCFBF4]/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FCFBF4] to-[#FCFBF4]/80 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-[#6667AB]" />
                </div>
                <span className="text-[#FCFBF4] font-bold text-xl">StablePay</span>
              </div>
              <div className="flex items-center gap-8 text-[#FCFBF4]/60 text-sm">
                <span>© 2025 StablePay. All rights reserved.</span>
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Support</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}