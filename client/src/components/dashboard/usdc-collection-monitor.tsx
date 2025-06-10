import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { transactionMonitor, type TransactionMonitor } from "@/lib/transaction-monitor";
import { getDeveloperWallet } from "@/lib/wallet-config";
import { Wallet, TrendingUp, Activity, RefreshCw, ExternalLink, DollarSign } from "lucide-react";

export function USDCCollectionMonitor() {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<TransactionMonitor[]>([]);
  const [totalCollected, setTotalCollected] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const networks = [
    { id: 'ethereum', name: 'Ethereum', color: 'bg-blue-500' },
    { id: 'polygon', name: 'Polygon', color: 'bg-purple-500' },
    { id: 'arbitrum', name: 'Arbitrum', color: 'bg-cyan-500' },
    { id: 'base', name: 'Base', color: 'bg-indigo-500' }
  ];

  const loadCollectionData = async () => {
    setIsLoading(true);
    try {
      const networkBalances = await transactionMonitor.getTotalCollectedUSDC();
      setBalances(networkBalances);

      const allTransactions = transactionMonitor.getAllTransactions();
      setTransactions(allTransactions.slice(-10));

      const total = Object.values(networkBalances)
        .reduce((sum, balance) => sum + parseFloat(balance), 0)
        .toFixed(2);
      setTotalCollected(total);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load collection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollectionData();
    const interval = setInterval(loadCollectionData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const viewTransactionOnExplorer = (hash: string, network: string) => {
    const explorerUrls = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      base: 'https://basescan.org/tx/'
    };
    const explorerUrl = explorerUrls[network as keyof typeof explorerUrls];
    if (explorerUrl) {
      window.open(`${explorerUrl}${hash}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span>Total USDC Collected</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCollectionData}
              disabled={isLoading}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-900 mb-2">
              ${totalCollected}
            </div>
            <p className="text-green-700">
              Across all supported networks
            </p>
            {lastUpdated && (
              <p className="text-xs text-green-600 mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-indigo-600" />
            <span>Network Collection Wallets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {networks.map((network) => {
              const balance = balances[network.id] || '0';
              const walletAddress = getDeveloperWallet(network.id as any);
              
              return (
                <div key={network.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${network.color}`}></div>
                    <div>
                      <div className="font-medium text-slate-900">{network.name}</div>
                      <code className="text-xs text-slate-600 font-mono">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </code>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${balance}</div>
                    <div className="text-xs text-slate-600">USDC</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <span>Recent Swaps</span>
            <Badge className="bg-blue-100 text-blue-800">
              Live Reown Swaps
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent transactions</p>
              <p className="text-sm">Swaps will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.hash} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-slate-900">
                        {tx.fromAmount} {tx.fromToken} → {tx.expectedUSDC} USDC
                      </span>
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-600">
                      <span className="capitalize">{tx.network}</span>
                      <span>{formatTime(tx.timestamp)}</span>
                      {tx.gasUsed && <span>Gas: {tx.gasUsed} ETH</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewTransactionOnExplorer(tx.hash, tx.network)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900">Reown AppKit Integration</div>
              <div className="text-sm text-blue-700">
                Real-time swap execution with automatic USDC collection to developer wallets
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}