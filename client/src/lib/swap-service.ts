import { getDeveloperWallet, getUSDCAddress, isValidNetwork, type SupportedNetwork } from './wallet-config';

interface SwapToUSDCParams {
  userAddress: string;
  network: string;
  tokenAddress: string;
  amount: string;
  slippage?: number;
}

interface SwapResult {
  transactionData: any;
  expectedUSDC: string;
  developerWallet: string;
  estimatedGas: string;
}

class SwapService {
  private readonly API_KEY = '1Fqf1TSnyq86janyEBVQ9wcd65Ml6yBf';
  private readonly BASE_URL = 'https://api.1inch.io/v5.0';

  async swapTokenToUSDC(params: SwapToUSDCParams): Promise<SwapResult> {
    if (!isValidNetwork(params.network)) {
      throw new Error(`Unsupported network: ${params.network}`);
    }

    const network = params.network as SupportedNetwork;
    const chainId = this.getChainId(network);
    const usdcAddress = getUSDCAddress(network);
    const developerWallet = getDeveloperWallet(network);

    try {
      // First get quote to estimate output
      const quoteParams = new URLSearchParams({
        fromTokenAddress: params.tokenAddress,
        toTokenAddress: usdcAddress,
        amount: params.amount,
      });

      console.log('1inch quote request:', `${this.BASE_URL}/${chainId}/quote?${quoteParams}`);

      const quoteResponse = await fetch(
        `${this.BASE_URL}/${chainId}/quote?${quoteParams}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      console.log('1inch quote response status:', quoteResponse.status);

      if (!quoteResponse.ok) {
        const error = await quoteResponse.text();
        console.error('1inch quote error:', error);
        throw new Error(`Quote failed (${quoteResponse.status}): ${error}`);
      }

      const quoteData = await quoteResponse.json();
      console.log('1inch quote data:', quoteData);

      // Then get swap transaction data with developer wallet as recipient
      const swapParams = new URLSearchParams({
        fromTokenAddress: params.tokenAddress,
        toTokenAddress: usdcAddress,
        amount: params.amount,
        fromAddress: params.userAddress,
        destReceiver: developerWallet, // Send USDC directly to developer wallet
        slippage: (params.slippage || 1).toString(),
        disableEstimate: 'false',
        allowPartialFill: 'false'
      });

      const swapResponse = await fetch(
        `${this.BASE_URL}/${chainId}/swap?${swapParams}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!swapResponse.ok) {
        const error = await swapResponse.text();
        throw new Error(`Swap failed: ${error}`);
      }

      const swapData = await swapResponse.json();

      return {
        transactionData: swapData.tx,
        expectedUSDC: quoteData.toTokenAmount,
        developerWallet,
        estimatedGas: swapData.tx.gasPrice
      };

    } catch (error: any) {
      console.error('1inch swap service error:', error);
      throw new Error(`Swap to USDC failed: ${error?.message || 'Unknown error'}`);
    }
  }

  async getAllowance(userAddress: string, tokenAddress: string, network: string): Promise<string> {
    if (!isValidNetwork(network)) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const chainId = this.getChainId(network as SupportedNetwork);

    try {
      const response = await fetch(
        `${this.BASE_URL}/${chainId}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${userAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Allowance check failed: ${response.status}`);
      }

      const data = await response.json();
      return data.allowance;
    } catch (error) {
      console.error('Allowance check error:', error);
      return '0';
    }
  }

  async getApprovalTransaction(userAddress: string, tokenAddress: string, network: string): Promise<any> {
    if (!isValidNetwork(network)) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const chainId = this.getChainId(network as SupportedNetwork);

    try {
      const response = await fetch(
        `${this.BASE_URL}/${chainId}/approve/transaction?tokenAddress=${tokenAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Approval transaction failed: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Approval transaction error:', error);
      throw new Error(`Failed to get approval transaction: ${(error as Error)?.message || 'Unknown error'}`);
    }
  }

  private getChainId(network: SupportedNetwork): string {
    const chainIds = {
      ethereum: '1',
      polygon: '137',
      arbitrum: '42161',
      base: '8453',
      optimism: '10',
      bsc: '56',
      avalanche: '43114'
    };
    return chainIds[network];
  }

  async estimateSwapGas(params: SwapToUSDCParams): Promise<string> {
    try {
      const result = await this.swapTokenToUSDC(params);
      return result.estimatedGas;
    } catch (error: any) {
      console.error('Gas estimation error:', error);
      return '21000'; // Default gas estimate
    }
  }
}

export const swapService = new SwapService();
export type { SwapToUSDCParams, SwapResult };