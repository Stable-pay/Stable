// Production-ready 1inch Fusion API for gasless swaps
interface FusionQuoteRequest {
  srcTokenAddress: string;
  dstTokenAddress: string;
  srcTokenAmount: string;
  walletAddress: string;
}

interface FusionQuoteResponse {
  type: 'fusion';
  gasless: boolean;
  fromToken: {
    address: string;
    amount: string;
    symbol?: string;
  };
  toToken: {
    address: string;
    amount: string;
    symbol?: string;
  };
  order?: any;
  quoteId?: string;
  estimate?: any;
  validUntil?: number;
}

interface FusionExecuteRequest {
  order: any;
  signature: string;
  quoteId: string;
}

class ProductionFusionAPI {
  private readonly apiKey = import.meta.env.VITE_ONEINCH_API_KEY;
  private readonly baseURL = '/api/1inch';

  async getGaslessQuote(params: FusionQuoteRequest): Promise<FusionQuoteResponse | null> {
    if (!this.apiKey) {
      console.warn('1inch API key required for Fusion gasless swaps');
      return null;
    }

    try {
      const { srcTokenAddress, dstTokenAddress, srcTokenAmount, walletAddress } = params;
      
      console.log('Requesting Fusion gasless quote:', {
        from: srcTokenAddress,
        to: dstTokenAddress,
        amount: srcTokenAmount
      });

      const response = await fetch(
        `${this.baseURL}/1/fusion/quote?src=${srcTokenAddress}&dst=${dstTokenAddress}&amount=${srcTokenAmount}&from=${walletAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.log('Fusion quote failed:', error.error || response.statusText);
        
        if (error.requiresAuth) {
          console.log('API authentication required for Fusion');
        }
        
        return null;
      }

      const data = await response.json();
      console.log('Fusion quote received:', data);
      
      return data;
    } catch (error) {
      console.error('Fusion quote error:', error);
      return null;
    }
  }

  async executeGaslessSwap(params: FusionExecuteRequest): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key required for Fusion execution');
    }

    try {
      const response = await fetch(`${this.baseURL}/1/fusion/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Fusion execution failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Fusion execution error:', error);
      throw error;
    }
  }

  async getFusionOrderStatus(orderHash: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/1/fusion/order/${orderHash}`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get order status');
      }

      return await response.json();
    } catch (error) {
      console.error('Order status error:', error);
      throw error;
    }
  }

  // Fallback to regular swap if Fusion not available
  async getRegularSwapQuote(params: FusionQuoteRequest): Promise<any> {
    try {
      const { srcTokenAddress, dstTokenAddress, srcTokenAmount, walletAddress } = params;
      
      console.log('Getting regular swap quote as fallback');
      
      const response = await fetch(
        `${this.baseURL}/1/quote?src=${srcTokenAddress}&dst=${dstTokenAddress}&amount=${srcTokenAmount}&from=${walletAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Regular swap quote failed');
      }

      const data = await response.json();
      
      return {
        type: 'regular',
        gasless: false,
        fromToken: {
          address: srcTokenAddress,
          amount: srcTokenAmount
        },
        toToken: {
          address: dstTokenAddress,
          amount: data.toTokenAmount || data.toAmount
        },
        gasEstimate: data.estimatedGas,
        quote: data
      };
    } catch (error) {
      console.error('Regular swap quote error:', error);
      throw error;
    }
  }

  // Comprehensive swap with intelligent fallback
  async getSwapQuote(params: FusionQuoteRequest): Promise<any> {
    // Try Fusion first for gasless swap
    const fusionQuote = await this.getGaslessQuote(params);
    
    if (fusionQuote && fusionQuote.gasless) {
      console.log('Fusion gasless swap available');
      return fusionQuote;
    }

    // Fallback to regular swap
    console.log('Fusion not available, using regular swap');
    return await this.getRegularSwapQuote(params);
  }

  async isApiKeyConfigured(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export const productionFusionAPI = new ProductionFusionAPI();
export type { FusionQuoteRequest, FusionQuoteResponse, FusionExecuteRequest };