import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  TrendingUp, 
  RefreshCw, 
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

export function WalletBalances() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { tokenBalances, totalValue, isLoading } = useWalletBalances();
  const [showValues, setShowValues] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
          <p className="text-[#6667AB]/70 mb-4">Connect your wallet to view balances</p>
          <w3m-button />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FCFBF4] border-[#6667AB]/30">
      <CardHeader>
        <CardTitle className="text-[#6667AB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Balances
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValues(!showValues)}
              className="text-[#6667AB] hover:bg-[#6667AB]/10"
            >
              {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={isLoading}
              className="text-[#6667AB] hover:bg-[#6667AB]/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-[#6667AB]/70">
          <span>{formatAddress(address || '')}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAddress}
            className="h-6 px-2 text-[#6667AB]/70 hover:bg-[#6667AB]/10"
          >
            {copiedAddress ? '✓' : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Portfolio Value */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-[#6667AB]/10 to-[#6667AB]/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#6667AB]" />
              <span className="text-sm text-[#6667AB]/70">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-[#6667AB]">
              {showValues ? `$${totalValue.toFixed(2)}` : '••••••'}
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-sm text-[#6667AB]/70">Active Tokens</span>
            </div>
            <div className="text-2xl font-bold text-[#6667AB]">
              {tokenBalances.filter(token => parseFloat(token.formattedBalance) > 0).length}
            </div>
          </div>
        </div>

        {/* Token List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin text-[#6667AB] mx-auto mb-2" />
              <p className="text-[#6667AB]/70 text-sm">Loading balances...</p>
            </div>
          ) : tokenBalances.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-[#6667AB]/30 mx-auto mb-4" />
              <p className="text-[#6667AB]/70 mb-2">No tokens found</p>
              <p className="text-[#6667AB]/50 text-sm">Your wallet appears to be empty</p>
            </div>
          ) : (
            tokenBalances.map((token, index) => (
              <div
                key={`${token.address}-${index}`}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#6667AB]/10 hover:border-[#6667AB]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {token.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-[#6667AB]">{token.symbol}</div>
                    <div className="text-xs text-[#6667AB]/60">{token.name}</div>
                    {token.isNative && (
                      <Badge className="text-xs bg-blue-100 text-blue-700 mt-1">Native</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-[#6667AB]">
                    {showValues 
                      ? `${parseFloat(token.formattedBalance).toFixed(6)} ${token.symbol}`
                      : '••••••'
                    }
                  </div>
                  {token.usdValue && (
                    <div className="text-xs text-[#6667AB]/60">
                      {showValues ? `$${token.usdValue.toFixed(2)}` : '••••'}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Network Info */}
        <div className="pt-3 border-t border-[#6667AB]/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6667AB]/70">Network:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#6667AB]">{chainId === 1 ? 'Ethereum' : `Chain ${chainId}`}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                className="h-6 px-2 text-[#6667AB]/70 hover:bg-[#6667AB]/10"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}