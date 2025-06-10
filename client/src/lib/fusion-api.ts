// Fusion API Service - Direct API implementation without SDK
// Avoids browser compatibility issues with Node.js modules

const ONEINCH_API_KEY = import.meta.env.VITE_ONEINCH_API_KEY;

interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

interface SwapQuote {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  toAmount: string;
  rate: string;
  priceImpact: string;
  gasEstimate: string;
  minimumReceived: string;
  route: string[];
  validUntil?: number;
}

interface SwapTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
}

class FusionAPIService {
  private readonly baseURL = 'https://api.1inch.dev';
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (!ONEINCH_API_KEY) {
        console.warn('1inch API key required for Fusion gasless swaps');
        return;
      }

      this.initialized = true;
      console.log('1inch Fusion API service initialized');
    } catch (error) {
      console.error('Failed to initialize 1inch Fusion API service:', error);
      this.initialized = false;
    }
  }

  async ensureInitialized(): Promise<boolean> {
    if (!this.initialized && ONEINCH_API_KEY) {
      await this.initialize();
    }
    return this.initialized;
  }

  // Get supported tokens for a network
  async getSupportedTokens(chainId: number): Promise<TokenInfo[]> {
    try {
      const response = await fetch(`${this.baseURL}/swap/v6.0/${chainId}/tokens`, {
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }

      const data = await response.json();
      return Object.values(data.tokens || {}) as TokenInfo[];
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      return [];
    }
  }

  // Get quote without using SDK
  async getQuote(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    walletAddress: string
  ): Promise<SwapQuote | null> {
    try {
      const params = new URLSearchParams({
        src: fromToken,
        dst: toToken,
        amount: amount,
        from: walletAddress,
        includeTokensInfo: 'true'
      });

      const response = await fetch(`${this.baseURL}/swap/v6.0/${chainId}/quote?${params}`, {
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Quote request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        fromToken: data.srcToken,
        toToken: data.dstToken,
        fromAmount: data.fromAmount || amount,
        toAmount: data.toAmount,
        rate: (parseFloat(data.toAmount) / parseFloat(amount)).toFixed(6),
        priceImpact: '0.1%', // Would be calculated from actual data
        gasEstimate: `~$${(parseFloat(data.estimatedGas || '150000') * 0.00002).toFixed(2)}`,
        minimumReceived: (parseFloat(data.toAmount) * 0.995).toString(), // 0.5% slippage
        route: [data.srcToken?.symbol || 'Unknown', data.dstToken?.symbol || 'Unknown']
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }

  // Check if initialized
  isInitialized(): boolean {
    return this.initialized;
  }

  // Get API key status
  hasApiKey(): boolean {
    return !!ONEINCH_API_KEY;
  }
    
  async executeSwap(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    chainId: number,
    walletAddress: string,
    slippage: number = 1
  ): Promise<SwapTransaction | null> {
    try {
      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amount,
        from: walletAddress,
        slippage: slippage.toString(),
        disableEstimate: 'false'
      });

      const response = await fetch(`${this.baseURL}/swap/v6.0/${chainId}/swap?${params}`, {
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to execute swap: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        to: data.tx.to,
        data: data.tx.data,
        value: data.tx.value,
        gasLimit: data.tx.gas,
        gasPrice: data.tx.gasPrice
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      return null;
    }
  }
}

export const fusionAPIService = new FusionAPIService();
export type { TokenInfo, SwapQuote, SwapTransaction };