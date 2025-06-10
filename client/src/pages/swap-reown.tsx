import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUpDown, Wallet, Zap, Shield } from 'lucide-react';

export default function SwapReown() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  const handleOpenSwap = () => {
    open({ view: 'OnRampProviders' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Token Swap
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Swap tokens seamlessly across multiple chains using Reown AppKit's 
            built-in swap functionality with optimal routing and security.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ArrowUpDown className="w-6 h-6 text-blue-600" />
                Reown AppKit Swaps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Connect your wallet to access Reown's built-in swap functionality
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">Secure Multi-Chain Swapping</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Powered by Reown AppKit with automatic routing optimization,
                      gasless transactions, and cross-chain support.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-blue-900">Fast Execution</div>
                    <div className="text-sm text-blue-700">Optimal routing</div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-green-900">Secure</div>
                    <div className="text-sm text-green-700">Built-in security</div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <ArrowUpDown className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="font-semibold text-purple-900">Multi-Chain</div>
                    <div className="text-sm text-purple-700">Cross-chain swaps</div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleOpenSwap} 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!isConnected}
                >
                  <ArrowUpDown className="w-5 h-5 mr-2" />
                  Open Reown Swap
                </Button>
              </div>

              {!isConnected && (
                <div className="text-center">
                  <Button 
                    onClick={() => open()} 
                    variant="outline"
                    size="lg"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet First
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}