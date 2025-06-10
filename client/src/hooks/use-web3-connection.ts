import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  formattedBalance: string;
  usdValue: number;
}

interface Web3State {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isLoading: boolean;
  balances: TokenBalance[];
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export function useWeb3Connection() {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
    address: null,
    chainId: null,
    isLoading: false,
    balances: [],
    provider: null,
    signer: null
  });

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('MetaMask not found');

      // Request account access
      await ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      setState(prev => ({
        ...prev,
        isConnected: true,
        address,
        chainId,
        provider,
        signer,
        isLoading: false
      }));

      // Fetch balances after connection
      await fetchBalances(address, chainId, provider);

    } catch (error) {
      console.error('Connection failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      alert('Failed to connect to MetaMask. Please try again.');
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      isLoading: false,
      balances: [],
      provider: null,
      signer: null
    });
  }, []);

  // Fetch token balances
  const fetchBalances = async (address: string, chainId: number, provider: ethers.BrowserProvider) => {
    try {
      const balances: TokenBalance[] = [];

      // Get ETH balance
      const ethBalance = await provider.getBalance(address);
      const ethFormatted = ethers.formatEther(ethBalance);
      
      balances.push({
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0x0000000000000000000000000000000000000000',
        balance: ethBalance.toString(),
        decimals: 18,
        chainId,
        formattedBalance: parseFloat(ethFormatted).toFixed(6),
        usdValue: parseFloat(ethFormatted) * 2045.67 // Real ETH price would come from API
      });

      // Get USDC balance (if on supported networks)
      const usdcAddresses: Record<number, string> = {
        1: '0xA0b86a33E6441021EAaF6e1F95544f64A37a43b7', // Ethereum
        137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
        42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' // Arbitrum
      };

      if (usdcAddresses[chainId]) {
        try {
          const usdcContract = new ethers.Contract(
            usdcAddresses[chainId],
            ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
            provider
          );

          const usdcBalance = await usdcContract.balanceOf(address);
          const usdcDecimals = await usdcContract.decimals();
          const usdcFormatted = ethers.formatUnits(usdcBalance, usdcDecimals);

          balances.push({
            symbol: 'USDC',
            name: 'USD Coin',
            address: usdcAddresses[chainId],
            balance: usdcBalance.toString(),
            decimals: usdcDecimals,
            chainId,
            formattedBalance: parseFloat(usdcFormatted).toFixed(2),
            usdValue: parseFloat(usdcFormatted)
          });
        } catch (error) {
          console.error('Failed to fetch USDC balance:', error);
        }
      }

      setState(prev => ({ ...prev, balances }));
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (state.address && state.chainId && state.provider) {
      await fetchBalances(state.address, state.chainId, state.provider);
    }
  }, [state.address, state.chainId, state.provider]);

  // Get total portfolio value
  const getTotalValue = useCallback(() => {
    return state.balances.reduce((total, balance) => total + balance.usdValue, 0);
  }, [state.balances]);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        connect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [state.address, connect, disconnect]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return;
        
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connect();
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    };

    checkConnection();
  }, [connect]);

  return {
    ...state,
    connect,
    disconnect,
    refreshBalances,
    getTotalValue,
    isMetaMaskInstalled
  };
}