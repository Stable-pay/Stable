import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpDown, 
  Shield, 
  Zap, 
  Globe, 
  TrendingUp, 
  Users, 
  CheckCircle,
  ArrowRight,
  Star,
  Fuel,
  BarChart3,
  Lock,
  Smartphone,
  CreditCard,
  Wallet
} from 'lucide-react';
import { Link } from 'wouter';
import { Web3PulseLoader, Web3SpinLoader } from '@/components/animations/web3-loader';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';

export default function AnimatedHome() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    {
      icon: ArrowUpDown,
      title: "Multi-Chain Swaps",
      description: "Swap tokens across Ethereum, Polygon, Arbitrum, Base, and more with the best rates",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Fuel,
      title: "Gasless Transactions",
      description: "Execute swaps without paying gas fees using our advanced PancakeSwap Fusion integration",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your funds are protected with enterprise-level security and smart contract audits",
      gradient: "from-red-500 to-pink-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get quotes and execute trades in seconds with our optimized infrastructure",
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Access DeFi from anywhere in the world with our compliant and regulated platform",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: BarChart3,
      title: "Best Rates",
      description: "Always get the best exchange rates through our intelligent routing algorithms",
      gradient: "from-cyan-500 to-blue-600"
    }
  ];

  const stats = [
    { label: "Total Volume", value: "$2.4B+", description: "Traded across all chains" },
    { label: "Active Users", value: "150K+", description: "Global community members" },
    { label: "Supported Tokens", value: "5,000+", description: "Available for trading" },
    { label: "Networks", value: "7+", description: "Blockchain ecosystems" }
  ];

  const supportedChains = [
    { name: "Ethereum", symbol: "ETH", color: "#627EEA" },
    { name: "Polygon", symbol: "MATIC", color: "#8247E5" },
    { name: "Arbitrum", symbol: "ARB", color: "#28A0F0" },
    { name: "Base", symbol: "BASE", color: "#0052FF" },
    { name: "Optimism", symbol: "OP", color: "#FF0420" },
    { name: "Avalanche", symbol: "AVAX", color: "#E84142" },
    { name: "BSC", symbol: "BNB", color: "#F3BA2F" }
  ];

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

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"
          style={{ y, opacity }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="mb-8"
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Web3SpinLoader size={16} color="#6667AB" />
                <span className="text-sm font-medium" style={{ color: '#6667AB' }}>
                  Web3 Trading Platform
                </span>
              </motion.div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-6xl md:text-7xl font-bold mb-6"
              style={{ color: '#6667AB' }}
            >
              The Future of
              <br />
              <motion.span 
                className="bg-gradient-to-r from-[#6667AB] to-[#8B7CC8] bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Multi-Chain DeFi
              </motion.span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Trade tokens seamlessly across multiple blockchains with gasless transactions, 
              best-in-class rates, and enterprise-grade security. Experience the next generation 
              of decentralized finance.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              {isConnected ? (
                <Link href="/swap">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg" 
                      className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8 py-4 text-lg h-auto"
                    >
                      Start Trading
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => open()}
                    size="lg" 
                    className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8 py-4 text-lg h-auto"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                </motion.div>
              )}
              
              <Link href="/dashboard">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white px-8 py-4 text-lg h-auto"
                  >
                    View Dashboard
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            
            {/* Animated Trust Indicators */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
            >
              {[
                { icon: Shield, text: "Audited Smart Contracts" },
                { icon: Lock, text: "Non-Custodial" },
                { icon: CheckCircle, text: "Regulatory Compliant" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.1 }}
                >
                  <item.icon className="h-4 w-4" style={{ color: '#6667AB' }} />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Floating Animation Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-[#6667AB] rounded-full opacity-20"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 40}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.8, 0.2],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="text-4xl md:text-5xl font-bold mb-2"
                  style={{ color: '#6667AB' }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Animated Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2 
              variants={itemVariants}
              className="text-4xl font-bold mb-4" 
              style={{ color: '#6667AB' }}
            >
              Why Choose StablePay?
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Built for traders, investors, and institutions who demand the best 
              in DeFi technology and user experience.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all bg-white h-full">
                  <CardHeader className="pb-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-r ${feature.gradient}`}
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <CardTitle className="text-xl" style={{ color: '#6667AB' }}>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Animated Supported Chains */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2 
              variants={itemVariants}
              className="text-4xl font-bold mb-4" 
              style={{ color: '#6667AB' }}
            >
              Multi-Chain Support
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Trade across the most popular blockchain networks with seamless 
              cross-chain functionality.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {supportedChains.map((chain, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.1, y: -5 }}
              >
                <motion.div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: chain.color }}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  {chain.symbol.charAt(0)}
                </motion.div>
                <div className="text-sm font-semibold text-gray-900">
                  {chain.name}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Animated CTA Section */}
      <motion.section 
        className="py-20 relative overflow-hidden"
        style={{ backgroundColor: '#6667AB' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.h2 
            variants={itemVariants}
            className="text-4xl font-bold text-white mb-6"
          >
            Ready to Experience the Future?
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of traders who trust StablePay for their multi-chain 
            DeFi operations. Start trading with gasless transactions today.
          </motion.p>
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isConnected ? (
              <Link href="/swap">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-white text-[#6667AB] hover:bg-gray-100 px-8 py-4 text-lg font-semibold h-auto"
                  >
                    Start Trading Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => open()}
                  size="lg" 
                  className="bg-white text-[#6667AB] hover:bg-gray-100 px-8 py-4 text-lg font-semibold h-auto"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Your Wallet
                </Button>
              </motion.div>
            )}
            
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-[#6667AB] px-8 py-4 text-lg h-auto"
                >
                  Learn More
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Floating Wallet Animation */}
          <motion.div
            className="absolute top-10 right-10 hidden lg:block"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Web3PulseLoader size={60} color="white" />
          </motion.div>
        </div>
      </motion.section>

    </div>
  );
}