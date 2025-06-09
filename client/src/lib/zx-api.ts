// 0x API service for token swapping and gasless transactions
export interface ZxSwapParams {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
  chainId: number;
  slippagePercentage?: number;
}

export interface ZxPriceResponse {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  grossPrice: string;
  estimatedGas: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenToEthRate: string;
  sellTokenToEthRate: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
}

export interface ZxQuoteResponse extends ZxPriceResponse {
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  gas: string;
  allowanceTarget: string;
  decodedUniqueId: string;
}

export interface ZxGaslessQuoteResponse {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenToEthRate: string;
  sellTokenToEthRate: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  orders: Array<{
    makerToken: string;
    takerToken: string;
    makerAmount: string;
    takerAmount: string;
    fillData: {
      tokenAddressPath: string[];
      router: string;
    };
    source: string;
    sourcePathId: string;
    type: number;
  }>;
  allowanceTarget: string;
  decodedUniqueId: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  permit2: {
    type: string;
    hash: string;
    eip712: {
      types: Record<string, any>;
      domain: Record<string, any>;
      message: Record<string, any>;
      primaryType: string;
    };
  };
  transaction: {
    to: string;
    data: string;
    gas: string;
    gasPrice: string;
    value: string;
  };
  tradeHash: string;
}

export interface ZxGaslessSubmitResponse {
  tradeHash: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// USDC contract addresses for each supported chain
const USDC_ADDRESSES: Record<number, string> = {
  1: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',      // Ethereum
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',    // Optimism
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'   // Avalanche
};

// Native token address for 0x API
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

class ZxApiService {
  private readonly BASE_URL = '/api/0x';

  async getPrice(params: ZxSwapParams): Promise<ZxPriceResponse> {
    const { sellToken, buyToken, sellAmount, takerAddress, chainId } = params;
    
    // Auto-convert to USDC if buyToken not specified
    const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
    if (!targetBuyToken) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }

    const queryParams = new URLSearchParams({
      sellToken: sellToken === 'native' ? NATIVE_TOKEN_ADDRESS : sellToken,
      buyToken: targetBuyToken,
      sellAmount,
      ...(takerAddress && { takerAddress })
    });

    const response = await fetch(`${this.BASE_URL}/${chainId}/price?${queryParams}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get price quote');
    }

    return response.json();
  }

  async getQuote(params: ZxSwapParams): Promise<ZxQuoteResponse> {
    const { sellToken, buyToken, sellAmount, takerAddress, chainId, slippagePercentage } = params;
    
    // Auto-convert to USDC if buyToken not specified
    const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
    if (!targetBuyToken) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }

    const queryParams = new URLSearchParams({
      sellToken: sellToken === 'native' ? NATIVE_TOKEN_ADDRESS : sellToken,
      buyToken: targetBuyToken,
      sellAmount,
      takerAddress,
      slippagePercentage: (slippagePercentage || 0.01).toString()
    });

    const response = await fetch(`${this.BASE_URL}/${chainId}/quote?${queryParams}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get swap quote');
    }

    return response.json();
  }

  async getGaslessQuote(params: ZxSwapParams): Promise<ZxGaslessQuoteResponse> {
    const { sellToken, buyToken, sellAmount, takerAddress, chainId } = params;
    
    // Auto-convert to USDC if buyToken not specified
    const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
    if (!targetBuyToken) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }

    const requestBody = {
      sellToken: sellToken === 'native' ? NATIVE_TOKEN_ADDRESS : sellToken,
      buyToken: targetBuyToken,
      sellAmount,
      takerAddress
    };

    const response = await fetch(`${this.BASE_URL}/${chainId}/gasless-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get gasless quote');
    }

    return response.json();
  }

  async submitGaslessSwap(chainId: number, signature: string, tradeHash: string): Promise<ZxGaslessSubmitResponse> {
    const requestBody = {
      signature,
      tradeHash
    };

    const response = await fetch(`${this.BASE_URL}/${chainId}/gasless-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit gasless swap');
    }

    return response.json();
  }

  // Helper function to convert token to USDC on native chain
  async swapToUSDC(params: {
    tokenAddress: string;
    amount: string;
    userAddress: string;
    chainId: number;
    gasless?: boolean;
  }) {
    const { tokenAddress, amount, userAddress, chainId, gasless = false } = params;
    
    const swapParams: ZxSwapParams = {
      sellToken: tokenAddress === 'native' ? NATIVE_TOKEN_ADDRESS : tokenAddress,
      buyToken: USDC_ADDRESSES[chainId],
      sellAmount: amount,
      takerAddress: userAddress,
      chainId
    };

    if (gasless) {
      return this.getGaslessQuote(swapParams);
    } else {
      return this.getQuote(swapParams);
    }
  }
}

export const zxApiService = new ZxApiService();