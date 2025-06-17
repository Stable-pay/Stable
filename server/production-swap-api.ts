import { Request, Response } from 'express';
import { ethers } from 'ethers';

/**
 * Production-Ready 0x Protocol Gasless Swap API
 * Implements live API integration with proper approval mechanisms
 */
export class ProductionSwapAPI {
  private readonly apiKey = process.env.ZEROX_API_KEY || '12be1743-8f3e-4867-a82b-501263f3c4b6';
  private readonly baseURL = 'https://api.0x.org';
  
  // Production RPC endpoints for each chain
  private readonly rpcEndpoints: Record<number, string> = {
    1: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    137: 'https://polygon-rpc.com',
    56: 'https://bsc-dataseed1.binance.org',
    42161: 'https://arb1.arbitrum.io/rpc',
    10: 'https://mainnet.optimism.io',
    8453: 'https://mainnet.base.org',
    43114: 'https://api.avax.network/ext/bc/C/rpc'
  };

  // USDC contract addresses for each chain
  private readonly usdcAddresses: Record<number, string> = {
    1: '0xA0b86a33E6441c49863dc7b4eA2b43DB5D31f0b2',
    137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  };

  // ERC20 ABI for approval checks
  private readonly erc20ABI = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  /**
   * Get production swap quote with live API
   */
  async getProductionSwapQuote(req: Request, res: Response) {
    try {
      const { 
        chainId, 
        sellToken, 
        sellAmount, 
        slippagePercentage = '0.01',
        takerAddress 
      } = req.body;

      if (!chainId || !sellToken || !sellAmount || !takerAddress) {
        return res.status(400).json({
          error: 'Missing required parameters: chainId, sellToken, sellAmount, takerAddress'
        });
      }

      const buyToken = this.usdcAddresses[chainId];
      if (!buyToken) {
        return res.status(400).json({
          error: `USDC not supported on chain ${chainId}`
        });
      }

      // Build 0x API request for production quote
      const apiURL = `${this.baseURL}/swap/v1/quote`;
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage,
        takerAddress,
        skipValidation: 'false',
        enableSlippageProtection: 'true'
      });

      console.log('Production 0x Quote Request:', `${apiURL}?${params.toString()}`);

      const response = await fetch(`${apiURL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          '0x-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('0x API Quote Error:', errorText);
        return res.status(response.status).json({
          error: 'Failed to get quote from 0x API',
          details: errorText,
          statusCode: response.status
        });
      }

      const quoteData = await response.json();

      // Check token allowance for the swap
      const allowanceData = await this.checkTokenAllowance(
        sellToken, 
        takerAddress, 
        quoteData.allowanceTarget, 
        chainId
      );

      res.json({
        success: true,
        quote: {
          ...quoteData,
          chainId,
          sellTokenSymbol: await this.getTokenSymbol(sellToken, chainId),
          buyTokenSymbol: 'USDC',
          allowanceRequired: allowanceData.allowanceRequired,
          currentAllowance: allowanceData.currentAllowance,
          approvalTransaction: allowanceData.approvalTransaction
        }
      });

    } catch (error) {
      console.error('Production swap quote error:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute production swap with proper validation
   */
  async executeProductionSwap(req: Request, res: Response) {
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
          error: 'Missing required parameters'
        });
      }

      const buyToken = this.usdcAddresses[chainId];
      
      // Get swap transaction from 0x API
      const apiURL = `${this.baseURL}/swap/v1/quote`;
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage,
        takerAddress,
        skipValidation: 'false'
      });

      const response = await fetch(`${apiURL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          '0x-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: 'Failed to get swap transaction',
          details: errorText
        });
      }

      const swapData = await response.json();

      // Validate transaction data
      if (!swapData.to || !swapData.data) {
        return res.status(400).json({
          error: 'Invalid transaction data from 0x API'
        });
      }

      res.json({
        success: true,
        transaction: {
          to: swapData.to,
          data: swapData.data,
          value: swapData.value || '0',
          gasPrice: swapData.gasPrice,
          gas: swapData.gas,
          sellToken,
          buyToken,
          sellAmount,
          buyAmount: swapData.buyAmount,
          allowanceTarget: swapData.allowanceTarget,
          chainId
        }
      });

    } catch (error) {
      console.error('Production swap execution error:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check token allowance and generate approval transaction if needed
   */
  async checkTokenAllowance(
    tokenAddress: string, 
    ownerAddress: string, 
    spenderAddress: string, 
    chainId: number
  ) {
    try {
      const rpcUrl = this.rpcEndpoints[chainId];
      if (!rpcUrl) {
        throw new Error(`No RPC endpoint for chain ${chainId}`);
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);

      // Get current allowance
      const currentAllowance = await tokenContract.allowance(ownerAddress, spenderAddress);
      const tokenDecimals = await tokenContract.decimals();
      
      // Check if allowance is sufficient (using max uint256 for unlimited approval)
      const maxUint256 = ethers.MaxUint256;
      const halfMaxUint256 = maxUint256 / BigInt(2);
      const allowanceRequired = currentAllowance < halfMaxUint256; // Need approval if less than half of max

      let approvalTransaction = null;
      if (allowanceRequired) {
        // Generate approval transaction
        const tokenInterface = new ethers.Interface(this.erc20ABI);
        approvalTransaction = {
          to: tokenAddress,
          data: tokenInterface.encodeFunctionData('approve', [spenderAddress, maxUint256]),
          value: '0'
        };
      }

      return {
        allowanceRequired,
        currentAllowance: currentAllowance.toString(),
        approvalTransaction,
        tokenDecimals
      };

    } catch (error) {
      console.error('Allowance check error:', error);
      return {
        allowanceRequired: true,
        currentAllowance: '0',
        approvalTransaction: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get token symbol from contract
   */
  async getTokenSymbol(tokenAddress: string, chainId: number): Promise<string> {
    try {
      const rpcUrl = this.rpcEndpoints[chainId];
      if (!rpcUrl) return 'UNKNOWN';

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
      
      return await tokenContract.symbol();
    } catch (error) {
      console.error('Token symbol error:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Validate USDC transfer for INR withdrawal
   */
  async validateUSDCTransfer(req: Request, res: Response) {
    try {
      const { chainId, userAddress, amount, custodyWallet } = req.body;

      if (!chainId || !userAddress || !amount || !custodyWallet) {
        return res.status(400).json({
          error: 'Missing required parameters'
        });
      }

      const usdcAddress = this.usdcAddresses[chainId];
      if (!usdcAddress) {
        return res.status(400).json({
          error: `USDC not supported on chain ${chainId}`
        });
      }

      // Check USDC balance and allowance
      const rpcUrl = this.rpcEndpoints[chainId];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const usdcContract = new ethers.Contract(usdcAddress, this.erc20ABI, provider);

      const balance = await usdcContract.balanceOf(userAddress);
      const allowance = await usdcContract.allowance(userAddress, custodyWallet);
      const decimals = await usdcContract.decimals();

      const amountWei = ethers.parseUnits(amount, decimals);

      res.json({
        success: true,
        validation: {
          hasBalance: balance >= amountWei,
          hasAllowance: allowance >= amountWei,
          currentBalance: ethers.formatUnits(balance, decimals),
          currentAllowance: ethers.formatUnits(allowance, decimals),
          requiredAmount: amount,
          usdcAddress,
          custodyWallet
        }
      });

    } catch (error) {
      console.error('USDC transfer validation error:', error);
      res.status(500).json({
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const productionSwapAPI = new ProductionSwapAPI();