import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, Globe, Send, Clock, CheckCircle, Wallet, Shield, CreditCard, 
  Phone, Building, MapPin, Users, TrendingUp, Star, Zap, RefreshCw, 
  FileText, Scan, UserCheck, Key, Database, Lock, AlertTriangle,
  PlusCircle, CreditCard as CardIcon, Smartphone, DollarSign
} from 'lucide-react';

// Enhanced state interface with travel rule and social login
interface EnhancedRemittanceState {
  step: 'social_auth' | 'wallet_creation' | 'crypto_purchase' | 'travel_rule' | 'kyc' | 'recipient' | 'transfer' | 'review' | 'processing' | 'complete';
  
  // Social Authentication
  socialProvider: 'google' | 'facebook' | 'twitter' | 'replit' | null;
  socialUser: {
    id: string;
    email: string;
    name: string;
    picture: string;
  } | null;
  
  // Wallet Creation
  walletType: 'social' | 'external' | 'custody' | null;
  walletAddress: string;
  isWalletCreated: boolean;
  
  // Crypto Purchase
  needsCryptoPurchase: boolean;
  fiatAmount: string;
  cryptoAmount: string;
  paymentMethod: 'card' | 'bank' | 'apple_pay' | 'google_pay' | null;
  purchaseOrderId: string | null;
  
  // Travel Rule Compliance
  travelRuleRequired: boolean;
  originatorInfo: {
    fullLegalName: string;
    dateOfBirth: string;
    nationality: string;
    residenceAddress: string;
    signature: string;
    signedAt: string;
  };
  
  // Enhanced Transfer Details
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
  
  // KYC Enhanced
  kycStatus: 'pending' | 'verified' | 'required';
  kycDocuments: {
    idType: string;
    idNumber: string;
    documentUploaded: boolean;
    selfieUploaded: boolean;
  };
  
  // Processing & Compliance
  isProcessing: boolean;
  transactionHash: string | null;
  travelRuleRecordId: string | null;
  estimatedArrival: string;
  exchangeRate: number;
  fees: number;
  errors: Record<string, string>;
  validationErrors: string[];
}

// Live exchange rate interface
interface ExchangeRate {
  rate: number;
  lastUpdated: string;
  change24h: number;
  isLoading: boolean;
}

// Social providers configuration
const SOCIAL_PROVIDERS = {
  google: { name: 'Google', icon: '🔍', color: 'bg-blue-500' },
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
  twitter: { name: 'Twitter', icon: '🐦', color: 'bg-sky-500' },
  replit: { name: 'Replit', icon: '🔄', color: 'bg-orange-500' }
};

// Crypto purchase providers
const CRYPTO_PROVIDERS = {
  moonpay: { name: 'MoonPay', fee: '3.5%', methods: ['card', 'bank', 'apple_pay'] },
  transak: { name: 'Transak', fee: '2.9%', methods: ['card', 'bank', 'google_pay'] },
  stripe: { name: 'Stripe', fee: '2.4%', methods: ['card', 'apple_pay', 'google_pay'] }
};

export default function EnhancedRemittancePlatform() {
  const [state, setState] = useState<EnhancedRemittanceState>({
    step: 'social_auth',
    socialProvider: null,
    socialUser: null,
    walletType: null,
    walletAddress: '',
    isWalletCreated: false,
    needsCryptoPurchase: false,
    fiatAmount: '',
    cryptoAmount: '',
    paymentMethod: null,
    purchaseOrderId: null,
    travelRuleRequired: false,
    originatorInfo: {
      fullLegalName: '',
      dateOfBirth: '',
      nationality: '',
      residenceAddress: '',
      signature: '',
      signedAt: ''
    },
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
    kycStatus: 'required',
    kycDocuments: {
      idType: '',
      idNumber: '',
      documentUploaded: false,
      selfieUploaded: false
    },
    isProcessing: false,
    transactionHash: null,
    travelRuleRecordId: null,
    estimatedArrival: '2-5 minutes',
    exchangeRate: 83.25,
    fees: 2.99,
    errors: {},
    validationErrors: []
  });

  const [liveExchangeRate, setLiveExchangeRate] = useState<ExchangeRate>({
    rate: 83.25,
    lastUpdated: new Date().toISOString(),
    change24h: 0.45,
    isLoading: false
  });

  // Live exchange rate fetching
  const fetchLiveExchangeRate = async () => {
    try {
      setLiveExchangeRate(prev => ({ ...prev, isLoading: true }));
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      if (data.rates && data.rates.INR) {
        const newRate = data.rates.INR;
        const change = ((newRate - liveExchangeRate.rate) / liveExchangeRate.rate) * 100;
        
        setLiveExchangeRate({
          rate: newRate,
          lastUpdated: new Date().toISOString(),
          change24h: change,
          isLoading: false
        });
        
        setState(prev => ({ ...prev, exchangeRate: newRate }));
      }
    } catch (error) {
      console.error('Failed to fetch live exchange rate:', error);
      setLiveExchangeRate(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchLiveExchangeRate();
    const interval = setInterval(fetchLiveExchangeRate, 30000);
    return () => clearInterval(interval);
  }, []);

  // Travel Rule compliance check
  const checkTravelRuleRequirement = (amount: number) => {
    return amount >= 3000; // $3000 USD threshold
  };

  // Wallet signing for originator information
  const signOriginatorInformation = async () => {
    try {
      if (!state.walletAddress) throw new Error('No wallet connected');
      
      const message = JSON.stringify({
        fullLegalName: state.originatorInfo.fullLegalName,
        dateOfBirth: state.originatorInfo.dateOfBirth,
        nationality: state.originatorInfo.nationality,
        residenceAddress: state.originatorInfo.residenceAddress,
        walletAddress: state.walletAddress,
        timestamp: new Date().toISOString()
      });

      // Mock wallet signing - in production, use actual wallet provider
      const signature = `0x${Array.from({length: 130}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      setState(prev => ({
        ...prev,
        originatorInfo: {
          ...prev.originatorInfo,
          signature,
          signedAt: new Date().toISOString()
        }
      }));

      return signature;
    } catch (error) {
      console.error('Failed to sign originator information:', error);
      throw error;
    }
  };

  // Social login authentication
  const handleSocialLogin = async (provider: string) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Mock social authentication - integrate with actual providers
      const mockUser = {
        id: `${provider}_${Date.now()}`,
        email: `user@${provider}.com`,
        name: `${provider} User`,
        picture: `https://ui-avatars.com/api/?name=${provider}+User`
      };

      setState(prev => ({
        ...prev,
        socialProvider: provider as any,
        socialUser: mockUser,
        step: 'wallet_creation',
        isProcessing: false
      }));
    } catch (error) {
      console.error('Social login failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Social wallet creation
  const createSocialWallet = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Mock wallet creation - integrate with actual wallet providers
      const walletAddress = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      setState(prev => ({
        ...prev,
        walletType: 'social',
        walletAddress,
        isWalletCreated: true,
        step: 'crypto_purchase',
        isProcessing: false
      }));
    } catch (error) {
      console.error('Wallet creation failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Crypto purchase flow
  const initiateCryptoPurchase = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      // Mock crypto purchase - integrate with MoonPay/Transak/Stripe
      const orderId = `order_${Date.now()}`;
      
      setState(prev => ({
        ...prev,
        purchaseOrderId: orderId,
        needsCryptoPurchase: false,
        step: 'travel_rule',
        isProcessing: false
      }));
    } catch (error) {
      console.error('Crypto purchase failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Step 1: Social Authentication
  if (state.step === 'social_auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-24">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-sm font-medium">Web3 Remittance & Off-Ramping Platform</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
                Send Money to India
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Instantly with Crypto
                </span>
              </h1>
              
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Create a social wallet, buy crypto instantly, and send money to India with 
                <br />
                blockchain settlement. Travel rule compliant and fully regulated.
              </p>

              {/* Live Stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="text-center group">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="text-3xl font-bold text-white">
                      ₹{liveExchangeRate.rate.toFixed(2)}
                    </div>
                    {liveExchangeRate.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white/60"></div>
                    ) : (
                      <div className={`text-sm px-2 py-1 rounded-full ${
                        liveExchangeRate.change24h >= 0 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {liveExchangeRate.change24h >= 0 ? '+' : ''}{liveExchangeRate.change24h.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-white/60">Live USD → INR rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">$2.99</div>
                  <div className="text-sm text-white/60">Fixed network fee</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">2-5min</div>
                  <div className="text-sm text-white/60">Settlement time</div>
                </div>
              </div>

              {/* Social Login Options */}
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-2xl font-semibold text-white mb-6">Get Started with Social Login</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SOCIAL_PROVIDERS).map(([key, provider]) => (
                    <Button
                      key={key}
                      onClick={() => handleSocialLogin(key)}
                      disabled={state.isProcessing}
                      className={`h-14 ${provider.color} hover:opacity-90 transition-all duration-300 group`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold text-white">{provider.name}</div>
                          <div className="text-xs text-white/80">Quick & Secure</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white/60">
                      Or connect existing wallet
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setState(prev => ({ ...prev, step: 'wallet_creation', walletType: 'external' }))}
                  variant="outline"
                  className="w-full h-14 border-white/20 text-white hover:bg-white/10"
                >
                  <Wallet className="w-5 h-5 mr-3" />
                  Connect External Wallet
                </Button>
              </div>

              <div className="text-center text-white/60 text-sm max-w-md mx-auto">
                By continuing, you agree to our Terms of Service and Privacy Policy. 
                Your data is encrypted and never shared.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Wallet Creation
  if (state.step === 'wallet_creation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <Key className="w-8 h-8 text-blue-400" />
              Create Your Wallet
            </CardTitle>
            <p className="text-white/70 mt-2">
              {state.socialUser ? `Welcome ${state.socialUser.name}!` : 'Welcome!'} Let's set up your secure wallet
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {state.socialUser && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={state.socialUser.picture} 
                    alt={state.socialUser.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="text-white font-medium">{state.socialUser.name}</div>
                    <div className="text-white/70 text-sm">{state.socialUser.email}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Social Recovery Wallet</h3>
                      <p className="text-white/70 text-sm mb-4">
                        Create a secure wallet with social recovery. Your private keys are encrypted and recoverable through your social account.
                      </p>
                      <div className="space-y-2 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Multi-chain support (Ethereum, Polygon, BSC)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Social recovery if you lose access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Hardware-grade encryption</span>
                        </div>
                      </div>
                      <Button
                        onClick={createSocialWallet}
                        disabled={state.isProcessing}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      >
                        {state.isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Creating Wallet...
                          </div>
                        ) : (
                          <>
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Create Social Wallet
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-300 font-medium mb-1">Important Security Notice</h4>
                    <p className="text-yellow-200/80 text-sm">
                      Your wallet will be created with industry-standard encryption. You maintain full custody of your funds while enjoying social recovery benefits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Crypto Purchase
  if (state.step === 'crypto_purchase') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              Buy Crypto for Remittance
            </CardTitle>
            <p className="text-white/70 mt-2">Purchase USDT to send money to India instantly</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Wallet Created Successfully</span>
              </div>
              <div className="text-white/70 text-sm font-mono">
                {state.walletAddress.slice(0, 6)}...{state.walletAddress.slice(-4)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Amount to Purchase (USD)</label>
                <Input
                  type="number"
                  placeholder="100.00"
                  value={state.fiatAmount}
                  onChange={(e) => setState(prev => ({ ...prev, fiatAmount: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600 text-white text-2xl h-14"
                />
                <div className="text-white/60 text-sm">
                  You'll receive approximately {state.fiatAmount ? (parseFloat(state.fiatAmount) * 0.97).toFixed(2) : '0.00'} USDT
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setState(prev => ({ ...prev, paymentMethod: 'card' }))}
                    variant={state.paymentMethod === 'card' ? 'default' : 'outline'}
                    className="h-14 flex-col gap-1"
                  >
                    <CardIcon className="w-5 h-5" />
                    <span className="text-sm">Credit Card</span>
                  </Button>
                  <Button
                    onClick={() => setState(prev => ({ ...prev, paymentMethod: 'bank' }))}
                    variant={state.paymentMethod === 'bank' ? 'default' : 'outline'}
                    className="h-14 flex-col gap-1"
                  >
                    <Building className="w-5 h-5" />
                    <span className="text-sm">Bank Transfer</span>
                  </Button>
                  <Button
                    onClick={() => setState(prev => ({ ...prev, paymentMethod: 'apple_pay' }))}
                    variant={state.paymentMethod === 'apple_pay' ? 'default' : 'outline'}
                    className="h-14 flex-col gap-1"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm">Apple Pay</span>
                  </Button>
                  <Button
                    onClick={() => setState(prev => ({ ...prev, paymentMethod: 'google_pay' }))}
                    variant={state.paymentMethod === 'google_pay' ? 'default' : 'outline'}
                    className="h-14 flex-col gap-1"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm">Google Pay</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium">Choose Provider</h4>
                {Object.entries(CRYPTO_PROVIDERS).map(([key, provider]) => (
                  <div key={key} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-blue-500/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{provider.name}</div>
                        <div className="text-white/60 text-sm">Fee: {provider.fee}</div>
                      </div>
                      <div className="flex gap-1">
                        {provider.methods.map(method => (
                          <Badge key={method} variant="secondary" className="text-xs">
                            {method.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'wallet_creation' }))}
                variant="outline"
                className="flex-1 h-12 border-gray-600 text-white hover:bg-gray-700/50"
              >
                Back
              </Button>
              <Button 
                onClick={initiateCryptoPurchase}
                disabled={!state.fiatAmount || !state.paymentMethod || state.isProcessing}
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {state.isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    Purchase ${state.fiatAmount || '0'} USDT
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <Button
                onClick={() => setState(prev => ({ ...prev, step: 'travel_rule', needsCryptoPurchase: false }))}
                variant="ghost"
                className="text-white/70 hover:text-white"
              >
                Skip - I already have crypto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 4: Travel Rule Compliance
  if (state.step === 'travel_rule') {
    const requiresTravelRule = checkTravelRuleRequirement(parseFloat(state.fiatAmount) || 0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-blue-400" />
              Travel Rule Compliance
            </CardTitle>
            <p className="text-white/70 mt-2">
              {requiresTravelRule 
                ? 'Compliance required for transfers over $3,000 USD' 
                : 'Optional originator information for enhanced security'}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {requiresTravelRule && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-orange-300 font-medium mb-1">Travel Rule Compliance Required</h4>
                    <p className="text-orange-200/80 text-sm">
                      Your transfer amount of ${state.fiatAmount} exceeds the $3,000 threshold. 
                      We need to collect originator information as required by international regulations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Originator Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Full Legal Name *</label>
                    <Input
                      value={state.originatorInfo.fullLegalName}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        originatorInfo: { ...prev.originatorInfo, fullLegalName: e.target.value }
                      }))}
                      placeholder="John Doe Smith"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Date of Birth *</label>
                    <Input
                      type="date"
                      value={state.originatorInfo.dateOfBirth}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        originatorInfo: { ...prev.originatorInfo, dateOfBirth: e.target.value }
                      }))}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Nationality *</label>
                    <Select value={state.originatorInfo.nationality} onValueChange={(value) => 
                      setState(prev => ({
                        ...prev,
                        originatorInfo: { ...prev.originatorInfo, nationality: value }
                      }))
                    }>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Residence Address *</label>
                    <textarea
                      value={state.originatorInfo.residenceAddress}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        originatorInfo: { ...prev.originatorInfo, residenceAddress: e.target.value }
                      }))}
                      placeholder="123 Main St, City, State, ZIP, Country"
                      rows={3}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-md px-3 py-2 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold text-lg">Wallet Signature</h3>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-blue-300 font-medium mb-1">Cryptographic Proof</h4>
                      <p className="text-blue-200/80 text-sm mb-3">
                        Sign your originator information with your wallet to create immutable compliance records.
                      </p>
                    </div>
                  </div>
                </div>

                {state.walletAddress && (
                  <div className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="text-white/70 text-xs mb-1">Connected Wallet</div>
                    <div className="text-white font-mono text-sm">
                      {state.walletAddress.slice(0, 6)}...{state.walletAddress.slice(-4)}
                    </div>
                  </div>
                )}

                {state.originatorInfo.signature ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-300 font-medium">Information Signed</span>
                      </div>
                      <div className="text-green-200/80 text-xs font-mono break-all">
                        {state.originatorInfo.signature.slice(0, 20)}...{state.originatorInfo.signature.slice(-10)}
                      </div>
                      <div className="text-green-200/60 text-xs mt-1">
                        Signed at: {new Date(state.originatorInfo.signedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={signOriginatorInformation}
                    disabled={!state.originatorInfo.fullLegalName || !state.originatorInfo.dateOfBirth || 
                             !state.originatorInfo.nationality || !state.originatorInfo.residenceAddress || 
                             state.isProcessing}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                  >
                    {state.isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Signing...
                      </div>
                    ) : (
                      <>
                        <Key className="w-5 h-5 mr-2" />
                        Sign with Wallet
                      </>
                    )}
                  </Button>
                )}

                <div className="text-white/60 text-xs">
                  Your signature creates a tamper-proof record that links your identity to this transaction 
                  for compliance purposes.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'crypto_purchase' }))}
                variant="outline"
                className="flex-1 h-12 border-gray-600 text-white hover:bg-gray-700/50"
              >
                Back
              </Button>
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'kyc', travelRuleRequired: requiresTravelRule }))}
                disabled={requiresTravelRule && !state.originatorInfo.signature}
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Continue to KYC
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 5: KYC Verification
  if (state.step === 'kyc') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <UserCheck className="w-8 h-8 text-green-400" />
              Identity Verification
            </CardTitle>
            <p className="text-white/70 mt-2">Complete KYC to enable remittance services</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Document Upload</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-white text-sm font-medium block mb-2">ID Document Type</label>
                    <Select value={state.kycDocuments.idType} onValueChange={(value) => 
                      setState(prev => ({
                        ...prev,
                        kycDocuments: { ...prev.kycDocuments, idType: value }
                      }))
                    }>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white text-sm font-medium block mb-2">Document Number</label>
                    <Input
                      value={state.kycDocuments.idNumber}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        kycDocuments: { ...prev.kycDocuments, idNumber: e.target.value }
                      }))}
                      placeholder="Enter document number"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Scan className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-white font-medium mb-1">Upload ID Document</div>
                    <div className="text-white/60 text-sm">PNG, JPG up to 10MB</div>
                    {state.kycDocuments.documentUploaded && (
                      <div className="mt-2 text-green-400 text-sm flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Document uploaded
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                      📷
                    </div>
                    <div className="text-white font-medium mb-1">Upload Selfie</div>
                    <div className="text-white/60 text-sm">Clear photo of your face</div>
                    {state.kycDocuments.selfieUploaded && (
                      <div className="mt-2 text-green-400 text-sm flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Selfie uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">Verification Status</h3>
                
                <div className="space-y-3">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-300 font-medium">Document Review</span>
                    </div>
                    <div className="text-blue-200/80 text-sm">
                      We'll verify your documents within 5-10 minutes using automated systems.
                    </div>
                  </div>

                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 font-medium">Privacy Protected</span>
                    </div>
                    <div className="text-purple-200/80 text-sm">
                      Your documents are encrypted and stored securely. We never share personal information.
                    </div>
                  </div>

                  {state.travelRuleRequired && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 font-medium">Travel Rule Complete</span>
                      </div>
                      <div className="text-green-200/80 text-sm">
                        Originator information signed and compliance record created.
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setState(prev => ({
                    ...prev,
                    kycDocuments: { ...prev.kycDocuments, documentUploaded: true, selfieUploaded: true },
                    kycStatus: 'verified'
                  }))}
                  disabled={!state.kycDocuments.idType || !state.kycDocuments.idNumber}
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                >
                  <Scan className="w-5 h-5 mr-2" />
                  Simulate Document Upload
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'travel_rule' }))}
                variant="outline"
                className="flex-1 h-12 border-gray-600 text-white hover:bg-gray-700/50"
              >
                Back
              </Button>
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'recipient' }))}
                disabled={state.kycStatus !== 'verified'}
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Continue to Transfer
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold">Loading Enhanced Platform...</h2>
        <p className="text-white/70 mb-4">Setting up travel rule compliance and social wallet features</p>
      </div>
    </div>
  );
}