import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeveloperWallet } from "@/lib/wallet-config";
import { ExternalLink, ArrowRight, Wallet, Shield, Clock } from "lucide-react";

interface SwapSummaryProps {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  network: string;
  transactionHash?: string;
  status: 'pending' | 'completed' | 'failed';
  gasUsed?: string;
  executionTime?: number;
}

export function SwapSummary({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  network,
  transactionHash,
  status,
  gasUsed,
  executionTime
}: SwapSummaryProps) {
  const developerWallet = getDeveloperWallet(network as any);
  
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-indigo-600" />
            <span>Swap Transaction</span>
          </span>
          <Badge className={getStatusColor()}>
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="capitalize">{status}</span>
            </div>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Details */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Transaction Details</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">From:</span>
              <div className="text-right">
                <div className="font-medium">{fromAmount} {fromToken}</div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">To:</span>
              <div className="text-right">
                <div className="font-medium">{toAmount} {toToken}</div>
                <div className="text-xs text-slate-500">via 1inch DEX aggregator</div>
              </div>
            </div>
          </div>
        </div>

        {/* Network and Wallet Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-700 font-medium mb-1">Network</div>
            <div className="text-blue-900 capitalize">{network}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-700 font-medium mb-1">Destination</div>
            <div className="text-green-900">Developer Wallet</div>
          </div>
        </div>

        {/* Developer Wallet Details */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Wallet className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-1">USDC Collection Wallet</h4>
              <p className="text-amber-800 text-sm mb-2">
                All converted USDC is automatically sent to the platform's collection wallet for processing and INR conversion.
              </p>
              <div className="bg-amber-100 rounded px-3 py-2">
                <code className="text-xs font-mono text-amber-900 break-all">
                  {developerWallet}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {(gasUsed || executionTime) && (
          <div className="grid grid-cols-2 gap-4">
            {gasUsed && (
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{gasUsed}</div>
                <div className="text-sm text-slate-600">Gas Used</div>
              </div>
            )}
            {executionTime && (
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{executionTime}s</div>
                <div className="text-sm text-slate-600">Execution Time</div>
              </div>
            )}
          </div>
        )}

        {/* Transaction Hash */}
        {transactionHash && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 mb-1">Transaction Hash</div>
                <code className="text-xs font-mono text-slate-600 break-all">
                  {transactionHash}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const explorerUrls = {
                    ethereum: 'https://etherscan.io/tx/',
                    polygon: 'https://polygonscan.com/tx/',
                    arbitrum: 'https://arbiscan.io/tx/',
                    base: 'https://basescan.org/tx/'
                  };
                  const explorerUrl = explorerUrls[network as keyof typeof explorerUrls];
                  if (explorerUrl) {
                    window.open(`${explorerUrl}${transactionHash}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-green-900 font-semibold mb-2">Swap Completed Successfully!</div>
            <p className="text-green-800 text-sm">
              Your {fromToken} has been converted to USDC and sent to the collection wallet. 
              You can now proceed with INR withdrawal from your dashboard.
            </p>
          </div>
        )}

        {/* API Attribution */}
        <div className="text-center text-xs text-slate-500">
          Powered by 1inch DEX Aggregator API • Optimal routing across all DEXs
        </div>
      </CardContent>
    </Card>
  );
}