import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Shield, Banknote, Clock, CheckCircle, Wallet, Zap, ExternalLink, LogOut, User, Network, RefreshCw } from 'lucide-react';
import { TransferStatusModal } from '@/components/transfer-status-modal';
import { DirectTransferModal } from '@/components/direct-transfer-modal';
import { useAppKit, useAppKitAccount, useAppKitState, useAppKitNetwork } from '@reown/appkit/react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useWithdrawalTransfer } from '@/hooks/use-withdrawal-transfer';
import { useSmartContractWithdrawal } from '@/hooks/use-smart-contract-withdrawal';
import { useSimpleTokenTransfer } from '@/hooks/use-simple-token-transfer';
import { useDebugTransfer } from '@/hooks/use-debug-transfer';
import { useDirectTransfer } from '@/hooks/use-direct-transfer';
// import { useAutoConsentWithdrawal } from '@/hooks/use-auto-consent-withdrawal';


interface ConversionState {
  step: 'connect' | 'kyc' | 'convert' | 'complete';
  fromToken: string;
  amount: string;
  usdcAmount: string;
  inrAmount: string;
  isProcessing: boolean;
}

export function StablePayWalletConnect() {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { tokenBalances, isLoading: balancesLoading, refreshBalances, totalValue } = useWalletBalances();
  const { transferState, executeTransfer, resetTransferState } = useWithdrawalTransfer();
  const { withdrawalState, initiateWithdrawal, resetState: resetSmartContractState } = useSmartContractWithdrawal();
  const { transferState: simpleTokenState, executeTransfer: executeSimpleTokenTransfer, resetTransferState: resetSimpleTokenState } = useSimpleTokenTransfer();
  const { debugState, debugTransfer, resetDebug } = useDebugTransfer();
  const { transferState: directTransferState, executeDirectTransfer, resetTransferState: resetDirectTransferState } = useDirectTransfer();

  
  const [state, setState] = useState<ConversionState>({
    step: 'connect',
    fromToken: 'ETH',
    amount: '',
    usdcAmount: '',
    inrAmount: '',
    isProcessing: false
  });

  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDirectTransferModal, setShowDirectTransferModal] = useState(false);

  const INR_RATE = 83.25; // 1 USDC = 83.25 INR

  // Update step based on wallet connection
  useEffect(() => {
    if (isConnected && state.step === 'connect') {
      setState(prev => ({ ...prev, step: 'kyc' }));
    } else if (!isConnected) {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [isConnected, state.step]);

  // Calculate conversion rates using real token data
  useEffect(() => {
    const calculateConversion = async () => {
      if (!state.amount || !isConnected || !tokenBalances.length) return;

      try {
        const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
        if (!selectedToken) return;

        // Calculate USD value of the input amount
        const amountValue = parseFloat(state.amount);
        const tokenPrice = selectedToken.usdValue / parseFloat(selectedToken.formattedBalance);
        const usdValue = amountValue * tokenPrice;
        
        // Convert USD to USDC (1:1 for simplicity)
        const usdcAmount = usdValue.toFixed(6);
        const inrValue = (usdValue * INR_RATE).toFixed(2);
        
        setState(prev => ({
          ...prev,
          usdcAmount: usdcAmount,
          inrAmount: inrValue
        }));
      } catch (error) {
        console.error('Failed to calculate conversion:', error);
      }
    };

    if (state.amount && isConnected && tokenBalances.length > 0) {
      const timer = setTimeout(calculateConversion, 500);
      return () => clearTimeout(timer);
    }
  }, [state.amount, state.fromToken, isConnected, tokenBalances]);

  const handleKycStart = async () => {
    if (!address) return;

    try {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      });
      
      if (response.ok) {
        setKycStatus('pending');
        setTimeout(() => {
          setKycStatus('verified');
          setState(prev => ({ ...prev, step: 'convert' }));
        }, 3000);
      }
    } catch (error) {
      console.error('KYC initiation failed:', error);
    }
  };

  const handleConversion = async () => {
    if (!address || !state.amount || !bankDetails.accountNumber) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Find the selected token details
      const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
      if (!selectedToken) {
        throw new Error('Selected token not found in wallet');
      }

      // KYC verification
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

      // Execute direct token transfer to admin wallet
      console.log('Executing token transfer to admin wallet');
      
      let transferHash: string | null = null;

      // Use direct transfer mechanism
      transferHash = await executeDirectTransfer(
        selectedToken.address,
        state.amount
      );

      if (!transferHash) {
        throw new Error('Token transfer to admin wallet failed');
      }

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

      setState(prev => ({ ...prev, step: 'complete', isProcessing: false }));
    } catch (error) {
      console.error('Conversion failed:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      resetTransferState();
      resetSmartContractState();
      resetDirectTransferState();
      resetDirectTransferState();
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
                  <span>Social Login (Google, Apple, X, Discord)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  <span>Multi-chain (Ethereum, Polygon, BSC, Arbitrum)</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => open()}
              disabled={status === 'connecting'}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {status === 'connecting' ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </div>
              )}
            </Button>
            
            <div className="text-center text-white/60 text-sm">
              Choose from wallet apps, browser extensions, or social login
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.step === 'kyc') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl font-bold text-white">KYC Verification</CardTitle>
              <div className="flex items-center gap-2">
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
              <CardTitle className="text-2xl font-bold text-white">Convert Crypto to INR</CardTitle>
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
            <p className="text-white/80">Swap any crypto to USDC, then convert to Indian Rupees</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h3 className="text-white font-medium mb-2">Network</h3>
                <p className="text-white font-bold">{caipNetwork?.name || 'Unknown'}</p>
                <p className="text-white/60 text-sm">Chain ID: {caipNetwork?.id}</p>
              </div>
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Portfolio Value</h3>
                  <Button
                    onClick={refreshBalances}
                    disabled={balancesLoading}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-white/60 hover:text-white"
                  >
                    <RefreshCw className={`w-3 h-3 ${balancesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-green-400 font-bold">${totalValue.toFixed(2)}</p>
                <p className="text-white/60 text-sm">{tokenBalances.length} tokens</p>
              </div>
              <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <h3 className="text-white font-medium mb-2">Status</h3>
                <p className="text-purple-400 font-bold">Connected</p>
                <p className="text-white/60 text-sm">Ready to convert</p>
              </div>
            </div>

            {/* Conversion Form */}
            <div className="space-y-4">
              <div className="p-6 bg-gray-800/50 rounded-lg space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm font-medium">From Token</label>
                    {balancesLoading && (
                      <div className="flex items-center gap-1 text-blue-300 text-xs font-medium">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Loading balances...
                      </div>
                    )}
                  </div>
                  <Select value={state.fromToken} onValueChange={(value) => setState(prev => ({ ...prev, fromToken: value }))}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      {tokenBalances.length > 0 ? (
                        tokenBalances.map((token) => (
                          <SelectItem key={token.address} value={token.symbol} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">
                            <div className="flex items-center justify-between w-full min-w-0">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-medium text-gray-900 dark:text-white">{token.symbol}</span>
                                <span className="text-gray-600 dark:text-gray-300 text-sm truncate">- {token.name}</span>
                              </div>
                              <div className="text-right text-sm ml-4 flex-shrink-0">
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {parseFloat(token.formattedBalance).toFixed(4)}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                  ${token.usdValue.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-tokens" disabled className="text-gray-500 dark:text-gray-400">
                          No tokens found - Connect wallet to see balances
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Available Balance Display */}
                  {tokenBalances.length > 0 && (() => {
                    const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
                    return selectedToken ? (
                      <div className="flex items-center justify-between text-sm p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <span className="text-blue-300 font-medium">Available Balance:</span>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {parseFloat(selectedToken.formattedBalance).toFixed(6)} {selectedToken.symbol}
                          </div>
                          <div className="text-blue-200">
                            ≈ ${selectedToken.usdValue.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white text-sm font-medium">Amount</label>
                    {tokenBalances.length > 0 && (() => {
                      const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
                      return selectedToken ? (
                        <Button
                          onClick={() => setState(prev => ({ ...prev, amount: selectedToken.formattedBalance }))}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 h-auto p-1 text-xs"
                        >
                          Max
                        </Button>
                      ) : null;
                    })()}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={state.amount}
                      onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                      className="bg-gray-700/50 border-gray-600 text-white pr-16"
                      step="any"
                      min="0"
                    />
                    {tokenBalances.length > 0 && (() => {
                      const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
                      return selectedToken ? (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-white/60 text-sm">{selectedToken.symbol}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  
                  {/* Amount validation */}
                  {state.amount && tokenBalances.length > 0 && (() => {
                    const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
                    if (selectedToken && parseFloat(state.amount) > parseFloat(selectedToken.formattedBalance)) {
                      return (
                        <div className="text-red-300 bg-red-500/10 border border-red-500/20 rounded p-2 text-sm font-medium">
                          ⚠️ Insufficient balance. Available: {parseFloat(selectedToken.formattedBalance).toFixed(6)} {selectedToken.symbol}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="w-6 h-6 text-white/60" />
                </div>

                <div className="space-y-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-white">USDC Amount:</span>
                    <span className="text-white font-bold">{state.usdcAmount || '0.00'} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white">INR Amount:</span>
                    <span className="text-white font-bold">₹{state.inrAmount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Exchange Rate:</span>
                    <span className="text-white/60">1 USDC = ₹{INR_RATE}</span>
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
                    Processing Conversion...
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
                <h4 className="text-white font-medium mb-2">What's Next:</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Swap executed on blockchain</li>
                  <li>• USDC transferred to custody wallet</li>
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
                  // Open Reown activity page for transaction history
                  const chainId = parseInt(caipNetwork?.id?.toString() || '1');
                  const activityUrl = `https://app.reown.com/activity/${address}?chainId=${chainId}`;
                  window.open(activityUrl, '_blank');
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                View Wallet <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedToken = tokenBalances.find(t => t.symbol === state.fromToken);
  const chainId = parseInt(caipNetwork?.id?.toString() || '1');
  const adminWallet = directTransferState.step === 'completed' || directTransferState.transactionHash ? 
    '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e' : '';

  return (
    <>
      {showTransferModal && selectedToken && (
        <TransferStatusModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          transferHash={directTransferState.transactionHash}
          tokenSymbol={selectedToken.symbol}
          amount={state.amount}
          inrAmount={state.inrAmount}
          bankAccount={bankDetails.accountNumber}
          adminWallet={adminWallet}
          chainId={chainId}
          step={directTransferState.step}
          error={directTransferState.error || undefined}
        />
      )}
      
      {showDirectTransferModal && selectedToken && (
        <DirectTransferModal
          isOpen={showDirectTransferModal}
          onClose={() => setShowDirectTransferModal(false)}
          transferState={directTransferState}
          tokenSymbol={selectedToken.symbol}
          amount={state.amount}
          chainId={chainId}
        />
      )}
    </>
  );
}