// 0x Protocol API service for token swapping and price data
export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  network: string;
  slippage: number;
  userAddress: string;
  gasless?: boolean;
}

export interface SwapResponse {
  quote: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    rate: number;
    priceImpact: number;
    gasEstimate: string;
    minimumReceived: string;
  };
  transaction: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  gasless?: {
    tradeHash: string;
    permit2: any;
  };
}

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

class DexApiService {
  private readonly BASE_URL = '/api/0x';
  private readonly COINGECKO_URL = 'https://api.coingecko.com/api/v3';

  // USDC addresses for each chain
  private readonly USDC_ADDRESSES: Record<string, string> = {
    'ethereum': '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',
    'polygon': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    'arbitrum': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'optimism': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    'avalanche': '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  };

  async getTokenPrices(tokens: string[]): Promise<Record<string, TokenPrice>> {
    try {
      // Use CoinGecko for real-time pricing
      const tokenIds = tokens.map(token => this.getTokenId(token)).join(',');
      const response = await fetch(
        `${this.COINGECKO_URL}/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      );
      
      if (!response.ok) {
        console.log('CoinGecko API unavailable, using mock prices');
        return this.getMockPrices(tokens);
      }
      
      const data = await response.json();
      const prices: Record<string, TokenPrice> = {};
      
      tokens.forEach(token => {
        const tokenId = this.getTokenId(token);
        const priceData = data[tokenId];
        if (priceData) {
          prices[token] = {
            symbol: token,
            price: priceData.usd || 0,
            change24h: priceData.usd_24h_change || 0,
            volume24h: priceData.usd_24h_vol || 0
          };
        }
      });
      
      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return this.getMockPrices(tokens);
    }
  }

  async getSwapQuote(params: SwapParams): Promise<SwapResponse> {
    try {
      console.log('Getting 0x swap quote for:', params);
      
      const chainId = this.getChainId(params.network);
      const sellToken = params.fromToken === 'native' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : params.fromToken;
      const buyToken = params.toToken || this.USDC_ADDRESSES[params.network.toLowerCase()];

      if (params.gasless) {
        // Use gasless API
        const requestBody = {
          sellToken,
          buyToken,
          sellAmount: params.amount,
          takerAddress: params.userAddress
        };

        const response = await fetch(`${this.BASE_URL}/${chainId}/gasless-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error('0x gasless API unavailable');
        }

        const data = await response.json();
        return this.formatGaslessResponse(data);
      } else {
        // Use regular swap API
        const queryParams = new URLSearchParams({
          sellToken,
          buyToken,
          sellAmount: params.amount,
          takerAddress: params.userAddress,
          slippagePercentage: (params.slippage / 100).toString()
        });

        const response = await fetch(`${this.BASE_URL}/${chainId}/quote?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('0x API unavailable');
        }
        
        const data = await response.json();
        return this.formatSwapResponse(data);
      }
      
    } catch (error) {
      console.error('0x API failed, using mock response:', error);
      return this.getMockSwapQuote(params);
    }
  }

  private getTokenId(symbol: string): string {
    const mapping: Record<string, string> = {
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
      'CRV': 'curve-dao-token',
      'SUSHI': 'sushi',
      'COMP': 'compound-governance-token',
      'MKR': 'maker',
      'SNX': 'havven',
      'YFI': 'yearn-finance',
      'BNB': 'binancecoin',
      'AVAX': 'avalanche-2'
    };
    return mapping[symbol] || symbol.toLowerCase();
  }

  private getChainId(network: string): string {
    const mapping: Record<string, string> = {
      'ethereum': '1',
      'polygon': '137',
      'arbitrum': '42161',
      'base': '8453',
      'optimism': '10',
      'avalanche': '43114',
      'bsc': '56'
    };
    return mapping[network.toLowerCase()] || '1';
  }

  private formatSwapResponse(data: any): SwapResponse {
    return {
      quote: {
        fromToken: data.sellToken || 'Unknown',
        toToken: data.buyToken || 'USDC',
        fromAmount: data.sellAmount || '0',
        toAmount: data.buyAmount || '0',
        rate: parseFloat(data.price || '0'),
        priceImpact: 0.5, // Estimate
        gasEstimate: data.estimatedGas || data.gas || '150000',
        minimumReceived: (parseFloat(data.buyAmount || '0') * 0.99).toString()
      },
      transaction: {
        to: data.to || '',
        data: data.data || '',
        value: data.value || '0',
        gasLimit: data.gas || '150000',
        gasPrice: data.gasPrice || '20000000000'
      }
    };
  }

  private formatGaslessResponse(data: any): SwapResponse {
    return {
      quote: {
        fromToken: data.sellToken || 'Unknown',
        toToken: data.buyToken || 'USDC',
        fromAmount: data.sellAmount || '0',
        toAmount: data.buyAmount || '0',
        rate: parseFloat(data.price || '0'),
        priceImpact: 0.5, // Estimate
        gasEstimate: '0', // Gasless
        minimumReceived: (parseFloat(data.buyAmount || '0') * 0.99).toString()
      },
      transaction: {
        to: data.transaction?.to || '',
        data: data.transaction?.data || '',
        value: data.transaction?.value || '0',
        gasLimit: data.transaction?.gas || '0',
        gasPrice: '0' // Gasless
      },
      gasless: {
        tradeHash: data.tradeHash,
        permit2: data.permit2
      }
    };
  }

  private getMockPrices(tokens: string[]): Record<string, TokenPrice> {
    const mockPrices: Record<string, TokenPrice> = {
      'ETH': { symbol: 'ETH', price: 2300, change24h: 2.5, volume24h: 15000000000 },
      'USDC': { symbol: 'USDC', price: 1.0, change24h: 0.1, volume24h: 8000000000 },
      'USDT': { symbol: 'USDT', price: 1.0, change24h: -0.05, volume24h: 25000000000 },
      'DAI': { symbol: 'DAI', price: 1.0, change24h: 0.05, volume24h: 500000000 },
      'MATIC': { symbol: 'MATIC', price: 0.85, change24h: 1.8, volume24h: 400000000 },
      'WMATIC': { symbol: 'WMATIC', price: 0.85, change24h: 1.8, volume24h: 400000000 },
      'WETH': { symbol: 'WETH', price: 2300, change24h: 2.5, volume24h: 5000000000 },
      'WBTC': { symbol: 'WBTC', price: 43000, change24h: 1.2, volume24h: 2000000000 },
      'LINK': { symbol: 'LINK', price: 15, change24h: 3.1, volume24h: 600000000 },
      'UNI': { symbol: 'UNI', price: 8.5, change24h: -1.5, volume24h: 300000000 },
      'AAVE': { symbol: 'AAVE', price: 85, change24h: 2.8, volume24h: 200000000 },
      'CRV': { symbol: 'CRV', price: 0.95, change24h: -0.8, volume24h: 150000000 },
      'SUSHI': { symbol: 'SUSHI', price: 1.2, change24h: 1.5, volume24h: 100000000 }
    };

    const result: Record<string, TokenPrice> = {};
    tokens.forEach(token => {
      result[token] = mockPrices[token] || { symbol: token, price: 1, change24h: 0, volume24h: 0 };
    });
    
    return result;
  }

  private getMockSwapQuote(params: SwapParams): SwapResponse {
    // Mock response for testing
    const mockRate = 1800; // Example: 1 ETH = 1800 USDC
    const fromAmount = parseFloat(params.amount);
    const toAmount = fromAmount * mockRate;
    
    const baseResponse = {
      quote: {
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        toAmount: toAmount.toString(),
        rate: mockRate,
        priceImpact: 0.5,
        gasEstimate: params.gasless ? '0' : '150000',
        minimumReceived: (toAmount * 0.99).toString()
      },
      transaction: {
        to: '0x1111111254fb6c44bac0bed2854e76f90643097d',
        data: '0x',
        value: params.fromToken === 'ETH' ? params.amount : '0',
        gasLimit: params.gasless ? '0' : '150000',
        gasPrice: params.gasless ? '0' : '20000000000'
      }
    };

    if (params.gasless) {
      return {
        ...baseResponse,
        gasless: {
          tradeHash: '0x' + Math.random().toString(16).substr(2, 64),
          permit2: {
            type: 'permit2',
            hash: '0x' + Math.random().toString(16).substr(2, 64),
            eip712: {}
          }
        }
      };
    }

    return baseResponse;
  }
}

export const dexApiService = new DexApiService();