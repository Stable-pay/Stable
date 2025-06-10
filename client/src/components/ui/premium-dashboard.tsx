import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { EnhancedCard } from './enhanced-card';
import { Button } from './button';
import { Badge } from './badge';
import { Progress } from './progress';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpDown, 
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Send,
  Download,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Activity,
  Sparkles
} from 'lucide-react';

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  formattedBalance: string;
  usdValue: number;
}

interface PremiumDashboardProps {
  walletData: {
    isConnected: boolean;
    address: string | null;
    balances: TokenBalance[];
    isLoading: boolean;
    getTotalValue: () => number;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    refreshBalances: () => Promise<void>;
  };
}

export default function PremiumDashboard({ walletData }: PremiumDashboardProps) {
  const [hideBalances, setHideBalances] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { isConnected, address, balances, isLoading, getTotalValue, connect, disconnect, refreshBalances } = walletData;

  const totalValue = getTotalValue();
  const change24h = 2.34; // Sample change percentage

  const stats = [
    {
      title: 'Total Portfolio',
      value: hideBalances ? '••••••' : `$${totalValue.toLocaleString()}`,
      change: '+2.34%',
      positive: true,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: 'Assets',
      value: balances.length.toString(),
      change: '+1',
      positive: true,
      icon: <Wallet className="h-5 w-5" />
    },
    {
      title: 'Networks',
      value: '5',
      change: 'Multi-chain',
      positive: true,
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: 'Performance',
      value: '+12.5%',
      change: '7d',
      positive: true,
      icon: <TrendingUp className="h-5 w-5" />
    }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-12"
          >
            <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to StablePay
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to access professional-grade DeFi tools
            </p>
            <Button
              onClick={connect}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-4 text-lg rounded-xl shadow-2xl"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Secure', desc: 'Bank-grade security' },
              { icon: Zap, title: 'Fast', desc: 'Lightning-fast transactions' },
              { icon: Globe, title: 'Multi-chain', desc: 'Cross-chain support' }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EnhancedCard gradient glow>
                  <div className="text-center p-6">
                    <feature.icon className="h-12 w-12 text-cyan-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-300">{feature.desc}</p>
                  </div>
                </EnhancedCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Portfolio Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideBalances(!hideBalances)}
              className="border-gray-300 dark:border-gray-600"
            >
              {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBalances}
              className="border-gray-300 dark:border-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
            >
              Disconnect
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <EnhancedCard gradient glow className="h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <Badge 
                      className={`mt-2 ${stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl">
                    {stat.icon}
                  </div>
                </div>
              </EnhancedCard>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Overview */}
          <div className="lg:col-span-2">
            <EnhancedCard 
              title="Portfolio Overview" 
              subtitle="Your asset allocation across chains"
              icon={<BarChart3 className="h-6 w-6 text-cyan-500" />}
              gradient
              glow
            >
              <div className="space-y-4">
                {balances.map((balance, index) => (
                  <motion.div
                    key={`${balance.chainId}-${balance.address}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-white/60 to-white/40 dark:from-gray-800/60 dark:to-gray-800/40 rounded-xl backdrop-blur-sm border border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {balance.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {balance.symbol}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {balance.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {hideBalances ? '••••••' : balance.formattedBalance}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {hideBalances ? '••••••' : `$${balance.usdValue.toFixed(2)}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </EnhancedCard>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <EnhancedCard 
              title="Quick Actions" 
              subtitle="One-click operations"
              icon={<Zap className="h-6 w-6 text-cyan-500" />}
              gradient
            >
              <div className="space-y-3">
                {[
                  { icon: ArrowUpDown, label: 'Swap Tokens', color: 'from-blue-500 to-cyan-500' },
                  { icon: Send, label: 'Send Payment', color: 'from-green-500 to-emerald-500' },
                  { icon: Download, label: 'Withdraw', color: 'from-purple-500 to-pink-500' },
                  { icon: Plus, label: 'Add Funds', color: 'from-orange-500 to-red-500' }
                ].map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 bg-gradient-to-r ${action.color} text-white rounded-xl font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all`}
                  >
                    <action.icon className="h-5 w-5" />
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </EnhancedCard>

            <EnhancedCard 
              title="Market Insights" 
              subtitle="Live market data"
              icon={<Activity className="h-6 w-6 text-cyan-500" />}
              gradient
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">ETH/USD</span>
                  <span className="font-bold text-green-500">$2,045.67 ↗</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">BTC/USD</span>
                  <span className="font-bold text-green-500">$43,256.89 ↗</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">USDC/USD</span>
                  <span className="font-bold text-gray-500">$1.00 →</span>
                </div>
              </div>
            </EnhancedCard>
          </div>
        </div>
      </div>
    </div>
  );
}