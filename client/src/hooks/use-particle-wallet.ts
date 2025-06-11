import { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

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
  address: string | undefined;
  chainId: number | undefined;
  isLoading: boolean;
  provider: BrowserProvider | null;
}

export function useParticleWallet() {
  const { open, close } = useAppKit();
  const { address, isConnected, chainId } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  
  const [state, setState] = useState<ParticleWalletState>({
    isConnected: false,
    address: undefined,
    chainId: undefined,
    isLoading: false,
    provider: null
  });

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  useEffect(() => {
    setState({
      isConnected: !!isConnected,
      address,
      chainId,
      isLoading: false,
      provider: walletProvider ? new BrowserProvider(walletProvider) : null
    });
  }, [isConnected, address, chainId, walletProvider]);

  const connectWallet = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await open();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const disconnectWallet = async () => {
    try {
      await close();
      setState({
        isConnected: false,
        address: undefined,
        chainId: undefined,
        isLoading: false,
        provider: null
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const fetchTokenBalances = async (): Promise<TokenBalance[]> => {
    if (!address || !chainId) {
      return [];
    }

    setIsLoadingBalances(true);
    try {
      const response = await fetch('/api/tokens/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          chainId
        }),
      });

      const data = await response.json();
      
      if (data.success && data.balance) {
        const tokenBalances = Array.isArray(data.balance) ? data.balance : [data.balance];
        setBalances(tokenBalances);
        return tokenBalances;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      return [];
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const transferToken = async (tokenAddress: string, amount: string, recipient: string) => {
    if (!state.provider || !address) {
      throw new Error('Wallet not connected');
    }

    const signer = await state.provider.getSigner();
    
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      // Native token transfer
      const tx = await signer.sendTransaction({
        to: recipient,
        value: parseUnits(amount, 18)
      });
      return tx;
    } else {
      // ERC20 token transfer
      const tokenContract = new Contract(
        tokenAddress,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        signer
      );
      const tx = await tokenContract.transfer(recipient, parseUnits(amount, 18));
      return tx;
    }
  };

  return {
    ...state,
    balances,
    isLoadingBalances,
    connectWallet,
    disconnectWallet,
    fetchTokenBalances,
    transferToken
  };
}