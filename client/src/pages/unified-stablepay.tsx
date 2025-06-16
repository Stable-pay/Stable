import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Zap, 
  Globe,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { ReownSwapFlow } from '@/components/remittance/reown-swap-flow';

export function UnifiedStablePay() {
  const { open } = useAppKit();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFBF4]">
      {/* Header */}
      <motion.nav 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-[#6667AB] shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-[#FCFBF4]">
              StablePay
            </div>
            <Button 
              onClick={() => open()}
              className="btn-premium"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#6667AB] to-[#6667AB]/90 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-[#FCFBF4]/20 text-[#FCFBF4] border border-[#FCFBF4]/30 rounded-full px-4 py-2 text-sm mb-6 inline-block">
              ₹2.5Cr+ Volume Processed • 10,000+ Happy Users
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[#FCFBF4] mb-6">
              Convert Crypto to INR
              <span className="block text-3xl md:text-4xl mt-2">Instantly & Securely</span>
            </h1>
            <p className="text-xl text-[#FCFBF4]/90 mb-8 max-w-3xl mx-auto">
              India's most trusted Web3 off-ramping platform. Convert your crypto holdings to INR with live rates, instant transfers, and complete transparency. Your crypto, your wallet, your INR - on your terms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={() => open()}
                size="lg"
                className="btn-premium text-lg px-8 py-4 group"
              >
                Connect Wallet to Start
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { label: "Volume Processed", value: "₹2.5Cr+", icon: TrendingUp },
                { label: "Active Users", value: "10,000+", icon: Users },
                { label: "Avg. Processing Time", value: "< 5 min", icon: Clock }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-[#FCFBF4]/10 backdrop-blur-sm rounded-2xl p-6 border border-[#FCFBF4]/20 text-center"
                >
                  <stat.icon className="w-8 h-8 text-[#FCFBF4] mx-auto mb-3" />
                  <div className="text-2xl font-bold text-[#FCFBF4] mb-1">{stat.value}</div>
                  <div className="text-[#FCFBF4]/80 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#FCFBF4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#6667AB] mb-6">
              How StablePay Works
            </h2>
            <p className="text-xl text-[#6667AB]/70 max-w-3xl mx-auto">
              Simple 4-step process to convert your crypto to INR
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Link your Web3 wallet using WalletConnect or create a new social wallet",
                color: "from-[#6667AB] to-[#6667AB]/80"
              },
              {
                step: "02", 
                title: "Select Crypto",
                description: "Choose from 50+ supported tokens across Ethereum, Polygon, BSC, and more",
                color: "from-[#6667AB]/90 to-[#6667AB]/70"
              },
              {
                step: "03",
                title: "Get Live Rate",
                description: "See real-time INR conversion with transparent fees - ₹249 flat fee",
                color: "from-[#6667AB]/80 to-[#6667AB]/60"
              },
              {
                step: "04",
                title: "Receive INR",
                description: "Get instant INR transfer to your verified Indian bank account",
                color: "from-[#6667AB]/70 to-[#6667AB]/50"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#6667AB] mb-3">{item.title}</h3>
                <p className="text-[#6667AB]/70">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Trading Section */}
      <section className="py-20 bg-gradient-to-br from-[#6667AB]/5 to-[#FCFBF4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-[#6667AB] mb-6">
              Start Trading Now
            </h2>
            <p className="text-lg text-[#6667AB]/70">
              Connect your wallet to access live rates and instant conversions
            </p>
          </motion.div>

          <Card className="bg-white/90 backdrop-blur-sm border-[#6667AB]/20 shadow-2xl">
            <CardContent className="p-8">
              <ReownSwapFlow />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#FCFBF4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#6667AB] mb-6">
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
                description: "Multi-layer security with smart contract audits, cold storage protection, and KYC compliance"
              },
              {
                icon: Zap,
                title: "Instant Transfers",
                description: "Receive INR in your bank account within minutes, not hours or days"
              },
              {
                icon: Globe,
                title: "Multi-Chain Support",
                description: "Trade across Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, and Avalanche"
              },
              {
                icon: TrendingUp,
                title: "Best Rates",
                description: "Competitive exchange rates with live market pricing and transparent fee structure"
              },
              {
                icon: CheckCircle,
                title: "KYC Compliant",
                description: "Fully compliant with Indian regulations and international FATF standards"
              },
              {
                icon: Users,
                title: "Trusted Platform",
                description: "Join 10,000+ satisfied users who have processed ₹2.5Cr+ volume securely"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-[#6667AB]/10 hover:border-[#6667AB]/30 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#6667AB] mb-3">{feature.title}</h3>
                <p className="text-[#6667AB]/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-[#6667AB]/10 to-[#FCFBF4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#6667AB] mb-6">
              Transparent Pricing
            </h2>
            <p className="text-xl text-[#6667AB]/70">
              No hidden fees. What you see is what you pay.
            </p>
          </motion.div>

          <Card className="bg-white border-[#6667AB]/20 shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-[#6667AB] mb-4">Simple Flat Fee</h3>
              <div className="text-6xl font-bold text-[#6667AB] mb-4">₹249</div>
              <p className="text-lg text-[#6667AB]/70 mb-8">per transaction, regardless of amount</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {[
                  "Live market rates with 0% markup",
                  "No minimum transaction amount", 
                  "Instant INR bank transfers",
                  "24/7 customer support",
                  "Multi-chain support included",
                  "KYC verification assistance"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#6667AB] mr-3 flex-shrink-0" />
                    <span className="text-[#6667AB]/80">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => open()}
                size="lg"
                className="btn-premium text-lg px-8 py-4 mt-8 group"
              >
                Connect Wallet to Start
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#6667AB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-[#FCFBF4] mb-4">
              Ready to Start?
            </h2>
            <p className="text-lg text-[#FCFBF4]/90 mb-8">
              Connect your wallet and start converting crypto to INR today
            </p>
            <Button 
              onClick={() => open()}
              size="lg"
              className="btn-premium text-lg px-8 py-4"
            >
              Connect Wallet Now
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}