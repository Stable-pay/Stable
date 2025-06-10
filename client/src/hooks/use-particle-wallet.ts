import { useState, useEffect, useCallback } from 'react';
import { particleConfig, supportedChains } from '@/lib/particle-config';
import { ethers } from 'ethers';

export interface ParticleWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  userInfo: any | null;
  isLoading: boolean;
  provider: any | null;
  smartAccount: any | null;
}

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

// Mock Particle Network functionality for development
export function useParticleWallet() {
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

  const connect = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));
      
      // Simulate Particle Network connection
      const mockAddress = '0x742d35Cc6639C0532fAA648C5b84A62B12345678';
      const mockUserInfo = {
        uuid: 'mock-uuid',
        email: 'user@example.com',
        name: 'Mock User',
        walletType: 'particle'
      };

      setWalletState({
        isConnected: true,
        address: mockAddress,
        chainId: 1,
        userInfo: mockUserInfo,
        isLoading: false,
        provider: window.ethereum || null,
        smartAccount: null,
      });

      return { address: mockAddress, userInfo: mockUserInfo };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
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
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    try {
      setWalletState(prev => ({ ...prev, chainId }));
    } catch (error) {
      console.error('Failed to switch chain:', error);
      throw error;
    }
  }, []);

  const getBalance = useCallback(async (tokenAddress?: string) => {
    if (!walletState.address || !walletState.provider) return '0';
    
    try {
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token balance
        const balance = await walletState.provider.getBalance(walletState.address);
        return ethers.formatEther(balance);
      } else {
        // ERC-20 token balance
        const contract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
          walletState.provider
        );
        const [balance, decimals] = await Promise.all([
          contract.balanceOf(walletState.address),
          contract.decimals()
        ]);
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }, [walletState.address, walletState.provider]);

  const sendTransaction = useCallback(async (to: string, value: string, data?: string) => {
    if (!walletState.address || !walletState.smartAccount) throw new Error('No wallet connected');

    try {
      // Prepare transaction for Account Abstraction
      const transaction = {
        to,
        value: ethers.parseEther(value),
        data: data || '0x'
      };

      // Use Particle Network's Smart Account for gasless transaction
      const userOp = await walletState.smartAccount.buildUserOperation({
        transactions: [transaction]
      });

      // Execute with paymaster sponsorship
      const txHash = await walletState.smartAccount.sendUserOperation(userOp);
      
      return txHash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }, [walletState.address, walletState.smartAccount]);

  const swapToUSDC = useCallback(async (fromToken: string, amount: string) => {
    if (!walletState.address || !walletState.smartAccount) throw new Error('No wallet connected');

    try {
      // Get live swap quote using production price API
      const { productionPriceAPI } = await import('@/lib/production-price-api');
      const quote = await productionPriceAPI.getSwapQuote(fromToken, 'USDC', amount, walletState.chainId || 1);
      
      if (!quote) {
        throw new Error('Unable to get swap quote');
      }

      // Build swap transaction data (simplified for demo - would use actual DEX router)
      const swapData = {
        to: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3 Router
        value: fromToken === 'ETH' ? ethers.parseEther(amount) : 0n,
        data: '0x' // Would contain actual swap calldata
      };

      // Execute gasless swap via Smart Account
      const userOp = await walletState.smartAccount.buildUserOperation({
        transactions: [swapData]
      });

      const txHash = await walletState.smartAccount.sendUserOperation(userOp);
      
      return {
        txHash,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        rate: quote.rate,
        gasless: true,
        sponsoredByPaymaster: true,
        minimumReceived: quote.minimumReceived
      };
    } catch (error) {
      console.error('Failed to swap to USDC:', error);
      throw error;
    }
  }, [walletState.address, walletState.smartAccount, walletState.chainId]);

  // Mock balance fetch
  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletState.isConnected || !walletState.address) return;

      try {
        const mockBalances: TokenBalance[] = [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            address: '0x0000000000000000000000000000000000000000',
            balance: '2.5',
            decimals: 18,
            chainId: walletState.chainId || 1,
            formattedBalance: '2.5000',
            usdValue: 6000
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0xA0b86a33E6441b8435b662da5e1a0d5d9d3B7B3e',
            balance: '1000.0',
            decimals: 6,
            chainId: walletState.chainId || 1,
            formattedBalance: '1000.0000',
            usdValue: 1000
          }
        ];

        setBalances(mockBalances);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      }
    };

    fetchBalances();
  }, [walletState.isConnected, walletState.address, walletState.chainId]);

  return {
    ...walletState,
    balances,
    connect,
    disconnect,
    switchChain,
    getBalance,
    sendTransaction,
    swapToUSDC,
  };
}