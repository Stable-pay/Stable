import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Mail, UserCheck, Wallet, Shield, Zap, Chrome, Apple } from 'lucide-react';
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
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-xl">
      <CardHeader className="text-center pb-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
          <UserCheck className="w-8 h-8" />
          Create Your Wallet
        </CardTitle>
        <p className="text-emerald-100 mt-2">
          Choose your preferred sign-up method to create a secure Web3 wallet
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Social Login Options */}
        <div className="space-y-3">
          <Button 
            onClick={() => handleSocialLogin('Google')}
            variant="outline"
            className="w-full h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 text-gray-700 transition-all duration-200 group"
          >
            <div className="w-6 h-6 mr-3 bg-white rounded-full flex items-center justify-center border">
              <span className="text-blue-600 text-sm font-bold">G</span>
            </div>
            Continue with Google
            <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button 
            onClick={() => handleSocialLogin('Apple')}
            variant="outline"
            className="w-full h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-400 text-gray-700 transition-all duration-200 group"
          >
            <Apple className="w-6 h-6 mr-3 text-gray-800" />
            Continue with Apple
            <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button 
            onClick={() => handleSocialLogin('Email')}
            variant="outline"
            className="w-full h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 text-gray-700 transition-all duration-200 group"
          >
            <Mail className="w-6 h-6 mr-3 text-emerald-600" />
            Continue with Email
            <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button 
            onClick={() => handleSocialLogin('Discord')}
            variant="outline"
            className="w-full h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-indigo-300 text-gray-700 transition-all duration-200 group"
          >
            <div className="w-6 h-6 mr-3 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            Continue with Discord
            <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
          </Button>

          <Button 
            onClick={() => handleSocialLogin('GitHub')}
            variant="outline"
            className="w-full h-14 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-400 text-gray-700 transition-all duration-200 group"
          >
            <div className="w-6 h-6 mr-3 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            Continue with GitHub
            <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Benefits */}
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-800 text-sm font-medium">Self-custodial - you control your keys</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 text-sm font-medium">Instant wallet creation</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span className="text-purple-800 text-sm font-medium">No seed phrase to remember</span>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-xs">
          <p>Powered by Reown AppKit • Secure authentication • Self-custodial wallet</p>
        </div>
      </CardContent>
    </Card>
  );
}