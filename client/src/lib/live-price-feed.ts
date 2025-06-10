
interface LivePrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdated: number;
}

interface SwapRate {
  fromToken: string;
  toToken: string;
  rate: number;
  inverseRate: number;
  lastUpdated: number;
  source: string;
}

class LivePriceFeedService {
  private priceCache = new Map<string, LivePrice>();
  private lastUpdate = 0;
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds
  private readonly COINGECKO_URL = 'https://api.coingecko.com/api/v3';
  
  // Token ID mapping for CoinGecko
  private tokenIdMap: Record<string, string> = {
    'ETH': 'ethereum',
    'WETH': 'weth',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'DAI': 'dai',
    'MATIC': 'matic-network',
    'WMATIC': 'wmatic',
    'WBTC': 'wrapped-bitcoin',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'BNB': 'binancecoin',
    'AVAX': 'avalanche-2'
  };

  async getLivePrice(symbol: string): Promise<LivePrice | null> {
    const now = Date.now();
    
    // Return cached price if still fresh
    if (this.priceCache.has(symbol) && (now - this.lastUpdate) < this.UPDATE_INTERVAL) {
      return this.priceCache.get(symbol) || null;
    }

    try {
      const tokenId = this.tokenIdMap[symbol.toUpperCase()];
      if (!tokenId) {
        console.warn(`No CoinGecko ID found for token: ${symbol}`);
        return this.getFallbackPrice(symbol);
      }

      const response = await fetch(
        `${this.COINGECKO_URL}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
      );

      if (!response.ok) {
        console.warn('CoinGecko API unavailable, using fallback');
        return this.getFallbackPrice(symbol);
      }

      const data = await response.json();
      const tokenData = data[tokenId];

      if (!tokenData) {
        return this.getFallbackPrice(symbol);
      }

      const livePrice: LivePrice = {
        symbol: symbol.toUpperCase(),
        price: tokenData.usd || 0,
        change24h: tokenData.usd_24h_change || 0,
        lastUpdated: tokenData.last_updated_at ? tokenData.last_updated_at * 1000 : now
      };

      this.priceCache.set(symbol, livePrice);
      this.lastUpdate = now;

      console.log(`Live price updated for ${symbol}: $${livePrice.price}`);
      return livePrice;

    } catch (error) {
      console.error(`Failed to fetch live price for ${symbol}:`, error);
      return this.getFallbackPrice(symbol);
    }
  }

  async getSwapRate(fromToken: string, toToken: string = 'USDC'): Promise<SwapRate | null> {
    try {
      const [fromPrice, toPrice] = await Promise.all([
        this.getLivePrice(fromToken),
        this.getLivePrice(toToken)
      ]);

      if (!fromPrice || !toPrice) {
        return this.getFallbackSwapRate(fromToken, toToken);
      }

      const rate = fromPrice.price / toPrice.price;
      const inverseRate = toPrice.price / fromPrice.price;

      return {
        fromToken: fromToken.toUpperCase(),
        toToken: toToken.toUpperCase(),
        rate,
        inverseRate,
        lastUpdated: Math.max(fromPrice.lastUpdated, toPrice.lastUpdated),
        source: 'CoinGecko Live API'
      };

    } catch (error) {
      console.error(`Failed to get swap rate ${fromToken}/${toToken}:`, error);
      return this.getFallbackSwapRate(fromToken, toToken);
    }
  }

  private getFallbackPrice(symbol: string): LivePrice {
    const fallbackPrices: Record<string, number> = {
      'ETH': 3200,
      'WETH': 3200,
      'USDC': 1.0,
      'USDT': 1.0,
      'DAI': 1.0,
      'MATIC': 0.85,
      'WMATIC': 0.85,
      'WBTC': 67000,
      'LINK': 15,
      'UNI': 8.5,
      'AAVE': 85,
      'BNB': 600,
      'AVAX': 35
    };

    return {
      symbol: symbol.toUpperCase(),
      price: fallbackPrices[symbol.toUpperCase()] || 1,
      change24h: 0,
      lastUpdated: Date.now()
    };
  }

  private getFallbackSwapRate(fromToken: string, toToken: string): SwapRate {
    const fromPrice = this.getFallbackPrice(fromToken);
    const toPrice = this.getFallbackPrice(toToken);
    
    const rate = fromPrice.price / toPrice.price;
    const inverseRate = toPrice.price / fromPrice.price;

    return {
      fromToken: fromToken.toUpperCase(),
      toToken: toToken.toUpperCase(),
      rate,
      inverseRate,
      lastUpdated: Date.now(),
      source: 'Fallback Rates'
    };
  }

  // Bulk update prices for multiple tokens
  async updatePrices(symbols: string[]): Promise<void> {
    const tokenIds = symbols
      .map(symbol => this.tokenIdMap[symbol.toUpperCase()])
      .filter(Boolean)
      .join(',');

    if (!tokenIds) return;

    try {
      const response = await fetch(
        `${this.COINGECKO_URL}/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
      );

      if (!response.ok) return;

      const data = await response.json();
      const now = Date.now();

      symbols.forEach(symbol => {
        const tokenId = this.tokenIdMap[symbol.toUpperCase()];
        const tokenData = data[tokenId];

        if (tokenData) {
          this.priceCache.set(symbol, {
            symbol: symbol.toUpperCase(),
            price: tokenData.usd || 0,
            change24h: tokenData.usd_24h_change || 0,
            lastUpdated: tokenData.last_updated_at ? tokenData.last_updated_at * 1000 : now
          });
        }
      });

      this.lastUpdate = now;
      console.log(`Bulk price update completed for ${symbols.length} tokens`);

    } catch (error) {
      console.error('Bulk price update failed:', error);
    }
  }

  // Clear cache to force fresh data
  clearCache(): void {
    this.priceCache.clear();
    this.lastUpdate = 0;
  }

  // Get cached prices
  getCachedPrices(): Map<string, LivePrice> {
    return new Map(this.priceCache);
  }
}

export const livePriceFeed = new LivePriceFeedService();
export type { LivePrice, SwapRate };
