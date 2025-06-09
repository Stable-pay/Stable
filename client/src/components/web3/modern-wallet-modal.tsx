import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Wallet, Shield, Zap, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Web3PulseLoader, Web3SpinLoader } from '@/components/animations/web3-loader';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed: boolean;
  popular?: boolean;
}

interface ModernWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => void;
  isConnecting: boolean;
  error?: string;
}

export function ModernWalletModal({ 
  isOpen, 
  onClose, 
  onConnect, 
  isConnecting, 
  error 
}: ModernWalletModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'connecting' | 'success'>('select');

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect with MetaMask browser extension',
      installed: typeof window !== 'undefined' && !!(window as any).ethereum,
      popular: true
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect with mobile wallet via QR code',
      installed: true,
      popular: true
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect with Coinbase Wallet',
      installed: true
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      icon: '🌐',
      description: 'Connect with any injected wallet',
      installed: typeof window !== 'undefined' && !!(window as any).ethereum
    }
  ];

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setStep('connecting');
    
    try {
      await onConnect(walletId);
      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('select');
      }, 2000);
    } catch (err) {
      setStep('select');
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Card className="border-0 shadow-2xl bg-white overflow-hidden">
            {/* Header */}
            <CardHeader className="relative pb-6" style={{ backgroundColor: '#6667AB' }}>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <motion.div
                  className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4"
                  animate={{ 
                    scale: step === 'connecting' ? [1, 1.1, 1] : 1,
                    rotate: step === 'connecting' ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: step === 'connecting' ? Infinity : 0 
                  }}
                >
                  {step === 'success' ? (
                    <Check className="h-8 w-8 text-white" />
                  ) : (
                    <Wallet className="h-8 w-8 text-white" />
                  )}
                </motion.div>
                
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {step === 'select' && 'Connect Wallet'}
                  {step === 'connecting' && 'Connecting...'}
                  {step === 'success' && 'Connected!'}
                </CardTitle>
                
                <p className="text-white/80">
                  {step === 'select' && 'Choose your preferred wallet to connect'}
                  {step === 'connecting' && `Connecting to ${walletOptions.find(w => w.id === selectedWallet)?.name}`}
                  {step === 'success' && 'Your wallet has been connected successfully'}
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {step === 'select' && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Security Notice */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Secure Connection</p>
                      <p className="text-blue-700">Your wallet stays secure and private</p>
                    </div>
                  </div>

                  {walletOptions.map((wallet) => (
                    <motion.div
                      key={wallet.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-auto p-4 justify-start border-gray-200 hover:border-[#6667AB] hover:bg-[#6667AB]/5"
                        onClick={() => handleWalletSelect(wallet.id)}
                        disabled={!wallet.installed}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="text-2xl">{wallet.icon}</div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{wallet.name}</span>
                              {wallet.popular && (
                                <Badge className="bg-[#6667AB] text-white">Popular</Badge>
                              )}
                              {!wallet.installed && (
                                <Badge variant="outline" className="text-gray-500">
                                  Not Installed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{wallet.description}</p>
                          </div>
                          {wallet.installed ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </Button>
                    </motion.div>
                  ))}

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Zap className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Gasless Swaps</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Secure</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'connecting' && (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Web3PulseLoader size={80} color="#6667AB" />
                  <p className="text-gray-600 mt-4">
                    Please confirm the connection in your wallet
                  </p>
                  {selectedWallet === 'walletconnect' && (
                    <p className="text-sm text-gray-500 mt-2">
                      Scan the QR code with your mobile wallet
                    </p>
                  )}
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Check className="h-10 w-10 text-green-600" />
                  </motion.div>
                  <p className="text-gray-600">
                    Wallet connected successfully! You can now start trading.
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900">Connection Failed</p>
                    <p className="text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}