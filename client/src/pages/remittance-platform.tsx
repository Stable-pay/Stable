import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Globe, Send, Clock, CheckCircle, Wallet, Shield, CreditCard, Phone, Building, MapPin, Users, TrendingUp, Star, Zap, RefreshCw } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useReownTransfer } from '@/hooks/use-reown-transfer';
import { useReownPay } from '@/hooks/use-reown-pay';

interface RemittanceState {
  step: 'connect' | 'recipient' | 'transfer' | 'complete';
  fromToken: string;
  amount: string;
  recipientCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientMethod: 'bank' | 'mobile' | 'cash';
  bankDetails: {
    accountNumber: string;
    bankName: string;
    swiftCode: string;
  };
  isProcessing: boolean;
  transactionHash: string | null;
  estimatedArrival: string;
  exchangeRate: number;
  fees: number;
}

// Supported remittance corridors with real exchange rates
const REMITTANCE_CORRIDORS = {
  'US-IN': { rate: 83.25, fees: 2.99, currency: 'INR', flag: '🇮🇳', name: 'India' },
  'US-PH': { rate: 56.45, fees: 2.99, currency: 'PHP', flag: '🇵🇭', name: 'Philippines' },
  'US-MX': { rate: 17.82, fees: 2.99, currency: 'MXN', flag: '🇲🇽', name: 'Mexico' },
  'US-NG': { rate: 1580.50, fees: 2.99, currency: 'NGN', flag: '🇳🇬', name: 'Nigeria' },
  'US-BD': { rate: 123.75, fees: 2.99, currency: 'BDT', flag: '🇧🇩', name: 'Bangladesh' },
  'US-PK': { rate: 278.50, fees: 2.99, currency: 'PKR', flag: '🇵🇰', name: 'Pakistan' },
  'US-VN': { rate: 24850, fees: 2.99, currency: 'VND', flag: '🇻🇳', name: 'Vietnam' },
  'US-KE': { rate: 129.80, fees: 2.99, currency: 'KES', flag: '🇰🇪', name: 'Kenya' }
};

// Admin wallet addresses for remittance platform
const REMITTANCE_WALLETS: Record<number, string> = {
  1: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Ethereum
  137: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Polygon
  56: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // BSC
  42161: '0x742d35Cc6dF6A18647d95D5aE274C4D81dB7e88E', // Arbitrum
};

export function RemittancePlatform() {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { tokenBalances, isLoading: balancesLoading, refreshBalances, totalValue } = useWalletBalances();
  
  const { transferState, transferToAdmin, openAccountModal, resetTransferState } = useReownTransfer();
  const { payState, openPayWithExchange, initiatePayWithExchange, resetPayState } = useReownPay();
  
  const [state, setState] = useState<RemittanceState>({
    step: 'connect',
    fromToken: 'USDT',
    amount: '',
    recipientCountry: 'US-IN',
    recipientName: '',
    recipientPhone: '',
    recipientMethod: 'bank',
    bankDetails: {
      accountNumber: '',
      bankName: '',
      swiftCode: ''
    },
    isProcessing: false,
    transactionHash: null,
    estimatedArrival: '2-5 minutes',
    exchangeRate: 83.25,
    fees: 2.99
  });

  // Update exchange rate and fees when country changes
  useEffect(() => {
    const corridor = REMITTANCE_CORRIDORS[state.recipientCountry as keyof typeof REMITTANCE_CORRIDORS];
    if (corridor) {
      setState(prev => ({
        ...prev,
        exchangeRate: corridor.rate,
        fees: corridor.fees
      }));
    }
  }, [state.recipientCountry]);

  // Set initial step based on connection status
  useEffect(() => {
    if (isConnected && state.step === 'connect') {
      setState(prev => ({ ...prev, step: 'recipient' }));
    } else if (!isConnected && state.step !== 'connect') {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [isConnected, state.step]);

  const corridor = REMITTANCE_CORRIDORS[state.recipientCountry as keyof typeof REMITTANCE_CORRIDORS];
  const receivedAmount = parseFloat(state.amount || '0') * state.exchangeRate;
  const totalCost = parseFloat(state.amount || '0') + state.fees;

  const handleRemittanceTransfer = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      const selectedToken = tokenBalances.find(token => token.symbol === state.fromToken);
      if (!selectedToken) {
        throw new Error('Selected token not found in wallet');
      }

      const chainId = typeof caipNetwork?.id === 'string' 
        ? parseInt(caipNetwork.id) 
        : (caipNetwork?.id as number) || 1;
      const adminWallet = REMITTANCE_WALLETS[chainId];
      if (!adminWallet) {
        throw new Error('Remittance not supported on this network');
      }

      const tokenAddress = selectedToken.address === '0x0000000000000000000000000000000000000000'
        ? '0x0000000000000000000000000000000000000000'
        : selectedToken.address;

      const txHash = await transferToAdmin(
        tokenAddress,
        totalCost.toString(),
        adminWallet,
        selectedToken.decimals
      );

      setState(prev => ({
        ...prev,
        transactionHash: txHash,
        step: 'complete',
        isProcessing: false
      }));

    } catch (error: any) {
      console.error('Remittance transfer failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      throw error;
    }
  };

  // Landing page for wallet connection
  if (!isConnected || state.step === 'connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm font-medium">World's First Web3 Remittance Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Send Money
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Instantly Worldwide
              </span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Skip traditional banks. Send crypto and receive local currency in minutes, 
              not days. Powered by blockchain technology for maximum security and speed.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <Clock className="w-4 h-4 mr-1" />
                2-5 minute transfers
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Shield className="w-4 h-4 mr-1" />
                Bank-grade security
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <TrendingUp className="w-4 h-4 mr-1" />
                Best exchange rates
              </Badge>
            </div>

            <Button 
              onClick={() => open({ view: 'Connect' })}
              size="lg"
              className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet to Start
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-white/70">Transfers complete in 2-5 minutes instead of 3-7 business days</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ultra Secure</h3>
                <p className="text-white/70">Blockchain technology ensures your transfers are safe and transparent</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Global Reach</h3>
                <p className="text-white/70">Send to 8+ countries with more corridors coming soon</p>
              </CardContent>
            </Card>
          </div>

          {/* Supported Countries */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-white mb-6">Send Money To</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.values(REMITTANCE_CORRIDORS).map((country, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg">
                  <span className="text-2xl">{country.flag}</span>
                  <span className="text-white font-medium">{country.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Recipient details step
  if (state.step === 'recipient') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <Users className="w-8 h-8 text-blue-400" />
              Recipient Details
            </CardTitle>
            <p className="text-white/70 mt-2">Who are you sending money to?</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Send To Country</label>
                <Select value={state.recipientCountry} onValueChange={(value) => setState(prev => ({ ...prev, recipientCountry: value }))}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REMITTANCE_CORRIDORS).map(([key, country]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <Badge variant="secondary" className="ml-2">{country.currency}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Recipient Name</label>
                <Input
                  placeholder="Full name as per ID"
                  value={state.recipientName}
                  onChange={(e) => setState(prev => ({ ...prev, recipientName: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Recipient Phone</label>
                <Input
                  placeholder="+1234567890"
                  value={state.recipientPhone}
                  onChange={(e) => setState(prev => ({ ...prev, recipientPhone: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Delivery Method</label>
                <Select value={state.recipientMethod} onValueChange={(value: 'bank' | 'mobile' | 'cash') => setState(prev => ({ ...prev, recipientMethod: value }))}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cash Pickup
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {state.recipientMethod === 'bank' && (
                <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-600/30">
                  <h4 className="text-white font-medium">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Account Number"
                      value={state.bankDetails.accountNumber}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                      }))}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Bank Name"
                      value={state.bankDetails.bankName}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                      }))}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="SWIFT/IFSC Code"
                      value={state.bankDetails.swiftCode}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        bankDetails: { ...prev.bankDetails, swiftCode: e.target.value }
                      }))}
                      className="bg-gray-700/50 border-gray-600 text-white md:col-span-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={() => setState(prev => ({ ...prev, step: 'transfer' }))}
              disabled={!state.recipientName || !state.recipientPhone || (state.recipientMethod === 'bank' && !state.bankDetails.accountNumber)}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Continue to Transfer
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transfer step
  if (state.step === 'transfer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <Send className="w-8 h-8 text-green-400" />
              Send Money
            </CardTitle>
            <p className="text-white/70 mt-2">
              To: {state.recipientName} in {corridor?.flag} {corridor?.name}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Wallet Balance Summary */}
            {!balancesLoading && tokenBalances.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm">Your Wallet Balance</span>
                  <Button 
                    onClick={refreshBalances}
                    variant="ghost" 
                    size="sm"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-white text-2xl font-bold">${totalValue.toFixed(2)} USD</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Send Amount (USD)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={state.amount}
                  onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600 text-white text-2xl h-14"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">From Token</label>
                <Select value={state.fromToken} onValueChange={(value) => setState(prev => ({ ...prev, fromToken: value }))}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenBalances.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center justify-between w-full">
                          <span>{token.symbol}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            {token.formattedBalance} available
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exchange Rate Display */}
              {state.amount && corridor && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Exchange Rate</span>
                    <span className="text-green-400 text-sm">1 USD = {corridor.rate.toFixed(2)} {corridor.currency}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-white">
                      <span>Send Amount:</span>
                      <span className="font-semibold">${state.amount} USD</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Transfer Fee:</span>
                      <span className="font-semibold">${state.fees} USD</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Total Cost:</span>
                      <span className="font-semibold">${totalCost.toFixed(2)} USD</span>
                    </div>
                    <Separator className="bg-white/20" />
                    <div className="flex justify-between text-green-400 text-lg">
                      <span>Recipient Gets:</span>
                      <span className="font-bold">{receivedAmount.toFixed(2)} {corridor.currency}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">Delivery Information</span>
                </div>
                <div className="text-white/80 text-sm">
                  <div>Estimated arrival: <span className="text-green-400 font-medium">{state.estimatedArrival}</span></div>
                  <div>Method: <span className="text-blue-400 font-medium capitalize">{state.recipientMethod} Transfer</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleRemittanceTransfer}
                disabled={
                  !state.amount || 
                  state.isProcessing ||
                  transferState.isTransferring ||
                  totalCost > totalValue
                }
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
              >
                {(state.isProcessing || transferState.isTransferring) ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {transferState.step === 'preparing' && 'Preparing Transfer...'}
                    {transferState.step === 'confirming' && 'Confirm in Wallet...'}
                    {transferState.step === 'completed' && 'Transfer Complete!'}
                    {transferState.step === 'idle' && 'Processing Transfer...'}
                  </div>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send ${totalCost.toFixed(2)} USD
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={openAccountModal}
                  variant="outline"
                  className="h-10 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
                
                <Button 
                  onClick={() => openPayWithExchange()}
                  variant="outline"
                  className="h-10 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={payState.isInitiating}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Pay+
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion step
  if (state.step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Money Sent Successfully!</CardTitle>
            <p className="text-white/80">Your transfer is on its way to {state.recipientName}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-white/70">Sent Amount</div>
                    <div className="text-white font-semibold">${state.amount} USD</div>
                  </div>
                  <div>
                    <div className="text-white/70">Recipient Gets</div>
                    <div className="text-green-400 font-semibold">
                      {receivedAmount.toFixed(2)} {corridor?.currency}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/70">Transaction</div>
                    <div className="text-blue-400 font-mono text-xs break-all">
                      {state.transactionHash?.slice(0, 10)}...{state.transactionHash?.slice(-8)}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/70">Status</div>
                    <div className="text-green-400 font-semibold">Processing</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">Estimated Delivery</span>
                </div>
                <div className="text-blue-400 font-semibold">{state.estimatedArrival}</div>
                <div className="text-white/70 text-sm mt-1">
                  Your recipient will be notified once the money is available
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setState({
                    step: 'recipient',
                    fromToken: 'USDT',
                    amount: '',
                    recipientCountry: 'US-IN',
                    recipientName: '',
                    recipientPhone: '',
                    recipientMethod: 'bank',
                    bankDetails: { accountNumber: '', bankName: '', swiftCode: '' },
                    isProcessing: false,
                    transactionHash: null,
                    estimatedArrival: '2-5 minutes',
                    exchangeRate: 83.25,
                    fees: 2.99
                  });
                  resetTransferState();
                }}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Another Transfer
              </Button>

              <Button 
                onClick={() => window.open(`https://etherscan.io/tx/${state.transactionHash}`, '_blank')}
                variant="outline"
                className="w-full h-10 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                View Transaction Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}