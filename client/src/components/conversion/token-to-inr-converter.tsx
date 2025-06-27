import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, ArrowDown, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { useWalletBalances, type TokenBalance } from '@/hooks/use-wallet-balances';
import { useAppKitAccount } from '@reown/appkit/react';
import { BINANCE_SUPPORTED_TOKENS, getBinanceTokenInfo, isTokenSupportedByBinance } from '@/../../shared/binance-supported-tokens';

interface TokenToINRConverterProps {
  onTokenSelect?: (token: TokenBalance, amount: string) => void;
  onConversionUpdate?: (tokenAmount: string, inrAmount: string, exchangeRate: number) => void;
}

export function TokenToINRConverter({ onTokenSelect, onConversionUpdate }: TokenToINRConverterProps) {
  const { address, isConnected } = useAppKitAccount();
  const { tokenBalances, isLoading, error, refreshAllChains } = useWalletBalances();
  
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [tokenAmount, setTokenAmount] = useState('');
  const [inrAmount, setInrAmount] = useState('0');
  const [exchangeRate, setExchangeRate] = useState(83.25); // Default USD to INR rate
  const [tokenPriceUSD, setTokenPriceUSD] = useState(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Filter supported tokens (only Binance-supported tokens)
  const supportedTokens = tokenBalances.filter(token => 
    isTokenSupportedByBinance(token.symbol, token.chainId) && 
    parseFloat(token.formattedBalance) > 0
  );

  // Get token price from multiple sources with fallback
  const fetchTokenPrice = async (symbol: string) => {
    setIsLoadingPrice(true);
    setPriceError(null);
    
    try {
      // Use backend endpoint to avoid CORS issues
      const response = await fetch(`/api/tokens/price/${symbol.toLowerCase()}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.usd && data.inr) {
          setTokenPriceUSD(data.usd);
          setExchangeRate(data.inr);
          
          if (data.source === 'fallback') {
            setPriceError('Using backup pricing');
          }
          return;
        }
      }
      
      throw new Error('Backend pricing API failed');
      
    } catch (error) {
      console.error('Failed to fetch token price:', error);
      setPriceError('Pricing temporarily unavailable');
      
      // Use fallback pricing as last resort
      const fallbackUSD = getFallbackPrice(symbol);
      setTokenPriceUSD(fallbackUSD);
      
      const usdToInrRate = await fetchUSDToINRRate();
      setExchangeRate(fallbackUSD * usdToInrRate);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Fetch live USD to INR rate
  const fetchUSDToINRRate = async (): Promise<number> => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        return data.rates.INR || 83.25;
      }
    } catch (error) {
      console.error('Failed to fetch USD to INR rate:', error);
    }
    return 83.25; // Fallback rate
  };

  // Get CoinGecko ID for token symbol
  const getCoingeckoId = (symbol: string): string => {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'ATOM': 'cosmos',
      'SOL': 'solana',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'PEPE': 'pepe',
      'SHIB': 'shiba-inu',
      'TRX': 'tron',
      'TON': 'the-open-network',
      'XRP': 'ripple'
    };
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  };

  // Fallback prices for major tokens (in USD)
  const getFallbackPrice = (symbol: string): number => {
    const prices: Record<string, number> = {
      'BTC': 42000,
      'ETH': 2600,
      'BNB': 320,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'MATIC': 0.85,
      'AVAX': 35,
      'LINK': 15,
      'UNI': 7,
      'DOGE': 0.08,
      'ADA': 0.45,
      'DOT': 6.5,
      'LTC': 70,
      'BCH': 200,
      'PEPE': 0.000015,
      'SHIB': 0.000025
    };
    return prices[symbol.toUpperCase()] || 1;
  };

  // Handle token selection
  const handleTokenSelect = (tokenAddress: string) => {
    const token = supportedTokens.find(t => t.address === tokenAddress);
    if (token) {
      setSelectedToken(token);
      setTokenAmount('');
      setInrAmount('0');
      fetchTokenPrice(token.symbol);
      
      if (onTokenSelect) {
        onTokenSelect(token, '');
      }
    }
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setTokenAmount(value);
    
    if (selectedToken && exchangeRate > 0) {
      const amount = parseFloat(value) || 0;
      const maxAmount = parseFloat(selectedToken.formattedBalance);
      
      if (amount > maxAmount) {
        setTokenAmount(maxAmount.toString());
        const inr = (maxAmount * exchangeRate).toFixed(2);
        setInrAmount(inr);
        
        if (onConversionUpdate) {
          onConversionUpdate(maxAmount.toString(), inr, exchangeRate);
        }
      } else {
        const inr = (amount * exchangeRate).toFixed(2);
        setInrAmount(inr);
        
        if (onConversionUpdate) {
          onConversionUpdate(value, inr, exchangeRate);
        }
      }
    }
  };

  // Set max amount
  const handleMaxClick = () => {
    if (selectedToken) {
      handleAmountChange(selectedToken.formattedBalance);
    }
  };

  // Format currency
  const formatCurrency = (value: number, currency: 'USD' | 'INR' = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (!isConnected) {
    return (
      <Card className="w-full bg-[#FCFBF4]/95 border-[#6667AB]/20">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-[#6667AB]/70" />
          <p className="text-[#6667AB]/70">Connect your wallet to convert tokens to INR</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-[#FCFBF4]/95 border-[#6667AB]/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-[#6667AB]">
            <TrendingUp className="w-6 h-6 text-[#6667AB]" />
            <span>Token to INR Converter</span>
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshAllChains}
            disabled={isLoading}
            className="border-[#6667AB]/20 text-[#6667AB] hover:bg-[#6667AB]/10"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {/* Token Selection */}
        <div className="space-y-2">
          <Label className="text-[#6667AB] font-medium">Select Token to Convert</Label>
          <Select onValueChange={handleTokenSelect} disabled={isLoading || supportedTokens.length === 0}>
            <SelectTrigger className="bg-white border-[#6667AB]/20 text-[#6667AB]">
              <SelectValue placeholder={supportedTokens.length === 0 ? "No supported tokens found" : "Choose a token"} />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#6667AB]/20">
              {supportedTokens.map((token) => (
                <SelectItem key={`${token.address}-${token.chainId}`} value={token.address}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{token.symbol}</span>
                      <Badge className="text-xs bg-[#6667AB]/10 text-[#6667AB] border-[#6667AB]/20">
                        {token.chainName}
                      </Badge>
                    </div>
                    <span className="text-sm text-[#6667AB]/70 ml-4">
                      {parseFloat(token.formattedBalance).toFixed(4)} {token.symbol}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {supportedTokens.length === 0 && !isLoading && (
            <p className="text-sm text-[#6667AB]/60">
              No supported tokens found. Only tokens with active USDT trading pairs on Binance are supported for INR conversion.
            </p>
          )}
        </div>

        {selectedToken && (
          <>
            <Separator className="bg-[#6667AB]/20" />
            
            {/* Token Info */}
            <div className="p-4 bg-[#6667AB]/10 rounded-lg border border-[#6667AB]/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#6667AB]">{selectedToken.symbol} - {selectedToken.name}</h3>
                <Badge className="bg-[#6667AB]/20 text-[#6667AB] border-[#6667AB]/20">
                  {selectedToken.chainName}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#6667AB]/70">Available Balance</p>
                  <p className="font-medium text-[#6667AB]">
                    {selectedToken.formattedBalance} {selectedToken.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-[#6667AB]/70">USD Value</p>
                  <p className="font-medium text-[#6667AB]">
                    {formatCurrency(selectedToken.usdValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#6667AB] font-medium">Amount to Convert</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMaxClick}
                  className="text-xs border-[#6667AB]/20 text-[#6667AB] hover:bg-[#6667AB]/10"
                >
                  MAX
                </Button>
              </div>
              <Input
                type="number"
                value={tokenAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="bg-white border-[#6667AB]/20 text-[#6667AB]"
                min="0"
                max={selectedToken.formattedBalance}
                step="any"
              />
            </div>

            {/* Conversion Arrow */}
            <div className="flex justify-center">
              <div className="p-2 bg-[#6667AB]/10 rounded-full">
                <ArrowDown className="w-5 h-5 text-[#6667AB]" />
              </div>
            </div>

            {/* INR Output */}
            <div className="space-y-2">
              <Label className="text-[#6667AB] font-medium">INR Amount (₹)</Label>
              <div className="p-3 bg-[#6667AB]/10 rounded-lg border border-[#6667AB]/20">
                <div className="text-2xl font-bold text-[#6667AB]">
                  ₹{parseFloat(inrAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="p-3 bg-[#FCFBF4]/50 rounded-lg border border-[#6667AB]/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6667AB]/70">Exchange Rate</span>
                <div className="flex items-center space-x-2">
                  {isLoadingPrice && <RefreshCw className="w-3 h-3 animate-spin text-[#6667AB]" />}
                  <span className="text-[#6667AB] font-medium">
                    1 {selectedToken.symbol} = ₹{exchangeRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {tokenPriceUSD > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-[#6667AB]/70">USD Price</span>
                  <span className="text-[#6667AB] font-medium">
                    {formatCurrency(tokenPriceUSD)}
                  </span>
                </div>
              )}
              {priceError && (
                <p className="text-xs text-red-600 mt-1">
                  {priceError} - Using fallback pricing
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}