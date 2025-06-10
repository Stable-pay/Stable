// Production-ready live price API service
interface LiveTokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: number;
}

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: number;
  priceImpact: number;
  gasEstimate: string;
  minimumReceived: string;
}

class ProductionPriceAPI {
  private readonly COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private priceCache = new Map<string, { data: LiveTokenPrice; timestamp: number }>();

  private tokenMapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'SOL': 'solana',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'COMP': 'compound-governance-token',
    'MKR': 'maker',
    'CRV': 'curve-dao-token',
    'SNX': 'havven',
    'YFI': 'yearn-finance',
    'SUSHI': 'sushi',
    'DAI': 'dai'
  };

  async getLivePrice(symbol: string): Promise<LiveTokenPrice | null> {
    const cacheKey = symbol.toUpperCase();
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const tokenId = this.tokenMapping[symbol.toUpperCase()];
      if (!tokenId) {
        console.warn(`Token mapping not found for ${symbol}`);
        return null;
      }

      const response = await fetch(
        `${this.COINGECKO_BASE}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const tokenData = data[tokenId];

      if (!tokenData) {
        return null;
      }

      const priceData: LiveTokenPrice = {
        symbol: symbol.toUpperCase(),
        price: tokenData.usd || 0,
        change24h: tokenData.usd_24h_change || 0,
        volume24h: tokenData.usd_24h_vol || 0,
        marketCap: tokenData.usd_market_cap,
        lastUpdated: Date.now()
      };

      this.priceCache.set(cacheKey, { data: priceData, timestamp: Date.now() });
      return priceData;

    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return null;
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<Record<string, LiveTokenPrice>> {
    const results: Record<string, LiveTokenPrice> = {};
    
    // Batch request for efficiency
    const tokenIds = symbols
      .map(symbol => this.tokenMapping[symbol.toUpperCase()])
      .filter(Boolean);

    if (tokenIds.length === 0) return results;

    try {
      const response = await fetch(
        `${this.COINGECKO_BASE}/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Batch price request failed: ${response.status}`);
      }

      const data = await response.json();

      symbols.forEach(symbol => {
        const tokenId = this.tokenMapping[symbol.toUpperCase()];
        const tokenData = data[tokenId];

        if (tokenData) {
          const priceData: LiveTokenPrice = {
            symbol: symbol.toUpperCase(),
            price: tokenData.usd || 0,
            change24h: tokenData.usd_24h_change || 0,
            volume24h: tokenData.usd_24h_vol || 0,
            marketCap: tokenData.usd_market_cap,
            lastUpdated: Date.now()
          };

          results[symbol.toUpperCase()] = priceData;
          this.priceCache.set(symbol.toUpperCase(), { 
            data: priceData, 
            timestamp: Date.now() 
          });
        }
      });

    } catch (error) {
      console.error('Failed to fetch batch prices:', error);
    }

    return results;
  }

  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number = 1
  ): Promise<SwapQuote | null> {
    try {
      // Calculate quote based on live prices
      const fromPrice = await this.getLivePrice(fromToken);
      const toPrice = await this.getLivePrice(toToken);

      if (!fromPrice || !toPrice) {
        return null;
      }

      const fromAmount = parseFloat(amount);
      const rate = fromPrice.price / toPrice.price;
      const toAmount = fromAmount * rate;
      const slippage = 0.005; // 0.5% slippage
      const minimumReceived = toAmount * (1 - slippage);

      return {
        fromToken: fromToken.toUpperCase(),
        toToken: toToken.toUpperCase(),
        fromAmount: amount,
        toAmount: toAmount.toFixed(6),
        rate,
        priceImpact: 0.1, // Estimated price impact
        gasEstimate: '0.002', // Estimated gas in ETH
        minimumReceived: minimumReceived.toFixed(6)
      };

    } catch (error) {
      console.error('Failed to get swap quote:', error);
      return null;
    }
  }

  clearCache(): void {
    this.priceCache.clear();
  }

  getCacheSize(): number {
    return this.priceCache.size;
  }
}

export const productionPriceAPI = new ProductionPriceAPI();
export type { LiveTokenPrice, SwapQuote };