import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  DollarSign, 
  Users, 
  TrendingUp,
  Lock,
  Smartphone,
  CreditCard,
  Send,
  Wallet,
  CheckCircle,
  Star,
  Building2,
  BarChart3,
  Coins,
  ArrowUpDown,
  Clock,
  FileText
} from 'lucide-react';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { Link } from 'wouter';

export default function StablePayHome() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const [currentSection, setCurrentSection] = useState(0);

  const heroVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">StablePay</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#security" className="text-gray-600 hover:text-blue-600 transition-colors">Security</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Wallet className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={() => open()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={heroVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Enterprise-Grade Crypto Banking
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  The Future of
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {" "}Digital Finance
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transform your business with our institutional-grade cryptocurrency platform. 
                  Seamless multi-chain transactions, enterprise security, and professional-grade tools 
                  for modern financial operations.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isConnected ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      View Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={() => open()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Learn More
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">$2.4B+</div>
                  <div className="text-sm text-gray-600">Volume Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">500K+</div>
                  <div className="text-sm text-gray-600">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-2xl"></div>
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Enterprise Dashboard</div>
                        <div className="text-sm text-gray-600">Real-time analytics</div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Live</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Coins className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">USDC Balance</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">$847,392</div>
                      <div className="text-sm text-green-600">+12.4% today</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-700">Portfolio</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">$1.2M</div>
                      <div className="text-sm text-green-600">+8.7% this week</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Swap Completed</div>
                          <div className="text-sm text-gray-600">ETH → USDC</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">$12,450</div>
                        <div className="text-xs text-gray-600">2 mins ago</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Send className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Withdrawal Processed</div>
                          <div className="text-sm text-gray-600">To Bank Account</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">$25,000</div>
                        <div className="text-xs text-gray-600">1 hour ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
                Enterprise Features
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for Professional Finance Teams
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive tools designed for institutional-grade cryptocurrency operations 
                with enterprise security and compliance standards.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <ArrowUpDown className="h-8 w-8 text-blue-600" />,
                title: "Multi-Chain Swaps",
                description: "Execute seamless token swaps across Ethereum, Polygon, Arbitrum, and Base with optimal routing and minimal slippage.",
                color: "blue"
              },
              {
                icon: <Shield className="h-8 w-8 text-indigo-600" />,
                title: "Enterprise Security",
                description: "Bank-grade security with multi-signature wallets, hardware security modules, and comprehensive audit trails.",
                color: "indigo"
              },
              {
                icon: <Building2 className="h-8 w-8 text-slate-600" />,
                title: "Institutional Grade",
                description: "Built for enterprise scale with dedicated support, custom integrations, and compliance reporting.",
                color: "slate"
              },
              {
                icon: <Zap className="h-8 w-8 text-emerald-600" />,
                title: "Instant Settlements",
                description: "Lightning-fast transaction processing with real-time settlement and immediate liquidity access.",
                color: "emerald"
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
                title: "Advanced Analytics",
                description: "Comprehensive reporting and analytics with real-time portfolio tracking and performance metrics.",
                color: "purple"
              },
              {
                icon: <Globe className="h-8 w-8 text-cyan-600" />,
                title: "Global Coverage",
                description: "Support for major cryptocurrencies and stablecoins across multiple blockchain networks worldwide.",
                color: "cyan"
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-blue-300">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-6`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">
                Bank-Grade Security
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Security That Institutions Trust
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our platform implements the highest security standards used by leading 
                financial institutions, ensuring your assets are protected at every level.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    icon: <Lock className="h-6 w-6 text-green-600" />,
                    title: "Multi-Signature Protection",
                    description: "Advanced multi-sig wallet architecture with distributed key management"
                  },
                  {
                    icon: <Shield className="h-6 w-6 text-blue-600" />,
                    title: "SOC 2 Compliance",
                    description: "Certified security controls and regular third-party audits"
                  },
                  {
                    icon: <FileText className="h-6 w-6 text-indigo-600" />,
                    title: "Regulatory Compliance",
                    description: "Full AML/KYC compliance with automated reporting capabilities"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Security Dashboard</h3>
                  <p className="text-gray-600">Real-time security monitoring</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "Wallet Security", status: "Active", color: "green" },
                    { label: "Multi-Factor Auth", status: "Enabled", color: "green" },
                    { label: "API Protection", status: "Active", color: "green" },
                    { label: "Fraud Detection", status: "Monitoring", color: "blue" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{item.label}</span>
                      <Badge className={`bg-${item.color}-100 text-${item.color}-700`}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to Transform Your Finance Operations?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join leading institutions using StablePay for secure, efficient cryptocurrency operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Access Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  onClick={() => open()}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                <Users className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">StablePay</span>
              </div>
              <p className="text-gray-400 mb-4">
                Enterprise-grade cryptocurrency platform for institutional finance operations.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Multi-Chain Swaps</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Portfolio Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Licenses</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 StablePay. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}