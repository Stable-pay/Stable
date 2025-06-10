import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Zap,
  Shield,
  Globe,
  Send
} from "lucide-react";
import { useProductionWallet } from "@/hooks/use-production-wallet";

interface Transaction {
  id: string;
  type: 'swap' | 'send' | 'receive' | 'withdrawal';
  amount: string;
  token: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  hash?: string;
}

interface PortfolioData {
  totalValue: number;
  change24h: number;
  assets: Array<{
    symbol: string;
    value: number;
    percentage: number;
    change24h: number;
  }>;
}

export default function DashboardDark() {
  const { balances, isConnected, address, kycStatus, isKycVerified } = useProductionWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate total portfolio value
  const totalValue = balances.reduce((sum, balance) => {
    return sum + (balance.usdValue || 0);
  }, 0);

  useEffect(() => {
    if (isConnected) {
      fetchTransactions();
      calculatePortfolio();
    }
  }, [isConnected, balances]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions/1');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const calculatePortfolio = () => {
    const assets = balances
      .filter(balance => balance.usdValue && balance.usdValue > 0)
      .map(balance => ({
        symbol: balance.symbol,
        value: balance.usdValue || 0,
        percentage: ((balance.usdValue || 0) / totalValue) * 100,
        change24h: Math.random() * 10 - 5 // Mock 24h change
      }));

    setPortfolio({
      totalValue,
      change24h: Math.random() * 10 - 5, // Mock 24h change
      assets
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="h-4 w-4" />;
      case 'receive': return <ArrowDownLeft className="h-4 w-4" />;
      case 'swap': return <Zap className="h-4 w-4" />;
      case 'withdrawal': return <Send className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Portfolio Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor your crypto assets, transactions, and portfolio performance
          </p>
          {address && (
            <div className="mt-4">
              <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">
                <Wallet className="h-3 w-3 mr-1" />
                {address.slice(0, 6)}...{address.slice(-4)}
              </Badge>
            </div>
          )}
        </motion.div>

        {/* KYC Status Banner */}
        {!isKycVerified && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card border-border border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-orange-500" />
                    <div>
                      <p className="font-semibold text-foreground">Complete KYC Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Verify your identity to unlock full platform features
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/kyc'}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Verify Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Portfolio Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              {portfolio && (
                <div className="mt-2">
                  <span className={`text-sm ${portfolio.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolio.change24h >= 0 ? '+' : ''}{portfolio.change24h.toFixed(2)}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">24h</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-foreground">{balances.length}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">KYC Status</p>
                  <p className="text-lg font-bold text-foreground capitalize">{kycStatus}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className={`h-6 w-6 ${isKycVerified ? 'text-green-500' : 'text-orange-500'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Overview
              </TabsTrigger>
              <TabsTrigger value="assets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Assets
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolio Chart */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <BarChart3 className="h-5 w-5" />
                      Portfolio Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portfolio && portfolio.assets.length > 0 ? (
                      <div className="space-y-4">
                        {portfolio.assets.map((asset, index) => (
                          <div key={asset.symbol} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-primary-foreground">
                                  {asset.symbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{asset.symbol}</p>
                                <p className="text-sm text-muted-foreground">
                                  {asset.percentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">
                                ${asset.value.toFixed(2)}
                              </p>
                              <p className={`text-sm ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No assets to display</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => window.location.href = '/swap'}
                      className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Swap Tokens
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/remittance'}
                      variant="outline"
                      className="w-full h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Money
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/withdraw'}
                      variant="outline"
                      className="w-full h-12 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Withdraw to Bank
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Your Assets</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    All tokens in your connected wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {balances.map((balance, index) => (
                      <div key={balance.symbol} className="flex items-center justify-between p-4 rounded-lg bg-input border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="font-bold text-primary-foreground">
                              {balance.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{balance.symbol}</p>
                            <p className="text-sm text-muted-foreground">{balance.chainName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {balance.formattedBalance}
                          </p>
                          {balance.usdValue && (
                            <p className="text-sm text-muted-foreground">
                              ${balance.usdValue.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {balances.length === 0 && (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No assets found</p>
                        <p className="text-sm text-muted-foreground">Connect your wallet to view assets</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Transactions</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Your latest transaction history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.map((tx, index) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-input border border-border">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-secondary ${getStatusColor(tx.status)}`}>
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground capitalize">{tx.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {tx.amount} {tx.token}
                          </p>
                          <div className={`flex items-center gap-1 text-sm ${getStatusColor(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            <span className="capitalize">{tx.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No transactions yet</p>
                        <p className="text-sm text-muted-foreground">Your transaction history will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}