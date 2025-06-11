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

// Production Particle Network API integration
export class ParticleAPI {
  private readonly serverKey: string;
  private readonly projectId: string;
  private readonly clientKey: string;
  private readonly baseUrl: string = 'https://api.particle.network';

  constructor() {
    this.serverKey = process.env.PARTICLE_SERVER_KEY!;
    this.projectId = process.env.PARTICLE_PROJECT_ID!;
    this.clientKey = process.env.PARTICLE_CLIENT_KEY!;
    
    if (!this.serverKey || !this.projectId || !this.clientKey) {
      console.error('Missing Particle Network credentials');
      throw new Error('Particle Network API credentials not configured');
    }
    
    this.projectId = this.projectId.trim();
    this.serverKey = this.serverKey.trim();
    this.clientKey = this.clientKey.trim();
  }

  private getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.serverKey}`,
      'Content-Type': 'application/json',
      'X-Project-Id': this.projectId,
      'X-Client-Key': this.clientKey
    };
  }

  // Authenticate user with Particle Network
  async authenticateUser(req: Request, res: Response) {
    try {
      const { token, uuid } = req.body;
      
      if (!token || !uuid) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing authentication token or UUID' 
        });
      }

      const response = await fetch(`${this.baseUrl}/server/rpc`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getUserInfo',
          params: [{
            uuid: uuid,
            token: token
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Particle API error: ${response.status}`);
      }

      const data: ParticleAuthResponse = await response.json();
      
      res.json({
        success: true,
        userInfo: {
          uuid: data.data.uuid,
          email: data.data.email,
          name: data.data.name,
          wallets: data.data.wallets,
          authenticated: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Particle auth error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Authentication failed - please check your credentials' 
      });
    }
  }

  // Get wallet balance using Particle Network Enhanced RPC
  async getWalletBalance(req: Request, res: Response) {
    try {
      const { uuid, chainId, publicAddress } = req.body;
      
      if (!uuid || !chainId || !publicAddress) {
        return res.status(400).json({ 
          error: 'Missing required parameters: uuid, chainId, publicAddress' 
        });
      }

      const response = await fetch(`${this.baseUrl}/server/rpc`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'enhancedGetTokensAndNFTs',
          params: [{
            uuid: uuid,
            chain_id: chainId,
            public_address: publicAddress,
            native_token: true,
            contract_addresses: [
              '0xA0b86a33E6441021EAaF6e1F95544f64A37a43b7', // USDC
              '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
              '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Particle API error: ${response.status}`);
      }

      const data: ParticleWalletResponse = await response.json();
      
      const formattedTokens = data.data.tokens.map(token => ({
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        address: token.token_address,
        balance: token.balance,
        usdValue: token.price ? parseFloat(token.balance) * token.price : 0,
        formattedBalance: (parseFloat(token.balance) / Math.pow(10, token.decimals)).toFixed(6)
      }));

      const nativeToken = {
        symbol: data.data.native.symbol,
        name: 'Native Token',
        balance: data.data.native.balance,
        usdValue: data.data.native.price ? parseFloat(data.data.native.balance) * data.data.native.price : 0,
        formattedBalance: (parseFloat(data.data.native.balance) / Math.pow(10, 18)).toFixed(6),
        isNative: true
      };
      
      res.json({
        success: true,
        tokens: [nativeToken, ...formattedTokens],
        totalValue: [nativeToken, ...formattedTokens].reduce((sum, token) => sum + token.usdValue, 0),
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Particle balance fetch error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch wallet balance from Particle Network' 
      });
    }
  }

  // Get swap quote using Particle Network Swap API
  async getSwapQuote(req: Request, res: Response) {
    try {
      const { fromToken, toToken, amount, chainId, userAddress, uuid } = req.body;

      if (!fromToken || !toToken || !amount || !chainId || !userAddress || !uuid) {
        return res.status(400).json({ 
          error: 'Missing required parameters for swap quote' 
        });
      }

      const response = await fetch(`${this.baseUrl}/server/rpc`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_getSwapQuote',
          params: [{
            uuid: uuid,
            chain_id: chainId,
            from_token_address: fromToken === 'ETH' ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : fromToken,
            to_token_address: toToken === 'USDC' ? '0xA0b86a33E6441021EAaF6e1F95544f64A37a43b7' : toToken,
            amount: amount,
            slippage: 50, // 0.5% slippage
            user_address: userAddress
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Particle Swap API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Particle API error: ${data.error.message}`);
      }

      res.json({
        success: true,
        quote: {
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: data.result?.toAmount || '0',
          priceImpact: data.result?.priceImpact || 0,
          gasEstimate: data.result?.gasPrice || '0',
          exchangeRate: data.result?.exchangeRate || '1',
          route: data.result?.route || [fromToken, toToken],
          transaction: data.result?.transaction
        }
      });
    } catch (error) {
      console.error('Particle swap quote error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get swap quote from Particle Network' 
      });
    }
  }

  // Execute swap with Account Abstraction and Paymaster
  async executeSwap(req: Request, res: Response) {
    try {
      const { uuid, transaction, chainId } = req.body;

      if (!uuid || !transaction || !chainId) {
        return res.status(400).json({ 
          error: 'Missing required parameters for swap execution' 
        });
      }

      // Execute swap with gasless transaction using Particle's paymaster
      const response = await fetch(`${this.baseUrl}/server/rpc`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_sendGaslessTransaction',
          params: [{
            uuid: uuid,
            chain_id: chainId,
            transaction: transaction,
            sponsor: true // Enable paymaster sponsorship
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Particle transaction error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Transaction failed: ${data.error.message}`);
      }

      res.json({
        success: true,
        transactionHash: data.result?.transactionHash || '',
        signature: data.result?.signature || '',
        sponsored: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Particle swap execution error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to execute swap transaction' 
      });
    }
  }

  // Get paymaster balance for gasless transactions
  async getPaymasterBalance(req: Request, res: Response) {
    try {
      const { chainId } = req.body;

      const response = await fetch(`${this.baseUrl}/server/rpc`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_getPaymasterBalance',
          params: [{
            chain_id: chainId || 1
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Particle paymaster error: ${response.status}`);
      }

      const data = await response.json();
      
      res.json({
        success: true,
        balance: data.result?.balance || '0',
        available: parseFloat(data.result?.balance || '0') > 0,
        chainId: chainId || 1
      });
    } catch (error) {
      console.error('Paymaster balance error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch paymaster balance' 
      });
    }
  }

  // Logout user from Particle Network
  async logoutUser(req: Request, res: Response) {
    try {
      const { uuid } = req.body;

      if (!uuid) {
        return res.status(400).json({ 
          error: 'Missing UUID for logout' 
        });
      }

      const response = await fetch(`${this.baseUrl}/server/rpc`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_logout',
          params: [{
            uuid: uuid
          }]
        })
      });

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