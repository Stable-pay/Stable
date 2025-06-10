import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProductionWallet, useTransferPermissions } from '@/hooks/use-production-wallet';
import { KYCVerificationModal } from '@/components/kyc-verification-modal';
import { LottieWrapper, animationConfigs } from '@/components/animations/lottie-wrapper';
import { 
  cryptoTransferAnimation,
  walletConnectAnimation,
  successCheckAnimation,
  loadingSpinnerAnimation,
  errorAnimation
} from '@/components/animations/lottie-animations';
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
  Users,
  Download,
  Smartphone
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
  const { 
    address, 
    isConnected, 
    balances, 
    kycStatus, 
    isKycVerified, 
    canTransfer, 
    canWithdraw 
  } = useProductionWallet();
  const { canSend, canSwap, needsKyc, kycPending } = useTransferPermissions();
  
  const [activeTab, setActiveTab] = useState('send');
  const [remittanceOrders, setRemittanceOrders] = useState<RemittanceOrder[]>([]);
  const [swapOrders, setSwapOrders] = useState<SwapOrder[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [userKycStatus, setUserKycStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>(kycStatus);
  
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

  // Get available tokens for sending (only if KYC verified)
  const availableTokens = balances.filter((balance: any) => 
    parseFloat(balance.formattedBalance) > 0 && canSend
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

  // Execute gasless remittance (KYC gated)
  const executeRemittance = async () => {
    if (!canSend) {
      setShowKYCModal(true);
      return;
    }

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
      
      // Refresh balances would be called here
      
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
            Global Remittance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Send money across borders with crypto - fast, secure, and gasless transactions
          </p>
        </motion.div>

        {/* PWA Install Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-card border-border rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8">
              <LottieWrapper
                animationData={walletConnectAnimation}
                {...animationConfigs.wallet}
                className="h-8 w-8"
              />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base">Install StablePay App</p>
              <p className="text-xs sm:text-sm opacity-90">Get the full PWA experience</p>
            </div>
          </div>
          <Button
            id="pwa-install-btn"
            size="sm"
            variant="secondary"
            className="hidden bg-white text-primary hover:bg-white/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16">
              <LottieWrapper
                animationData={cryptoTransferAnimation}
                {...animationConfigs.transfer}
                className="h-12 w-12 sm:h-16 sm:w-16"
              />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
              Global Remittance Dashboard
            </h1>
          </div>
          <p className="text-base sm:text-xl text-muted-foreground px-4">
            Send money worldwide with gasless USDC conversion via 1inch Fusion
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8"
        >
          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Sent</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">$12,450</p>
                </div>
                <div className="h-6 w-6 sm:h-8 sm:w-8 text-primary">
                  <Send className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Countries</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">8</p>
                </div>
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg. Time</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">3.2 min</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Gas Saved</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">$284</p>
                </div>
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Interface */}
        {/* KYC Status Banner */}
        {isConnected && !isKycVerified && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border border-border bg-accent/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {kycPending ? 'KYC Under Review' : 'Complete KYC Verification'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {kycPending 
                          ? 'Your documents are being reviewed. You\'ll be notified within 24-48 hours.'
                          : 'Complete KYC verification to send money and withdraw to INR.'
                        }
                      </p>
                    </div>
                  </div>
                  {!kycPending && (
                    <Button 
                      onClick={() => setShowKYCModal(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Start KYC
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
                <DollarSign className="h-6 w-6 text-primary" />
                Remittance Center
                {isKycVerified && (
                  <Badge className="bg-primary/10 text-primary border border-primary/20 ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    KYC Verified
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="send">Send Money</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw INR</TabsTrigger>
                  <TabsTrigger value="history">Transaction History</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Send Form */}
                    <div className="space-y-6">
                      <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                          Send Crypto → Receive USDC
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                              From Token
                            </label>
                            <Select value={fromToken} onValueChange={setFromToken}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTokens.map((token: any) => (
                                  <SelectItem key={token.symbol} value={token.symbol}>
                                    {token.symbol} - {token.formattedBalance} available
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Amount to Send
                            </label>
                            <Input
                              type="number"
                              placeholder="0.0"
                              value={fromAmount}
                              onChange={(e) => setFromAmount(e.target.value)}
                              onBlur={getQuote}
                              className="bg-input border-border text-foreground"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Recipient Address
                            </label>
                            <Input
                              placeholder="0x..."
                              value={recipientAddress}
                              onChange={(e) => setRecipientAddress(e.target.value)}
                              className="bg-input border-border text-foreground"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Destination Country
                            </label>
                            <Select value={recipientCountry} onValueChange={setRecipientCountry}>
                              <SelectTrigger className="bg-input border-border text-foreground">
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
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Purpose of Transfer
                            </label>
                            <Select value={purpose} onValueChange={setPurpose}>
                              <SelectTrigger className="bg-input border-border text-foreground">
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

                <TabsContent value="withdraw" className="space-y-6 mt-6">
                  {!canWithdraw ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">KYC Verification Required</h3>
                      <p className="text-gray-600 mb-4">
                        Complete KYC verification to withdraw USDC to your bank account in INR
                      </p>
                      <Button 
                        onClick={() => setShowKYCModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Complete KYC Verification
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Withdrawal Form */}
                      <div className="space-y-6">
                        <div className="bg-green-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Withdraw USDC → INR
                          </h3>
                          
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                USDC Balance Available
                              </Label>
                              <div className="bg-white rounded-lg p-3 border">
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-semibold">
                                    {balances.find((b: any) => b.symbol === 'USDC')?.formattedBalance || '0.00'} USDC
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ≈ ₹{((parseFloat(balances.find((b: any) => b.symbol === 'USDC')?.formattedBalance || '0') * 83.5).toFixed(2))}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Amount to Withdraw (USDC)
                              </Label>
                              <Input
                                type="number"
                                placeholder="0.0"
                                className="text-lg"
                              />
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Bank Account (from KYC)
                              </Label>
                              <div className="bg-gray-50 rounded-lg p-3 border">
                                <p className="font-medium">State Bank of India</p>
                                <p className="text-sm text-gray-600">Account: ****1234</p>
                                <p className="text-sm text-gray-600">IFSC: SBIN0001234</p>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Exchange Rate:</span>
                                  <span>1 USDC = ₹83.50</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Processing Fee:</span>
                                  <span>₹25.00</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Processing Time:</span>
                                  <span>2-4 hours</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between font-semibold">
                                  <span>You'll receive:</span>
                                  <span>₹0.00</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          disabled={!canWithdraw}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 text-lg"
                        >
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Withdraw to Bank Account
                          </div>
                        </Button>
                      </div>

                      {/* Withdrawal Info */}
                      <div className="space-y-6">
                        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                          <CardHeader>
                            <CardTitle className="text-lg text-green-800">
                              Instant INR Withdrawals
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Direct bank transfer via IMPS/NEFT</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Live exchange rates (₹83.50/USDC)</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">KYC-verified secure transactions</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">24/7 processing availability</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Recent Withdrawals</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-8">
                              <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">No withdrawals yet</p>
                              <p className="text-sm text-gray-500">Your withdrawal history will appear here</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
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

        {/* KYC Verification Modal */}
        <KYCVerificationModal
          isOpen={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          walletAddress={address || ''}
          onKYCComplete={(status) => {
            setUserKycStatus(status);
            setShowKYCModal(false);
            toast({
              title: "KYC Submitted",
              description: "Your verification documents have been submitted for review.",
            });
          }}
        />
      </div>
    </div>
  );
}