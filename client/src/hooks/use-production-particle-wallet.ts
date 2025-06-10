import { useState, useEffect, useCallback } from 'react';
import { ParticleNetwork } from '@particle-network/auth';
import { ParticleProvider } from '@particle-network/provider';
import { SmartAccount } from '@particle-network/aa';
import { ethers } from 'ethers';
import { particleConfig } from '@/lib/particle-config';

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  usdValue?: number;
  formattedBalance: string;
}

export interface ParticleWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  userInfo: any | null;
  isLoading: boolean;
  provider: ParticleProvider | null;
  smartAccount: SmartAccount | null;
}

export function useProductionParticleWallet() {
  const [walletState, setWalletState] = useState<ParticleWalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    userInfo: null,
    isLoading: false,
    provider: null,
    smartAccount: null,
  });

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [particle, setParticle] = useState<ParticleNetwork | null>(null);

  // Initialize Particle Network
  const initializeParticle = useCallback(async () => {
    try {
      const particleInstance = new ParticleNetwork({
        projectId: particleConfig.projectId,
        clientKey: particleConfig.clientKey,
        appId: particleConfig.appId,
        chainName: 'ethereum',
        chainId: 1,
        wallet: {
          displayWalletEntry: true,
        },
      });

      const provider = new ParticleProvider(particleInstance.auth);
      
      const smartAccount = new SmartAccount(provider, {
        projectId: particleConfig.projectId,
        clientKey: particleConfig.clientKey,
        appId: particleConfig.appId,
        aaOptions: {
          accountContracts: {
            SIMPLE: [{ chainIds: [1, 137, 56, 42161, 10, 8453], version: '1.0.0' }],
          },
        },
      });

      setParticle(particleInstance);
      setWalletState(prev => ({
        ...prev,
        provider,
        smartAccount,
      }));

      return { particle: particleInstance, provider, smartAccount };
    } catch (error) {
      console.error('Failed to initialize Particle:', error);
      throw error;
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));

      let particleInstance = particle;
      let provider = walletState.provider;
      let smartAccount = walletState.smartAccount;

      if (!particleInstance) {
        const initialized = await initializeParticle();
        particleInstance = initialized.particle;
        provider = initialized.provider;
        smartAccount = initialized.smartAccount;
      }

      // Authenticate user
      const userInfo = await particleInstance.auth.login();
      
      // Get user address
      const accounts = await provider?.request({ 
        method: 'eth_accounts' 
      }) as string[];
      
      const address = accounts?.[0] || null;
      const chainId = await provider?.request({ 
        method: 'eth_chainId' 
      }) as number;

      setWalletState({
        isConnected: true,
        address,
        chainId: parseInt(chainId.toString(), 16),
        userInfo,
        isLoading: false,
        provider,
        smartAccount,
      });

      return userInfo;
    } catch (error) {
      setWalletState(prev => ({ ...prev, isLoading: false }));
      console.error('Connection failed:', error);
      throw error;
    }
  }, [particle, walletState.provider, walletState.smartAccount, initializeParticle]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      if (particle) {
        await particle.auth.logout();
      }
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        userInfo: null,
        isLoading: false,
        provider: null,
        smartAccount: null,
      });
      setBalances([]);
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  }, [particle]);

  // Switch chain
  const switchChain = useCallback(async (chainId: number) => {
    try {
      if (!walletState.provider) throw new Error('Provider not available');

      await walletState.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      setWalletState(prev => ({ ...prev, chainId }));
    } catch (error) {
      console.error('Chain switch failed:', error);
      throw error;
    }
  }, [walletState.provider]);

  // Get token balances using Particle API
  const fetchTokenBalances = useCallback(async () => {
    if (!walletState.address || !walletState.chainId) return;

    try {
      const response = await fetch('/api/particle/wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletState.address,
          chainId: walletState.chainId,
          tokens: [], // Empty array to get all tokens
        }),
      });

      const data = await response.json();
      
      if (data.result) {
        const tokenBalances: TokenBalance[] = data.result.map((token: any) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.contractAddress || '0x0000000000000000000000000000000000000000',
          balance: token.balance,
          decimals: token.decimals,
          chainId: walletState.chainId!,
          usdValue: token.usdValue,
          formattedBalance: ethers.formatUnits(token.balance, token.decimals),
        }));

        setBalances(tokenBalances);
      }
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      setBalances([]);
    }
  }, [walletState.address, walletState.chainId]);

  // Send gasless transaction
  const sendTransaction = useCallback(async (to: string, value: string, data?: string) => {
    if (!walletState.smartAccount) throw new Error('Smart Account not available');

    try {
      const transaction = {
        to,
        value: ethers.parseEther(value),
        data: data || '0x',
      };

      // Use Particle AA for gasless transaction
      const userOp = await walletState.smartAccount.buildUserOperation([transaction]);
      const txHash = await walletState.smartAccount.sendUserOperation(userOp);
      
      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [walletState.smartAccount]);

  // Swap using Particle Swap API
  const swapToUSDC = useCallback(async (fromToken: string, amount: string) => {
    if (!walletState.address || !walletState.chainId) throw new Error('Wallet not connected');

    try {
      // Get swap quote
      const quoteResponse = await fetch('/api/particle/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken,
          toToken: 'USDC',
          amount,
          chainId: walletState.chainId,
        }),
      });

      const quote = await quoteResponse.json();
      
      if (!quote.result) {
        throw new Error('Failed to get swap quote');
      }

      // Get swap transaction
      const txResponse = await fetch('/api/particle/swap/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quote.result,
          userAddress: walletState.address,
        }),
      });

      const swapTx = await txResponse.json();
      
      if (!swapTx.result) {
        throw new Error('Failed to get swap transaction');
      }

      // Execute swap with Smart Account (gasless)
      const txHash = await sendTransaction(
        swapTx.result.to,
        swapTx.result.value || '0',
        swapTx.result.data
      );

      return {
        txHash,
        fromAmount: amount,
        toAmount: quote.result.toAmount,
        rate: quote.result.rate,
        gasless: true,
        sponsoredByPaymaster: true,
        minimumReceived: quote.result.minimumReceived,
      };
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }, [walletState.address, walletState.chainId, sendTransaction]);

  // Check paymaster balance
  const getPaymasterBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/particle/paymaster/balance');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get paymaster balance:', error);
      return null;
    }
  }, []);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      fetchTokenBalances();
    }
  }, [walletState.isConnected, walletState.address, fetchTokenBalances]);

  return {
    ...walletState,
    balances,
    connect,
    disconnect,
    switchChain,
    sendTransaction,
    swapToUSDC,
    getPaymasterBalance,
    refreshBalances: fetchTokenBalances,
  };
}