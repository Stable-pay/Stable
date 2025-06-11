import { Request, Response } from 'express';
import { ethers } from 'ethers';

export class ReownAPI {
  private readonly rpcEndpoints: Record<number, string> = {
    1: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    137: 'https://polygon-rpc.com',
    56: 'https://bsc-dataseed.binance.org',
    42161: 'https://arb1.arbitrum.io/rpc'
  };

  private readonly tokenContracts: Record<number, Record<string, string>> = {
    1: {
      'USDC': '0xA0b86a33E6441e95e2c2b08ae91e8e6B0e5C3CB2',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    },
    137: {
      'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
    },
    56: {
      'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      'USDT': '0x55d398326f99059fF775485246999027B3197955',
      'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
    }
  };

  // Get token balance for specific token
  async getTokenBalance(req: Request, res: Response) {
    try {
      const { address, tokenAddress, chainId } = req.body;
      
      if (!address || !tokenAddress || !chainId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters' 
        });
      }

      const rpcUrl = this.rpcEndpoints[chainId];
      if (!rpcUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Unsupported chain ID' 
        });
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token balance
        const balance = await provider.getBalance(address);
        const symbol = this.getNativeSymbol(chainId);
        const price = await this.getTokenPrice(symbol);
        const formattedBalance = ethers.formatEther(balance);
        
        res.json({
          success: true,
          balance: {
            symbol: symbol,
            name: this.getNativeName(chainId),
            address: tokenAddress,
            balance: balance.toString(),
            decimals: 18,
            chainId: chainId,
            formattedBalance: formattedBalance,
            usdValue: parseFloat(formattedBalance) * price
          }
        });
      } else {
        // ERC20 token balance
        const contract = new ethers.Contract(tokenAddress, [
          'function balanceOf(address) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
          'function name() view returns (string)'
        ], provider);
        
        const [balance, decimals, symbol, name] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
          contract.symbol(),
          contract.name()
        ]);
        
        const formattedBalance = ethers.formatUnits(balance, decimals);
        const price = await this.getTokenPrice(symbol);
        
        res.json({
          success: true,
          balance: {
            symbol: symbol,
            name: name,
            address: tokenAddress,
            balance: balance.toString(),
            decimals: Number(decimals),
            chainId: chainId,
            formattedBalance: formattedBalance,
            usdValue: parseFloat(formattedBalance) * price
          }
        });
      }
    } catch (error) {
      console.error('Token balance fetch error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch token balance' 
      });
    }
  }

  // Get swap quote using 1inch API
  async getSwapQuote(req: Request, res: Response) {
    try {
      const { fromToken, toToken, amount, userAddress, chainId } = req.body;
      
      if (!fromToken || !toToken || !amount || !userAddress || !chainId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required swap parameters' 
        });
      }

      // Get token addresses
      const fromTokenAddress = this.getTokenAddress(fromToken, chainId);
      const toTokenAddress = this.getTokenAddress(toToken, chainId);
      
      if (!fromTokenAddress || !toTokenAddress) {
        return res.status(400).json({ 
          success: false, 
          error: 'Unsupported token or chain' 
        });
      }

      // Convert amount to wei/smallest unit
      const fromTokenDecimals = await this.getTokenDecimals(fromTokenAddress, chainId);
      const amountInWei = ethers.parseUnits(amount, fromTokenDecimals);

      // For demo, calculate exchange rate using prices
      const fromPrice = await this.getTokenPrice(fromToken);
      const toPrice = await this.getTokenPrice(toToken);
      const exchangeRate = fromPrice / toPrice;
      const toAmount = (parseFloat(amount) * exchangeRate * 0.997).toFixed(6); // 0.3% slippage
      
      res.json({
        success: true,
        quote: {
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: toAmount,
          fromTokenAddress,
          toTokenAddress,
          exchangeRate: exchangeRate.toFixed(6),
          priceImpact: '0.3',
          gasEstimate: '150000',
          minimumReceived: (parseFloat(toAmount) * 0.99).toFixed(6),
          route: [`${fromToken} → ${toToken}`],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Swap quote error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get swap quote' 
      });
    }
  }

  // Execute swap transaction
  async executeSwap(req: Request, res: Response) {
    try {
      const { quote, userAddress, chainId } = req.body;
      
      if (!quote || !userAddress || !chainId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing swap parameters' 
        });
      }

      // Simulate transaction execution
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      res.json({
        success: true,
        transaction: {
          hash: txHash,
          status: 'pending',
          fromToken: quote.fromToken,
          toToken: quote.toToken,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          userAddress: userAddress,
          chainId: chainId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Swap execution error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to execute swap' 
      });
    }
  }

  // Helper methods
  private getTokenAddress(symbol: string, chainId: number): string | null {
    if (symbol === 'ETH' || symbol === 'MATIC' || symbol === 'BNB') {
      return '0x0000000000000000000000000000000000000000';
    }
    return this.tokenContracts[chainId]?.[symbol] || null;
  }

  private async getTokenDecimals(tokenAddress: string, chainId: number): Promise<number> {
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      return 18; // Native tokens have 18 decimals
    }
    
    try {
      const provider = new ethers.JsonRpcProvider(this.rpcEndpoints[chainId]);
      const contract = new ethers.Contract(tokenAddress, [
        'function decimals() view returns (uint8)'
      ], provider);
      
      const decimals = await contract.decimals();
      return Number(decimals);
    } catch (error) {
      console.warn(`Failed to get decimals for ${tokenAddress}:`, error);
      return 18; // Default to 18
    }
  }

  private getNativeSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB',
      42161: 'ETH'
    };
    return symbols[chainId] || 'ETH';
  }

  private getNativeName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'Binance Coin',
      42161: 'Ethereum'
    };
    return names[chainId] || 'Ethereum';
  }

  private async getTokenPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoingeckoId(symbol)}&vs_currencies=usd`);
      const data = await response.json();
      const id = this.getCoingeckoId(symbol);
      return data[id]?.usd || 0;
    } catch (error) {
      console.warn(`Failed to fetch price for ${symbol}:`, error);
      return 0;
    }
  }

  private getCoingeckoId(symbol: string): string {
    const ids: Record<string, string> = {
      'ETH': 'ethereum',
      'MATIC': 'matic-network',
      'BNB': 'binancecoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai'
    };
    return ids[symbol] || symbol.toLowerCase();
  }
}

export const reownAPI = new ReownAPI();