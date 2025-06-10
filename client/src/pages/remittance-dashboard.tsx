import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useComprehensiveWalletBalances } from '@/hooks/use-comprehensive-wallet-balances';
import { 
  Send, 
  Globe, 
  Clock, 
  DollarSign, 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Wallet,
  TrendingUp,
  Users
} from 'lucide-react';

interface RemittanceOrder {
  id: number;
  senderAddress: string;
  recipientAddress: string;
  recipientCountry: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  gasless: boolean;
  purpose: string;
  estimatedArrival: Date;
  createdAt: Date;
  completedAt?: Date;
}

interface SwapOrder {
  orderHash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  gasless: boolean;
  paymasterUsed: boolean;
  txHash?: string;
  createdAt: Date;
  executedAt?: Date;
}

const supportedCountries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' }
];

const purposeOptions = [
  'Family Support',
  'Business Payment',
  'Personal Transfer',
  'Investment',
  'Education',
  'Medical Expenses',
  'Property Purchase',
  'Other'
];

export default function RemittanceDashboard() {
  const { toast } = useToast();
  const { balances, isLoading: balancesLoading, refetch } = useComprehensiveWalletBalances();
  
  const [activeTab, setActiveTab] = useState('send');
  const [remittanceOrders, setRemittanceOrders] = useState<RemittanceOrder[]>([]);
  const [swapOrders, setSwapOrders] = useState<SwapOrder[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Send form state
  const [fromToken, setFromToken] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [purpose, setPurpose] = useState('');
  const [quote, setQuote] = useState<any>(null);

  // Real-time updates via polling (simulates webhook updates)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [remittanceRes, swapRes] = await Promise.all([
          fetch('/api/remittance-orders/1').then(r => r.json()),
          fetch('/api/swap-orders/1').then(r => r.json())
        ]);
        
        setRemittanceOrders(remittanceRes);
        setSwapOrders(swapRes);
      } catch (error) {
        console.error('Error fetching real-time updates:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Get available tokens for sending
  const availableTokens = balances.filter(balance => 
    parseFloat(balance.formattedBalance) > 0 && 
    ['ETH', 'MATIC', 'AVAX', 'BNB'].includes(balance.symbol)
  );

  // Get quote for remittance
  const getQuote = async () => {
    if (!fromAmount || !fromToken) return;

    try {
      const response = await fetch('/api/fusion/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken,
          amount: fromAmount,
          chainId: 1,
          userAddress: balances[0]?.address || ''
        })
      });

      const quoteData = await response.json();
      setQuote(quoteData);
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: "Quote Error",
        description: "Failed to get exchange rate",
        variant: "destructive"
      });
    }
  };

  // Execute gasless remittance
  const executeRemittance = async () => {
    if (!quote || !recipientAddress || !recipientCountry || !purpose) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Execute the gasless swap first
      const swapResponse = await fetch('/api/fusion/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderHash: quote.orderHash,
          fromToken: quote.fromToken,
          toToken: quote.toToken,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          userAddress: balances[0]?.address || ''
        })
      });

      const swapResult = await swapResponse.json();

      // Create remittance order
      const remittanceResponse = await fetch('/api/remittance-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAddress: balances[0]?.address || '',
          recipientAddress,
          recipientCountry,
          fromToken: quote.fromToken,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          exchangeRate: quote.rate,
          chainId: 1,
          purpose,
          swapOrderHash: quote.orderHash
        })
      });

      const remittanceResult = await remittanceResponse.json();

      toast({
        title: "Remittance Initiated",
        description: `Gasless swap to USDC started. Estimated arrival: ${new Date(swapResult.estimatedArrival).toLocaleTimeString()}`,
      });

      // Reset form
      setFromAmount('');
      setRecipientAddress('');
      setRecipientCountry('');
      setPurpose('');
      setQuote(null);
      
      // Refresh balances
      refetch();
      
      setActiveTab('history');
    } catch (error) {
      console.error('Error executing remittance:', error);
      toast({
        title: "Transaction Failed",
        description: "Failed to execute remittance transfer",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'filled':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'filled':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Global Remittance Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Send money worldwide with gasless USDC conversion via 1inch Fusion
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900">$12,450</p>
                </div>
                <Send className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Countries</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <Globe className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                  <p className="text-2xl font-bold text-gray-900">3.2 min</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gas Saved</p>
                  <p className="text-2xl font-bold text-gray-900">$284</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-blue-600" />
                Remittance Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="send">Send Money</TabsTrigger>
                  <TabsTrigger value="history">Transaction History</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Send Form */}
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Send Crypto → Receive USDC
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              From Token
                            </label>
                            <Select value={fromToken} onValueChange={setFromToken}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTokens.map(token => (
                                  <SelectItem key={token.symbol} value={token.symbol}>
                                    {token.symbol} - {token.formattedBalance} available
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Amount to Send
                            </label>
                            <Input
                              type="number"
                              placeholder="0.0"
                              value={fromAmount}
                              onChange={(e) => setFromAmount(e.target.value)}
                              onBlur={getQuote}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Recipient Address
                            </label>
                            <Input
                              placeholder="0x..."
                              value={recipientAddress}
                              onChange={(e) => setRecipientAddress(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Destination Country
                            </label>
                            <Select value={recipientCountry} onValueChange={setRecipientCountry}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {supportedCountries.map(country => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.flag} {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Purpose of Transfer
                            </label>
                            <Select value={purpose} onValueChange={setPurpose}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select purpose" />
                              </SelectTrigger>
                              <SelectContent>
                                {purposeOptions.map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={executeRemittance}
                        disabled={!quote || isProcessing || !recipientAddress || !recipientCountry || !purpose}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Processing Gasless Transfer...
                          </div>
                        ) : quote ? (
                          <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Send {quote.fromAmount} {quote.fromToken} → {quote.toAmount} USDC
                          </div>
                        ) : (
                          'Enter Amount for Quote'
                        )}
                      </Button>
                    </div>

                    {/* Quote Display */}
                    <div className="space-y-6">
                      {quote && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Exchange Quote
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">You send</span>
                              <span className="font-semibold">
                                {quote.fromAmount} {quote.fromToken}
                              </span>
                            </div>
                            
                            <div className="flex justify-center">
                              <ArrowRight className="h-6 w-6 text-blue-600" />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Recipient gets</span>
                              <span className="font-semibold text-green-600">
                                {quote.toAmount} USDC
                              </span>
                            </div>
                            
                            <div className="border-t pt-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Exchange rate</span>
                                <span>1 {quote.fromToken} = {quote.rate} USDC</span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Network fees</span>
                                <span className="text-green-600 font-medium">
                                  <Zap className="h-4 w-4 inline mr-1" />
                                  Gasless (Paymaster)
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Estimated arrival</span>
                                <span>~3-5 minutes</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="bg-yellow-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Gasless Technology
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          All transactions are gasless using 1inch Fusion and paymaster technology. 
                          No need to hold ETH for gas fees.
                        </p>
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Zero gas fees</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold">Recent Transactions</h3>
                    
                    {remittanceOrders.length > 0 ? (
                      <div className="space-y-4">
                        {remittanceOrders.map((order) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-lg border p-6"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Send className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {order.fromAmount} {order.fromToken} → {order.toAmount} USDC
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    To {supportedCountries.find(c => c.code === order.recipientCountry)?.name}
                                  </p>
                                </div>
                              </div>
                              
                              <Badge className={getStatusColor(order.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(order.status)}
                                  {order.status}
                                </div>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Purpose:</span>
                                <p className="font-medium">{order.purpose}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Created:</span>
                                <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Gasless:</span>
                                <p className="font-medium text-green-600">
                                  {order.gasless ? 'Yes' : 'No'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Rate:</span>
                                <p className="font-medium">{order.exchangeRate}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No remittance transactions yet</p>
                        <p className="text-sm text-gray-500">Start sending money to see your history</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Transfer Volume
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600 mb-2">$12,450</div>
                        <p className="text-gray-600">Total volume this month</p>
                        <div className="mt-4 text-sm text-green-600">
                          +24% from last month
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Recipients
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600 mb-2">23</div>
                        <p className="text-gray-600">Unique recipients</p>
                        <div className="mt-4 text-sm text-green-600">
                          Across 8 countries
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}