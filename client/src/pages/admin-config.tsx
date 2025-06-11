import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Check, AlertCircle, Copy } from 'lucide-react';
import { ADMIN_WALLETS } from '@shared/admin-wallets';

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  137: 'Polygon',
  56: 'BSC (Binance Smart Chain)',
  42161: 'Arbitrum One',
  10: 'Optimism',
  8453: 'Base'
};

export function AdminConfig() {
  const [walletAddresses, setWalletAddresses] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load current admin wallet addresses
    setWalletAddresses({ ...ADMIN_WALLETS });
  }, []);

  const handleAddressChange = (chainId: number, address: string) => {
    setWalletAddresses(prev => ({
      ...prev,
      [chainId]: address
    }));
  };

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const saveConfiguration = async () => {
    setIsLoading(true);
    setSaveStatus('idle');

    try {
      // Validate all addresses
      const invalidAddresses = Object.entries(walletAddresses)
        .filter(([_, address]) => address && !isValidAddress(address))
        .map(([chainId]) => CHAIN_NAMES[parseInt(chainId)]);

      if (invalidAddresses.length > 0) {
        alert(`Invalid wallet addresses for: ${invalidAddresses.join(', ')}`);
        setSaveStatus('error');
        return;
      }

      // Send configuration to backend
      const response = await fetch('/api/admin/configure-wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletAddresses)
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Configuration save failed:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              Admin Wallet Configuration
            </CardTitle>
            <p className="text-white/80">
              Configure your controlled wallet addresses for each supported blockchain network.
              These wallets will receive user tokens during INR withdrawals.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              {Object.entries(CHAIN_NAMES).map(([chainId, chainName]) => {
                const numericChainId = parseInt(chainId);
                const currentAddress = walletAddresses[numericChainId] || '';
                const isValid = !currentAddress || isValidAddress(currentAddress);
                const isConfigured = currentAddress && isValidAddress(currentAddress);

                return (
                  <div key={chainId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{chainName}</h3>
                        <Badge variant={isConfigured ? "default" : "secondary"} className={
                          isConfigured ? "bg-green-600" : "bg-yellow-600"
                        }>
                          Chain ID: {chainId}
                        </Badge>
                        {isConfigured && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Configured
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="0x... (Your controlled wallet address)"
                          value={currentAddress}
                          onChange={(e) => handleAddressChange(numericChainId, e.target.value)}
                          className={`flex-1 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 ${
                            !isValid ? 'border-red-500' : isConfigured ? 'border-green-500' : ''
                          }`}
                        />
                        {currentAddress && (
                          <Button
                            onClick={() => copyToClipboard(currentAddress)}
                            variant="outline"
                            size="sm"
                            className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {!isValid && (
                        <p className="text-red-400 text-sm">
                          Please enter a valid Ethereum wallet address (42 characters starting with 0x)
                        </p>
                      )}

                      <p className="text-white/60 text-sm">
                        This address will receive {chainName === 'Ethereum Mainnet' ? 'ETH and ERC-20 tokens' : 
                        chainName === 'Polygon' ? 'MATIC and Polygon tokens' :
                        chainName === 'BSC (Binance Smart Chain)' ? 'BNB and BEP-20 tokens' :
                        chainName === 'Arbitrum One' ? 'ETH and Arbitrum tokens' :
                        chainName === 'Optimism' ? 'ETH and Optimism tokens' :
                        'ETH and Base tokens'} during user withdrawals.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/20">
              <div className="text-white/60 text-sm">
                {Object.values(walletAddresses).filter(addr => addr && isValidAddress(addr)).length} of {Object.keys(CHAIN_NAMES).length} chains configured
              </div>

              <Button
                onClick={saveConfiguration}
                disabled={isLoading || Object.values(walletAddresses).some(addr => addr && !isValidAddress(addr))}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>

            {saveStatus === 'success' && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-300">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Configuration saved successfully!</span>
                </div>
                <p className="text-green-200 text-sm mt-1">
                  Your admin wallet addresses have been updated and are now active for user withdrawals.
                </p>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Failed to save configuration</span>
                </div>
                <p className="text-red-200 text-sm mt-1">
                  Please check your addresses and try again.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}