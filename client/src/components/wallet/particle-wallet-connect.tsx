import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Zap, 
  Shield, 
  ArrowUpDown,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useParticleWallet } from '@/hooks/use-particle-wallet';
import { useToast } from '@/hooks/use-toast';

export default function ParticleWalletConnect() {
  const { 
    isConnected, 
    address, 
    chainId, 
    balances, 
    isLoading, 
    isLoadingBalances,
    error,
    connect, 
    disconnect, 
    switchChain,
    refreshBalances,
    getTotalValue
  } = useParticleWallet();
  
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState(1);

  const networks = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 56, name: 'BSC', symbol: 'BNB' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
    { id: 10, name: 'Optimism', symbol: 'ETH' }
  ];

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Particle Network"
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet"
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive"
      });
    }
  };

  const handleSwitchNetwork = async (networkId: number) => {
    try {
      await switchChain(networkId);
      setSelectedChain(networkId);
      toast({
        title: "Network Switched",
        description: `Switched to ${networks.find(n => n.id === networkId)?.name}`
      });
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch network",
        variant: "destructive"
      });
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard"
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-gradient">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <Wallet className="h-6 w-6 text-cyan-500" />
              Connect Wallet
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect your wallet to access all features
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <Shield className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="font-medium text-sm">Secure Authentication</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Powered by Particle Network
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Zap className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">Gasless Transactions</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Smart Account integration
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <ArrowUpDown className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Multi-Chain Support</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Ethereum, Polygon, BSC & more
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button 
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-600 hover:to-green-600"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card className="border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-cyan-500" />
              Connected Wallet
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {address && formatAddress(address)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyAddress}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a 
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Current Network</span>
            <Badge variant="outline">
              {networks.find(n => n.id === chainId)?.name || 'Unknown'}
            </Badge>
          </div>

          <div className="flex justify-between">
            <Button onClick={handleDisconnect} variant="outline" size="sm">
              Disconnect
            </Button>
            <Button 
              onClick={refreshBalances} 
              variant="outline" 
              size="sm"
              disabled={isLoadingBalances}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingBalances ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Switch Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {networks.map((network) => (
              <motion.button
                key={network.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSwitchNetwork(network.id)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  chainId === network.id
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <p className="font-medium text-sm">{network.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{network.symbol}</p>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Token Balances</span>
            <Badge variant="outline">
              Total: ${getTotalValue().toFixed(2)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBalances ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div>
                      <div className="w-16 h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="w-12 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="w-20 h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          ) : balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((balance, index) => (
                <motion.div
                  key={`${balance.chainId}-${balance.address}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {balance.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{balance.symbol}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {balance.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{balance.formattedBalance}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      ${balance.usdValue.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">No token balances found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Make sure you're connected to the right network
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}