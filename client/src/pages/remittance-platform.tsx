import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Globe, Send, Clock, CheckCircle, Wallet, Shield, CreditCard, Phone, Building, MapPin, Users, TrendingUp, Star, Zap, RefreshCw, FileText, Scan, UserCheck, Key, Database, Lock } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitState } from '@reown/appkit/react';
import { SocialWalletCreator } from '@/components/reown/social-wallet-creator';
import { TravelRuleForm } from '@/components/compliance/travel-rule-form';
import { TravelRuleCompliance } from '@/components/compliance/travel-rule-compliance';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { UniversalPageLayout } from '@/components/layout/universal-page-layout';
import { StepWithBenefits } from '@/components/layout/step-with-benefits';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useReownTransfer } from '@/hooks/use-reown-transfer';
import { useReownPay } from '@/hooks/use-reown-pay';

type StepType = 'connect' | 'create-wallet' | 'social-signup' | 'buy-crypto' | 'kyc' | 'recipient' | 'travel-rule' | 'transfer' | 'review' | 'processing' | 'complete';

interface RemittanceState {
  step: StepType;
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
  kycStatus: 'pending' | 'verified' | 'required';
  kycDocuments: {
    idType: string;
    idNumber: string;
    documentUploaded: boolean;
    selfieUploaded: boolean;
  };
  travelRuleData: {
    originatorName?: string;
    originatorAddress?: string;
    originatorCountry?: string;
    originatorIdType?: string;
    originatorIdNumber?: string;
    beneficiaryName?: string;
    beneficiaryAddress?: string;
    beneficiaryAccountNumber?: string;
    beneficiaryBankName?: string;
    beneficiaryBankCode?: string;
    transactionPurpose?: string;
    sourceOfFunds?: string;
    relationshipToBeneficiary?: string;
    reference?: string;
    complianceVerified: boolean;
  } | null;
  walletCreationType: 'existing' | 'new';
  socialProvider: string;
  buyCryptoAmount: string;
  isProcessing: boolean;
  transactionHash: string | null;
  estimatedArrival: string;
  exchangeRate: number;
  fees: number;
  errors: Record<string, string>;
  validationErrors: string[];
}

// Live exchange rate state
interface ExchangeRate {
  rate: number;
  lastUpdated: string;
  change24h: number;
  isLoading: boolean;
}

// Primary remittance corridor - India with live rates
const REMITTANCE_CORRIDORS = {
  'US-IN': { 
    baseRate: 83.25, 
    fees: 2.99, 
    currency: 'INR', 
    flag: '🇮🇳', 
    name: 'India', 
    available: true,
    apiSymbol: 'USD_INR'
  },
  'US-PH': { baseRate: 56.45, fees: 2.99, currency: 'PHP', flag: '🇵🇭', name: 'Philippines', available: false, apiSymbol: 'USD_PHP' },
  'US-MX': { baseRate: 17.82, fees: 2.99, currency: 'MXN', flag: '🇲🇽', name: 'Mexico', available: false, apiSymbol: 'USD_MXN' },
  'US-NG': { baseRate: 1580.50, fees: 2.99, currency: 'NGN', flag: '🇳🇬', name: 'Nigeria', available: false, apiSymbol: 'USD_NGN' },
  'US-BD': { baseRate: 123.75, fees: 2.99, currency: 'BDT', flag: '🇧🇩', name: 'Bangladesh', available: false, apiSymbol: 'USD_BDT' },
  'US-PK': { baseRate: 278.50, fees: 2.99, currency: 'PKR', flag: '🇵🇰', name: 'Pakistan', available: false, apiSymbol: 'USD_PKR' },
  'US-VN': { baseRate: 24850, fees: 2.99, currency: 'VND', flag: '🇻🇳', name: 'Vietnam', available: false, apiSymbol: 'USD_VND' },
  'US-KE': { baseRate: 129.80, fees: 2.99, currency: 'KES', flag: '🇰🇪', name: 'Kenya', available: false, apiSymbol: 'USD_KES' }
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
  const { selectedNetworkId } = useAppKitState();
  const { tokenBalances, isLoading: balancesLoading, refreshBalances, totalValue } = useWalletBalances();
  
  const { transferState, transferToAdmin, openAccountModal, resetTransferState } = useReownTransfer();
  const { payState, openPayWithExchange, initiatePayWithExchange, resetPayState } = useReownPay();
  
  const [state, setState] = useState<RemittanceState>({
    step: 'connect' as const,
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
    travelRuleData: null,
    walletCreationType: 'existing',
    socialProvider: '',
    buyCryptoAmount: '',
    isProcessing: false,
    transactionHash: null,
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

  const [showWalletCreationModal, setShowWalletCreationModal] = useState(false);

  // Monitor wallet connection and auto-advance flow
  useEffect(() => {
    if (isConnected && address && ['connect', 'create-wallet'].includes(state.step)) {
      console.log('Wallet connected successfully:', address);
      // Auto-advance to transfer step when wallet is connected
      setState(prev => ({ 
        ...prev, 
        step: 'transfer' as const,
        walletCreationType: prev.step === 'create-wallet' ? 'new' : 'existing'
      }));
    }
  }, [isConnected, address, state.step]);

  // Fetch live USD to INR exchange rate
  const fetchLiveExchangeRate = async () => {
    try {
      setLiveExchangeRate(prev => ({ ...prev, isLoading: true }));
      
      // Using exchangerate-api.com for live rates
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

  // Fetch live rates on component mount and every 30 seconds
  useEffect(() => {
    fetchLiveExchangeRate();
    const interval = setInterval(fetchLiveExchangeRate, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update exchange rate and fees when country changes
  useEffect(() => {
    const corridor = REMITTANCE_CORRIDORS[state.recipientCountry as keyof typeof REMITTANCE_CORRIDORS];
    if (corridor) {
      setState(prev => ({
        ...prev,
        exchangeRate: liveExchangeRate.rate || corridor.baseRate,
        fees: corridor.fees
      }));
    }
  }, [state.recipientCountry, liveExchangeRate.rate]);

  // Validation functions
  const validateStep = (step: string): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 'kyc':
        if (!state.kycDocuments.idType) errors.push('ID type is required');
        if (!state.kycDocuments.idNumber) errors.push('ID number is required');
        if (!state.kycDocuments.documentUploaded) errors.push('ID document upload is required');
        if (!state.kycDocuments.selfieUploaded) errors.push('Selfie verification is required');
        break;
        
      case 'recipient':
        if (!state.recipientName.trim()) errors.push('Recipient name is required');
        if (!state.recipientPhone.trim()) errors.push('Recipient phone is required');
        if (state.recipientMethod === 'bank') {
          if (!state.bankDetails.accountNumber.trim()) errors.push('Account number is required');
          if (!state.bankDetails.bankName.trim()) errors.push('Bank name is required');
          if (!state.bankDetails.swiftCode.trim()) errors.push('SWIFT/IFSC code is required');
        }
        break;
        
      case 'transfer':
        if (!state.amount || parseFloat(state.amount) <= 0) errors.push('Valid amount is required');
        if (!state.fromToken) errors.push('Token selection is required');
        const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
        if (selectedToken && parseFloat(state.amount) > parseFloat(selectedToken.formattedBalance)) {
          errors.push('Insufficient balance');
        }
        break;
    }
    
    return errors;
  };

  const handleStepNavigation = (nextStep: RemittanceState['step']) => {
    const currentErrors = validateStep(state.step);
    
    if (currentErrors.length > 0) {
      setState(prev => ({ ...prev, validationErrors: currentErrors }));
      return false;
    }
    
    setState(prev => ({ 
      ...prev, 
      step: nextStep, 
      validationErrors: [],
      errors: {}
    }));
    return true;
  };

  // Set initial step based on connection status
  useEffect(() => {
    if (isConnected && address) {
      // Close wallet creation modal if it's open
      setShowWalletCreationModal(false);
      
      // If user just connected/created wallet
      if (state.step === 'connect' || state.step === 'create-wallet') {
        if (state.walletCreationType === 'new') {
          // New wallet created via social login, guide to buy crypto first
          setState(prev => ({ ...prev, step: 'buy-crypto' }));
        } else {
          // Existing wallet connected, skip to KYC
          setState(prev => ({ ...prev, step: 'kyc' }));
        }
      }
      // If user is on buy-crypto step and has funds, proceed to KYC
      else if (state.step === 'buy-crypto' && totalValue > 0) {
        setState(prev => ({ ...prev, step: 'kyc' }));
      }
    } else if (!isConnected && state.step !== 'connect' && state.step !== 'create-wallet' && state.step !== 'buy-crypto') {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [isConnected, address, status, state.step, state.walletCreationType, totalValue]);

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

  // Navigation handler for mobile layout
  const handleMobileNavigation = (step: string) => {
    setState(prev => ({ ...prev, step: step as StepType }));
  };

  // Landing page for wallet connection - Mobile-first design
  if (!isConnected || state.step === 'connect') {
    return (
      <MobileLayout 
        currentStep={state.step} 
        isConnected={isConnected} 
        onNavigate={handleMobileNavigation}
        showNavigation={false}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-background/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-background/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navigation Header */}
          <header className="w-full px-6 py-4 border-b border-background/10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-background to-background/80 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[#FCFBF4] font-semibold text-lg">StablePay</span>
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm text-[#FCFBF4]/80">
                <span>How it works</span>
                <span>Security</span>
                <span>Support</span>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <main className="flex-1 flex items-center justify-center px-6 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#FCFBF4]/10 backdrop-blur-sm border border-[#FCFBF4]/20 px-4 py-2 rounded-full mb-8">
                <div className="w-2 h-2 bg-[#FCFBF4] rounded-full animate-pulse"></div>
                <span className="text-[#FCFBF4]/90 text-sm font-medium">World's first Web3 remittance platform</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="mobile-text-2xl font-bold mb-8 leading-tight tracking-tight">
                <span className="text-[#FCFBF4]">Send money to</span>
                <br />
                <span className="bg-gradient-to-r from-[#FCFBF4] to-[#FCFBF4]/80 bg-clip-text text-transparent">
                  India instantly
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="mobile-text-lg text-[#FCFBF4]/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                Skip the banks. Send crypto, receive rupees. 
                <br />
                <span className="text-[#FCFBF4]/80">2-5 minutes. Always.</span>
              </p>

              {/* Live Stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="text-center group">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="text-3xl font-bold text-[#FCFBF4]">
                      ₹{liveExchangeRate.rate.toFixed(2)}
                    </div>
                    {liveExchangeRate.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#FCFBF4]/20 border-t-[#FCFBF4]/60"></div>
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
                  <div className="text-sm text-[#FCFBF4]/70">Live USD → INR rate</div>
                  <div className="text-xs text-[#FCFBF4]/50 mt-1">
                    Updated {new Date(liveExchangeRate.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FCFBF4] mb-1">$2.99</div>
                  <div className="text-sm text-[#FCFBF4]/70">Fixed network fee</div>
                  <div className="text-xs text-[#FCFBF4]/50 mt-1">No hidden charges</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FCFBF4] mb-1">2-5min</div>
                  <div className="text-sm text-[#FCFBF4]/70">Settlement time</div>
                  <div className="text-xs text-[#FCFBF4]/50 mt-1">Blockchain powered</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {/* Connect Existing Wallet */}
                  <Button 
                    onClick={() => {
                      setState(prev => ({ ...prev, walletCreationType: 'existing' }));
                      open({ view: 'Connect' });
                    }}
                    className="btn-premium h-16 px-8 text-lg font-bold group animate-fade-in-up"
                    style={{ animationDelay: '0.2s' }}
                  >
                    <Wallet className="w-6 h-6 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    <span className="relative">Connect Wallet</span>
                  </Button>
                  
                  {/* Create New Wallet */}
                  <Button 
                    onClick={() => {
                      setState(prev => ({ 
                        ...prev, 
                        walletCreationType: 'new',
                        step: 'create-wallet'
                      }));
                    }}
                    className="btn-outline-fill h-16 px-8 text-lg font-bold group animate-fade-in-up"
                    style={{ animationDelay: '0.4s' }}
                  >
                    <UserCheck className="w-6 h-6 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                    <span className="relative">Create Wallet</span>
                  </Button>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-sm">
                    <div className="p-6 bg-[#FCFBF4]/10 rounded-xl border border-[#FCFBF4]/20 group hover:bg-[#FCFBF4]/15 transition-all duration-300 animate-slide-in-left cursor-pointer transform hover:scale-[1.02]">
                      <div className="font-semibold text-[#FCFBF4] mb-2 group-hover:text-[#FCFBF4] transition-colors">Already have crypto?</div>
                      <div className="text-[#FCFBF4]/80 group-hover:text-[#FCFBF4] transition-colors">Use MetaMask, Coinbase, Trust Wallet, or any of 300+ supported wallets</div>
                    </div>
                    <div className="p-6 bg-[#FCFBF4]/10 rounded-xl border border-[#FCFBF4]/20 group hover:bg-[#FCFBF4]/15 transition-all duration-300 animate-slide-in-right cursor-pointer transform hover:scale-[1.02]">
                      <div className="font-semibold text-[#FCFBF4] mb-2 group-hover:text-[#FCFBF4] transition-colors">New to crypto?</div>
                      <div className="text-[#FCFBF4]/80 group-hover:text-[#FCFBF4] transition-colors">Sign up with Google/Apple • Buy crypto instantly • Start sending money</div>
                    </div>
                  </div>
                  
                  <div className="text-[#FCFBF4]/80 text-sm font-medium">
                    🔐 Secure • 🎯 Self-custodial • 🔑 Your keys, your crypto
                  </div>
                </div>
                
                {status === 'reconnecting' && (
                  <div className="flex items-center justify-center gap-2 text-[#FCFBF4]/70">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#FCFBF4]/20 border-t-[#FCFBF4]/60"></div>
                    <span className="text-sm">Connecting...</span>
                  </div>
                )}
                
                {status === 'disconnected' && address && (
                  <div className="text-destructive text-sm">
                    Wallet disconnected. Please reconnect to continue.
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Features Section */}
          <section className="px-6 pb-20">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="group p-8 rounded-2xl bg-background/5 border border-background/10 hover:bg-background/15 transition-all duration-500 animate-fade-in-up cursor-pointer transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl" style={{ animationDelay: '0.1s' }}>
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-float-subtle">
                    <Zap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-background mb-3 group-hover:text-primary transition-colors">Lightning fast</h3>
                  <p className="text-background/70 leading-relaxed group-hover:text-background transition-colors">Complete transfers in minutes, not days. Because your family shouldn't wait.</p>
                  <div className="mt-4 h-1 w-0 bg-primary rounded-full group-hover:w-full transition-all duration-500"></div>
                </div>

                <div className="group p-8 rounded-2xl bg-background/5 border border-background/10 hover:bg-background/15 transition-all duration-500 animate-fade-in-up cursor-pointer transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl" style={{ animationDelay: '0.2s' }}>
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-float-subtle" style={{ animationDelay: '0.5s' }}>
                    <Shield className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-background mb-3 group-hover:text-primary transition-colors">Bank-grade security</h3>
                  <p className="text-background/70 leading-relaxed group-hover:text-background transition-colors">Blockchain technology with enterprise-level security standards.</p>
                  <div className="mt-4 h-1 w-0 bg-primary rounded-full group-hover:w-full transition-all duration-500"></div>
                </div>

                <div className="group p-8 rounded-2xl bg-background/5 border border-background/10 hover:bg-background/15 transition-all duration-500 animate-fade-in-up cursor-pointer transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl" style={{ animationDelay: '0.3s' }}>
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-float-subtle" style={{ animationDelay: '1s' }}>
                    <TrendingUp className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-background mb-3 group-hover:text-primary transition-colors">Best rates</h3>
                  <p className="text-background/70 leading-relaxed group-hover:text-background transition-colors">Live market rates with transparent, fixed fees. No hidden charges.</p>
                  <div className="mt-4 h-1 w-0 bg-primary rounded-full group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="px-6 py-20 border-t border-background/10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-[#FCFBF4] mb-4">How it works</h2>
                <p className="text-xl text-[#FCFBF4]/80 max-w-2xl mx-auto">
                  Four simple steps to send money across borders instantly
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                {/* Step 1 */}
                <div className="relative group animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse-glow"></div>
                  <div className="relative p-8 rounded-3xl bg-background/15 border border-background/30 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 shadow-xl hover:shadow-2xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 animate-float-subtle">
                      <Wallet className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 bg-[#6667AB] text-[#FCFBF4] rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <h3 className="text-xl font-bold text-[#FCFBF4] group-hover:text-[#FCFBF4] transition-colors">Connect wallet</h3>
                    </div>
                    <p className="text-[#FCFBF4]/80 leading-relaxed mb-6 group-hover:text-[#FCFBF4] transition-colors">
                      Connect your self-custodial Web3 wallet. Keep full control of your assets.
                    </p>
                    <div className="p-4 bg-[#6667AB]/15 border border-[#6667AB]/40 rounded-xl group-hover:bg-[#6667AB]/20 transition-all duration-300">
                      <p className="text-[#FCFBF4] text-sm font-medium">
                        <strong>Self-custody:</strong> Your keys, your crypto
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Step 2 - KYC */}
                <div className="relative group animate-scale-in" style={{ animationDelay: '0.4s' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse-glow"></div>
                  <div className="relative p-8 rounded-3xl bg-background/15 border border-background/30 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 shadow-xl hover:shadow-2xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 animate-float-subtle" style={{ animationDelay: '0.3s' }}>
                      <UserCheck className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 bg-[#6667AB] text-[#FCFBF4] rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <h3 className="text-xl font-bold text-[#FCFBF4] group-hover:text-[#FCFBF4] transition-colors">Verify identity</h3>
                    </div>
                    <p className="text-[#FCFBF4]/80 leading-relaxed mb-6 group-hover:text-[#FCFBF4] transition-colors">
                      Quick KYC for recipient verification. Upload ID, capture selfie. Compliant with regulations.
                    </p>
                    <div className="p-4 bg-[#6667AB]/15 border border-[#6667AB]/40 rounded-xl group-hover:bg-[#6667AB]/20 transition-all duration-300">
                      <p className="text-[#FCFBF4] text-sm font-medium">
                        <strong>Secure:</strong> Encrypted verification process
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative group animate-scale-in" style={{ animationDelay: '0.6s' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse-glow"></div>
                  <div className="relative p-8 rounded-3xl bg-background/15 border border-background/30 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 shadow-xl hover:shadow-2xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 animate-float-subtle" style={{ animationDelay: '0.6s' }}>
                      <Send className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 bg-[#6667AB] text-[#FCFBF4] rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <h3 className="text-xl font-bold text-[#FCFBF4] group-hover:text-[#FCFBF4] transition-colors">Send crypto</h3>
                    </div>
                    <p className="text-[#FCFBF4]/80 leading-relaxed mb-6 group-hover:text-[#FCFBF4] transition-colors">
                      Enter amount and recipient details. Choose delivery method: bank, mobile money, or cash pickup.
                    </p>
                    <div className="p-4 bg-[#6667AB]/15 border border-[#6667AB]/40 rounded-xl group-hover:bg-[#6667AB]/20 transition-all duration-300">
                      <p className="text-[#FCFBF4] text-sm font-medium">
                        <strong>Flexible:</strong> Multiple delivery options
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative group animate-scale-in" style={{ animationDelay: '0.8s' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse-glow"></div>
                  <div className="relative p-8 rounded-3xl bg-background/15 border border-background/30 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 shadow-xl hover:shadow-2xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 animate-float-subtle" style={{ animationDelay: '0.9s' }}>
                      <Zap className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 bg-[#6667AB] text-[#FCFBF4] rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <h3 className="text-xl font-bold text-[#FCFBF4] group-hover:text-[#FCFBF4] transition-colors">Instant settlement</h3>
                    </div>
                    <p className="text-[#FCFBF4]/80 leading-relaxed mb-6 group-hover:text-[#FCFBF4] transition-colors">
                      Blockchain settlement in 2-5 minutes. Recipient gets INR directly to their preferred method.
                    </p>
                    <div className="p-4 bg-[#6667AB]/15 border border-[#6667AB]/40 rounded-xl group-hover:bg-[#6667AB]/20 transition-all duration-300">
                      <p className="text-[#FCFBF4] text-sm font-medium">
                        <strong>Lightning:</strong> Faster than traditional rails
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Web3 Benefits Section */}
          <section className="px-6 py-20 border-t border-background/10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-[#FCFBF4] mb-4">Web3 off-ramping benefits</h2>
                <p className="text-xl text-[#FCFBF4]/80">
                  Self-custodial wallets + instant settlement = financial freedom
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-16">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4">
                    <Key className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#FCFBF4] mb-3">Your keys, your crypto</h3>
                  <p className="text-[#FCFBF4]/70 text-sm leading-relaxed">
                    Complete control over your assets. No bank can freeze, limit, or control your transactions. True financial sovereignty.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4">
                    <Database className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#FCFBF4] mb-3">Decentralized settlement</h3>
                  <p className="text-[#FCFBF4]/70 text-sm leading-relaxed">
                    No single point of failure. Blockchain networks operate 24/7 across thousands of nodes worldwide.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#FCFBF4] mb-3">Cryptographic security</h3>
                  <p className="text-[#FCFBF4]/70 text-sm leading-relaxed">
                    Military-grade encryption protects every transaction. Immutable ledger provides permanent audit trail.
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Traditional remittance</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      </div>
                      <span>Banks control your money</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      </div>
                      <span>3-7 day settlement times</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      </div>
                      <span>Hidden fees up to 8% total cost</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      </div>
                      <span>Centralized points of failure</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      </div>
                      <span>Limited to business hours</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-2xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Web3 off-ramping</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      </div>
                      <span>Self-custodial wallet control</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      </div>
                      <span>2-5 minute blockchain settlement</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      </div>
                      <span>Transparent $2.99 flat fee</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      </div>
                      <span>Decentralized infrastructure</span>
                    </div>
                    <div className="flex items-start gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      </div>
                      <span>Available 24/7 globally</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </MobileLayout>
    );
  }

  // Unified Connect/Create Wallet step
  if (['connect', 'create-wallet'].includes(state.step)) {
    return (
      <MobileLayout 
        currentStep={state.step} 
        isConnected={isConnected} 
        onNavigate={handleMobileNavigation}
        showNavigation={false}
      >
        <div className="flex items-center justify-center min-h-screen mobile-container">
        <Card className="w-full max-w-lg border-border shadow-xl">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <Wallet className="w-8 h-8" />
              {state.step === 'create-wallet' ? 'Create Your Wallet' : 'Connect Your Wallet'}
            </CardTitle>
            <p className="text-primary-foreground/90 mt-2">
              {state.step === 'create-wallet' 
                ? 'Create a secure Web3 wallet with social login or connect an existing one'
                : 'Connect your existing wallet or create a new one to get started'
              }
            </p>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Connection Status */}
            {isConnected && address && (
              <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span className="text-foreground font-semibold">Wallet Connected</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Address: {address.slice(0, 6)}...{address.slice(-4)}
                </p>
                <p className="text-muted-foreground text-sm">
                  Proceeding to transfer setup...
                </p>
              </div>
            )}

            {/* Unified Wallet Connection Button */}
            {!isConnected && (
              <div className="space-y-4">
                <Button 
                  onClick={async () => {
                    try {
                      console.log('Opening wallet connection modal...');
                      await open();
                    } catch (error) {
                      console.error('Error opening wallet modal:', error);
                    }
                  }}
                  className="w-full h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group border-0"
                >
                  <Wallet className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  {state.step === 'create-wallet' ? 'Create or Connect Wallet' : 'Connect Wallet'}
                  <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-center text-muted-foreground text-sm">
                  Choose from MetaMask, WalletConnect, Google, Apple, Email, or other providers
                </p>
              </div>
            )}

            {/* Features */}
            <div className="p-4 bg-muted rounded-lg border border-border">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground text-sm font-medium">Secure wallet connections & social login</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground text-sm font-medium">Instant setup with multiple options</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground text-sm font-medium">Self-custodial - you control your keys</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {state.step === 'create-wallet' && (
                <Button 
                  onClick={() => setState(prev => ({ ...prev, step: 'connect' as const }))}
                  variant="outline"
                  className="flex-1"
                >
                  ← Back to Connect
                </Button>
              )}
              {state.step !== 'create-wallet' && (
                <Button 
                  onClick={() => setState(prev => ({ ...prev, step: 'create-wallet' as const }))}
                  variant="outline"
                  className="flex-1"
                >
                  Create New Wallet
                </Button>
              )}
            </div>

            <div className="text-center text-muted-foreground text-xs">
              <p>Powered by Reown AppKit • Enterprise-grade security • Multi-chain support</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </MobileLayout>
    );
  }

  // This step is now handled by Reown AppKit directly - no separate social signup step needed

  // Buy Crypto step - integrated with Reown AppKit onramp
  if (state.step === 'buy-crypto') {
    return (
      <MobileLayout 
        currentStep={state.step} 
        isConnected={isConnected} 
        onNavigate={handleMobileNavigation}
        showNavigation={true}
      >
        <div className="flex items-center justify-center min-h-screen mobile-container">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <CreditCard className="w-8 h-8 text-green-400" />
              Buy Crypto
            </CardTitle>
            <p className="text-white/70 mt-2">Add funds to your wallet to start sending money</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-medium">Wallet Successfully Created!</span>
                </div>
                <p className="text-green-200/80 text-sm">
                  Your secure Web3 wallet is ready. Now add some crypto to start sending money to India.
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="text-blue-300 font-medium mb-3">Buy Crypto with Reown</h4>
                <p className="text-blue-200/80 text-sm mb-4">
                  Use our integrated onramp to purchase cryptocurrency directly to your wallet with credit cards, bank transfers, or digital payments.
                </p>
                
                <Button 
                  onClick={() => {
                    // Open Reown AppKit onramp view
                    open({ view: 'OnRampProviders' });
                  }}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                >
                  <CreditCard className="w-5 h-5 mr-2 text-white" />
                  Open Crypto Purchase
                  <ArrowRight className="w-5 h-5 ml-2 text-white" />
                </Button>
              </div>

              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h4 className="text-purple-300 font-medium mb-2">Alternative: Already have crypto?</h4>
                <p className="text-purple-200/80 text-sm mb-3">
                  If you already have cryptocurrency in another wallet, you can receive or transfer it to your new wallet.
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      open({ view: 'Account' });
                    }}
                    variant="outline"
                    className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                  >
                    View Wallet
                  </Button>
                  <Button 
                    onClick={() => {
                      setState(prev => ({ ...prev, step: 'kyc' }));
                    }}
                    variant="outline"
                    className="flex-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                  >
                    Skip for Now
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'create-wallet' }))}
                variant="outline"
                className="flex-1 h-12 border-gray-600 text-white hover:bg-gray-700/50"
              >
                Back
              </Button>
            </div>

            <div className="text-center text-white/60 text-xs">
              <p>Powered by Reown AppKit • Secure payment processing • Multiple payment methods supported</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </MobileLayout>
    );
  }

  // KYC Verification step
  if (state.step === 'kyc') {
    return (
      <StepWithBenefits
        title="Identity Verification"
        subtitle="Complete KYC verification to ensure secure transfers"
        badge="Secure & compliant verification process"
        onDisconnect={() => setState(prev => ({ ...prev, step: 'connect' }))}
      >
        <Card className="w-full bg-[#FCFBF4]/95 backdrop-blur-md border-[#6667AB]/20 shadow-2xl">
          <CardContent className="mobile-form-section">
            {/* Validation Errors */}
            {state.validationErrors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                  <span className="text-red-300 font-medium">Please fix the following:</span>
                </div>
                <ul className="text-red-200 text-sm space-y-1 ml-7">
                  {state.validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mobile-spacing">
              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">ID Document Type</label>
                <Select 
                  value={state.kycDocuments.idType} 
                  onValueChange={(value) => setState(prev => ({ 
                    ...prev, 
                    kycDocuments: { ...prev.kycDocuments, idType: value }
                  }))}
                >
                  <SelectTrigger className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6667AB]/20">
                    <SelectItem value="passport" className="text-[#6667AB] hover:bg-[#6667AB]/10">Passport</SelectItem>
                    <SelectItem value="drivers_license" className="text-[#6667AB] hover:bg-[#6667AB]/10">Driver's License</SelectItem>
                    <SelectItem value="national_id" className="text-[#6667AB] hover:bg-[#6667AB]/10">National ID Card</SelectItem>
                    <SelectItem value="aadhaar" className="text-[#6667AB] hover:bg-[#6667AB]/10">Aadhaar Card (India)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">ID Number</label>
                <Input
                  placeholder="Enter your ID number"
                  value={state.kycDocuments.idNumber}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    kycDocuments: { ...prev.kycDocuments, idNumber: e.target.value }
                  }))}
                  className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium placeholder:text-[#6667AB]/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mobile-form-field">
                  <label className="mobile-form-label text-[#6667AB] font-semibold">Upload ID Document</label>
                  <div className="border-2 border-dashed border-[#6667AB]/30 rounded-lg p-6 text-center hover:border-[#6667AB]/50 transition-colors cursor-pointer bg-white">
                    {state.kycDocuments.documentUploaded ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Document uploaded</span>
                      </div>
                    ) : (
                      <div className="text-[#6667AB]/70">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to upload ID document</p>
                        <Button
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            kycDocuments: { ...prev.kycDocuments, documentUploaded: true }
                          }))}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-[#6667AB]/30 text-[#6667AB] hover:bg-[#6667AB]/10"
                        >
                          Upload Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mobile-form-field">
                  <label className="mobile-form-label text-[#6667AB] font-semibold">Selfie Verification</label>
                  <div className="border-2 border-dashed border-[#6667AB]/30 rounded-lg p-6 text-center hover:border-[#6667AB]/50 transition-colors cursor-pointer bg-white">
                    {state.kycDocuments.selfieUploaded ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Selfie verified</span>
                      </div>
                    ) : (
                      <div className="text-[#6667AB]/70">
                        <Scan className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Take a selfie for verification</p>
                        <Button
                          onClick={() => setState(prev => ({ 
                            ...prev, 
                            kycDocuments: { ...prev.kycDocuments, selfieUploaded: true }
                          }))}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-[#6667AB]/30 text-[#6667AB] hover:bg-[#6667AB]/10"
                        >
                          Take Selfie
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#6667AB]/10 border border-[#6667AB]/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#6667AB] mt-0.5" />
                  <div>
                    <h4 className="text-[#6667AB] font-semibold mb-1">Secure Verification</h4>
                    <p className="text-[#6667AB]/80 text-sm font-medium">
                      Your documents are encrypted and processed securely. We comply with international KYC/AML regulations to ensure safe transfers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'connect' }))}
                variant="outline"
                className="flex-1 h-12 border-gray-600 text-white hover:bg-gray-700/50"
              >
                Back
              </Button>
              <Button 
                onClick={() => handleStepNavigation('recipient')}
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Verify & Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </StepWithBenefits>
    );
  }

  // Recipient details step
  if (state.step === 'recipient') {
    return (
      <StepWithBenefits
        title="Recipient Details"
        subtitle="Who are you sending money to?"
        badge="Secure recipient information"
        onDisconnect={() => setState(prev => ({ ...prev, step: 'connect' }))}
      >
        <Card className="w-full bg-[#FCFBF4]/95 backdrop-blur-md border-[#6667AB]/20 shadow-2xl">
          <CardContent className="mobile-form-section">
            <div className="mobile-spacing">
              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">Send To Country</label>
                <Select value={state.recipientCountry} onValueChange={(value) => setState(prev => ({ ...prev, recipientCountry: value }))}>
                  <SelectTrigger className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6667AB]/20">
                    {Object.entries(REMITTANCE_CORRIDORS).map(([key, country]) => (
                      <SelectItem key={key} value={key} disabled={!country.available} className="text-[#6667AB] hover:bg-[#6667AB]/10">
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span className={country.available ? 'text-[#6667AB]' : 'text-[#6667AB]/50'}>
                            {country.name}
                          </span>
                          <Badge className="ml-2 bg-[#6667AB]/10 text-[#6667AB]">{country.currency}</Badge>
                          {!country.available && (
                            <Badge className="ml-1 text-xs bg-[#6667AB]/20 text-[#6667AB]/70">
                              Soon
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">Recipient Name</label>
                <Input
                  placeholder="Full name as per ID"
                  value={state.recipientName}
                  onChange={(e) => setState(prev => ({ ...prev, recipientName: e.target.value }))}
                  className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium placeholder:text-[#6667AB]/50"
                />
              </div>

              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">Recipient Phone</label>
                <Input
                  placeholder="+1234567890"
                  value={state.recipientPhone}
                  onChange={(e) => setState(prev => ({ ...prev, recipientPhone: e.target.value }))}
                  className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium placeholder:text-[#6667AB]/50"
                />
              </div>

              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">Delivery Method</label>
                <Select value={state.recipientMethod} onValueChange={(value: 'bank' | 'mobile' | 'cash') => setState(prev => ({ ...prev, recipientMethod: value }))}>
                  <SelectTrigger className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6667AB]/20">
                    <SelectItem value="bank" className="text-[#6667AB] hover:bg-[#6667AB]/10">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile" className="text-[#6667AB] hover:bg-[#6667AB]/10">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="cash" className="text-[#6667AB] hover:bg-[#6667AB]/10">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cash Pickup
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {state.recipientMethod === 'bank' && (
                <div className="mobile-form-field p-4 bg-[#6667AB]/10 rounded-lg border border-[#6667AB]/30">
                  <h4 className="text-[#6667AB] font-semibold mb-4">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Account Number"
                      value={state.bankDetails.accountNumber}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                      }))}
                      className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium placeholder:text-[#6667AB]/50"
                    />
                    <Input
                      placeholder="Bank Name"
                      value={state.bankDetails.bankName}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                      }))}
                      className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium placeholder:text-[#6667AB]/50"
                    />
                    <Input
                      placeholder="SWIFT/IFSC Code"
                      value={state.bankDetails.swiftCode}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        bankDetails: { ...prev.bankDetails, swiftCode: e.target.value }
                      }))}
                      className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium placeholder:text-[#6667AB]/50 md:col-span-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'kyc' }))}
                variant="outline"
                className="mobile-button flex-1 border-[#6667AB]/20 text-[#6667AB] hover:bg-[#6667AB]/10"
              >
                Back
              </Button>
              <Button 
                onClick={() => handleStepNavigation('transfer')}
                className="mobile-button btn-premium flex-1"
              >
                Continue to Transfer
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </StepWithBenefits>
    );
  }

  // Transfer step  
  if (state.step === 'transfer') {
    return (
      <StepWithBenefits
        title="Send Money"
        subtitle="Choose amount and recipient details"
        badge="Instant blockchain transfers"
        onDisconnect={() => setState(prev => ({ ...prev, step: 'connect' }))}
      >
        <Card className="w-full bg-[#FCFBF4]/95 backdrop-blur-md border-[#6667AB]/20 shadow-2xl">
          <CardContent className="mobile-form-section">
            {/* Validation Errors */}
            {state.validationErrors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                  <span className="text-red-600 font-medium">Please fix the following:</span>
                </div>
                <ul className="text-red-600 text-sm space-y-1 ml-7">
                  {state.validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recipient Information */}
            {state.recipientName && corridor && (
              <div className="p-4 bg-[#6667AB]/10 rounded-lg border border-[#6667AB]/30">
                <div className="text-[#6667AB] font-semibold flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Sending to: {state.recipientName} in {corridor?.flag} {corridor?.name}
                </div>
              </div>
            )}

            {/* Enhanced Multi-Chain Wallet Balance Display */}
            <div className="bg-[#6667AB]/10 backdrop-blur-sm rounded-lg p-4 border border-[#6667AB]/20">
              <WalletBalanceDisplay showAllChains={true} compact={false} />
            </div>

            <div className="mobile-spacing">
              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">Send Amount (USD)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={state.amount}
                  onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                  className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium placeholder:text-[#6667AB]/50 text-2xl h-14"
                />
              </div>

              <div className="mobile-form-field">
                <label className="mobile-form-label text-[#6667AB] font-semibold">From Token</label>
                <Select value={state.fromToken} onValueChange={(value) => setState(prev => ({ ...prev, fromToken: value }))}>
                  <SelectTrigger className="mobile-input bg-white border-[#6667AB]/30 text-[#6667AB] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6667AB]/20">
                    {tokenBalances.map((token) => (
                      <SelectItem key={`${token.symbol}-${token.chainId}`} value={token.symbol} className="text-[#6667AB] hover:bg-[#6667AB]/10">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <span className="text-xs bg-[#6667AB]/20 text-[#6667AB] px-1 rounded">{token.chainName}</span>
                          </div>
                          <span className="text-sm text-[#6667AB]/70 ml-2">
                            {parseFloat(token.formattedBalance).toFixed(4)} available
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exchange Rate Display */}
              {state.amount && corridor && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#6667AB]/80 text-sm font-medium">Exchange Rate</span>
                    <span className="text-green-600 text-sm font-semibold">1 USD = {state.exchangeRate.toFixed(2)} {corridor.currency}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[#6667AB]">
                      <span>Send Amount:</span>
                      <span className="font-semibold">${state.amount} USD</span>
                    </div>
                    <div className="flex justify-between text-[#6667AB]">
                      <span>Transfer Fee:</span>
                      <span className="font-semibold">${state.fees} USD</span>
                    </div>
                    <div className="flex justify-between text-[#6667AB]">
                      <span>Total Cost:</span>
                      <span className="font-semibold">${totalCost.toFixed(2)} USD</span>
                    </div>
                    <Separator className="bg-[#6667AB]/20" />
                    <div className="flex justify-between text-green-600 text-lg">
                      <span>Recipient Gets:</span>
                      <span className="font-bold">{receivedAmount.toFixed(2)} {corridor.currency}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              <div className="p-4 bg-[#6667AB]/10 rounded-lg border border-[#6667AB]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#6667AB]" />
                  <span className="text-[#6667AB] text-sm font-semibold">Delivery Information</span>
                </div>
                <div className="text-[#6667AB]/80 text-sm">
                  <div>Estimated arrival: <span className="text-green-600 font-medium">{state.estimatedArrival}</span></div>
                  <div>Method: <span className="text-[#6667AB] font-medium capitalize">{state.recipientMethod} Transfer</span></div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'recipient' }))}
                className="btn-outline-fill flex-1 h-14 text-lg font-semibold group"
              >
                <ArrowRight className="w-5 h-5 mr-2 rotate-180 group-hover:scale-110 transition-transform" />
                <span className="relative">Back</span>
              </Button>
              <Button 
                onClick={() => handleStepNavigation('travel-rule')}
                className="btn-premium flex-1 h-14 text-lg font-semibold group"
              >
                <span className="relative">Continue to Compliance</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:scale-110 group-hover:translate-x-1 transition-all duration-300" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </StepWithBenefits>
    );
  }

  // Travel Rule Compliance step
  if (state.step === 'travel-rule') {
    return (
      <TravelRuleCompliance
        walletAddress={address || ''}
        transactionAmount={parseFloat(state.amount) || 0}
        currency="USD"
        onComplianceComplete={(reference) => {
          setState(prev => ({ 
            ...prev, 
            step: 'review',
            travelRuleData: { 
              reference,
              complianceVerified: true 
            }
          }));
        }}
        isVisible={true}
      />
    );
  }

  // Review step
  if (state.step === 'review') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border">
          <CardHeader className="text-center bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-8 h-8" />
              Review Transfer
            </CardTitle>
            <p className="text-primary-foreground/90 mt-2">Confirm all details before sending</p>
          </CardHeader>
          
          <CardContent className="space-y-6 p-6">
            {/* Transfer Summary */}
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <h3 className="text-foreground font-semibold mb-3">Transfer Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Send Amount:</span>
                    <span className="text-foreground font-medium">${state.amount} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee:</span>
                    <span className="text-foreground font-medium">${state.fees} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exchange Rate:</span>
                    <span className="text-foreground font-medium">1 USD = {state.exchangeRate.toFixed(2)} {corridor?.currency}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex justify-between text-lg">
                    <span className="text-foreground font-semibold">Total Cost:</span>
                    <span className="text-foreground font-bold">${totalCost.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-secondary font-semibold">Recipient Gets:</span>
                    <span className="text-secondary font-bold">{receivedAmount.toFixed(2)} {corridor?.currency}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg border border-border">
                <h3 className="text-foreground font-semibold mb-3">Recipient Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="text-foreground font-medium">{state.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-foreground font-medium">{state.recipientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="text-foreground font-medium">{corridor?.flag} {corridor?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span className="text-foreground font-medium capitalize">{state.recipientMethod} Transfer</span>
                  </div>
                  {state.recipientMethod === 'bank' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="text-foreground font-medium">{state.bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="text-foreground font-medium">***{state.bankDetails.accountNumber.slice(-4)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Travel Rule Compliance Summary */}
              {state.travelRuleData && (
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-secondary" />
                    Compliance Verified
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Originator:</span>
                      <span className="text-foreground font-medium">{state.travelRuleData.originatorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span className="text-foreground font-medium capitalize">
                        {state.travelRuleData?.transactionPurpose?.replace('_', ' ') || 'Family support'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source of Funds:</span>
                      <span className="text-foreground font-medium capitalize">
                        {state.travelRuleData?.sourceOfFunds?.replace('_', ' ') || 'Employment income'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <CheckCircle className="w-4 h-4 text-secondary" />
                      <span className="text-secondary text-sm font-medium">Travel Rule requirements completed</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">Delivery Information</span>
                </div>
                <div className="text-white/80 text-sm">
                  <div>Estimated arrival: <span className="text-green-400 font-medium">{state.estimatedArrival}</span></div>
                  <div>Blockchain settlement via Web3 off-ramping</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'transfer' }))}
                variant="outline"
                className="flex-1 h-12 border-gray-600 text-white hover:bg-gray-700/50"
              >
                Back to Edit
              </Button>
              <Button 
                onClick={handleRemittanceTransfer}
                disabled={state.isProcessing || transferState.isTransferring}
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {(state.isProcessing || transferState.isTransferring) ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {transferState.step === 'preparing' && 'Preparing...'}
                    {transferState.step === 'confirming' && 'Confirm in Wallet...'}
                    {transferState.step === 'completed' && 'Complete!'}
                    {transferState.step === 'idle' && 'Processing...'}
                  </div>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Transfer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing and Complete steps remain the same
  if (state.step === 'processing' || state.step === 'complete') {
    return (
      <MobileLayout 
        currentStep={state.step} 
        isConnected={isConnected} 
        onNavigate={(step) => setState(prev => ({ ...prev, step: step as StepType }))}
        showNavigation={false}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Card className="mobile-card bg-[#FCFBF4]/95 backdrop-blur-md border-[#6667AB]/20 w-full max-w-md">
            <CardContent className="text-center mobile-form-section">
              {state.step === 'processing' ? (
                <div className="mobile-spacing">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#6667AB] border-t-transparent mx-auto"></div>
                  <div>
                    <h3 className="mobile-text-xl font-bold text-[#6667AB] mb-2">Processing Transfer</h3>
                    <p className="text-[#6667AB]/70">Please wait while we process your transfer...</p>
                  </div>
                </div>
              ) : (
                <div className="mobile-spacing">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="mobile-text-xl font-bold text-[#6667AB] mb-2">Transfer Complete!</h3>
                    <p className="text-[#6667AB]/70 mb-4">
                      Your transfer has been sent successfully. The recipient will receive {receivedAmount.toFixed(2)} {corridor?.currency} in {state.estimatedArrival}.
                    </p>
                    {state.transactionHash && (
                      <p className="text-sm text-[#6667AB]/60">
                        Transaction Hash: {state.transactionHash.slice(0, 10)}...{state.transactionHash.slice(-8)}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => setState(prev => ({ ...prev, step: 'connect' }))}
                    className="mobile-button w-full bg-[#6667AB] text-[#FCFBF4] hover:bg-[#6667AB]/90"
                  >
                    Send Another Transfer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  // Fallback - should not reach here
  return (
    <>
      <div className="pwa-fullscreen bg-gradient-to-br from-[#6667AB] via-[#6667AB] to-[#5A5B9F] relative overflow-hidden no-pull-refresh">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6667AB]/90 via-[#6667AB]/95 to-[#5A5B9F]/90" />
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-repeat" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FCFBF4' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />
        
        <div className="relative z-10 safe-area-inset pwa-scrollable">
          <div className="mobile-container flex items-center justify-center min-h-screen">
            <div className="text-[#FCFBF4] text-center mobile-spacing">
              <h2 className="mobile-text-2xl font-bold">Something went wrong</h2>
              <p className="text-[#FCFBF4]/70 mb-4">Please refresh the page and try again</p>
              <Button onClick={() => window.location.reload()} className="mobile-button bg-[#FCFBF4] text-[#6667AB] hover:bg-[#FCFBF4]/90">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info for wallet creation */}
      {showWalletCreationModal && (
        <div className="mobile-modal">
          <div className="mobile-modal-content bg-[#6667AB]/95 backdrop-blur-md text-[#FCFBF4] p-4 rounded-t-xl sm:rounded-xl">
            <p>Debug: Wallet creation modal state active</p>
            <button 
              onClick={() => setShowWalletCreationModal(false)} 
              className="mobile-button bg-red-500 text-white mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button for Quick Transfer */}
      {isConnected && (
        <button 
          className="mobile-fab bg-[#6667AB] text-[#FCFBF4] hover:bg-[#6667AB]/90 hover:scale-110 shadow-2xl group touch-manipulation"
          onClick={() => setState(prev => ({ ...prev, step: 'transfer' }))}
          title="Quick Transfer"
        >
          <Send className="w-6 h-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
        </button>
      )}
    </>
  );
}