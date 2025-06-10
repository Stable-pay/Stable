// PancakeSwap API integration for cross-chain swaps and gasless transactions
interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
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

interface PancakeSwapQuoteRequest {
  srcTokenAddress: string;
  dstTokenAddress: string;
  srcTokenAmount: string;
  walletAddress: string;
  chainId: number;
}

interface PancakeSwapQuoteResponse {
  type: 'pancakeswap';
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
  transaction?: any;
  quoteId?: string;
  estimate?: any;
  validUntil?: number;
}

class PancakeSwapAPIService {
  private readonly apiKey = import.meta.env.VITE_PANCAKESWAP_API_KEY;
  private readonly baseURL = '/api/pancakeswap';
  private readonly pancakeRouterAddress = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'; // PancakeSwap Universal Router

  // Supported networks for PancakeSwap
  private readonly supportedChains = {
    1: 'ethereum',
    56: 'bsc',
    137: 'polygon',
    42161: 'arbitrum',
    10: 'optimism',
    8453: 'base'
  };

  async getSwapQuote(params: PancakeSwapQuoteRequest): Promise<PancakeSwapQuoteResponse | null> {
    try {
      const { srcTokenAddress, dstTokenAddress, srcTokenAmount, walletAddress, chainId } = params;
      
      console.log('Requesting PancakeSwap quote:', {
        from: srcTokenAddress,
        to: dstTokenAddress,
        amount: srcTokenAmount,
        chain: this.supportedChains[chainId as keyof typeof this.supportedChains]
      });

      const response = await fetch(
        `${this.baseURL}/${chainId}/quote?src=${srcTokenAddress}&dst=${dstTokenAddress}&amount=${srcTokenAmount}&from=${walletAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.log('PancakeSwap quote failed:', error.error || response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('PancakeSwap quote received:', data);
      
      return {
        type: 'pancakeswap',
        gasless: data.gasless || false,
        fromToken: {
          address: srcTokenAddress,
          amount: srcTokenAmount,
          symbol: data.fromToken?.symbol
        },
        toToken: {
          address: dstTokenAddress,
          amount: data.toAmount || data.toTokenAmount,
          symbol: data.toToken?.symbol
        },
        transaction: data.transaction,
        quoteId: data.quoteId,
        estimate: data.estimate,
        validUntil: data.validUntil
      };
    } catch (error) {
      console.error('PancakeSwap quote error:', error);
      return null;
    }
  }

  async executeSwap(params: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'PancakeSwap execution failed');
      }

      return await response.json();
    } catch (error) {
      console.error('PancakeSwap execution error:', error);
      throw error;
    }
  }

  async getTokenPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.baseURL}/${chainId}/prices?tokens=${tokenAddresses.join(',')}`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get token prices');
      }

      return await response.json();
    } catch (error) {
      console.error('Token prices error:', error);
      return {};
    }
  }

  async getSupportedTokens(chainId: number): Promise<TokenInfo[]> {
    try {
      const response = await fetch(`${this.baseURL}/${chainId}/tokens`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error(`PancakeSwap tokens API error: ${response.status}`);
        return this.getFallbackTokens(chainId);
      }

      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      console.error('PancakeSwap tokens error:', error);
      return this.getFallbackTokens(chainId);
    }
  }

  private getFallbackTokens(chainId: number): TokenInfo[] {
    const commonTokens: Record<number, TokenInfo[]> = {
      1: [ // Ethereum
        { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, chainId: 1 },
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B', decimals: 6, chainId: 1 },
        { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, chainId: 1 },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, chainId: 1 }
      ],
      56: [ // BSC
        { symbol: 'BNB', name: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, chainId: 56 },
        { symbol: 'CAKE', name: 'PancakeSwap Token', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18, chainId: 56 },
        { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, chainId: 56 },
        { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18, chainId: 56 }
      ]
    };

    return commonTokens[chainId] || [];
  }

  async checkAPIHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      return response.ok;
    } catch (error) {
      console.error('PancakeSwap API health check failed:', error);
      return false;
    }
  }

  async isApiKeyConfigured(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export const pancakeSwapAPIService = new PancakeSwapAPIService();
export type { PancakeSwapQuoteRequest, PancakeSwapQuoteResponse, TokenInfo, SwapQuote, SwapTransaction };