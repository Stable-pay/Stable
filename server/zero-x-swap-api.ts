import { Request, Response } from 'express';

/**
 * 0x Swap API Integration for Gasless Swaps
 * Enables seamless crypto-to-USDC conversions with zero gas fees
 */
export class ZeroXSwapAPI {
  private readonly apiKey = '12be1743-8f3e-4867-a82b-501263f3c4b6';
  private readonly baseURL = 'https://api.0x.org';
  
  // Supported chains for 0x API
  private readonly supportedChains: Record<number, string> = {
    1: 'ethereum',
    137: 'polygon',
    56: 'bsc',
    42161: 'arbitrum',
    10: 'optimism',
    8453: 'base',
    43114: 'avalanche'
  };

  // USDC contract addresses for each chain
  private readonly usdcAddresses: Record<number, string> = {
    1: '0xA0b86a33E6441c49863dc7b4eA2b43DB5D31f0b2', // Ethereum USDC
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon USDC
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC USDC
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
    10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism USDC
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' // Avalanche USDC
  };

  /**
   * Get swap quote for token to USDC conversion
   */
  async getSwapQuote(req: Request, res: Response) {
    try {
      console.log('Raw request body:', req.body);
      console.log('Request headers:', req.headers);
      
      const { 
        chainId, 
        sellToken, 
        sellAmount, 
        slippagePercentage = '0.01',
        takerAddress 
      } = req.body;

      console.log('Extracted parameters:', { chainId, sellToken, sellAmount, takerAddress, slippagePercentage });

      if (!chainId || !sellToken || !sellAmount || !takerAddress) {
        console.log('Missing parameters detected:', {
          hasChainId: !!chainId,
          hasSellToken: !!sellToken,
          hasSellAmount: !!sellAmount,
          hasTakerAddress: !!takerAddress
        });
        return res.status(400).json({
          error: 'Missing required parameters: chainId, sellToken, sellAmount, takerAddress',
          received: { chainId, sellToken, sellAmount, takerAddress }
        });
      }

      const chainName = this.supportedChains[chainId];
      if (!chainName) {
        return res.status(400).json({
          error: `Unsupported chain ID: ${chainId}`
        });
      }

      const buyToken = this.usdcAddresses[chainId];
      if (!buyToken) {
        return res.status(400).json({
          error: `USDC not available on chain ${chainId}`
        });
      }

      // Build 0x API URL - use correct endpoint structure
      const apiURL = `${this.baseURL}/swap/v1/quote`;
      
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage,
        takerAddress,
        skipValidation: 'true' // Skip validation for quote-only requests
      });

      console.log('0x API Request URL:', `${apiURL}?${params.toString()}`);

      const response = await fetch(`${apiURL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          '0x-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('0x API Error:', errorData);
        return res.status(response.status).json({
          error: 'Failed to get swap quote',
          details: errorData
        });
      }

      const quoteData = await response.json();

      // Enhance quote with additional info
      const enhancedQuote = {
        ...quoteData,
        chainId,
        chainName,
        sellTokenSymbol: await this.getTokenSymbol(sellToken, chainId),
        buyTokenSymbol: 'USDC',
        estimatedGas: quoteData.estimatedGas || '0',
        gasPrice: quoteData.gasPrice || '0',
        protocolFee: quoteData.protocolFee || '0',
        minimumProtocolFee: quoteData.minimumProtocolFee || '0'
      };

      res.json({
        success: true,
        quote: enhancedQuote
      });

    } catch (error) {
      console.error('Swap quote error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute gasless swap transaction
   */
  async executeGaslessSwap(req: Request, res: Response) {
    try {
      const { 
        chainId, 
        sellToken, 
        sellAmount, 
        takerAddress,
        slippagePercentage = '0.01'
      } = req.body;

      if (!chainId || !sellToken || !sellAmount || !takerAddress) {
        return res.status(400).json({
          error: 'Missing required parameters: chainId, sellToken, sellAmount, takerAddress'
        });
      }

      const chainName = this.supportedChains[chainId];
      if (!chainName) {
        return res.status(400).json({
          error: `Unsupported chain ID: ${chainId}`
        });
      }

      const buyToken = this.usdcAddresses[chainId];

      // Get gasless swap transaction data
      const apiURL = chainId === 1 
        ? `${this.baseURL}/gasless/v1/submit`
        : `${this.baseURL}/gasless/v1/submit?chainId=${chainId}`;

      const swapParams = {
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage,
        takerAddress,
        enableSlippageProtection: true,
        priceImpactProtectionPercentage: '0.95',
        gasless: true
      };

      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          '0x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(swapParams)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('0x Gasless API Error:', errorData);
        return res.status(response.status).json({
          error: 'Failed to execute gasless swap',
          details: errorData
        });
      }

      const swapResult = await response.json();

      res.json({
        success: true,
        transaction: {
          ...swapResult,
          chainId,
          chainName,
          type: 'gasless_swap',
          sellTokenSymbol: await this.getTokenSymbol(sellToken, chainId),
          buyTokenSymbol: 'USDC'
        }
      });

    } catch (error) {
      console.error('Gasless swap execution error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get transaction status for gasless swap
   */
  async getTransactionStatus(req: Request, res: Response) {
    try {
      const { transactionHash, chainId } = req.params;

      if (!transactionHash || !chainId) {
        return res.status(400).json({
          error: 'Missing transaction hash or chain ID'
        });
      }

      const apiURL = `${this.baseURL}/gasless/v1/status/${transactionHash}`;

      const response = await fetch(apiURL, {
        headers: {
          '0x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        return res.status(response.status).json({
          error: 'Failed to get transaction status',
          details: errorData
        });
      }

      const statusData = await response.json();

      res.json({
        success: true,
        status: statusData
      });

    } catch (error) {
      console.error('Transaction status error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get supported tokens for gasless swaps on a specific chain
   */
  async getSupportedTokens(req: Request, res: Response) {
    try {
      const { chainId } = req.params;

      if (!chainId) {
        return res.status(400).json({
          error: 'Missing chain ID'
        });
      }

      const chainName = this.supportedChains[parseInt(chainId)];
      if (!chainName) {
        return res.status(400).json({
          error: `Unsupported chain ID: ${chainId}`
        });
      }

      const apiURL = `${this.baseURL}/swap/v1/tokens?chainId=${chainId}`;

      const response = await fetch(apiURL, {
        headers: {
          '0x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        return res.status(response.status).json({
          error: 'Failed to get supported tokens',
          details: errorData
        });
      }

      const tokensData = await response.json();

      res.json({
        success: true,
        chainId: parseInt(chainId),
        chainName,
        tokens: tokensData.records || tokensData
      });

    } catch (error) {
      console.error('Supported tokens error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Helper function to get token symbol
   */
  private async getTokenSymbol(tokenAddress: string, chainId: number): Promise<string> {
    try {
      // Common token symbols for quick lookup
      const commonTokens: Record<string, string> = {
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'WBTC',
        '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'UNI'
      };

      if (commonTokens[tokenAddress]) {
        return commonTokens[tokenAddress];
      }

      // For native tokens
      if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        const nativeSymbols: Record<number, string> = {
          1: 'ETH',
          137: 'MATIC',
          56: 'BNB',
          42161: 'ETH',
          10: 'ETH',
          8453: 'ETH',
          43114: 'AVAX'
        };
        return nativeSymbols[chainId] || 'ETH';
      }

      return tokenAddress.slice(0, 8) + '...';
    } catch (error) {
      return 'UNKNOWN';
    }
  }
}

export const zeroXSwapAPI = new ZeroXSwapAPI();