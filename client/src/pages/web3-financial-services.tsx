import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpCircle, 
  CreditCard, 
  Zap, 
  ArrowRightLeft, 
  Send, 
  Wallet,
  Shield,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { GaslessSwapInterface } from '@/components/swap/gasless-swap-interface';
import { WalletBalances } from '@/components/wallet/wallet-balances';

export default function Web3FinancialServices() {
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [activeService, setActiveService] = useState('overview');

  const services = [
    {
      id: 'top-up',
      title: 'Wallet Top-Up',
      description: 'Buy crypto directly to your wallet',
      icon: CreditCard,
      color: 'from-blue-500 to-blue-600',
      comingSoon: false
    },
    {
      id: 'swap',
      title: 'Instant Swap',
      description: 'Zero-gas token to USDC conversion',
      icon: Zap,
      color: 'from-green-500 to-green-600',
      comingSoon: false
    },
    {
      id: 'off-ramp',
      title: 'Off-Ramp to INR',
      description: 'Convert crypto to Indian Rupees',
      icon: ArrowUpCircle,
      color: 'from-purple-500 to-purple-600',
      comingSoon: false
    },
    {
      id: 'remittance',
      title: 'Global Remittance',
      description: 'Cross-border money transfers',
      icon: Send,
      color: 'from-orange-500 to-orange-600',
      comingSoon: false
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'Military-grade encryption and multi-signature protection for all transactions'
    },
    {
      icon: Globe,
      title: 'Multi-Chain Support',
      description: 'Access 18+ blockchain networks including Ethereum, Polygon, BSC, and Solana'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Rates',
      description: 'Live exchange rates with minimal slippage and transparent fee structure'
    },
    {
      icon: Clock,
      title: 'Instant Settlement',
      description: 'Fast transaction processing with automated compliance and KYC verification'
    }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-[#FCFBF4]">
              Web3 Financial Services
            </h1>
            <p className="text-xl text-[#FCFBF4]/80 mb-8 max-w-3xl mx-auto">
              Comprehensive blockchain-based financial infrastructure for crypto trading, 
              remittances, and decentralized banking services
            </p>
            
            <Card className="bg-[#FCFBF4]/10 border-[#FCFBF4]/20 backdrop-blur-lg">
              <CardContent className="p-8 text-center">
                <Wallet className="w-16 h-16 text-[#FCFBF4]/70 mx-auto mb-4" />
                <p className="text-[#FCFBF4] text-lg mb-6">
                  Connect your wallet to access our full suite of Web3 financial services
                </p>
                <w3m-button />
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Overview Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-[#FCFBF4]/10 border-[#FCFBF4]/20 backdrop-blur-lg hover:bg-[#FCFBF4]/15 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#FCFBF4] mb-2">{service.title}</h3>
                    <p className="text-[#FCFBF4]/70 text-sm">{service.description}</p>
                    {service.comingSoon && (
                      <Badge className="mt-3 bg-yellow-500 text-yellow-900">Coming Soon</Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="bg-[#FCFBF4]/10 border-[#FCFBF4]/20 backdrop-blur-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#FCFBF4]/20 to-[#FCFBF4]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-[#FCFBF4]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#FCFBF4] mb-2">{feature.title}</h3>
                        <p className="text-[#FCFBF4]/70 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6667AB] to-[#6667AB]/80 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#FCFBF4]">
            Web3 Financial Services
          </h1>
          <p className="text-xl text-[#FCFBF4]/80 mb-8">
            Complete blockchain financial infrastructure for modern transactions
          </p>
        </motion.div>

        <Tabs value={activeService} onValueChange={setActiveService} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-[#FCFBF4]/10 backdrop-blur-lg border border-[#FCFBF4]/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[#FCFBF4] data-[state=active]:text-[#6667AB] text-[#FCFBF4]/70"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="top-up" 
              className="data-[state=active]:bg-[#FCFBF4] data-[state=active]:text-[#6667AB] text-[#FCFBF4]/70"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Top-Up
            </TabsTrigger>
            <TabsTrigger 
              value="swap" 
              className="data-[state=active]:bg-[#FCFBF4] data-[state=active]:text-[#6667AB] text-[#FCFBF4]/70"
            >
              <Zap className="w-4 h-4 mr-2" />
              Swap
            </TabsTrigger>
            <TabsTrigger 
              value="off-ramp" 
              className="data-[state=active]:bg-[#FCFBF4] data-[state=active]:text-[#6667AB] text-[#FCFBF4]/70"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Off-Ramp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Wallet Balances */}
              <div>
                <WalletBalances />
              </div>
              
              {/* Quick Actions */}
              <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
                <CardHeader>
                  <CardTitle className="text-[#6667AB] flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setActiveService('top-up')}
                    className="w-full btn-premium justify-start"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy Crypto with Card
                  </Button>
                  <Button 
                    onClick={() => setActiveService('swap')}
                    className="w-full btn-premium justify-start"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Instant Swap to USDC
                  </Button>
                  <Button 
                    onClick={() => setActiveService('off-ramp')}
                    className="w-full btn-premium justify-start"
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Convert to INR
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Service Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <Card key={service.id} className="bg-[#FCFBF4]/10 border-[#FCFBF4]/20 backdrop-blur-lg">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#FCFBF4] mb-2">{service.title}</h3>
                    <p className="text-[#FCFBF4]/70 text-sm mb-4">{service.description}</p>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveService(service.id)}
                      className="btn-premium w-full"
                      disabled={service.comingSoon}
                    >
                      {service.comingSoon ? 'Coming Soon' : 'Access'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="top-up" className="space-y-8">
            <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
              <CardHeader>
                <CardTitle className="text-[#6667AB] flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  Wallet Top-Up Service
                  <Badge className="bg-blue-500 text-white">Secure</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#6667AB]">Buy Crypto with Credit/Debit Card</h3>
                      <p className="text-[#6667AB]/70 text-sm">Secure fiat-to-crypto purchases directly to your wallet</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-[#6667AB]/80">Instant Processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-[#6667AB]/80">Bank-Grade Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-[#6667AB]/80">150+ Countries</span>
                    </div>
                  </div>

                  {/* Reown AppKit Feature Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Buy Crypto */}
                    <div className="border border-[#6667AB]/20 rounded-lg p-6 bg-white text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#6667AB] mb-2">Buy Crypto</h3>
                      <p className="text-sm text-[#6667AB]/70 mb-4">Purchase crypto with your card directly to your wallet</p>
                      <Button 
                        className="btn-premium w-full"
                        onClick={() => open({ view: 'OnRampProviders' })}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy Crypto
                      </Button>
                    </div>

                    {/* Send */}
                    <div className="border border-[#6667AB]/20 rounded-lg p-6 bg-white text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                        <Send className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#6667AB] mb-2">Send Tokens</h3>
                      <p className="text-sm text-[#6667AB]/70 mb-4">Send crypto to any wallet address securely</p>
                      <Button 
                        className="btn-premium w-full"
                        onClick={() => open({ view: 'Account' })}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Tokens
                      </Button>
                    </div>

                    {/* Activity */}
                    <div className="border border-[#6667AB]/20 rounded-lg p-6 bg-white text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#6667AB] mb-2">Activity</h3>
                      <p className="text-sm text-[#6667AB]/70 mb-4">View your transaction history and activity</p>
                      <Button 
                        className="btn-premium w-full"
                        onClick={() => open({ view: 'Transactions' })}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        View Activity
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-[#6667AB]/60 text-center">
                    Powered by Reown • KYC verification may be required for larger amounts
                  </div>
                </div>

                {/* Supported Payment Methods */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-[#6667AB] mb-3">Supported Payment Methods</h4>
                      <div className="space-y-2 text-sm text-[#6667AB]/80">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Visa & Mastercard</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Apple Pay & Google Pay</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Bank Transfers (ACH/SEPA)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Local Payment Methods</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-[#6667AB] mb-3">Available Cryptocurrencies</h4>
                      <div className="space-y-2 text-sm text-[#6667AB]/80">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Bitcoin (BTC)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Ethereum (ETH)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>USDC & USDT Stablecoins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>50+ Major Altcoins</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swap" className="space-y-8">
            <GaslessSwapInterface />
          </TabsContent>

          <TabsContent value="off-ramp" className="space-y-8">
            <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
              <CardHeader>
                <CardTitle className="text-[#6667AB] flex items-center gap-2">
                  <ArrowUpCircle className="w-6 h-6" />
                  Crypto to INR Off-Ramp
                  <Badge className="bg-green-500 text-white">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="max-w-md mx-auto">
                  <ArrowUpCircle className="w-16 h-16 text-[#6667AB]/50 mx-auto mb-4" />
                  <p className="text-[#6667AB] text-lg mb-6">
                    Convert your crypto holdings to Indian Rupees with competitive rates
                  </p>
                  <Button className="btn-premium">
                    Start INR Conversion
                  </Button>
                  <p className="text-xs text-[#6667AB]/60 mt-4">
                    KYC verification required • Minimum conversion: ₹1,000
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}