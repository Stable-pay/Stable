import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  ArrowUpDown, 
  DollarSign, 
  TrendingUp, 
  Send, 
  Repeat,
  Shield,
  Zap,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Banknote
} from 'lucide-react';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { Link } from 'wouter';
// Removed viem and comprehensive wallet balances - replaced with Particle Network

interface Transaction {
  id: string;
  type: 'swap' | 'withdraw' | 'deposit';
  status: 'completed' | 'pending' | 'failed';
  amount: string;
  currency: string;
  timestamp: Date;
  hash?: string;
}

export default function StablePayDashboard() {
  const { address, isConnected, balances, connect } = useProductionParticle();
  const isLoading = false;
  
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock transaction data
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'swap',
      status: 'completed',
      amount: '1,250.00',
      currency: 'USDC',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      hash: '0x1234...5678'
    },
    {
      id: '2',
      type: 'withdraw',
      status: 'pending',
      amount: '500.00',
      currency: 'USD',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'swap',
      status: 'completed',
      amount: '750.50',
      currency: 'USDC',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      hash: '0x9876...5432'
    }
  ]);

  // Calculate total USDC balance across all chains
  const totalUSDCBalance = balances
    .filter((balance: any) => balance.symbol === 'USDC')
    .reduce((total: any, balance: any) => total + parseFloat(balance.formattedBalance), 0);

  // Get unique networks from balances
  const networks = Array.from(new Set(balances.map((balance: any) => balance.chainId || 1)));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refresh functionality would reload wallet balances
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-8">
              Connect your wallet to access your StablePay dashboard and manage your crypto assets
            </p>
            <Button 
              onClick={() => open()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600">
                Manage your crypto portfolio and track your StablePay transactions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-gray-300 hover:border-blue-500"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setHideBalances(!hideBalances)}
                className="border-gray-300 hover:border-blue-500"
              >
                {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Connected Wallet</p>
                  <p className="font-mono text-sm font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">Connected</Badge>
            </div>
          </div>
        </motion.div>

        {/* Balance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-blue-100 mb-2">Total USDC Balance</p>
                  <h2 className="text-5xl font-bold">
                    {hideBalances ? '••••••' : `$${totalUSDCBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </h2>
                  <p className="text-blue-100 mt-2">
                    Across {networks.length} networks
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <DollarSign className="h-10 w-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>+5.2% (24h)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <Link href="/swap">
                  <Button 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0 w-full h-12"
                  >
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Swap Tokens
                  </Button>
                </Link>
                <Link href="/remittance">
                  <Button 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0 w-full h-12"
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    INR Remittance
                  </Button>
                </Link>
                <Link href="/kyc">
                  <Button 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-0 w-full h-12"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Complete KYC
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio and Balances */}
          <div className="lg:col-span-2 space-y-8">
            {/* Token Balances */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      Token Balances
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white"
                      >
                        <option value="all">All Networks</option>
                        {networks.map(network => (
                          <option key={network} value={network}>{network}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                            <div>
                              <div className="w-20 h-4 bg-gray-300 rounded mb-1"></div>
                              <div className="w-16 h-3 bg-gray-300 rounded"></div>
                            </div>
                          </div>
                          <div className="w-24 h-4 bg-gray-300 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {balances
                        .filter(balance => selectedNetwork === 'all' || balance.chainId.toString() === selectedNetwork)
                        .filter(balance => parseFloat(balance.formattedBalance) > 0)
                        .map((balance, index) => (
                          <motion.div
                            key={`${balance.chainId}-${balance.address}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {balance.symbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold">{balance.symbol}</p>
                                <p className="text-sm text-gray-600">Chain {balance.chainId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {hideBalances ? '••••••' : balance.formattedBalance}
                              </p>
                              {balance.usdValue && (
                                <p className="text-sm text-gray-600">
                                  {hideBalances ? '••••••' : `$${balance.usdValue.toFixed(2)}`}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-blue-600" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tx.status)}
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              {tx.type === 'swap' && <ArrowUpDown className="h-5 w-5 text-white" />}
                              {tx.type === 'withdraw' && <Send className="h-5 w-5 text-white" />}
                              {tx.type === 'deposit' && <Plus className="h-5 w-5 text-white" />}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{tx.type}</p>
                            <p className="text-sm text-gray-600">
                              {tx.timestamp.toLocaleDateString()} at {tx.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {hideBalances ? '••••••' : `${tx.amount} ${tx.currency}`}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">{tx.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                      View All Transactions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Network Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-500" />
                    Network Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Ethereum', 'Polygon', 'Arbitrum', 'Base'].map((network) => (
                      <div key={network} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{network}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600">Online</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="shadow-xl bg-white/90 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Wallet Connected</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">KYC Status</span>
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2FA Enabled</span>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <Link href="/kyc">
                      <Button size="sm" variant="outline" className="w-full mt-3 border-blue-500 text-blue-600 hover:bg-blue-50">
                        Complete Verification
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}