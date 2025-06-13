import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowRight, Mail, UserCheck, Wallet, Shield, Zap } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';

interface WalletCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletCreated: () => void;
}

export function WalletCreationModal({ isOpen, onClose, onWalletCreated }: WalletCreationModalProps) {
  const { open } = useAppKit();
  const [step, setStep] = useState<'choose' | 'creating' | 'success'>('choose');

  const handleSocialLogin = (provider?: string) => {
    setStep('creating');
    // Open AppKit which will handle the social login flow
    open();
    // Note: We'll need to detect successful connection via the parent component's useEffect
  };

  const handleEmailLogin = () => {
    setStep('creating');
    open();
  };

  if (step === 'creating') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 border-white/20">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-2">Creating Your Wallet</h3>
            <p className="text-white/70 mb-6">
              Complete the authentication process in the popup window
            </p>
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Secure authentication</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Generating wallet keys...</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Setting up account</span>
              </div>
            </div>
            <Button 
              onClick={onClose}
              variant="outline"
              className="mt-6 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-indigo-900/95 border-white/20">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <Wallet className="w-8 h-8 text-blue-400" />
            Create Your Wallet
          </CardTitle>
          <p className="text-white/70 mt-2">
            Choose your preferred sign-up method to create a secure Web3 wallet
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social Login Options */}
          <div className="space-y-3">
            <Button 
              onClick={() => handleSocialLogin('google')}
              variant="outline"
              className="w-full h-14 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="w-6 h-6 mr-3 bg-white rounded-full flex items-center justify-center">
                <span className="text-black text-sm font-bold">G</span>
              </div>
              Continue with Google
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              onClick={() => handleSocialLogin('apple')}
              variant="outline"
              className="w-full h-14 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="w-6 h-6 mr-3 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🍎</span>
              </div>
              Continue with Apple
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              onClick={handleEmailLogin}
              variant="outline"
              className="w-full h-14 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <Mail className="w-6 h-6 mr-3 text-blue-400" />
              Continue with Email
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              onClick={() => handleSocialLogin('discord')}
              variant="outline"
              className="w-full h-14 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="w-6 h-6 mr-3 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">D</span>
              </div>
              Continue with Discord
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm">Self-custodial - you control your keys</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm">Instant wallet creation</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm">No seed phrase to remember</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-white/70 hover:bg-gray-700/50"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}