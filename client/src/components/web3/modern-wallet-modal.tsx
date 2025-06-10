import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Smartphone, 
  Globe, 
  Shield, 
  Zap, 
  ArrowRight,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Web3SpinLoader } from '@/components/animations/web3-loader';

interface ModernWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletId: string) => void;
  isConnecting: boolean;
}

const popularWallets = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Most popular browser wallet',
    icon: '🦊',
    color: '#F6851B',
    features: ['Browser Extension', 'Mobile App', 'Hardware Support']
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect any mobile wallet',
    icon: '📱',
    color: '#3B99FC',
    features: ['QR Code', 'Mobile Wallets', 'Cross-Platform']
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Secure and easy to use',
    icon: '🔵',
    color: '#0052FF',
    features: ['Built-in DeFi', 'NFT Support', 'Easy Onboarding']
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    description: 'Multi-chain mobile wallet',
    icon: '🛡️',
    color: '#3375BB',
    features: ['Mobile First', 'Multi-Chain', 'DApp Browser']
  }
];

export function ModernWalletModal({ isOpen, onClose, onConnect, isConnecting }: ModernWalletModalProps) {
  const handleWalletClick = (walletId: string) => {
    onConnect(walletId);
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
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
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DialogHeader className="text-center pb-6">
                <motion.div
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ backgroundColor: '#6667AB' }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Wallet className="h-8 w-8 text-white" />
                </motion.div>
                
                <DialogTitle className="text-3xl font-bold mb-2" style={{ color: '#6667AB' }}>
                  Connect Your Wallet
                </DialogTitle>
                <p className="text-gray-600 text-lg">
                  Choose your preferred wallet to get started
                </p>
              </DialogHeader>

              {isConnecting ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Web3SpinLoader size={60} color="#6667AB" />
                  <h3 className="text-xl font-semibold mt-6 mb-2" style={{ color: '#6667AB' }}>
                    Connecting Wallet
                  </h3>
                  <p className="text-gray-600">
                    Please approve the connection in your wallet
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {/* Popular Wallets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {popularWallets.map((wallet, index) => (
                      <motion.div
                        key={wallet.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className="cursor-pointer border-2 border-gray-200 hover:border-[#6667AB] transition-all duration-300 hover:shadow-lg"
                          onClick={() => handleWalletClick(wallet.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div 
                                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                  style={{ backgroundColor: `${wallet.color}20` }}
                                >
                                  {wallet.icon}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg" style={{ color: '#6667AB' }}>
                                    {wallet.name}
                                  </h3>
                                  <p className="text-gray-600 text-sm">
                                    {wallet.description}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {wallet.features.map((feature, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="secondary" 
                                  className="text-xs bg-gray-100 text-gray-700"
                                >
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Security Info */}
                  <motion.div
                    variants={itemVariants}
                    className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="h-5 w-5" style={{ color: '#6667AB' }} />
                      <h4 className="font-semibold" style={{ color: '#6667AB' }}>
                        Your Security is Our Priority
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>End-to-end encryption</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>No private key storage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Open source protocol</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Help Section */}
                  <motion.div
                    variants={itemVariants}
                    className="mt-6 text-center"
                  >
                    <p className="text-sm text-gray-500 mb-3">
                      Don't have a wallet yet?
                    </p>
                    <Button
                      variant="outline"
                      className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white"
                      onClick={() => window.open('https://metamask.io/', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get MetaMask
                    </Button>
                  </motion.div>

                  {/* Additional Features */}
                  <motion.div
                    variants={itemVariants}
                    className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Secure</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Zap className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Fast</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Globe className="h-4 w-4" style={{ color: '#6667AB' }} />
                      <span>Global</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}