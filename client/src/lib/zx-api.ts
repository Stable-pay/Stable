// 0x Gasless v2 API service based on official headless example
export interface ZxSwapParams {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
  chainId: number;
  slippagePercentage?: number;
}

export interface ZxQuoteResponse {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  estimatedGas: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  allowanceTarget: string;
}

export interface ZxGaslessPrice {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  estimatedGas: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
}

export interface ZxGaslessQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  trade: {
    eip712: {
      types: Record<string, any>;
      domain: Record<string, any>;
      message: Record<string, any>;
      primaryType: string;
    };
    tradeHash: string;
  };
  approval: {
    isRequired: boolean;
    eip712?: {
      types: Record<string, any>;
      domain: Record<string, any>;
      message: Record<string, any>;
      primaryType: string;
    };
  };
}

export interface ZxGaslessSubmitResponse {
  tradeHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
}

export interface ZxGaslessStatus {
  status: 'pending' | 'confirmed' | 'failed';
  transactions: Array<{
    hash: string;
    timestamp: number;
    gasUsed?: string;
  }>;
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

  // Check supported chains for gasless
  private readonly GASLESS_SUPPORTED_CHAINS = [1, 137, 42161, 8453, 10];

  isGaslessSupported(chainId: number): boolean {
    return this.GASLESS_SUPPORTED_CHAINS.includes(chainId);
  }

  // Standard 0x swap quote
  async getQuote(params: ZxSwapParams): Promise<ZxQuoteResponse> {
    const { sellToken, buyToken, sellAmount, takerAddress, chainId, slippagePercentage } = params;
    
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

  // 0x Gasless v2 price check
  async getGaslessPrice(params: ZxSwapParams): Promise<ZxGaslessPrice> {
    const { sellToken, buyToken, sellAmount, takerAddress, chainId } = params;
    
    if (!this.isGaslessSupported(chainId)) {
      throw new Error(`Gasless swaps not supported on chain ${chainId}`);
    }
    
    const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
    if (!targetBuyToken) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }

    const queryParams = new URLSearchParams({
      sellToken: sellToken === 'native' ? NATIVE_TOKEN_ADDRESS : sellToken,
      buyToken: targetBuyToken,
      sellAmount,
      takerAddress
    });

    const response = await fetch(`${this.BASE_URL}/${chainId}/gasless/price?${queryParams}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get gasless price');
    }

    return response.json();
  }

  // 0x Gasless v2 quote with EIP-712 signature data
  async getGaslessQuote(params: ZxSwapParams): Promise<ZxGaslessQuote> {
    const { sellToken, buyToken, sellAmount, takerAddress, chainId } = params;
    
    if (!this.isGaslessSupported(chainId)) {
      throw new Error(`Gasless swaps not supported on chain ${chainId}`);
    }
    
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

    const response = await fetch(`${this.BASE_URL}/${chainId}/gasless/quote`, {
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

  // Submit gasless swap with EIP-712 signature
  async submitGaslessSwap(chainId: number, signature: string, trade: any): Promise<ZxGaslessSubmitResponse> {
    if (!this.isGaslessSupported(chainId)) {
      throw new Error(`Gasless swaps not supported on chain ${chainId}`);
    }

    const requestBody = {
      signature,
      trade
    };

    const response = await fetch(`${this.BASE_URL}/${chainId}/gasless/submit`, {
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

  // Check gasless swap status
  async getGaslessStatus(chainId: number, tradeHash: string): Promise<ZxGaslessStatus> {
    if (!this.isGaslessSupported(chainId)) {
      throw new Error(`Gasless swaps not supported on chain ${chainId}`);
    }

    const response = await fetch(`${this.BASE_URL}/${chainId}/gasless/status/${tradeHash}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get gasless swap status');
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

    if (gasless && this.isGaslessSupported(chainId)) {
      return this.getGaslessQuote(swapParams);
    } else {
      return this.getQuote(swapParams);
    }
  }

  // Helper to check if token approval is needed for gasless swaps
  async checkApprovalNeeded(params: ZxSwapParams): Promise<boolean> {
    try {
      const gaslessQuote = await this.getGaslessQuote(params);
      return gaslessQuote.approval.isRequired;
    } catch (error) {
      console.error('Error checking approval:', error);
      return false;
    }
  }
}

export const zxApiService = new ZxApiService();