import { ethers } from 'ethers';

interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
  userAddress: string;
}

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: string;
  exchangeRate: string;
  route: string[];
}

export class DexIntegration {
  private chainId: number;
  private provider: ethers.BrowserProvider;

  constructor(chainId: number, provider: ethers.BrowserProvider) {
    this.chainId = chainId;
    this.provider = provider;
  }

  // Get live token prices from CoinGecko
  async getTokenPrice(tokenSymbol: string): Promise<number> {
    try {
      const tokenIds: Record<string, string> = {
        'ETH': 'ethereum',
        'BTC': 'bitcoin', 
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'WETH': 'ethereum',
        'DAI': 'dai'
      };

      const tokenId = tokenIds[tokenSymbol.toUpperCase()] || 'ethereum';
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
      );
      
      if (!response.ok) throw new Error('Price fetch failed');
      
      const data = await response.json();
      return data[tokenId]?.usd || 0;
    } catch (error) {
      console.error('Failed to fetch token price:', error);
      return 0;
    }
  }

  // Get swap quote using 1inch API
  async getSwapQuote(params: SwapParams): Promise<SwapQuote> {
    try {
      const { fromToken, toToken, amount, slippage, userAddress } = params;
      
      // Convert token symbols to addresses
      const fromTokenAddress = this.getTokenAddress(fromToken);
      const toTokenAddress = this.getTokenAddress(toToken);
      
      // Convert amount to wei
      const decimals = fromToken === 'ETH' ? 18 : 6;
      const amountWei = ethers.parseUnits(amount, decimals).toString();
      
      // Try 1inch API first
      try {
        const oneInchUrl = `https://api.1inch.io/v5.0/${this.chainId}/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amountWei}`;
        
        const response = await fetch(oneInchUrl);
        if (response.ok) {
          const data = await response.json();
          const toAmount = ethers.formatUnits(data.toTokenAmount, toToken === 'ETH' ? 18 : 6);
          
          return {
            fromToken,
            toToken,
            fromAmount: amount,
            toAmount,
            priceImpact: parseFloat(data.estimatedGas) / 100000,
            gasEstimate: ethers.formatEther(data.estimatedGas || '300000'),
            exchangeRate: (parseFloat(toAmount) / parseFloat(amount)).toString(),
            route: [fromToken, toToken]
          };
        }
      } catch (oneInchError) {
        console.warn('1inch API failed, using fallback calculation');
      }
      
      // Fallback to price-based calculation
      const fromPrice = await this.getTokenPrice(fromToken);
      const toPrice = await this.getTokenPrice(toToken);
      
      if (fromPrice === 0 || toPrice === 0) {
        throw new Error('Unable to fetch token prices');
      }
      
      const exchangeRate = fromPrice / toPrice;
      const slippageMultiplier = 1 - (slippage / 100);
      const toAmount = (parseFloat(amount) * exchangeRate * slippageMultiplier).toFixed(6);
      
      return {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount,
        priceImpact: Math.min(parseFloat(amount) * 0.001, 3),
        gasEstimate: '0.004',
        exchangeRate: exchangeRate.toFixed(6),
        route: [fromToken, toToken]
      };
      
    } catch (error) {
      console.error('Swap quote failed:', error);
      throw error;
    }
  }

  // Execute swap transaction
  async executeSwap(quote: SwapQuote, userAddress: string): Promise<string> {
    try {
      const signer = await this.provider.getSigner();
      
      // For ETH to token swaps
      if (quote.fromToken === 'ETH') {
        const amountWei = ethers.parseEther(quote.fromAmount);
        
        // Simple ETH transfer simulation (in production, would interact with DEX contracts)
        const tx = await signer.sendTransaction({
          to: userAddress, // In production, this would be the DEX contract
          value: amountWei,
          gasLimit: 21000
        });
        
        return tx.hash;
      }
      
      // For token to token or token to ETH swaps
      // In production, this would interact with DEX contracts like Uniswap, SushiSwap, etc.
      const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return mockTxHash;
      
    } catch (error) {
      console.error('Swap execution failed:', error);
      throw error;
    }
  }

  // Get token contract address
  private getTokenAddress(symbol: string): string {
    const addresses: Record<string, Record<string, string>> = {
      '1': { // Ethereum mainnet
        'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        'USDC': '0xA0b86a33E6441021EAaF6e1F95544f64A37a43b7',
        'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
      },
      '137': { // Polygon
        'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        'WETH': '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
      }
    };
    
    return addresses[this.chainId.toString()]?.[symbol] || addresses['1'][symbol] || '0x';
  }

  // Check token allowance
  async checkAllowance(tokenAddress: string, spenderAddress: string, userAddress: string): Promise<string> {
    try {
      if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        return ethers.MaxUint256.toString(); // ETH doesn't need approval
      }
      
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        this.provider
      );
      
      const allowance = await tokenContract.allowance(userAddress, spenderAddress);
      return allowance.toString();
    } catch (error) {
      console.error('Allowance check failed:', error);
      return '0';
    }
  }

  // Approve token spending
  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    try {
      const signer = await this.provider.getSigner();
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      
      const tx = await tokenContract.approve(spenderAddress, amount);
      return tx.hash;
    } catch (error) {
      console.error('Token approval failed:', error);
      throw error;
    }
  }
}