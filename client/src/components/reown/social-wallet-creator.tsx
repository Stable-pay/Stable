import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Mail, UserCheck, Wallet, Shield, Zap } from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

interface SocialWalletCreatorProps {
  onWalletCreated: () => void;
  isVisible: boolean;
}

export function SocialWalletCreator({ onWalletCreated, isVisible }: SocialWalletCreatorProps) {
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Monitor connection state for successful wallet creation
  useEffect(() => {
    if (isConnected && address && isCreating) {
      console.log('Wallet created successfully:', address);
      setIsCreating(false);
      setSelectedProvider(null);
      onWalletCreated();
    }
  }, [isConnected, address, isCreating, onWalletCreated]);

  const handleSocialLogin = async (provider: string) => {
    try {
      setIsCreating(true);
      setSelectedProvider(provider);
      console.log(`Initiating wallet creation with ${provider}...`);
      
      // Open AppKit modal for wallet creation
      await open();
      
    } catch (error) {
      console.error('Error creating wallet:', error);
      setIsCreating(false);
      setSelectedProvider(null);
    }
  };

  if (!isVisible) return null;

  if (isCreating) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Creating Your Wallet</h3>
          <p className="text-gray-600 mb-6">
            {selectedProvider ? `Setting up with ${selectedProvider}...` : 'Complete the process in the popup window'}
          </p>
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure authentication</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Generating wallet keys...</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Setting up account</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-card border-border shadow-xl">
      <CardHeader className="text-center pb-6 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
          <UserCheck className="w-8 h-8" />
          Create Your Wallet
        </CardTitle>
        <p className="text-primary-foreground/90 mt-2">
          Create a secure Web3 wallet with social login - no seed phrase required
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Single Wallet Creation Button */}
        <div className="space-y-4">
          <Button 
            onClick={() => handleSocialLogin('Wallet Creation')}
            className="w-full h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group border-0"
          >
            <Wallet className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
            Create Wallet with Social Login
            <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-center text-muted-foreground text-sm">
            Choose from Google, Apple, Email, Discord, or other providers in the next step
          </p>
        </div>

        {/* Benefits */}
        <div className="p-4 bg-muted rounded-lg border border-border">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-secondary flex-shrink-0" />
              <span className="text-foreground text-sm font-medium">Self-custodial - you control your private keys</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-secondary flex-shrink-0" />
              <span className="text-foreground text-sm font-medium">Instant creation with social authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-secondary flex-shrink-0" />
              <span className="text-foreground text-sm font-medium">No seed phrase to memorize or store</span>
            </div>
          </div>
        </div>

        <div className="text-center text-muted-foreground text-xs">
          <p>Powered by Reown AppKit • Enterprise-grade security • Self-custodial</p>
        </div>
      </CardContent>
    </Card>
  );
}