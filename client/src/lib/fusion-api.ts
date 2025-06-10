import { FusionSDK, NetworkEnum } from '@1inch/fusion-sdk';

const ONEINCH_API_KEY = import.meta.env.VITE_ONEINCH_API_KEY;
const ZX_API_KEY = import.meta.env.ZX_API_KEY;

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
  private sdk: FusionSDK | null = null;
  private readonly baseURL = 'https://api.1inch.dev';
  private initialized = false;

  constructor() {
    this.initializeSDK();
  }

  private async initializeSDK() {
    try {
      if (!ONEINCH_API_KEY) {
        console.warn('1inch API key required for Fusion gasless swaps');
        return;
      }

      this.sdk = new FusionSDK({
        url: this.baseURL,
        network: NetworkEnum.ETHEREUM,
        authKey: ONEINCH_API_KEY
      });

      this.initialized = true;
      console.log('1inch Fusion SDK initialized with authentication');
    } catch (error) {
      console.error('Failed to initialize 1inch Fusion SDK:', error);
      this.initialized = false;
    }
  }

  async ensureInitialized(): Promise<boolean> {
    if (!this.initialized && ONEINCH_API_KEY) {
      await this.initializeSDK();
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
      
      return Object.values(data.tokens).map((token: any) => ({
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        decimals: token.decimals,
        logoURI: token.logoURI
      }));
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      return this.getFallbackTokens(chainId);
    }
  }

  // Get swap quote
  async getSwapQuote(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    chainId: number,
    walletAddress?: string
  ): Promise<SwapQuote | null> {
    try {
      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amount,
        from: walletAddress || '0x0000000000000000000000000000000000000000',
        slippage: '1',
        disableEstimate: 'false'
      });

      const response = await fetch(`${this.baseURL}/swap/v6.0/${chainId}/quote?${params}`, {
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quote: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        fromToken: {
          symbol: data.fromToken.symbol,
          name: data.fromToken.name,
          address: data.fromToken.address,
          decimals: data.fromToken.decimals
        },
        toToken: {
          symbol: data.toToken.symbol,
          name: data.toToken.name,
          address: data.toToken.address,
          decimals: data.toToken.decimals
        },
        fromAmount: data.fromTokenAmount,
        toAmount: data.toTokenAmount,
        rate: `1 ${data.fromToken.symbol} = ${(parseFloat(data.toTokenAmount) / parseFloat(data.fromTokenAmount)).toFixed(6)} ${data.toToken.symbol}`,
        priceImpact: `${(parseFloat(data.estimatedGas) * 0.001).toFixed(2)}%`,
        gasEstimate: `~$${(parseFloat(data.estimatedGas) * 0.00002).toFixed(2)}`,
        minimumReceived: (parseFloat(data.toTokenAmount) * 0.99).toString(),
        route: [data.fromToken.symbol, data.toToken.symbol]
      };
    } catch (error) {
      console.error('Error fetching swap quote:', error);
      return null;
    }
  }

  // Execute swap transaction
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

  // Get token prices
  async getTokenPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.baseURL}/price/v1.1/${chainId}/${tokenAddresses.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }

  // Fallback tokens for when API is unavailable
  private getFallbackTokens(chainId: number): TokenInfo[] {
    const tokenMap: Record<number, TokenInfo[]> = {
      1: [ // Ethereum
        {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          decimals: 18
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xa0b86a33e6e7c7c0c3e6d2e7d2e6b7e6e6e6e6e6',
          decimals: 6
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          decimals: 6
        },
        {
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          decimals: 18
        }
      ],
      137: [ // Polygon
        {
          symbol: 'MATIC',
          name: 'Polygon',
          address: '0x0000000000000000000000000000000000001010',
          decimals: 18
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          decimals: 6
        }
      ],
      42161: [ // Arbitrum
        {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
          decimals: 18
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
          decimals: 6
        }
      ],
      8453: [ // Base
        {
          symbol: 'ETH',
          name: 'Ethereum',
          address: '0x4200000000000000000000000000000000000006',
          decimals: 18
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          decimals: 6
        }
      ]
    };

    return tokenMap[chainId] || [];
  }

  // Check API health
  async checkAPIHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/healthcheck`, {
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          'accept': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Alternative 0x API service for fallback
class ZeroXAPIService {
  private readonly baseURL = 'https://api.0x.org';

  async getSwapQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    chainId: number
  ): Promise<SwapQuote | null> {
    try {
      const params = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage: '0.01'
      });

      const response = await fetch(`${this.baseURL}/swap/v1/quote?${params}`, {
        headers: {
          '0x-api-key': ZX_API_KEY || '',
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`0x API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        fromToken: {
          symbol: data.sellTokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? 'ETH' : 'TOKEN',
          name: 'Token',
          address: data.sellTokenAddress,
          decimals: 18
        },
        toToken: {
          symbol: data.buyTokenAddress === '0xa0b86a33e6e7c7c0c3e6d2e7d2e6b7e6e6e6e6e6' ? 'USDC' : 'TOKEN',
          name: 'Token',
          address: data.buyTokenAddress,
          decimals: 18
        },
        fromAmount: data.sellAmount,
        toAmount: data.buyAmount,
        rate: `1 ${data.sellTokenAddress} = ${(parseFloat(data.buyAmount) / parseFloat(data.sellAmount)).toFixed(6)}`,
        priceImpact: `${(parseFloat(data.estimatedPriceImpact) * 100).toFixed(2)}%`,
        gasEstimate: `~$${(parseFloat(data.estimatedGas) * 0.00002).toFixed(2)}`,
        minimumReceived: data.guaranteedPrice,
        route: ['TOKEN1', 'TOKEN2']
      };
    } catch (error) {
      console.error('0x API error:', error);
      return null;
    }
  }
}

export const fusionAPIService = new FusionAPIService();
export const zeroXAPIService = new ZeroXAPIService();
export type { TokenInfo, SwapQuote, SwapTransaction };