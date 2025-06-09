import { useState, useEffect } from 'react';
import { appKit } from '@/lib/reown';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
}

export function useWalletConnection() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isConnecting: false
  });

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          
          // Check if already connected
          const accounts = await ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            const chainId = await ethereum.request({ 
              method: 'eth_chainId' 
            });
            
            setWalletState({
              isConnected: true,
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              isConnecting: false
            });
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0]
          }));
        } else {
          setWalletState({
            isConnected: false,
            address: null,
            chainId: null,
            isConnecting: false
          });
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16)
        }));
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      appKit.open();
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const disconnectWallet = async () => {
    try {
      await appKit.disconnect();
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        isConnecting: false
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return {
    ...walletState,
    connect: connectWallet,
    disconnect: disconnectWallet
  };
}