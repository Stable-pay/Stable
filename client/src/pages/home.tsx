import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Zap, DollarSign, Shield, TrendingUp, Users, Wallet, ChevronRight, Play, Star } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Link } from 'wouter';
import { ReownWalletConnect } from '@/components/wallet/reown-wallet-connect';

export default function Home() {
  const { isConnected } = useAccount();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const features = [
    {
      id: 'swap',
      icon: ArrowUpDown,
      title: 'Token Swap',
      description: 'Convert any token to USDC with 1inch Protocol',
      color: 'from-blue-500 to-purple-600',
      href: '/swap'
    },
    {
      id: 'dashboard',
      icon: TrendingUp,
      title: 'Portfolio Dashboard',
      description: 'Monitor your USDC balances across all chains',
      color: 'from-green-500 to-blue-500',
      href: '/dashboard'
    },
    {
      id: 'withdraw',
      icon: DollarSign,
      title: 'Fiat Withdrawal',
      description: 'Convert USDC to your local currency',
      color: 'from-purple-500 to-pink-500',
      href: '/withdraw'
    }
  ];

  const stats = [
    { label: 'Total Volume', value: '$2.4M+', icon: TrendingUp },
    { label: 'Active Users', value: '12,500+', icon: Users },
    { label: 'Supported Chains', value: '7', icon: Zap },
    { label: 'Success Rate', value: '99.8%', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Stable Pay
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              The fastest way to convert crypto to USDC and withdraw to your bank account
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Multi-chain token swapping with KYC-compliant fiat withdrawals across 7+ blockchain networks
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {isConnected ? (
                <Link href="/swap">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg">
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Start Swapping
                  </Button>
                </Link>
              ) : (
                <ReownWalletConnect />
              )}
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Secure & Non-custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Best Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>99.8% Success Rate</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need for crypto-to-fiat conversion
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Seamless token swapping, portfolio management, and fiat withdrawals in one platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature) => (
            <Link key={feature.id} href={feature.href}>
              <Card 
                className={`cursor-pointer border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  hoveredCard === feature.id ? 'scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                    <span>Get Started</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Convert crypto to cash in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Connect Wallet</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect your Web3 wallet to access your tokens across multiple chains
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <ArrowUpDown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Swap to USDC</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Convert any token to USDC using 1inch Protocol for the best rates
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Withdraw Fiat</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Complete KYC and withdraw USDC directly to your bank account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Networks */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Supported Networks
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Swap tokens across all major blockchain networks
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {['Ethereum', 'Polygon', 'Arbitrum', 'Base', 'Optimism', 'Avalanche', 'BSC'].map((network, index) => (
            <Card key={network} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-sm">{network.charAt(0)}</span>
                </div>
                <p className="font-semibold text-sm">{network}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust Stable Pay for their crypto-to-fiat needs
          </p>
          
          {isConnected ? (
            <Link href="/swap">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg">
                <ArrowUpDown className="h-5 w-5 mr-2" />
                Start Swapping Now
              </Button>
            </Link>
          ) : (
            <div className="flex justify-center">
              <ReownWalletConnect />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}