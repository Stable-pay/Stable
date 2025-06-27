import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, ExternalLink, Copy, CheckCircle } from 'lucide-react';

interface SolanaWallet {
  name: string;
  icon: string;
  adapter: any;
  readyState: string;
}

interface SolanaWalletConnectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: any) => void;
}

export function SolanaWalletConnector({ isOpen, onClose, onConnect }: SolanaWalletConnectorProps) {
  const [solanaWallets, setSolanaWallets] = useState<SolanaWallet[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<any>(null);

  useEffect(() => {
    // Detect available Solana wallets
    const detectWallets = () => {
      const detectedWallets: SolanaWallet[] = [];
      
      // Check for Phantom
      if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
        detectedWallets.push({
          name: 'Phantom',
          icon: '/phantom-logo.svg',
          adapter: (window as any).phantom.solana,
          readyState: 'Installed'
        });
      }
      
      // Check for Solflare
      if (typeof window !== 'undefined' && (window as any).solflare) {
        detectedWallets.push({
          name: 'Solflare',
          icon: 'https://solflare.com/favicon.ico',
          adapter: (window as any).solflare,
          readyState: 'Installed'
        });
      }
      
      // Check for Backpack
      if (typeof window !== 'undefined' && (window as any).backpack) {
        detectedWallets.push({
          name: 'Backpack',
          icon: 'https://backpack.app/favicon.ico',
          adapter: (window as any).backpack,
          readyState: 'Installed'
        });
      }
      
      // Add downloadable wallets if not installed
      if (!detectedWallets.find(w => w.name === 'Phantom')) {
        detectedWallets.push({
          name: 'Phantom',
          icon: '/phantom-logo.svg',
          adapter: null,
          readyState: 'NotDetected'
        });
      }
      
      if (!detectedWallets.find(w => w.name === 'Solflare')) {
        detectedWallets.push({
          name: 'Solflare',
          icon: 'https://solflare.com/favicon.ico',
          adapter: null,
          readyState: 'NotDetected'
        });
      }
      
      setSolanaWallets(detectedWallets);
    };

    if (isOpen) {
      detectWallets();
    }
  }, [isOpen]);

  const connectWallet = async (wallet: SolanaWallet) => {
    if (wallet.readyState === 'NotDetected') {
      // Open download page
      const downloadUrls: Record<string, string> = {
        'Phantom': 'https://phantom.app/download',
        'Solflare': 'https://solflare.com/download',
        'Backpack': 'https://backpack.app/download'
      };
      window.open(downloadUrls[wallet.name], '_blank');
      return;
    }

    if (!wallet.adapter) return;

    setConnecting(wallet.name);
    
    try {
      // Connect to Solana wallet
      const response = await wallet.adapter.connect();
      const publicKey = response?.publicKey || wallet.adapter.publicKey;
      
      if (publicKey) {
        const walletInfo = {
          address: publicKey.toString(),
          name: wallet.name,
          adapter: wallet.adapter,
          network: 'solana'
        };
        
        setConnected(walletInfo);
        onConnect(walletInfo);
        
        // Store connection info
        localStorage.setItem('solana-wallet', JSON.stringify({
          name: wallet.name,
          address: publicKey.toString()
        }));
      }
    } catch (error) {
      console.error('Failed to connect to Solana wallet:', error);
    } finally {
      setConnecting(null);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#FCFBF4] border-[#6667AB]/30">
        <DialogHeader>
          <DialogTitle className="text-[#6667AB] flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Solana Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {connected ? (
            <Card className="bg-[#6667AB]/10 border-[#6667AB]/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6667AB] flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-[#FCFBF4]" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#6667AB]">{connected.name}</div>
                      <div className="text-sm text-[#6667AB]/70 font-mono">
                        {connected.address.slice(0, 8)}...{connected.address.slice(-6)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAddress(connected.address)}
                    className="text-[#6667AB]"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Badge className="mt-2 bg-green-500 text-white">
                  Connected to Solana
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {solanaWallets.map((wallet) => (
                <Card 
                  key={wallet.name}
                  className="border-[#6667AB]/30 hover:border-[#6667AB]/50 transition-colors cursor-pointer"
                  onClick={() => connectWallet(wallet)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={wallet.icon} 
                          alt={wallet.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-semibold text-[#6667AB]">{wallet.name}</div>
                          <div className="text-sm text-[#6667AB]/70">
                            {wallet.readyState === 'Installed' ? 'Detected' : 'Not installed'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {wallet.readyState === 'Installed' ? (
                          <Badge className="bg-[#6667AB] text-[#FCFBF4]">
                            {connecting === wallet.name ? 'Connecting...' : 'Connect'}
                          </Badge>
                        ) : (
                          <ExternalLink className="w-4 h-4 text-[#6667AB]/70" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-center">
            <p className="text-sm text-[#6667AB]/70">
              Solana wallets connect directly without WalletConnect restrictions
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}