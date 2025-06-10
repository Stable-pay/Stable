import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, Loader2, CheckCircle, AlertTriangle, RefreshCw, Wallet, Fuel, Star, TrendingUp, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ModernWalletModal } from '@/components/web3/modern-wallet-modal';
import { Web3SpinLoader, Web3PulseLoader } from '@/components/animations/web3-loader';

interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  formattedBalance: string;
  isNative: boolean;
}

interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  rate: number;
  minimumReceived: string;
  gasless: boolean;
  networkFee: string;
  data?: any;
}

export function AnimatedSwapInterface() {
  const { toast } = useToast();
  
  // Mock wallet state for demo
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [swapState, setSwapState] = useState<'idle' | 'getting-quote' | 'ready' | 'swapping' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);

  const mockTokens: TokenBalance[] = [
    {
      symbol: 'ETH',
      address: 'native',
      balance: '2500000000000000000',
      decimals: 18,
      chainId: 1,
      chainName: 'Ethereum',
      formattedBalance: '2.500000',
      isNative: true
    },
    {
      symbol: 'USDC',
      address: '0xA0b86a33E574960C2B5389d83527982f387C56d5',
      balance: '1000000000',
      decimals: 6,
      chainId: 1,
      chainName: 'Ethereum',
      formattedBalance: '1000.000000',
      isNative: false
    }
  ];

  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      8453: 'Base',
      10: 'Optimism'
    };
    return networks[chainId] || 'Unknown';
  };

  const handleWalletConnect = async (walletId: string) => {
    setIsConnecting(true);
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsConnected(true);
    setAddress('0x742d35Cc6735C0532925a3b8D4B0d7b0c7C5b8b9');
    setBalances(mockTokens);
    setIsConnecting(false);
    setShowWalletModal(false);
    
    toast({
      title: "Wallet Connected!",
      description: "You can now start swapping tokens",
    });
  };

  const getFusionQuote = async () => {
    if (!selectedToken || !swapAmount || !address) return;

    setSwapState('getting-quote');
    setProgress(0);
    
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockQuote: SwapQuote = {
        fromAmount: swapAmount,
        toAmount: (parseFloat(swapAmount) * 2000).toFixed(6),
        rate: 2000,
        minimumReceived: (parseFloat(swapAmount) * 2000 * 0.99).toFixed(6),
        gasless: Math.random() > 0.5,
        networkFee: Math.random() > 0.5 ? '0.00' : '~$3-5'
      };

      setQuote(mockQuote);
      setProgress(100);
      setSwapState('ready');

      toast({
        title: mockQuote.gasless ? "Gasless Quote Ready!" : "Quote Ready",
        description: `${swapAmount} ${selectedToken.symbol} → ${mockQuote.toAmount} USDT ${mockQuote.gasless ? '(No Gas Fees!)' : ''}`,
      });

    } catch (error) {
      setSwapState('failed');
      toast({
        title: "Quote Failed",
        description: "Unable to get swap quote",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const executeSwap = async () => {
    if (!quote) return;

    setSwapState('swapping');

    try {
      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSwapState('completed');
      
      toast({
        title: "Swap Completed!",
        description: `Successfully swapped ${swapAmount} ${selectedToken?.symbol} to USDT ${quote.gasless ? 'with no gas fees!' : ''}`,
      });

      // Reset after success
      setTimeout(() => {
        setSwapAmount('');
        setQuote(null);
        setSelectedToken(null);
        setSwapState('idle');
      }, 3000);
      
    } catch (error) {
      setSwapState('failed');
      toast({
        title: "Swap Failed",
        description: "Transaction failed",
        variant: "destructive"
      });
    }
  };

  // Auto-quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedToken && swapAmount && parseFloat(swapAmount) > 0 && swapState === 'idle') {
        getFusionQuote();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedToken, swapAmount]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  if (!isConnected) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="w-full max-w-lg shadow-2xl bg-white/90 backdrop-blur-xl border-0">
              <CardHeader className="text-center pb-8 pt-12">
                <motion.div
                  className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  style={{ backgroundColor: '#6667AB' }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Wallet className="h-10 w-10 text-white" />
                </motion.div>
                
                <CardTitle className="text-3xl font-bold mb-3" style={{ color: '#6667AB' }}>
                  Connect Your Wallet
                </CardTitle>
                <p className="text-gray-600 text-lg">
                  Access the future of multi-chain DeFi trading
                </p>
                
                {/* Animated Features */}
                <motion.div 
                  className="mt-6 grid grid-cols-2 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Fuel className="h-4 w-4" style={{ color: '#6667AB' }} />
                    <span>Gasless Swaps</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Star className="h-4 w-4" style={{ color: '#6667AB' }} />
                    <span>Best Rates</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    <TrendingUp className="h-4 w-4" style={{ color: '#6667AB' }} />
                    <span>Multi-Chain</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Zap className="h-4 w-4" style={{ color: '#6667AB' }} />
                    <span>Lightning Fast</span>
                  </motion.div>
                </motion.div>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                <motion.div
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={() => setShowWalletModal(true)}
                    className="w-full h-14 text-lg font-semibold bg-[#6667AB] hover:bg-[#5a5b96] text-white shadow-lg"
                    size="lg"
                  >
                    <Wallet className="h-5 w-5 mr-3" />
                    Connect Wallet
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <ModernWalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onConnect={handleWalletConnect}
          isConnecting={isConnecting}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Animated Header */}
        <motion.div 
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#6667AB' }}>
                Token Swap
              </h1>
              <p className="text-gray-600 text-lg">
                Trade tokens with gasless transactions across multiple chains
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </motion.div>
          </div>

          {/* Wallet Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#6667AB' }}
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Wallet className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-gray-500 text-sm">Connected Wallet</p>
                      <p className="font-mono text-lg" style={{ color: '#6667AB' }}>
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm">Network</p>
                    <p className="text-lg font-semibold" style={{ color: '#6667AB' }}>
                      {getNetworkName(chainId)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Swap Interface */}
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div 
            className="lg:col-span-2"
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl" style={{ color: '#6667AB' }}>
                  <motion.div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#6667AB' }}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowUpDown className="h-5 w-5 text-white" />
                  </motion.div>
                  <span>Swap to Stablecoin</span>
                  <AnimatePresence>
                    {quote?.gasless && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Fuel className="h-3 w-3 mr-1" />
                          Gasless
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Convert tokens with the best rates using 1inch Protocol
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Token Selection */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="text-lg font-semibold" style={{ color: '#6667AB' }}>From Token</label>
                  <Select 
                    value={selectedToken?.address || ''} 
                    onValueChange={(value) => {
                      const token = balances.find(t => t.address === value);
                      setSelectedToken(token || null);
                      setQuote(null);
                      setSwapState('idle');
                    }}
                  >
                    <SelectTrigger className="h-14 border-gray-200 hover:border-[#6667AB] focus:border-[#6667AB] transition-colors">
                      <SelectValue placeholder="Select token to swap" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <motion.div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: '#6667AB' }}
                                whileHover={{ scale: 1.1 }}
                              >
                                {token.symbol.charAt(0)}
                              </motion.div>
                              <div>
                                <p className="font-semibold">{token.symbol}</p>
                                <p className="text-xs text-gray-500">{token.chainName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{token.formattedBalance}</p>
                              <p className="text-xs text-gray-500">Available</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Amount Input */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-lg font-semibold" style={{ color: '#6667AB' }}>Amount</label>
                    {selectedToken && (
                      <motion.button
                        onClick={() => setSwapAmount(selectedToken.formattedBalance)}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: '#6667AB' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        MAX: {selectedToken.formattedBalance} {selectedToken.symbol}
                      </motion.button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={swapAmount}
                      onChange={(e) => {
                        setSwapAmount(e.target.value);
                        setQuote(null);
                        setSwapState('idle');
                      }}
                      className="h-14 text-lg border-gray-200 focus:border-[#6667AB] pr-20 transition-colors"
                    />
                    {selectedToken && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        {selectedToken.symbol}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Progress Bar */}
                <AnimatePresence>
                  {swapState === 'getting-quote' && (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="flex items-center gap-3" style={{ color: '#6667AB' }}>
                        <Web3SpinLoader size={20} color="#6667AB" />
                        <span className="text-sm font-medium">Getting best quote from 1inch...</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quote Display */}
                <AnimatePresence>
                  {quote && swapState === 'ready' && (
                    <motion.div
                      className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl space-y-4"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium" style={{ color: '#6667AB' }}>You'll receive</span>
                        <div className="flex gap-2">
                          <Badge className="bg-white border-[#6667AB] text-[#6667AB]">
                            1inch Protocol
                          </Badge>
                          {quote.gasless && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <Fuel className="h-3 w-3 mr-1" />
                                No Gas Fees
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      <motion.div 
                        className="flex items-center gap-3"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div 
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: '#6667AB' }}
                        >
                          <span className="text-white font-bold">$</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold" style={{ color: '#6667AB' }}>
                            {quote.toAmount} USDT
                          </p>
                          <p className="text-gray-600">
                            Rate: 1 {selectedToken?.symbol} = {quote.rate.toFixed(4)} USDT
                          </p>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="grid grid-cols-2 gap-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Minimum Received</p>
                          <p className="font-semibold" style={{ color: '#6667AB' }}>
                            {quote.minimumReceived} USDT
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Network Fee</p>
                          <p className="font-semibold" style={{ color: '#6667AB' }}>
                            {quote.networkFee}
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Swap Button */}
                <motion.div
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button 
                    onClick={executeSwap}
                    disabled={swapState !== 'ready' || !quote}
                    className="w-full h-14 text-lg font-semibold bg-[#6667AB] hover:bg-[#5a5b96] text-white shadow-lg transition-all"
                    size="lg"
                  >
                    {swapState === 'idle' && (
                      <>
                        <ArrowUpDown className="h-5 w-5 mr-2" />
                        Enter Amount
                      </>
                    )}
                    {swapState === 'getting-quote' && (
                      <>
                        <Web3SpinLoader size={20} color="white" />
                        <span className="ml-2">Getting Quote...</span>
                      </>
                    )}
                    {swapState === 'ready' && (
                      <>
                        <ArrowUpDown className="h-5 w-5 mr-2" />
                        {quote?.gasless ? 'Swap (Gasless)' : 'Swap to USDT'}
                      </>
                    )}
                    {swapState === 'swapping' && (
                      <>
                        <Web3PulseLoader size={20} color="white" />
                        <span className="ml-2">Confirm in Wallet</span>
                      </>
                    )}
                    {swapState === 'completed' && (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Completed!
                      </>
                    )}
                    {swapState === 'failed' && (
                      <>
                        <ArrowUpDown className="h-5 w-5 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Status Messages */}
                <AnimatePresence>
                  {swapState === 'completed' && (
                    <motion.div
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center gap-3 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Swap completed successfully!</span>
                      </div>
                    </motion.div>
                  )}

                  {swapState === 'failed' && (
                    <motion.div
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center gap-3 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Swap failed - Please try again</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Animated Sidebar */}
          <motion.div 
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay: 0.6 }}
          >
            {/* Network Status */}
            <Card className="shadow-xl bg-white/90 backdrop-blur-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg" style={{ color: '#6667AB' }}>Network Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-3 h-3 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div>
                      <p className="font-semibold" style={{ color: '#6667AB' }}>
                        {getNetworkName(chainId)}
                      </p>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                  <motion.div 
                    className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      Gasless swaps available
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Summary */}
            <Card className="shadow-xl bg-white/90 backdrop-blur-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg" style={{ color: '#6667AB' }}>Your Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.map((token, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: '#6667AB' }}
                        >
                          {token.symbol.charAt(0)}
                        </div>
                        <span className="font-medium text-sm">{token.symbol}</span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#6667AB' }}>
                        {token.formattedBalance}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}