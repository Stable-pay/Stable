import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Wallet, TrendingUp, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

interface WalletBalanceDisplayProps {
  showAllChains?: boolean;
  compact?: boolean;
}

export function WalletBalanceDisplay({ showAllChains = false, compact = false }: WalletBalanceDisplayProps) {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const [expandedChains, setExpandedChains] = useState<Set<number>>(new Set());
  
  const {
    tokenBalances,
    currentChainBalances,
    chainsWithBalances,
    isLoading,
    error,
    refreshBalances,
    refreshAllChains,
    getChainBalances,
    totalValue,
    currentChainValue,
    supportedChains
  } = useWalletBalances();

  const toggleChainExpansion = (chainId: number) => {
    const newExpanded = new Set(expandedChains);
    if (newExpanded.has(chainId)) {
      newExpanded.delete(chainId);
    } else {
      newExpanded.add(chainId);
    }
    setExpandedChains(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatTokenAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount);
    if (num < 0.01) return '< 0.01';
    if (num < 1) return num.toFixed(decimals);
    if (num < 1000) return num.toFixed(4);
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
    return `${(num / 1000000).toFixed(2)}M`;
  };

  const getChainIcon = (chainId: number) => {
    const icons: Record<number, string> = {
      1: '🔷', // Ethereum
      137: '🟣', // Polygon
      56: '🟡', // BSC
      42161: '🔵', // Arbitrum
      10: '🔴', // Optimism
      8453: '🟦', // Base
      43114: '❄️' // Avalanche
    };
    return icons[chainId] || '⛓️';
  };

  if (!isConnected) {
    return (
      <Card className="w-full bg-[#FCFBF4]/95 border-[#6667AB]/20">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-[#6667AB]/70" />
          <p className="text-[#6667AB]/70">Connect your wallet to view balances</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="w-full bg-[#FCFBF4]/95 border-[#6667AB]/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-[#6667AB]" />
              <div>
                <p className="text-sm font-medium text-[#6667AB]">Portfolio Value</p>
                <p className="text-lg font-bold text-[#6667AB]">
                  {formatCurrency(showAllChains ? totalValue : currentChainValue)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="text-xs bg-[#6667AB]/10 text-[#6667AB] border-[#6667AB]/20">
                {showAllChains ? tokenBalances.length : currentChainBalances.length} tokens
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={showAllChains ? refreshAllChains : refreshBalances}
                disabled={isLoading}
                className="border-[#6667AB]/20 text-[#6667AB] hover:bg-[#6667AB]/10"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-[#FCFBF4]/95 border-[#6667AB]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-[#6667AB]">
            <Wallet className="w-6 h-6 text-[#6667AB]" />
            <span>Wallet Balances</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-[#6667AB]/10 text-[#6667AB] border-[#6667AB]/20">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={showAllChains ? refreshAllChains : refreshBalances}
              disabled={isLoading}
              className="border-[#6667AB]/20 text-[#6667AB] hover:bg-[#6667AB]/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[#6667AB]/10 rounded-lg border border-[#6667AB]/20">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#6667AB]" />
              <span className="text-sm font-medium text-[#6667AB]">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-[#6667AB]">
              {formatCurrency(showAllChains ? totalValue : currentChainValue)}
            </p>
          </div>
          <div className="p-3 bg-[#6667AB]/10 rounded-lg border border-[#6667AB]/20">
            <div className="flex items-center space-x-2 mb-1">
              <Wallet className="w-4 h-4 text-[#6667AB]" />
              <span className="text-sm font-medium text-[#6667AB]">Active Tokens</span>
            </div>
            <p className="text-2xl font-bold text-[#6667AB]">
              {showAllChains ? tokenBalances.length : currentChainBalances.length}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#6667AB]" />
              <span className="text-[#6667AB]/70">Fetching balances...</span>
            </div>
          </div>
        )}

        {!isLoading && tokenBalances.length === 0 && (
          <div className="text-center p-8">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-[#6667AB]/70" />
            <p className="text-[#6667AB]/70">No token balances found</p>
            <p className="text-sm text-[#6667AB]/50 mt-2">
              Make sure you have tokens in your wallet on supported networks
            </p>
          </div>
        )}

        {/* Chain-grouped balances */}
        {showAllChains ? (
          <div className="space-y-3">
            {chainsWithBalances.map((chain) => {
              const chainBalances = getChainBalances(chain.chainId);
              const chainValue = chainBalances.reduce((sum, token) => sum + token.usdValue, 0);
              const isExpanded = expandedChains.has(chain.chainId);

              return (
                <div key={chain.chainId} className="border border-[#6667AB]/20 rounded-lg bg-[#FCFBF4]/50">
                  <div
                    className="p-3 cursor-pointer hover:bg-[#6667AB]/10 transition-colors"
                    onClick={() => toggleChainExpansion(chain.chainId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getChainIcon(chain.chainId)}</span>
                        <div>
                          <p className="font-medium text-[#6667AB]">{chain.name}</p>
                          <p className="text-sm text-[#6667AB]/70">
                            {chainBalances.length} tokens • {formatCurrency(chainValue)}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#6667AB]/70" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#6667AB]/70" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#6667AB]/20">
                      {chainBalances.map((token, index) => (
                        <div key={`${token.address}-${token.chainId}`}>
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-[#6667AB]/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-[#6667AB]">
                                  {token.symbol.slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-[#6667AB]">{token.symbol}</p>
                                <p className="text-sm text-[#6667AB]/70">{token.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-[#6667AB]">
                                {formatTokenAmount(token.formattedBalance)} {token.symbol}
                              </p>
                              <p className="text-sm text-[#6667AB]/70">
                                {formatCurrency(token.usdValue)}
                              </p>
                            </div>
                          </div>
                          {index < chainBalances.length - 1 && <Separator className="bg-[#6667AB]/20" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Current chain balances only
          <div className="space-y-2">
            {currentChainBalances.map((token) => (
              <div key={`${token.address}-${token.chainId}`} className="p-3 border border-[#6667AB]/20 rounded-lg bg-[#FCFBF4]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#6667AB]/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-[#6667AB]">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#6667AB]">{token.symbol}</p>
                      <p className="text-sm text-[#6667AB]/70">{token.name}</p>
                      {token.isNative && (
                        <Badge className="text-xs mt-1 bg-[#6667AB]/20 text-[#6667AB] border-[#6667AB]/20">
                          Native
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#6667AB]">
                      {formatTokenAmount(token.formattedBalance)} {token.symbol}
                    </p>
                    <p className="text-sm text-[#6667AB]/70">
                      {formatCurrency(token.usdValue)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show all chains toggle */}
        {!showAllChains && chainsWithBalances.length > 1 && (
          <div className="text-center pt-4">
            <p className="text-sm text-[#6667AB]/70 mb-2">
              Showing {currentChainBalances.length} tokens on current network
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllChains}
              disabled={isLoading}
              className="border-[#6667AB]/20 text-[#6667AB] hover:bg-[#6667AB]/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View All Networks ({chainsWithBalances.length} chains)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}