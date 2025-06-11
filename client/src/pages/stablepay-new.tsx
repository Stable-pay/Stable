import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, Shield, Banknote, Clock, CheckCircle, Wallet, Zap, ExternalLink, LogOut, User, Network, RefreshCw } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useSimpleBalances } from '@/hooks/use-simple-balances';
import { useSimpleTransfer } from '@/hooks/use-simple-transfer';

interface ConversionState {
  step: 'connect' | 'kyc' | 'convert' | 'complete';
  fromToken: string;
  amount: string;
  usdcAmount: string;
  inrAmount: string;
  isProcessing: boolean;
}

export function StablePayNew() {
  const { open } = useAppKit();
  const { address, isConnected, chainId, chainName } = useWalletConnection();
  const { balances, isLoading: balancesLoading, totalValue, refetch } = useSimpleBalances(address, chainId);
  const { transferState, executeTransfer, resetTransfer } = useSimpleTransfer();

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
    accountNumber: '1234567890',
    ifscCode: 'HDFC0000123',
    accountHolder: 'John Doe',
    bankName: 'HDFC Bank'
  });

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Update step based on connection status
  useEffect(() => {
    if (isConnected && address) {
      setState(prev => ({ ...prev, step: kycStatus === 'verified' ? 'convert' : 'kyc' }));
    } else {
      setState(prev => ({ ...prev, step: 'connect' }));
    }
  }, [isConnected, address, kycStatus]);

  // Calculate conversions
  useEffect(() => {
    if (state.amount && selectedToken) {
      const usdcAmount = parseFloat(state.amount) * (selectedToken.symbol === 'USDC' ? 1 : getTokenToUSDCRate(selectedToken.symbol));
      const inrAmount = usdcAmount * 83; // USD to INR rate
      
      setState(prev => ({
        ...prev,
        usdcAmount: usdcAmount.toFixed(2),
        inrAmount: inrAmount.toFixed(2)
      }));
    }
  }, [state.amount, selectedToken]);

  const getTokenToUSDCRate = (symbol: string): number => {
    const rates: Record<string, number> = {
      ETH: 2000,
      MATIC: 0.8,
      BNB: 250,
      USDT: 1,
      DAI: 1,
      USDC: 1
    };
    return rates[symbol] || 1;
  };

  const handleKYCSubmit = async () => {
    setKycStatus('pending');
    
    try {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+91 9876543210'
        })
      });

      if (response.ok) {
        setTimeout(() => {
          setKycStatus('verified');
          setState(prev => ({ ...prev, step: 'convert' }));
        }, 2000);
      }
    } catch (error) {
      console.error('KYC submission failed:', error);
    }
  };

  const handleTokenSelect = (tokenSymbol: string) => {
    const token = balances.find(t => t.symbol === tokenSymbol);
    if (token) {
      setSelectedToken(token);
      setState(prev => ({ ...prev, fromToken: tokenSymbol }));
    }
  };

  const handleTransfer = async () => {
    if (!selectedToken || !state.amount) return;

    try {
      const txHash = await executeTransfer(
        selectedToken.address,
        state.amount,
        chainId,
        address!
      );

      if (txHash) {
        setShowTransferModal(true);
        // Refresh balances after successful transfer
        setTimeout(() => {
          refetch();
        }, 3000);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  const getExplorerUrl = (txHash: string): string => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
      42161: 'https://arbiscan.io/tx/',
      10: 'https://optimistic.etherscan.io/tx/',
      43114: 'https://snowtrace.io/tx/',
      1337: 'http://localhost:8545/tx/'
    };
    return `${explorers[chainId] || explorers[1]}${txHash}`;
  };

  // Connect Wallet Step
  if (state.step === 'connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              StablePay
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Convert crypto to INR instantly
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Wallet className="w-16 h-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Connect your wallet to start converting crypto to INR
              </p>
            </div>
            
            <Button onClick={() => open()} className="w-full" size="lg">
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KYC Step
  if (state.step === 'kyc') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Complete KYC Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {kycStatus === 'pending' ? 'Verifying...' : 'Verify Your Identity'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {kycStatus === 'pending' 
                  ? 'Your KYC is being processed. This usually takes a few seconds.'
                  : 'Complete KYC verification to enable INR withdrawals'
                }
              </p>
            </div>

            {kycStatus === 'pending' ? (
              <div className="flex items-center justify-center">
                <Clock className="w-5 h-5 animate-spin mr-2" />
                <span>Processing...</span>
              </div>
            ) : (
              <Button onClick={handleKYCSubmit} className="w-full" size="lg">
                <Shield className="w-5 h-5 mr-2" />
                Start KYC Verification
              </Button>
            )}

            <div className="text-center pt-4">
              <Button variant="ghost" onClick={() => open()}>
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Conversion Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">StablePay</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Connected to {chainName}</p>
              <p className="text-xs text-gray-500">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
            </div>
            <Button variant="outline" onClick={() => open()}>
              <User className="w-4 h-4 mr-2" />
              Wallet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Portfolio</span>
                <Button variant="ghost" size="sm" onClick={refetch} disabled={balancesLoading}>
                  <RefreshCw className={`w-4 h-4 ${balancesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Your Tokens</h4>
                  {balancesLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500">Loading balances...</p>
                    </div>
                  ) : balances.length > 0 ? (
                    balances.map((token) => (
                      <div
                        key={token.address}
                        className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => handleTokenSelect(token.symbol)}
                      >
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-xs text-gray-500">{token.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{parseFloat(token.formattedBalance).toFixed(4)}</p>
                          <p className="text-xs text-gray-500">${token.usdValue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No tokens found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Interface */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Convert to INR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Token */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <div className="space-y-2">
                  <Select value={state.fromToken} onValueChange={handleTokenSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.map((token) => (
                        <SelectItem key={token.address} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <span>{token.symbol}</span>
                            <span className="text-xs text-gray-500">
                              Balance: {parseFloat(token.formattedBalance).toFixed(4)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={state.amount}
                    onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-gray-400" />
              </div>

              {/* To INR */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To INR</label>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold">₹{state.inrAmount}</div>
                  <div className="text-sm text-gray-500">
                    ≈ ${state.usdcAmount} USDC
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Banknote className="w-4 h-4 mr-2" />
                  Bank Account Details
                </h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Account:</span> {bankDetails.accountNumber}</p>
                  <p><span className="text-gray-600">IFSC:</span> {bankDetails.ifscCode}</p>
                  <p><span className="text-gray-600">Name:</span> {bankDetails.accountHolder}</p>
                  <p><span className="text-gray-600">Bank:</span> {bankDetails.bankName}</p>
                </div>
              </div>

              {/* Transfer Button */}
              <Button 
                onClick={handleTransfer}
                disabled={!selectedToken || !state.amount || transferState.isTransferring}
                className="w-full"
                size="lg"
              >
                {transferState.isTransferring ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {transferState.step === 'validating' && 'Validating...'}
                    {transferState.step === 'approving' && 'Please sign transaction...'}
                    {transferState.step === 'transferring' && 'Processing...'}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Convert & Transfer
                  </>
                )}
              </Button>

              {/* Transfer Status */}
              {transferState.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{transferState.error}</p>
                </div>
              )}

              {transferState.step === 'completed' && transferState.transactionHash && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="font-semibold text-green-700 dark:text-green-300">Transfer Completed!</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                    Your tokens have been transferred to the custody wallet. INR will be deposited to your bank account within 1-2 business days.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getExplorerUrl(transferState.transactionHash!), '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Transaction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}