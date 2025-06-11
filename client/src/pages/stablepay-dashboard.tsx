import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle, Banknote } from 'lucide-react';
import { useWeb3Connection } from '@/hooks/use-web3-connection';

interface Transaction {
  id: number;
  type: 'custody_transfer' | 'withdrawal';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'pending' | 'completed' | 'failed';
  txHash: string;
  createdAt: string;
  metadata: any;
}

export function StablePayDashboard() {
  const walletData = useWeb3Connection();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!walletData.address) return;

      try {
        const response = await fetch(`/api/transactions/${walletData.address}`);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [walletData.address]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!walletData.isConnected) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center space-y-4">
            <Banknote className="w-16 h-16 text-white/60 mx-auto" />
            <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
            <p className="text-white/80">Connect your wallet to view transaction history</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Transaction History</h1>
          <p className="text-white/80">
            Wallet: {walletData.address?.slice(0, 6)}...{walletData.address?.slice(-4)}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/80">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-12 text-center space-y-4">
              <ArrowUpRight className="w-16 h-16 text-white/40 mx-auto" />
              <h3 className="text-xl font-semibold text-white">No Transactions Yet</h3>
              <p className="text-white/80">Start converting crypto to INR to see your transaction history</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card key={tx.id} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {tx.type === 'withdrawal' ? (
                          <ArrowDownLeft className="w-6 h-6 text-white" />
                        ) : (
                          <ArrowUpRight className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-white">
                            {tx.type === 'withdrawal' ? 'INR Withdrawal' : 'Crypto Conversion'}
                          </h3>
                          <Badge className={getStatusColor(tx.status)}>
                            {getStatusIcon(tx.status)}
                            <span className="ml-1 capitalize">{tx.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="text-white/80 text-sm">
                          {tx.fromAmount} {tx.fromToken} → {tx.toAmount} {tx.toToken}
                        </div>
                        
                        <div className="text-white/60 text-xs">
                          {formatDate(tx.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      {tx.type === 'withdrawal' && (
                        <div className="text-xl font-bold text-green-400">
                          ₹{tx.toAmount}
                        </div>
                      )}
                      
                      {tx.txHash && (
                        <div className="text-xs text-white/60">
                          TX: {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                        </div>
                      )}
                    </div>
                  </div>

                  {tx.type === 'withdrawal' && tx.status === 'pending' && (
                    <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center text-yellow-400 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        Your INR transfer is being processed and will complete within 24 hours
                      </div>
                    </div>
                  )}

                  {tx.type === 'withdrawal' && tx.status === 'completed' && (
                    <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        INR successfully transferred to your bank account
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Transaction Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-white/80">
              <span>Daily Limit:</span>
              <span className="text-white font-medium">₹50,000</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Max Transactions/Day:</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Processing Fee:</span>
              <span className="text-white font-medium">1.5%</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Settlement Time:</span>
              <span className="text-white font-medium">T+0 to T+1</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}