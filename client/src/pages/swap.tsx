import ProductionSwapInterface from '@/components/swap/production-swap-interface';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown, Zap, Shield, Sparkles } from 'lucide-react';
import { useParticleWallet } from '@/hooks/use-particle-wallet';

export default function SwapParticle() {
  const { isConnected } = useParticleWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Particle Network Swap
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Experience gasless token swaps with Account Abstraction and sponsored transactions 
            powered by Particle Network's advanced blockchain infrastructure.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <ProductionSwapInterface />
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center p-4">
              <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold">Account Abstraction</h3>
              <p className="text-sm text-gray-600">Smart contract wallets with enhanced security</p>
            </Card>
            
            <Card className="text-center p-4">
              <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold">Gasless Transactions</h3>
              <p className="text-sm text-gray-600">Zero gas fees with paymaster sponsorship</p>
            </Card>
            
            <Card className="text-center p-4">
              <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold">Multi-Chain Support</h3>
              <p className="text-sm text-gray-600">Seamless swaps across 6+ networks</p>
            </Card>
          </div>

          {isConnected && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 text-purple-800 mb-4">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Particle Network Features</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900">Smart Account Benefits:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Social login integration</li>
                      <li>• Recovery mechanisms</li>
                      <li>• Batch transactions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Swap Advantages:</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• No gas fee worries</li>
                      <li>• MEV protection</li>
                      <li>• Optimal routing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}