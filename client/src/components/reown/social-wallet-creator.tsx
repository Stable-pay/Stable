import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, UserCheck, Wallet, Shield, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppKit, useAppKitAccount, useAppKitState } from '@reown/appkit/react';

interface SocialWalletCreatorProps {
  onWalletCreated: () => void;
  isVisible: boolean;
}

export function SocialWalletCreator({ onWalletCreated, isVisible }: SocialWalletCreatorProps) {
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { loading } = useAppKitState();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monitor connection state for successful wallet creation
  useEffect(() => {
    if (isConnected && address && isCreating) {
      console.log('Wallet created successfully:', address);
      setIsCreating(false);
      setError(null);
      // Add a small delay to ensure the connection is stable
      setTimeout(() => {
        onWalletCreated();
      }, 1000);
    }
  }, [isConnected, address, isCreating, onWalletCreated]);

  // Monitor for connection errors
  useEffect(() => {
    if (!loading && !isConnected && isCreating) {
      // If we're not loading, not connected, but were trying to create
      const timer = setTimeout(() => {
        if (!isConnected) {
          setError('Wallet creation was cancelled or failed. Please try again.');
          setIsCreating(false);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, isConnected, isCreating]);

  const handleWalletCreation = useCallback(async () => {
    try {
      setIsCreating(true);
      setError(null);
      console.log('Opening wallet creation modal...');
      
      // Open AppKit modal for wallet creation
      await open();
      
    } catch (error) {
      console.error('Error opening wallet creation modal:', error);
      setError('Failed to open wallet creation. Please try again.');
      setIsCreating(false);
    }
  }, [open]);

  const handleRetry = () => {
    setError(null);
    handleWalletCreation();
  };

  if (!isVisible) return null;

  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto bg-card border-border shadow-xl">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Wallet Creation Failed</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => {
                setError(null);
                setIsCreating(false);
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isCreating) {
    return (
      <Card className="w-full max-w-lg mx-auto bg-card border-border shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Creating Your Wallet</h3>
          <p className="text-muted-foreground mb-6">
            Complete the wallet creation process in the popup window
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span>Opening wallet creation modal</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span>Waiting for wallet setup...</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span>Account will be ready shortly</span>
            </div>
          </div>
          <Button 
            onClick={() => {
              setIsCreating(false);
              setError('Wallet creation was cancelled by user.');
            }}
            variant="outline"
            className="mt-6"
          >
            Cancel
          </Button>
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
            onClick={handleWalletCreation}
            disabled={isCreating}
            className="w-full h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group border-0 disabled:opacity-70"
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