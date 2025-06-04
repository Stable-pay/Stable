import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface PriceChartProps {
  tokens: string[];
}

export function PriceChart({ tokens }: PriceChartProps) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        // Fetch real-time prices from CoinGecko API
        const tokenIds = tokens.map(token => getTokenId(token)).join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }

        const data = await response.json();
        const result: Record<string, PriceData> = {};

        tokens.forEach(token => {
          const id = getTokenId(token);
          if (data[id]) {
            result[token] = {
              symbol: token,
              price: data[id].usd,
              change24h: data[id].usd_24h_change || 0,
              volume24h: data[id].usd_24h_vol || 0
            };
          }
        });

        setPriceData(result);
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [tokens]);

  const getTokenId = (symbol: string): string => {
    const tokenIds: Record<string, string> = {
      ETH: 'ethereum',
      MATIC: 'matic-network',
      BNB: 'binancecoin',
      AVAX: 'avalanche-2',
      USDC: 'usd-coin',
      USDT: 'tether',
      WBTC: 'wrapped-bitcoin',
      DAI: 'dai',
      UNI: 'uniswap',
      ARB: 'arbitrum',
      OP: 'optimism'
    };
    return tokenIds[symbol] || symbol.toLowerCase();
  };

  const formatPrice = (price: number): string => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString()}`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Live Market Prices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-300 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-16 h-4 bg-slate-300 rounded"></div>
                    <div className="w-24 h-3 bg-slate-300 rounded"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="w-20 h-4 bg-slate-300 rounded"></div>
                  <div className="w-16 h-3 bg-slate-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Live Market Prices</span>
          <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-200">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.values(priceData).map(token => (
            <div key={token.symbol} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{token.symbol}</div>
                  <div className="text-sm text-slate-500 flex items-center space-x-2">
                    <DollarSign className="h-3 w-3" />
                    <span>Vol: {formatVolume(token.volume24h)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{formatPrice(token.price)}</div>
                <div className={`text-sm flex items-center space-x-1 ${
                  token.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {token.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(token.change24h).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}