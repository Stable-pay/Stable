import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Wallet, Shield, Zap, UserCheck, Mail, Chrome, Apple } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';

interface SimpleWalletConnectorProps {
  onWalletCreated: () => void;
  walletType: 'new' | 'existing';
}

export function SimpleWalletConnector({ onWalletCreated, walletType }: SimpleWalletConnectorProps) {
  const { open } = useAppKit();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log(`Connecting ${walletType} wallet...`);
      
      // Open AppKit modal directly
      await open();
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (walletType === 'new') {
    return (
      <Card className="w-full bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <UserCheck className="w-7 h-7 text-blue-400" />
            Create New Wallet
          </CardTitle>
          <p className="text-white/70">
            Create a secure Web3 wallet with social login
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300">Self-custodial - you control your keys</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-green-300">Instant wallet creation</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300">Login with Google, Apple, Email, Discord</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Creating Wallet...</span>
              </div>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Create Wallet with Social Login
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <div className="text-center text-white/60 text-xs">
            <p>Available options: Google • Apple • Email • Discord • GitHub • X</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Wallet className="w-7 h-7 text-green-400" />
          Connect Existing Wallet
        </CardTitle>
        <p className="text-white/70">
          Connect your existing Web3 wallet
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Chrome className="w-4 h-4 text-green-400" />
              <span className="text-green-300">MetaMask, Coinbase Wallet, WalletConnect</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300">Secure connection via WalletConnect</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300">Instant connection</span>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full h-14 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg font-semibold"
        >
          {isConnecting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            <>
              <Wallet className="w-5 h-5 mr-2" />
              Connect Existing Wallet
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <div className="text-center text-white/60 text-xs">
          <p>Supports 300+ wallets via WalletConnect protocol</p>
        </div>
      </CardContent>
    </Card>
  );
}