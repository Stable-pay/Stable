import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink, AlertTriangle } from 'lucide-react';

interface ParticleWalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: any) => void;
}

export function ParticleWalletConnect({ isOpen, onClose, onConnect }: ParticleWalletConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectParticle = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // Note: Particle Network integration requires proper API keys
      // This is a placeholder implementation
      console.warn('Particle Network integration not fully configured');
      setError('Particle Network integration requires configuration');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Particle Network';
      console.error('Particle connection error:', err);
      setError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#FCFBF4] border-[#6667AB]/30">
        <DialogHeader>
          <DialogTitle className="text-[#6667AB] flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect with Particle Network
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="text-red-800">{error}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#6667AB]/30 hover:border-[#6667AB]/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6667AB] flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#FCFBF4]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#6667AB]">Particle Network</div>
                    <div className="text-sm text-[#6667AB]/70">
                      Social login and account abstraction
                    </div>
                  </div>
                </div>
                <Button
                  onClick={connectParticle}
                  disabled={connecting}
                  className="bg-[#6667AB] hover:bg-[#6667AB]/90 text-[#FCFBF4]"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center">
            <p className="text-sm text-[#6667AB]/70">
              Particle Network provides Web2-like login experience with Web3 features
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}