import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Zap, 
  Globe
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
            <h1 className="text-4xl md:text-6xl font-bold text-[#FCFBF4] mb-6">
              Convert Crypto to INR
            </h1>
            <p className="text-xl text-[#FCFBF4]/90 mb-8 max-w-2xl mx-auto">
              Secure, fast, and transparent crypto-to-INR conversions with live rates
            </p>
            <Button 
              onClick={() => open()}
              size="lg"
              className="btn-premium text-lg px-8 py-4"
            >
              Connect Wallet to Start
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main Trading Section */}
      <section className="py-16 bg-[#FCFBF4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-[#6667AB] mb-4">
              Start Trading
            </h2>
            <p className="text-lg text-[#6667AB]/70">
              Connect your wallet to access live rates and instant conversions
            </p>
          </motion.div>

          <Card className="bg-white border-[#6667AB]/20 shadow-xl">
            <CardContent className="p-8">
              <ReownSwapFlow />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-[#6667AB]/5 to-[#FCFBF4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-[#6667AB] mb-4">
              Why Choose StablePay
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Bank-Grade Security",
                description: "Multi-layer security with smart contract audits"
              },
              {
                icon: Zap,
                title: "Instant Transfers",
                description: "Receive INR in your bank account within minutes"
              },
              {
                icon: Globe,
                title: "Multi-Chain Support",
                description: "Trade across 7+ blockchain networks"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#6667AB] mb-2">{feature.title}</h3>
                <p className="text-[#6667AB]/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
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