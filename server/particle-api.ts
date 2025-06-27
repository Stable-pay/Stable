import type { Express, Request, Response } from "express";

/**
 * Particle Network API integration for server-side operations
 * Handles user authentication, wallet management, and transaction signing
 */

interface ParticleAPIConfig {
  projectId: string;
  serverKey: string;
  environment: 'development' | 'production';
}

interface ParticleUser {
  uuid: string;
  email?: string;
  phone?: string;
  walletAddress: string;
  chainId: number;
}

class ParticleAPI {
  private config: ParticleAPIConfig;
  private isInitialized = false;

  constructor(config: ParticleAPIConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Validate configuration
      if (!this.config.projectId || !this.config.serverKey) {
        throw new Error('Missing required Particle API configuration');
      }

      console.log('Initializing Particle API with project:', this.config.projectId.substring(0, 8) + '...');
      this.isInitialized = true;
    } catch (error) {
      console.error('Particle API initialization failed:', error);
      throw error;
    }
  }

  async getUserInfo(uuid: string): Promise<ParticleUser | null> {
    try {
      await this.initialize();

      // Placeholder for Particle API call
      console.warn('Particle getUserInfo not implemented');
      return null;
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  async validateUser(uuid: string, token: string): Promise<boolean> {
    try {
      await this.initialize();

      // Placeholder for user validation
      console.warn('Particle user validation not implemented');
      return false;
    } catch (error) {
      console.error('Failed to validate user:', error);
      throw error;
    }
  }

  async createWallet(uuid: string, chainId: number): Promise<string> {
    try {
      await this.initialize();

      // Placeholder for wallet creation
      console.warn('Particle wallet creation not implemented');
      throw new Error('Wallet creation not implemented');
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  async signTransaction(uuid: string, transaction: any): Promise<string> {
    try {
      await this.initialize();

      // Placeholder for transaction signing
      console.warn('Particle transaction signing not implemented');
      throw new Error('Transaction signing not implemented');
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  }
}

// Configuration
const getParticleAPIConfig = (): ParticleAPIConfig => {
  const projectId = process.env.PARTICLE_PROJECT_ID;
  const serverKey = process.env.PARTICLE_SERVER_KEY;
  const environment = (process.env.NODE_ENV === 'production' ? 'production' : 'development') as 'development' | 'production';

  if (!projectId || !serverKey) {
    console.warn('Particle API configuration incomplete. Please set PARTICLE_PROJECT_ID and PARTICLE_SERVER_KEY');
  }

  return {
    projectId: projectId || 'demo-project-id',
    serverKey: serverKey || 'demo-server-key',
    environment
  };
};

// Singleton instance
let particleAPIInstance: ParticleAPI | null = null;

const getParticleAPI = (): ParticleAPI => {
  if (!particleAPIInstance) {
    particleAPIInstance = new ParticleAPI(getParticleAPIConfig());
  }
  return particleAPIInstance;
};

/**
 * Register Particle API routes
 */
export function registerParticleRoutes(app: Express): void {
  const particleAPI = getParticleAPI();

  // Get user info
  app.get('/api/particle/user/:uuid', async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;
      
      if (!uuid) {
        return res.status(400).json({
          error: 'Missing user UUID',
          code: 'MISSING_UUID'
        });
      }

      const userInfo = await particleAPI.getUserInfo(uuid);
      
      if (!userInfo) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json(userInfo);
    } catch (error) {
      console.error('Particle user info error:', error);
      res.status(500).json({
        error: 'Failed to get user info',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // Validate user token
  app.post('/api/particle/validate', async (req: Request, res: Response) => {
    try {
      const { uuid, token } = req.body;
      
      if (!uuid || !token) {
        return res.status(400).json({
          error: 'Missing UUID or token',
          code: 'MISSING_CREDENTIALS'
        });
      }

      const isValid = await particleAPI.validateUser(uuid, token);
      
      res.json({ valid: isValid });
    } catch (error) {
      console.error('Particle validation error:', error);
      res.status(500).json({
        error: 'Failed to validate user',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // Create wallet
  app.post('/api/particle/wallet', async (req: Request, res: Response) => {
    try {
      const { uuid, chainId } = req.body;
      
      if (!uuid || !chainId) {
        return res.status(400).json({
          error: 'Missing UUID or chain ID',
          code: 'MISSING_PARAMETERS'
        });
      }

      const walletAddress = await particleAPI.createWallet(uuid, chainId);
      
      res.json({ address: walletAddress });
    } catch (error) {
      console.error('Particle wallet creation error:', error);
      res.status(500).json({
        error: 'Failed to create wallet',
        code: 'INTERNAL_ERROR'
      });
    }
  });

  // Sign transaction
  app.post('/api/particle/sign', async (req: Request, res: Response) => {
    try {
      const { uuid, transaction } = req.body;
      
      if (!uuid || !transaction) {
        return res.status(400).json({
          error: 'Missing UUID or transaction data',
          code: 'MISSING_PARAMETERS'
        });
      }

      const signature = await particleAPI.signTransaction(uuid, transaction);
      
      res.json({ signature });
    } catch (error) {
      console.error('Particle transaction signing error:', error);
      res.status(500).json({
        error: 'Failed to sign transaction',
        code: 'INTERNAL_ERROR'
      });
    }
  });
}