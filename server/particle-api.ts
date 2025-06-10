import { Request, Response } from 'express';

// Production Particle Network API integration
export class ParticleAPI {
  private readonly serverKey: string;
  private readonly projectId: string;
  private readonly clientKey: string;

  constructor() {
    this.serverKey = process.env.PARTICLE_SERVER_KEY!;
    this.projectId = process.env.PARTICLE_PROJECT_ID!;
    this.clientKey = process.env.PARTICLE_CLIENT_KEY!;
  }

  // Authenticate user with Particle Network
  async authenticateUser(req: Request, res: Response) {
    try {
      const { preferredAuthType, socialType } = req.body;

      const response = await fetch('https://api.particle.network/server/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serverKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_auth_login',
          params: [{
            projectId: this.projectId,
            clientKey: this.clientKey,
            preferredAuthType,
            socialType,
          }]
        })
      });

      const data = await response.json();
      
      if (data.result) {
        res.json({
          success: true,
          userInfo: data.result
        });
      } else {
        throw new Error(data.error?.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Particle auth error:', error);
      res.status(500).json({ success: false, error: 'Authentication failed' });
    }
  }

  // Get wallet balance using Particle Network
  async getWalletBalance(req: Request, res: Response) {
    try {
      const { address, chainId } = req.body;

      const response = await fetch('https://api.particle.network/server/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serverKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_getTokensAndNFTs',
          params: [{
            address,
            chainId,
          }]
        })
      });

      const data = await response.json();
      
      if (data.result) {
        res.json({
          success: true,
          balances: data.result.tokens || []
        });
      } else {
        throw new Error(data.error?.message || 'Failed to fetch balances');
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch balances' });
    }
  }

  // Get swap quote from Particle Network
  async getSwapQuote(req: Request, res: Response) {
    try {
      const { fromToken, toToken, amount, chainId, userAddress } = req.body;

      const response = await fetch('https://api.particle.network/server/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serverKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_getSwapQuote',
          params: [{
            chainId,
            fromTokenAddress: fromToken,
            toTokenAddress: toToken,
            fromAmount: amount,
            userAddress,
            slippage: 0.5,
          }]
        })
      });

      const data = await response.json();
      
      if (data.result) {
        res.json({
          success: true,
          quote: data.result
        });
      } else {
        throw new Error(data.error?.message || 'Failed to get swap quote');
      }
    } catch (error) {
      console.error('Swap quote error:', error);
      res.status(500).json({ success: false, error: 'Failed to get swap quote' });
    }
  }

  // Execute swap transaction
  async executeSwap(req: Request, res: Response) {
    try {
      const { userAddress, chainId, swapData } = req.body;

      const response = await fetch('https://api.particle.network/server/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serverKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_sendTransaction',
          params: [{
            userAddress,
            chainId,
            transaction: swapData,
          }]
        })
      });

      const data = await response.json();
      
      if (data.result) {
        res.json({
          success: true,
          txHash: data.result.hash,
          gasless: data.result.gasless || false,
          sponsoredByPaymaster: data.result.sponsoredByPaymaster || false,
        });
      } else {
        throw new Error(data.error?.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('Swap execution error:', error);
      res.status(500).json({ success: false, error: 'Transaction failed' });
    }
  }

  // Get paymaster balance
  async getPaymasterBalance(req: Request, res: Response) {
    try {
      const response = await fetch('https://api.particle.network/server/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serverKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_getPaymasterBalance',
          params: [{
            projectId: this.projectId,
          }]
        })
      });

      const data = await response.json();
      
      if (data.result) {
        res.json({
          success: true,
          balance: data.result.balance,
          currency: data.result.currency || 'USD'
        });
      } else {
        throw new Error(data.error?.message || 'Failed to get paymaster balance');
      }
    } catch (error) {
      console.error('Paymaster balance error:', error);
      res.status(500).json({ success: false, error: 'Failed to get paymaster balance' });
    }
  }

  // Logout user
  async logoutUser(req: Request, res: Response) {
    try {
      const response = await fetch('https://api.particle.network/server/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serverKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'particle_auth_logout',
          params: [{
            projectId: this.projectId,
          }]
        })
      });

      const data = await response.json();
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  }
}

export const particleAPI = new ParticleAPI();