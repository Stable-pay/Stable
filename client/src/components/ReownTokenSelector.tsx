import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKit } from '@reown/appkit/react';
import { useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowRight, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

interface ReownTokenSelectorProps {
  onTokenSelect: (token: any, amount: string, inrAmount: string) => void;
}

interface TokenInfo {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address?: string;
  chainId: number;
  chainName: string;
  usdValue: number;
  isNative: boolean;
}

// Supported tokens database from Binance USDT pairs
const SUPPORTED_TOKENS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'TRX', 'TON', 
  'LINK', 'MATIC', 'DOT', 'UNI', 'LTC', 'BCH', 'PEPE', 'APT', 'NEAR', 'SHIB',
  'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD'
];

export function ReownTokenSelector({ onTokenSelect }: ReownTokenSelectorProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { open } = useAppKit();
  const { data: balance } = useBalance({ 
    address: address as `0x${string}`,
    query: { enabled: !!address }
  });
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [inrAmount, setInrAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [currentTokens, setCurrentTokens] = useState<TokenInfo[]>([]);

  // USD to INR conversion rate
  const USD_TO_INR = 84.5;

  const getChainName = (chainId: number): string => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      43114: 'Avalanche'
    };
    return chains[chainId] || 'Unknown';
  };

  const getNativeTokenInfo = (chainId: number): { symbol: string; name: string } => {
    const tokens: Record<number, { symbol: string; name: string }> = {
      1: { symbol: 'ETH', name: 'Ethereum' },
      137: { symbol: 'MATIC', name: 'Polygon' },
      56: { symbol: 'BNB', name: 'BNB Chain' },
      42161: { symbol: 'ETH', name: 'Arbitrum ETH' },
      10: { symbol: 'ETH', name: 'Optimism ETH' },
      8453: { symbol: 'ETH', name: 'Base ETH' },
      43114: { symbol: 'AVAX', name: 'Avalanche' }
    };
    return tokens[chainId] || { symbol: 'ETH', name: 'Ethereum' };
  };

  const getTokenPrice = async (symbol: string): Promise<number> => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${getCoingeckoId(symbol)}&vs_currencies=usd`);
      const data = await response.json();
      const coinId = getCoingeckoId(symbol);
      return data[coinId]?.usd || 0;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return getFallbackPrice(symbol);
    }
  };

  const getCoingeckoId = (symbol: string): string => {
    const ids: Record<string, string> = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'MATIC': 'matic-network',
      'BNB': 'binancecoin',
      'AVAX': 'avalanche-2',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'DOGE': 'dogecoin',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'SOL': 'solana',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash'
    };
    return ids[symbol] || 'ethereum';
  };

  const getFallbackPrice = (symbol: string): number => {
    const prices: Record<string, number> = {
      'ETH': 3500,
      'BTC': 65000,
      'MATIC': 0.85,
      'BNB': 600,
      'AVAX': 35,
      'USDT': 1,
      'USDC': 1,
      'LINK': 15,
      'UNI': 7,
      'DOGE': 0.08,
      'ADA': 0.45,
      'DOT': 6,
      'SOL': 200,
      'LTC': 90,
      'BCH': 450
    };
    return prices[symbol] || 100;
  };

  const isTokenSupported = (symbol: string): boolean => {
    return SUPPORTED_TOKENS.includes(symbol.toUpperCase());
  };

  useEffect(() => {
    const loadTokenData = async () => {
      if (!isConnected || !address || !balance) return;

      // Default to Ethereum if no chainId
      const currentChainId = chainId || 1;
      const nativeToken = getNativeTokenInfo(1); // Default to ETH for simplicity
      
      // Only show native token if it's supported
      if (isTokenSupported(nativeToken.symbol)) {
        const price = await getTokenPrice(nativeToken.symbol);
        const balanceValue = parseFloat(balance.formatted);
        
        if (balanceValue > 0) {
          const tokenInfo: TokenInfo = {
            symbol: nativeToken.symbol,
            name: nativeToken.name,
            balance: balance.formatted,
            decimals: balance.decimals,
            chainId: 1,
            chainName: 'Ethereum',
            usdValue: price,
            isNative: true
          };
          
          setCurrentTokens([tokenInfo]);
        } else {
          setCurrentTokens([]);
        }
      } else {
        setCurrentTokens([]);
      }
    };

    loadTokenData();
  }, [isConnected, address, chainId, balance]);

  const handleTokenSelect = (token: TokenInfo) => {
    setSelectedToken(token);
    setTokenAmount('');
    setInrAmount('');
  };

  const handleInrAmountChange = (value: string) => {
    setInrAmount(value);
    if (selectedToken && value) {
      const inrValue = parseFloat(value);
      const usdValue = inrValue / USD_TO_INR;
      const tokenValue = usdValue / selectedToken.usdValue;
      setTokenAmount(tokenValue.toFixed(6));
    } else {
      setTokenAmount('');
    }
  };

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (selectedToken && value) {
      const tokenValue = parseFloat(value);
      const usdValue = tokenValue * selectedToken.usdValue;
      const inrValue = usdValue * USD_TO_INR;
      setInrAmount(inrValue.toFixed(2));
    } else {
      setInrAmount('');
    }
  };

  const handleProceed = () => {
    if (selectedToken && tokenAmount && inrAmount) {
      onTokenSelect(selectedToken, tokenAmount, inrAmount);
    }
  };

  const isValidAmount = selectedToken && tokenAmount && parseFloat(tokenAmount) > 0 && parseFloat(tokenAmount) <= parseFloat(selectedToken.balance);

  if (!isConnected) {
    return (
      <Card className="bg-[#FCFBF4] border-[#6667AB]/20">
        <CardContent className="p-8 text-center">
          <Wallet className="w-12 h-12 text-[#6667AB] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#6667AB] mb-2">Connect Your Wallet</h3>
          <p className="text-[#6667AB]/70 mb-6">Connect your wallet to view token balances and start converting to INR</p>
          <Button 
            onClick={() => open()}
            className="bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 hover:from-[#6667AB]/90 hover:to-[#6667AB]/70 text-[#FCFBF4] px-8 py-3 rounded-xl contrast-fix-inverse"
            style={{ 
              color: '#FCFBF4 !important',
              backgroundColor: '#6667AB !important' 
            }}
          >
            <Wallet className="w-5 h-5 mr-2" style={{ color: '#FCFBF4' }} />
            <span style={{ color: '#FCFBF4' }}>Connect Wallet</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Selection */}
      <Card className="bg-[#FCFBF4] border-[#6667AB]/20">
        <CardHeader>
          <CardTitle className="text-[#6667AB] flex items-center">
            <Coins className="w-5 h-5 mr-2" />
            Select Token to Convert
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentTokens.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-[#6667AB]/50 mx-auto mb-4" />
              <p className="text-[#6667AB]/70 mb-2">No supported tokens found</p>
              <p className="text-sm text-[#6667AB]/60">
                Connect to a different network or ensure you have supported tokens
              </p>
              <Button 
                onClick={() => open({ view: 'Networks' })}
                variant="outline"
                className="mt-4 border-[#6667AB]/30 text-[#6667AB] hover:bg-[#6667AB]/5"
              >
                Switch Network
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {currentTokens.map((token, index) => (
                <div
                  key={index}
                  onClick={() => handleTokenSelect(token)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedToken?.symbol === token.symbol
                      ? 'border-[#6667AB] bg-[#6667AB]/5'
                      : 'border-[#6667AB]/20 hover:border-[#6667AB]/40 hover:bg-[#6667AB]/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#6667AB] rounded-full flex items-center justify-center">
                        <span className="text-[#FCFBF4] font-bold text-sm">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#6667AB]">{token.symbol}</p>
                        <p className="text-sm text-[#6667AB]/70">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#6667AB]">
                        {parseFloat(token.balance).toFixed(4)} {token.symbol}
                      </p>
                      <p className="text-sm text-[#6667AB]/70">
                        ${(parseFloat(token.balance) * token.usdValue).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className="border-[#6667AB]/30 text-[#6667AB]">
                      {token.chainName}
                    </Badge>
                    {isTokenSupported(token.symbol) ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Supported
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Not Supported
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Interface */}
      {selectedToken && (
        <Card className="bg-[#FCFBF4] border-[#6667AB]/20">
          <CardHeader>
            <CardTitle className="text-[#6667AB]">Convert to INR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#6667AB] font-medium">INR Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter INR amount"
                  value={inrAmount}
                  onChange={(e) => handleInrAmountChange(e.target.value)}
                  className="mt-1 border-[#6667AB]/30 focus:border-[#6667AB] bg-white"
                />
              </div>
              <div>
                <Label className="text-[#6667AB] font-medium">
                  {selectedToken.symbol} Amount
                </Label>
                <Input
                  type="number"
                  placeholder={`Enter ${selectedToken.symbol} amount`}
                  value={tokenAmount}
                  onChange={(e) => handleTokenAmountChange(e.target.value)}
                  className="mt-1 border-[#6667AB]/30 focus:border-[#6667AB] bg-white"
                />
              </div>
            </div>

            {tokenAmount && (
              <div className="bg-[#6667AB]/5 p-4 rounded-xl">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6667AB]/70">Conversion Rate:</span>
                  <span className="text-[#6667AB] font-medium">
                    1 {selectedToken.symbol} = ₹{(selectedToken.usdValue * USD_TO_INR).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-[#6667AB]/70">Available Balance:</span>
                  <span className="text-[#6667AB] font-medium">
                    {parseFloat(selectedToken.balance).toFixed(4)} {selectedToken.symbol}
                  </span>
                </div>
                {parseFloat(tokenAmount) > parseFloat(selectedToken.balance) && (
                  <div className="flex items-center mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Insufficient balance</span>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleProceed}
              disabled={!isValidAmount}
              className="w-full bg-gradient-to-r from-[#6667AB] to-[#6667AB]/80 hover:from-[#6667AB]/90 hover:to-[#6667AB]/70 text-[#FCFBF4] py-6 text-lg font-bold rounded-xl disabled:opacity-50 contrast-fix-inverse"
              style={{ 
                color: '#FCFBF4 !important',
                backgroundColor: '#6667AB !important' 
              }}
            >
              <span style={{ color: '#FCFBF4' }}>
                {!isValidAmount ? 'Enter Valid Amount' : 'Proceed to KYC'}
              </span>
              <ArrowRight className="w-5 h-5 ml-2" style={{ color: '#FCFBF4' }} />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}