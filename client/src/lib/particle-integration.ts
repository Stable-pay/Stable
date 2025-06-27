/**
 * Particle Network Integration Module
 * Provides Web3 wallet functionality with social login capabilities
 */

interface ParticleConfig {
  projectId: string;
  clientKey: string;
  appId: string;
  environment: 'development' | 'production';
}

interface UserInfo {
  uuid: string;
  phone?: string;
  email?: string;
  name?: string;
  avatar?: string;
}

interface ParticleWallet {
  address: string;
  chainId: number;
  publicKey: string;
}

export class ParticleIntegration {
  private config: ParticleConfig;
  private isInitialized = false;
  private currentUser: UserInfo | null = null;
  private currentWallet: ParticleWallet | null = null;

  constructor(config: ParticleConfig) {
    this.config = config;
  }

  /**
   * Initialize Particle Network SDK
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Validate configuration
      if (!this.config.projectId || !this.config.clientKey || !this.config.appId) {
        throw new Error('Missing required Particle configuration');
      }

      // Placeholder for actual Particle SDK initialization
      console.warn('Particle Network SDK initialization not fully implemented');
      console.log('Configuration:', {
        projectId: this.config.projectId.substring(0, 8) + '...',
        environment: this.config.environment
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Particle initialization failed:', error);
      throw error;
    }
  }

  /**
   * Login user with social providers
   */
  async login(provider: 'google' | 'facebook' | 'twitter' | 'apple' | 'email'): Promise<UserInfo> {
    try {
      await this.initialize();

      // Placeholder for social login
      console.warn(`Particle ${provider} login not implemented`);
      throw new Error(`${provider} login not implemented`);
    } catch (error) {
      console.error('Particle login failed:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      // Placeholder for logout
      this.currentUser = null;
      this.currentWallet = null;
      console.warn('Particle logout not implemented');
    } catch (error) {
      console.error('Particle logout failed:', error);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUser;
  }

  /**
   * Get current wallet info
   */
  getCurrentWallet(): ParticleWallet | null {
    return this.currentWallet;
  }

  /**
   * Send transaction
   */
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    try {
      if (!this.currentWallet) {
        throw new Error('No wallet connected');
      }

      // Placeholder for transaction sending
      console.warn('Particle sendTransaction not implemented');
      throw new Error('Transaction sending not implemented');
    } catch (error) {
      console.error('Particle transaction failed:', error);
      throw error;
    }
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    try {
      if (!this.currentWallet) {
        throw new Error('No wallet connected');
      }

      // Placeholder for message signing
      console.warn('Particle signMessage not implemented');
      throw new Error('Message signing not implemented');
    } catch (error) {
      console.error('Particle message signing failed:', error);
      throw error;
    }
  }

  /**
   * Switch chain
   */
  async switchChain(chainId: number): Promise<void> {
    try {
      if (!this.currentWallet) {
        throw new Error('No wallet connected');
      }

      // Placeholder for chain switching
      console.warn('Particle switchChain not implemented');
      throw new Error('Chain switching not implemented');
    } catch (error) {
      console.error('Particle chain switch failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.currentWallet !== null;
  }
}

// Default configuration
export const getParticleConfig = (): ParticleConfig => {
  const projectId = process.env.VITE_PARTICLE_PROJECT_ID;
  const clientKey = process.env.VITE_PARTICLE_CLIENT_KEY;
  const appId = process.env.VITE_PARTICLE_APP_ID;
  const environment = (process.env.NODE_ENV === 'production' ? 'production' : 'development') as 'development' | 'production';

  if (!projectId || !clientKey || !appId) {
    console.warn('Particle configuration incomplete. Please set VITE_PARTICLE_PROJECT_ID, VITE_PARTICLE_CLIENT_KEY, and VITE_PARTICLE_APP_ID');
  }

  return {
    projectId: projectId || 'demo-project-id',
    clientKey: clientKey || 'demo-client-key',
    appId: appId || 'demo-app-id',
    environment
  };
};

// Singleton instance
let particleInstance: ParticleIntegration | null = null;

export const getParticleIntegration = (): ParticleIntegration => {
  if (!particleInstance) {
    particleInstance = new ParticleIntegration(getParticleConfig());
  }
  return particleInstance;
};