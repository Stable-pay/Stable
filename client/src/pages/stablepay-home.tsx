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
  CreditCard
} from 'lucide-react';
import { Link } from 'wouter';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';

export default function StablePayHome() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  const features = [
    {
      icon: ArrowUpDown,
      title: "Multi-Chain Swaps",
      description: "Swap tokens across Ethereum, Polygon, Arbitrum, Base, and more with the best rates"
    },
    {
      icon: Fuel,
      title: "Gasless Transactions",
      description: "Execute swaps without paying gas fees using our advanced 1inch Fusion integration"
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your funds are protected with enterprise-level security and smart contract audits"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get quotes and execute trades in seconds with our optimized infrastructure"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Access DeFi from anywhere in the world with our compliant and regulated platform"
    },
    {
      icon: BarChart3,
      title: "Best Rates",
      description: "Always get the best exchange rates through our intelligent routing algorithms"
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: '#6667AB' }}>
              The Future of
              <br />
              <span className="bg-gradient-to-r from-[#6667AB] to-[#8B7CC8] bg-clip-text text-transparent">
                Multi-Chain DeFi
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Trade tokens seamlessly across multiple blockchains with gasless transactions, 
              best-in-class rates, and enterprise-grade security. Experience the next generation 
              of decentralized finance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isConnected ? (
                <Link href="/swap">
                  <Button 
                    size="lg" 
                    className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8 py-3 text-lg"
                  >
                    Start Trading
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={() => open()}
                  size="lg" 
                  className="bg-[#6667AB] hover:bg-[#5a5b96] text-white px-8 py-3 text-lg"
                >
                  Connect Wallet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white px-8 py-3 text-lg"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: '#6667AB' }} />
                <span>Audited Smart Contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" style={{ color: '#6667AB' }} />
                <span>Non-Custodial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" style={{ color: '#6667AB' }} />
                <span>Regulatory Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#6667AB' }}>
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#6667AB' }}>
              Why Choose StablePay?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for traders, investors, and institutions who demand the best 
              in DeFi technology and user experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="pb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: '#6667AB' }}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
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
            ))}
          </div>
        </div>
      </section>

      {/* Supported Chains */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#6667AB' }}>
              Multi-Chain Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trade across the most popular blockchain networks with seamless 
              cross-chain functionality.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {supportedChains.map((chain, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg"
                  style={{ backgroundColor: chain.color }}
                >
                  {chain.symbol.charAt(0)}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {chain.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: '#6667AB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who trust StablePay for their multi-chain 
            DeFi operations. Start trading with gasless transactions today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isConnected ? (
              <Link href="/swap">
                <Button 
                  size="lg" 
                  className="bg-white text-[#6667AB] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={() => open()}
                size="lg" 
                className="bg-white text-[#6667AB] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                Connect Your Wallet
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-[#6667AB] px-8 py-3 text-lg"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}