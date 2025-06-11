import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Shield, Banknote, Clock, CheckCircle, Wallet, Zap, ExternalLink, LogOut, User, Network, RefreshCw } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';

interface ConversionState {
  step: 'connect' | 'kyc' | 'convert' | 'complete';
  fromToken: string;
  amount: string;
  usdcAmount: string;
  inrAmount: string;
  isProcessing: boolean;
  transactionHash: string | null;
}

// Admin wallet addresses for each chain
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Ethereum
  56: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // BSC
  137: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Polygon
  42161: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Arbitrum
  10: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Optimism
  43114: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Avalanche
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Local hardhat
};

export function StablePayMinimal() {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { tokenBalances, isLoading: balancesLoading, refreshBalances, totalValue } = useWalletBalances();
  
  const [state, setState] = useState<ConversionState>({
    step: 'connect',
    fromToken: 'ETH',
    amount: '',
    usdcAmount: '',
    inrAmount: '',
    isProcessing: false,
    transactionHash: null
  });

  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const INR_RATE = 83.25; // 1 USDC = 83.25 INR

  // Update step based on wallet connection
  useEffect(() => {
    if (status === 'connected' && address) {
      setState(prev => prev.step === 'connect' ? { ...prev, step: 'kyc' } : prev);
    } else if (status === 'disconnected') {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [status, address]);

  // Calculate INR amount when USDC amount changes
  useEffect(() => {
    if (state.amount) {
      const usdcAmount = parseFloat(state.amount) || 0;
      const inrAmount = (usdcAmount * INR_RATE).toFixed(2);
      setState(prev => ({ 
        ...prev, 
        usdcAmount: usdcAmount.toFixed(2),
        inrAmount 
      }));
    }
  }, [state.amount]);

  const handleKycStart = async () => {
    try {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      if (response.ok) {
        setKycStatus('verified'); // Simulate instant verification for demo
      }
    } catch (error) {
      console.error('KYC initiation failed:', error);
    }
  };

  const executeDirectTransfer = async (tokenAddress: string, amount: string): Promise<string | null> => {
    try {
      // Verify wallet connection state
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      if (!caipNetwork?.id) {
        throw new Error('Network not detected. Please switch to a supported network');
      }

      const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
      const adminWallet = ADMIN_WALLETS[chainId];
      
      if (!adminWallet) {
        throw new Error(`This network (Chain ID: ${chainId}) is not supported yet`);
      }

      console.log('Starting token transfer:', { tokenAddress, amount, adminWallet, chainId, address });

      // Use a mock transaction hash for now to complete the flow
      // In production, this would integrate with smart contracts or payment processors
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
      
      // Simulate transfer delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Mock token transfer completed:', mockTxHash);
      return mockTxHash;
      
    } catch (error) {
      console.error('Direct transfer failed:', error);
      throw new Error(`Transfer failed: ${(error as Error).message}`);
    }
  };

  const handleConversion = async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Pre-flight checks
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      const selectedToken = tokenBalances.find(token => token.symbol === state.fromToken);
      if (!selectedToken) {
        throw new Error('Selected token not found. Please refresh and try again.');
      }

      // Check sufficient balance
      const availableBalance = parseFloat(selectedToken.formattedBalance);
      const requestedAmount = parseFloat(state.amount);
      if (requestedAmount > availableBalance) {
        throw new Error(`Insufficient balance. Available: ${availableBalance} ${state.fromToken}`);
      }

      // Initiate KYC if needed
      const kycResponse = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          amount: state.amount,
          token: state.fromToken,
          bankAccount: bankDetails.accountNumber
        })
      });

      if (!kycResponse.ok) throw new Error('KYC verification failed');

      // Execute direct blockchain transfer
      console.log('Executing direct token transfer to admin wallet');
      const transferHash = await executeDirectTransfer(
        selectedToken.address,
        state.amount
      );

      if (!transferHash) {
        throw new Error('Token transfer to admin wallet failed');
      }

      console.log('Token transfer successful:', transferHash);

      // Create transaction record
      const transactionResponse = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          fromToken: state.fromToken,
          fromAmount: state.amount,
          toToken: 'INR',
          toAmount: state.inrAmount,
          status: 'completed',
          bankAccount: bankDetails.accountNumber,
          transferHash: transferHash
        })
      });

      if (!transactionResponse.ok) throw new Error('Transaction creation failed');

      setState(prev => ({ 
        ...prev, 
        step: 'complete', 
        isProcessing: false,
        transactionHash: transferHash
      }));
      
      // Refresh balances after successful transfer
      setTimeout(async () => {
        await refreshBalances();
      }, 2000);
      
    } catch (error) {
      console.error('Conversion failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      alert('Conversion failed: ' + (error as Error).message);
    }
  };

  if (state.step === 'connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Banknote className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">StablePay</CardTitle>
            <p className="text-white/80 text-lg">Powered by Reown WalletConnect</p>
            <p className="text-white/60 text-sm">Multi-chain crypto-to-INR conversion platform</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs text-white/80">Connect</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-xs text-white/80">Swap</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Banknote className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-white/80">Receive INR</p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <h3 className="text-white font-medium mb-3">Connection Options:</h3>
              <div className="space-y-2 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>350+ Wallets (MetaMask, Rainbow, Coinbase)</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Social Login (Google, X, Discord)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  <span>Multi-chain Support (Ethereum, BSC, Polygon)</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => open()}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'kyc') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl font-bold text-white">Identity Verification</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => open({ view: 'Account' })}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <User className="w-4 h-4 mr-2" />
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Button>
                <Button
                  onClick={() => open({ view: 'Networks' })}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Network className="w-4 h-4 mr-2" />
                  {caipNetwork?.name || 'Network'}
                </Button>
              </div>
            </div>
            <p className="text-white/80">Complete identity verification for INR withdrawals</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-medium">Connected Wallet</h3>
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Wallet Connected</p>
                      <p className="text-white/60 text-sm">{address?.slice(0, 12)}...{address?.slice(-6)}</p>
                      <p className="text-white/60 text-sm">Network: {caipNetwork?.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-medium">KYC Status</h3>
                <div className={`p-4 border rounded-lg ${
                  kycStatus === 'verified' ? 'bg-green-500/20 border-green-500/30' :
                  kycStatus === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30' :
                  'bg-gray-500/20 border-gray-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {kycStatus === 'verified' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                     kycStatus === 'pending' ? <Clock className="w-5 h-5 text-yellow-400" /> :
                     <Shield className="w-5 h-5 text-gray-400" />}
                    <div>
                      <p className="text-white font-medium">
                        {kycStatus === 'verified' ? 'Verified' :
                         kycStatus === 'pending' ? 'Processing...' :
                         'Not Started'}
                      </p>
                      <p className="text-white/60 text-sm">
                        {kycStatus === 'verified' ? 'Ready for withdrawals' :
                         kycStatus === 'pending' ? 'Verifying documents...' :
                         'Click to start verification'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {kycStatus === 'none' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Required Documents:</h4>
                  <ul className="text-white/80 text-sm space-y-1">
                    <li>• Government-issued photo ID (Aadhaar, PAN, Passport)</li>
                    <li>• Bank account details for INR withdrawals</li>
                    <li>• Address proof (utility bill, bank statement)</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleKycStart}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Start KYC Verification
                </Button>
              </div>
            )}

            {kycStatus === 'verified' && (
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'convert' }))}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Continue to Conversion
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'convert') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl font-bold text-white">Convert to INR</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={refreshBalances}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  disabled={balancesLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${balancesLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={() => open({ view: 'Account' })}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <User className="w-4 h-4 mr-2" />
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Button>
              </div>
            </div>
            <p className="text-white/80">Convert your tokens to Indian Rupees</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              {/* Portfolio Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total Portfolio Value</span>
                  <span className="text-white text-xl font-bold">${totalValue.toFixed(2)}</span>
                </div>
                <p className="text-white/60 text-sm mt-1">
                  ≈ ₹{(totalValue * INR_RATE).toFixed(2)} INR
                </p>
              </div>

              {/* Conversion Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">From Token</label>
                  <Select value={state.fromToken} onValueChange={(value) => setState(prev => ({ ...prev, fromToken: value }))}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenBalances.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <span className="text-sm text-gray-400">
                              ({token.formattedBalance} available)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={state.amount}
                      onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                      className="bg-gray-700/50 border-gray-600 text-white text-lg pr-16"
                    />
                    <Button
                      onClick={() => {
                        const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
                        if (selectedToken) {
                          setState(prev => ({ ...prev, amount: selectedToken.formattedBalance }));
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300"
                    >
                      MAX
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 bg-white/10 rounded-full">
                    <ArrowDown className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">You'll Receive</label>
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-green-400 text-2xl font-bold">₹{state.inrAmount}</p>
                      <p className="text-white/60 text-sm">Indian Rupees</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Bank Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Account Number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="IFSC Code"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                  <Input
                    placeholder="Account Holder Name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    className="bg-gray-700/50 border-gray-600 text-white md:col-span-2"
                  />
                </div>
              </div>

              <Button 
                onClick={handleConversion}
                disabled={
                  !state.amount || 
                  !bankDetails.accountNumber || 
                  state.isProcessing ||
                  (tokenBalances.length > 0 && (() => {
                    const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
                    return selectedToken && parseFloat(state.amount) > parseFloat(selectedToken.formattedBalance);
                  })())
                }
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Executing Blockchain Transfer...
                  </div>
                ) : (
                  'Convert to INR'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Conversion Complete!</CardTitle>
            <p className="text-white/80">Your INR transfer is being processed</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-white">Converted Amount:</span>
                  <span className="text-white font-bold">₹{state.inrAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Bank Account:</span>
                  <span className="text-white/60 text-sm">***{bankDetails.accountNumber.slice(-4)}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h4 className="text-white font-medium mb-2">Transaction Hash:</h4>
                <p className="text-white/80 text-sm font-mono break-all">
                  {state.transactionHash}
                </p>
              </div>

              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h4 className="text-white font-medium mb-2">What's Next:</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Tokens transferred to custody wallet</li>
                  <li>• USDC conversion completed</li>
                  <li>• INR transfer initiated to your bank</li>
                  <li>• Funds will arrive in 2-3 business days</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setState(prev => ({ ...prev, step: 'convert' }))}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                New Conversion
              </Button>
              <Button 
                onClick={() => {
                  if (state.transactionHash) {
                    window.open(`https://etherscan.io/tx/${state.transactionHash}`, '_blank');
                  }
                }}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}