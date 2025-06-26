import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Key,
  Smartphone,
  Mail,
  Chrome,
  Apple,
  Facebook,
  Twitter,
  Github
} from 'lucide-react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: Chrome,
    color: 'bg-red-500 hover:bg-red-600',
    description: 'Sign in with your Google account'
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: Apple,
    color: 'bg-black hover:bg-gray-800',
    description: 'Sign in with your Apple ID'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600 hover:bg-blue-700',
    description: 'Sign in with your Facebook account'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-sky-500 hover:bg-sky-600',
    description: 'Sign in with your Twitter account'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    color: 'bg-gray-800 hover:bg-gray-900',
    description: 'Sign in with your GitHub account'
  }
];

interface SocialWalletCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (walletAddress: string) => void;
}

export function SocialWalletCreator({ isOpen, onClose, onSuccess }: SocialWalletCreatorProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'creating' | 'success' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle wallet creation success
  useEffect(() => {
    if (isConnected && address && step === 'creating') {
      setStep('success');
      setTimeout(() => {
        onSuccess(address);
        onClose();
      }, 2000);
    }
  }, [isConnected, address, step, onSuccess, onClose]);

  // Handle social provider selection
  const handleProviderSelect = async (providerId: string) => {
    setSelectedProvider(providerId);
    setIsCreating(true);
    setStep('creating');

    try {
      // Open Reown AppKit modal which handles social login
      await open();
    } catch (error) {
      console.error('Failed to create wallet:', error);
      setStep('error');
      setErrorMessage('Failed to create wallet. Please try again.');
      setIsCreating(false);
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setStep('select');
    setSelectedProvider(null);
    setIsCreating(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Create Your Wallet
          </DialogTitle>
          <DialogDescription>
            Create a secure wallet using your social account. No seed phrases to remember!
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Benefits */}
              <div className="grid grid-cols-1 gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Secure & encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span>Gasless transactions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-4 w-4 text-purple-600" />
                  <span>No seed phrase needed</span>
                </div>
              </div>

              <Separator />

              {/* Social Providers */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Choose your preferred sign-in method:
                </h4>
                
                {SOCIAL_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider.id)}
                    disabled={isCreating}
                    className={`w-full justify-start gap-3 h-12 ${provider.color} text-white`}
                    variant="default"
                  >
                    <provider.icon className="h-5 w-5" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Continue with {provider.name}</span>
                      <span className="text-xs opacity-90">{provider.description}</span>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Security Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <strong>Secure & Private:</strong> Your social account is only used for authentication. 
                    We never access your personal data or social media content.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'creating' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 space-y-4"
            >
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">Creating Your Wallet</h3>
                <p className="text-muted-foreground text-sm">
                  {selectedProvider && `Authenticating with ${SOCIAL_PROVIDERS.find(p => p.id === selectedProvider)?.name}...`}
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>Generating secure wallet</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <span>Setting up account abstraction</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <span>Enabling gasless transactions</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-green-700">Wallet Created Successfully!</h3>
                <p className="text-muted-foreground text-sm">
                  Your secure wallet is ready to use
                </p>
              </div>

              {address && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Wallet Address:</p>
                  <code className="text-xs font-mono break-all">{address}</code>
                </div>
              )}

              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready for transactions
              </Badge>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-red-700">Creation Failed</h3>
                <p className="text-muted-foreground text-sm">
                  {errorMessage}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setStep('select')}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleClose}
                  variant="default"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Info */}
        {step === 'select' && (
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Already have a wallet?{' '}
              <button 
                onClick={() => {
                  handleClose();
                  open(); // Open regular wallet connection
                }}
                className="text-primary hover:underline"
              >
                Connect existing wallet
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}