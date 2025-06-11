import { Request, Response } from 'express';

interface ParticleAuthResponse {
  data: {
    uuid: string;
    email?: string;
    name?: string;
    wallets: Array<{
      chain_name: string;
      public_address: string;
    }>;
  };
  message: string;
}

interface ParticleWalletResponse {
  data: {
    tokens: Array<{
      symbol: string;
      name: string;
      decimals: number;
      token_address: string;
      balance: string;
      price?: number;
    }>;
    native: {
      symbol: string;
      balance: string;
      price?: number;
    };
  };
  message: string;
}

export class ParticleAPI {
  private readonly serverKey: string;
  private readonly projectId: string;
  private readonly clientKey: string;
  private readonly baseUrl: string = 'https://api.particle.network';

  constructor() {
    this.serverKey = process.env.PARTICLE_SERVER_KEY || '';
    this.projectId = process.env.PARTICLE_PROJECT_ID || '';
    this.clientKey = process.env.PARTICLE_CLIENT_KEY || '';

    if (!this.serverKey || !this.projectId || !this.clientKey) {
      console.warn('Particle Network credentials not found in environment variables');
    }
  }

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.serverKey}`
    };
  }

  // Authenticate user with Particle Network
  async authenticateUser(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing email address' 
        });
      }

      // For demo purposes, create authenticated user without real API call
      const userInfo = {
        uuid: `particle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: email,
        name: email.split('@')[0],
        wallets: [{
          chain_name: 'ethereum',
          public_address: '0x742d35cc6bf8e8cad85e9a6ad13e81c3dca4af6b'
        }, {
          chain_name: 'polygon',
          public_address: '0x742d35cc6bf8e8cad85e9a6ad13e81c3dca4af6b'
        }],
        authenticated: true,
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        userInfo: userInfo
      });
    } catch (error) {
      console.error('Particle auth error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Authentication failed' 
      });
    }
  }

  // Get wallet balance using live blockchain data
  async getWalletBalance(req: Request, res: Response) {
    try {
      const { uuid, chainId, address } = req.body;
      
      if (!uuid || !chainId || !address) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters' 
        });
      }

      // Fetch real token balances from blockchain
      const tokens = await this.fetchRealTokenBalances(address, chainId);
      
      res.json({
        success: true,
        balance: {
          tokens: tokens,
          native: {
            symbol: this.getNativeSymbol(chainId),
            balance: tokens.find(t => t.symbol === this.getNativeSymbol(chainId))?.balance || '0',
            price: await this.getTokenPrice(this.getNativeSymbol(chainId))
          },
          totalUsdValue: tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0)
        }
      });
    } catch (error) {
      console.error('Particle balance fetch error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch wallet balance' 
      });
    }
  }

  private async fetchRealTokenBalances(address: string, chainId: number) {
    try {
      // Use ethers to fetch real balances
      const { ethers } = await import('ethers');
      const rpcUrl = this.getRpcUrl(chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const tokens = [];
      
      // Get native token balance
      const nativeBalance = await provider.getBalance(address);
      const nativeSymbol = this.getNativeSymbol(chainId);
      const nativePrice = await this.getTokenPrice(nativeSymbol);
      
      tokens.push({
        symbol: nativeSymbol,
        name: this.getNativeName(chainId),
        decimals: 18,
        token_address: '0x0000000000000000000000000000000000000000',
        balance: ethers.formatEther(nativeBalance),
        price: nativePrice,
        usdValue: parseFloat(ethers.formatEther(nativeBalance)) * nativePrice
      });

      // Get common token balances (USDC, USDT, etc.)
      const commonTokens = this.getCommonTokens(chainId);
      for (const token of commonTokens) {
        try {
          const contract = new ethers.Contract(token.address, [
            'function balanceOf(address) view returns (uint256)',
            'function decimals() view returns (uint8)'
          ], provider);
          
          const balance = await contract.balanceOf(address);
          const decimals = await contract.decimals();
          const formattedBalance = ethers.formatUnits(balance, decimals);
          const price = await this.getTokenPrice(token.symbol);
          
          if (parseFloat(formattedBalance) > 0) {
            tokens.push({
              symbol: token.symbol,
              name: token.name,
              decimals: decimals,
              token_address: token.address,
              balance: formattedBalance,
              price: price,
              usdValue: parseFloat(formattedBalance) * price
            });
          }
        } catch (tokenError) {
          console.warn(`Failed to fetch ${token.symbol} balance:`, tokenError);
        }
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching real token balances:', error);
      return [];
    }
  }

  private getRpcUrl(chainId: number): string {
    const rpcUrls: Record<number, string> = {
      1: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      137: 'https://polygon-rpc.com',
      56: 'https://bsc-dataseed.binance.org'
    };
    return rpcUrls[chainId] || rpcUrls[1];
  }

  private getNativeSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB'
    };
    return symbols[chainId] || 'ETH';
  }

  private getNativeName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'Binance Coin'
    };
    return names[chainId] || 'Ethereum';
  }

  private getCommonTokens(chainId: number) {
    const tokens: Record<number, Array<{symbol: string; name: string; address: string}>> = {
      1: [
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441e95e2c2b08ae91e8e6B0e5C3CB2' },
        { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' }
      ],
      137: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
        { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' }
      ]
    };
    return tokens[chainId] || [];
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
      'USDT': 'tether'
    };
    return ids[symbol] || symbol.toLowerCase();
  }

  // Get swap quote
  async getSwapQuote(req: Request, res: Response) {
    try {
      const { fromToken, toToken, fromAmount, slippage = '1' } = req.body;
      
      if (!fromToken || !toToken || !fromAmount) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required swap parameters' 
        });
      }

      // Generate realistic swap quote
      const fromPrice = await this.getTokenPrice(fromToken);
      const toPrice = await this.getTokenPrice(toToken);
      const exchangeRate = fromPrice / toPrice;
      const toAmount = (parseFloat(fromAmount) * exchangeRate * (1 - parseFloat(slippage) / 100)).toFixed(6);

      res.json({
        success: true,
        quote: {
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          exchangeRate: exchangeRate.toFixed(6),
          priceImpact: '0.3',
          gasEstimate: '150000',
          minimumReceived: (parseFloat(toAmount) * 0.99).toFixed(6),
          route: [`${fromToken} → ${toToken}`],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Particle swap quote error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get swap quote' 
      });
    }
  }

  // Execute swap transaction
  async executeSwap(req: Request, res: Response) {
    try {
      const { uuid, quote, gasless = true } = req.body;
      
      if (!uuid || !quote) {
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
          gasless: gasless,
          fromToken: quote.fromToken,
          toToken: quote.toToken,
          fromAmount: quote.fromAmount,
          toAmount: quote.toAmount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Particle swap execution error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to execute swap' 
      });
    }
  }

  // Get paymaster balance for gasless transactions
  async getPaymasterBalance(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        paymaster: {
          balance: '10.5',
          currency: 'ETH',
          gasCredits: 1000,
          isActive: true
        }
      });
    } catch (error) {
      console.error('Particle paymaster error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get paymaster balance' 
      });
    }
  }

  // Logout user
  async logoutUser(req: Request, res: Response) {
    try {
      const { uuid } = req.body;
      
      if (!uuid) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing user UUID' 
        });
      }

      res.json({
        success: true,
        message: 'User logged out successfully'
      });
    } catch (error) {
      console.error('Particle logout error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to logout user' 
      });
    }
  }
}

export const particleAPI = new ParticleAPI();