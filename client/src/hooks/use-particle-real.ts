import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface ParticleWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  userInfo: any | null;
  isLoading: boolean;
  provider: ethers.BrowserProvider | null;
  smartAccount: any | null;
}

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  usdValue?: number;
  formattedBalance: string;
}

// Initialize Particle Network using direct API integration
const initParticleNetwork = () => {
  if (typeof window === 'undefined') return null;

  // Create mock Particle instance for API integration
  return {
    projectId: import.meta.env.VITE_PARTICLE_PROJECT_ID || 'c83ce10f-85ce-406e-a9a3-0444767f730b',
    clientKey: import.meta.env.VITE_PARTICLE_CLIENT_KEY || 'cAEYYI4suhkKPKYAuD6APYq6vaj9J4a1KhX1k4Zv',
    baseUrl: 'https://api.particle.network',
    isInitialized: true
  };
};

export function useParticleReal() {
  const [state, setState] = useState<ParticleWalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    userInfo: null,
    isLoading: false,
    provider: null,
    smartAccount: null
  });

  const [particle, setParticle] = useState<any>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);

  // Initialize Particle Network
  useEffect(() => {
    const particleInstance = initParticleNetwork();
    if (particleInstance) {
      setParticle(particleInstance);
    }
  }, []);

  // Connect wallet using Particle Network API
  const connect = useCallback(async () => {
    console.log('Connect button clicked - Starting Particle Network connection...');
    
    if (!particle) {
      console.error('Particle Network not initialized');
      alert('Particle Network not initialized. Please refresh the page.');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    alert('Please use the email dialog to connect');
    setState(prev => ({ ...prev, isLoading: false }));
  }, [particle]);

  // Connect with email (new function for dialog-based connection)
  const connectWithEmail = useCallback(async (email: string) => {
    if (!particle) {
      console.error('Particle Network not initialized');
      throw new Error('Particle Network not initialized');
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Authenticating with backend using email:', email);
      const userInfo = await authenticateWithBackend(email);
      console.log('Authentication response:', userInfo);
      
      if (!userInfo || !userInfo.wallets || userInfo.wallets.length === 0) {
        throw new Error('Invalid user information received');
      }
      
      // Create ethers provider for blockchain interactions
      const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');

      console.log('Setting connected state with address:', userInfo.wallets[0].public_address);
      setState(prev => ({
        ...prev,
        isConnected: true,
        address: userInfo.wallets[0].public_address,
        chainId: 1,
        userInfo: userInfo,
        provider: provider as any,
        isLoading: false
      }));
      
      // Fetch wallet balances using real blockchain data
      console.log('Fetching wallet balances...');
      await fetchBalances(userInfo.uuid, 1, userInfo.wallets[0].public_address);
      
      console.log('Particle Network connection successful!');

    } catch (error) {
      console.error('Particle connection failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [particle]);

  // Authenticate with backend using email
  const authenticateWithBackend = async (email: string) => {
    try {
      const response = await fetch('/api/particle/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email
        })
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const result = await response.json();
      console.log('Backend authentication successful:', result);
      return result.userInfo;
    } catch (error) {
      console.error('Backend authentication error:', error);
      throw error;
    }
  };

  // Fetch wallet balances using Particle API
  const fetchBalances = async (uuid: string, chainId: number, publicAddress: string) => {
    try {
      const response = await fetch('/api/particle/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid,
          chainId,
          publicAddress
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tokens) {
          setBalances(data.tokens);
        }
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  // Get swap quote using Particle Network
  const getSwapQuote = async (fromToken: string, toToken: string, amount: string) => {
    if (!state.userInfo || !state.address || !state.chainId) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch('/api/particle/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: state.userInfo.uuid,
          fromToken,
          toToken,
          amount,
          chainId: state.chainId,
          userAddress: state.address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get swap quote');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Swap quote failed');
      }

      return data.quote;
    } catch (error) {
      console.error('Swap quote error:', error);
      throw error;
    }
  };

  // Execute swap using Particle's gasless transactions
  const executeSwap = async (swapQuote: any) => {
    if (!state.userInfo || !particle) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch('/api/particle/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: state.userInfo.uuid,
          transaction: swapQuote.transaction,
          chainId: state.chainId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute swap');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Swap execution failed');
      }

      return data.transactionHash;
    } catch (error) {
      console.error('Swap execution error:', error);
      throw error;
    }
  };

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (particle && state.userInfo) {
      try {
        await fetch('/api/particle/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: state.userInfo.uuid })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setState({
      isConnected: false,
      address: null,
      chainId: null,
      userInfo: null,
      isLoading: false,
      provider: null,
      smartAccount: null
    });
    setBalances([]);
  }, [particle, state.userInfo]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (state.userInfo && state.chainId && state.address) {
      await fetchBalances(state.userInfo.uuid, state.chainId, state.address);
    }
  }, [state.userInfo, state.chainId, state.address]);

  return {
    ...state,
    balances,
    connect,
    connectWithEmail,
    disconnect,
    refreshBalances,
    getSwapQuote,
    executeSwap,
    getTotalValue: () => balances.reduce((total, token) => total + (token.usdValue || 0), 0)
  };
}