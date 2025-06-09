import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ComprehensiveTokenSwap } from "@/components/swap/comprehensive-token-swap";
import { ReownWalletConnect } from "@/components/wallet/reown-wallet-connect";
import { TrendingUp, Wallet, Shield, University, AlertCircle, DollarSign, Network, Coins, ArrowUpDown } from "lucide-react";
import { useAccount, useBalance, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { useComprehensiveWalletBalances } from "@/hooks/use-comprehensive-wallet-balances";

export function ComprehensiveWalletDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  
  const { 
    balances, 
    isLoading, 
    currentChainName,
    supportedNetworks,
    totalTokensFound,
    nativeTokenFound,
    erc20TokensFound
  } = useComprehensiveWalletBalances();

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view comprehensive token balances and swap across all supported networks
          </p>
          <ReownWalletConnect />
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-2">Supported Networks:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Ethereum', 'Polygon', 'Arbitrum', 'Base', 'Optimism', 'BNB Chain', 'Avalanche'].map(network => (
                <Badge key={network} variant="outline" className="text-xs">
                  {network}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nativeBalance = balance ? parseFloat(formatUnits(balance.value, balance.decimals)) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Comprehensive Wallet Dashboard</h1>
          <p className="text-gray-600">
            All tokens across all supported networks with live swapping capabilities
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <ReownWalletConnect />
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Network</p>
                <p className="text-2xl font-bold">{currentChainName}</p>
                <p className="text-xs text-gray-500">Chain ID: {chainId}</p>
              </div>
              <Network className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Native Balance</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : nativeBalance.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500">{balance?.symbol}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tokens Found</p>
                <p className="text-2xl font-bold">{totalTokensFound}</p>
                <p className="text-xs text-gray-500">{erc20TokensFound} ERC20 + {nativeTokenFound ? '1' : '0'} Native</p>
              </div>
              <Coins className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Swap Status</p>
                <p className="text-2xl font-bold text-green-600">Ready</p>
                <p className="text-xs text-gray-500">1inch Integration</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Token Swap Interface */}
        <div className="lg:col-span-2">
          <ComprehensiveTokenSwap />
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Wallet Token Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-green-600" />
                <span>Your Token Balances</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Loading balances...</p>
                </div>
              ) : balances.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">No tokens found on {currentChainName}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {balances.map((token, index) => (
                    <div 
                      key={`${token.address}-${token.chainId}-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-sm">{token.symbol}</div>
                          <div className="text-xs text-gray-500">
                            {token.chainName}
                            {token.isNative && ' • Native'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{token.formattedBalance}</div>
                        <div className="text-xs text-gray-500">{token.decimals} decimals</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Platform Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Reown WalletKit Integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Multi-Chain Token Detection</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Live 1inch API Swapping</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">7 Network Support</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Real Blockchain Data</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Automatic USDC Collection</span>
              </div>
            </CardContent>
          </Card>

          {/* Supported Networks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-purple-600" />
                <span>Supported Networks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {supportedNetworks.map((network) => (
                  <div 
                    key={network}
                    className={`flex justify-between items-center p-2 rounded border ${
                      network === currentChainName ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium">{network}</span>
                    {network === currentChainName && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                        Connected
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Developer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <University className="h-5 w-5 text-orange-600" />
                <span>USDC Collection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                All swapped USDC is automatically sent to developer wallets across all networks:
              </div>
              <div className="text-xs font-mono bg-gray-50 p-2 rounded border break-all">
                0x742d35Cc6634C0532925a3b8D93B443A38A73f65
              </div>
              <Badge variant="outline" className="w-full justify-center">
                Multi-Network Collection Active
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Live Platform Status:</strong> All wallet connections use Reown WalletKit. 
          Token balances are fetched directly from blockchain networks. Token swapping uses 
          authentic 1inch API integration. No mock or demo data is present. 
          Connected to {currentChainName} with {totalTokensFound} tokens detected.
        </AlertDescription>
      </Alert>
    </div>
  );
}