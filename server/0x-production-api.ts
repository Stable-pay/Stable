import { Request, Response } from 'express';
import { ethers } from 'ethers';

/**
 * Production 0x Protocol API Implementation
 * Based on https://github.com/0xProject/0x-examples
 * Using official 0x API with provided key: 12be1743-8f3e-4867-a82b-501263f3c4b6
 */
export class ZeroXProductionAPI {
  private readonly apiKey = '12be1743-8f3e-4867-a82b-501263f3c4b6';
  private readonly baseURL = 'https://api.0x.org';
  
  // Production chain configurations from 0x examples
  private readonly chainConfigs: Record<number, { name: string; rpcUrl: string }> = {
    1: { name: 'ethereum', rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo' },
    137: { name: 'polygon', rpcUrl: 'https://polygon-rpc.com' },
    56: { name: 'bsc', rpcUrl: 'https://bsc-dataseed1.binance.org' },
    42161: { name: 'arbitrum', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
    10: { name: 'optimism', rpcUrl: 'https://mainnet.optimism.io' },
    8453: { name: 'base', rpcUrl: 'https://mainnet.base.org' },
    43114: { name: 'avalanche', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc' }
  };

  // USDC contract addresses (official from 0x examples)
  private readonly usdcAddresses: Record<number, string> = {
    1: '0xA0b86a33E6441c49863dc7b4eA2b43DB5D31f0b2',
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  };

  // ERC20 ABI for token operations
  private readonly erc20ABI = [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address to, uint256 amount) returns (bool)'
  ];

  /**
   * Get live price quote from 0x API
   * Implementation based on 0x-examples/swap-v1-headless-example
   */
  async getLiveQuote(req: Request, res: Response) {
    try {
      const { 
        chainId, 
        sellToken, 
        sellAmount, 
        slippagePercentage = '0.01',
        takerAddress 
      } = req.body;

      console.log('0x Live Quote Request:', { chainId, sellToken, sellAmount, takerAddress });

      if (!chainId || !sellToken || !sellAmount || !takerAddress) {
        return res.status(400).json({
          error: 'Missing required parameters',
          required: ['chainId', 'sellToken', 'sellAmount', 'takerAddress']
        });
      }

      const chainConfig = this.chainConfigs[chainId];
      if (!chainConfig) {
        return res.status(400).json({
          error: `Unsupported chain: ${chainId}`,
          supportedChains: Object.keys(this.chainConfigs).map(Number)
        });
      }

      const buyToken = this.usdcAddresses[chainId];
      if (!buyToken) {
        return res.status(400).json({
          error: `USDC not available on chain ${chainId}`
        });
      }

      // Build 0x API request following official examples
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage,
        takerAddress,
        skipValidation: 'false',
        intentOnFilling: 'true'
      });

      const quoteUrl = `${this.baseURL}/swap/permit2/quote?${params.toString()}`;
      console.log('0x Quote URL:', quoteUrl);

      const response = await fetch(quoteUrl, {
        method: 'GET',
        headers: {
          '0x-api-key': this.apiKey,
          '0x-version': 'v2',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('0x API Quote Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        return res.status(response.status).json({
          error: '0x API quote failed',
          details: errorText,
          statusCode: response.status
        });
      }

      const quoteData = await response.json();
      console.log('0x Quote Response:', quoteData);

      // Check token allowance for Permit2
      const allowanceData = await this.checkPermit2Allowance(
        sellToken, 
        takerAddress, 
        quoteData.permit2?.eip712 ? quoteData.permit2.eip712.domain.verifyingContract : null,
        chainId
      );

      res.json({
        success: true,
        quote: {
          ...quoteData,
          chainId,
          chainName: chainConfig.name,
          sellTokenSymbol: await this.getTokenSymbol(sellToken, chainId),
          buyTokenSymbol: 'USDC',
          allowanceCheck: allowanceData
        }
      });

    } catch (error) {
      console.error('Live quote error:', error);
      res.status(500).json({
        error: 'Failed to get live quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute gasless swap using 0x permit2 system
   * Implementation based on 0x-examples/swap-v1-headless-example
   */
  async executeGaslessSwap(req: Request, res: Response) {
    try {
      const { 
        chainId, 
        sellToken, 
        sellAmount, 
        takerAddress,
        slippagePercentage = '0.01',
        permit2Signature
      } = req.body;

      console.log('0x Gasless Swap Request:', { 
        chainId, 
        sellToken, 
        sellAmount, 
        takerAddress, 
        hasPermit2Signature: !!permit2Signature 
      });

      if (!chainId || !sellToken || !sellAmount || !takerAddress) {
        return res.status(400).json({
          error: 'Missing required parameters'
        });
      }

      const chainConfig = this.chainConfigs[chainId];
      if (!chainConfig) {
        return res.status(400).json({
          error: `Unsupported chain: ${chainId}`
        });
      }

      const buyToken = this.usdcAddresses[chainId];

      // Get swap transaction from 0x API
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage,
        takerAddress,
        skipValidation: 'false'
      });

      // Add permit2 signature if provided
      if (permit2Signature) {
        params.append('permit2Signature', permit2Signature);
      }

      const swapUrl = `${this.baseURL}/swap/permit2/quote?${params.toString()}`;
      console.log('0x Swap URL:', swapUrl);

      const response = await fetch(swapUrl, {
        method: 'GET',
        headers: {
          '0x-api-key': this.apiKey,
          '0x-version': 'v2',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('0x API Swap Error:', {
          status: response.status,
          error: errorText
        });

        return res.status(response.status).json({
          error: '0x API swap failed',
          details: errorText,
          statusCode: response.status
        });
      }

      const swapData = await response.json();
      console.log('0x Swap Response:', swapData);

      // Validate transaction data
      if (!swapData.transaction || !swapData.transaction.to || !swapData.transaction.data) {
        return res.status(400).json({
          error: 'Invalid transaction data from 0x API',
          received: swapData
        });
      }

      res.json({
        success: true,
        transaction: {
          to: swapData.transaction.to,
          data: swapData.transaction.data,
          value: swapData.transaction.value || '0',
          gasPrice: swapData.transaction.gasPrice,
          gas: swapData.transaction.gas,
          sellToken,
          buyToken,
          sellAmount,
          buyAmount: swapData.buyAmount,
          price: swapData.price,
          guaranteedPrice: swapData.guaranteedPrice,
          chainId,
          chainName: chainConfig.name,
          permit2: swapData.permit2,
          sources: swapData.sources
        }
      });

    } catch (error) {
      console.error('Gasless swap execution error:', error);
      res.status(500).json({
        error: 'Failed to execute gasless swap',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check Permit2 allowance for gasless transactions
   */
  async checkPermit2Allowance(
    tokenAddress: string,
    ownerAddress: string,
    permit2Address: string | null,
    chainId: number
  ) {
    try {
      if (!permit2Address) {
        return {
          allowanceRequired: true,
          currentAllowance: '0',
          permit2Required: true
        };
      }

      const chainConfig = this.chainConfigs[chainId];
      if (!chainConfig?.rpcUrl) {
        return {
          allowanceRequired: true,
          currentAllowance: '0',
          error: 'No RPC endpoint available'
        };
      }

      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);

      // Check allowance to Permit2 contract
      const currentAllowance = await tokenContract.allowance(ownerAddress, permit2Address);
      const maxUint256 = ethers.MaxUint256;
      const halfMax = maxUint256 / BigInt(2);

      return {
        allowanceRequired: currentAllowance < halfMax,
        currentAllowance: currentAllowance.toString(),
        permit2Address,
        permit2Required: true
      };

    } catch (error) {
      console.error('Permit2 allowance check error:', error);
      return {
        allowanceRequired: true,
        currentAllowance: '0',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get supported tokens for gasless swaps
   */
  async getSupportedTokens(req: Request, res: Response) {
    try {
      const { chainId } = req.params;
      const chainIdNum = parseInt(chainId);

      if (!this.chainConfigs[chainIdNum]) {
        return res.status(400).json({
          error: `Unsupported chain: ${chainId}`
        });
      }

      // Get token list from 0x API
      const tokensUrl = `${this.baseURL}/swap/v1/tokens?chainId=${chainId}`;
      
      const response = await fetch(tokensUrl, {
        method: 'GET',
        headers: {
          '0x-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: 'Failed to get supported tokens',
          details: errorText
        });
      }

      const tokensData = await response.json();

      res.json({
        success: true,
        chainId: chainIdNum,
        chainName: this.chainConfigs[chainIdNum].name,
        tokens: tokensData.records || [],
        usdcAddress: this.usdcAddresses[chainIdNum]
      });

    } catch (error) {
      console.error('Get supported tokens error:', error);
      res.status(500).json({
        error: 'Failed to get supported tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(req: Request, res: Response) {
    try {
      const { transactionHash, chainId } = req.params;

      const chainConfig = this.chainConfigs[parseInt(chainId)];
      if (!chainConfig) {
        return res.status(400).json({
          error: `Unsupported chain: ${chainId}`
        });
      }

      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const receipt = await provider.getTransactionReceipt(transactionHash);

      if (!receipt) {
        return res.json({
          status: 'pending',
          transactionHash,
          chainId: parseInt(chainId)
        });
      }

      res.json({
        status: receipt.status === 1 ? 'success' : 'failed',
        transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        chainId: parseInt(chainId),
        chainName: chainConfig.name
      });

    } catch (error) {
      console.error('Transaction status error:', error);
      res.status(500).json({
        error: 'Failed to get transaction status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get token symbol from contract
   */
  async getTokenSymbol(tokenAddress: string, chainId: number): Promise<string> {
    try {
      const chainConfig = this.chainConfigs[chainId];
      if (!chainConfig?.rpcUrl) return 'UNKNOWN';

      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
      
      return await tokenContract.symbol();
    } catch (error) {
      console.error('Token symbol error:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const testChainId = 1; // Ethereum mainnet
      const testUrl = `${this.baseURL}/swap/v1/tokens?chainId=${testChainId}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          '0x-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const isHealthy = response.ok;
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        apiKey: this.apiKey.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
        supportedChains: Object.keys(this.chainConfigs).map(Number)
      });

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const zeroXProductionAPI = new ZeroXProductionAPI();