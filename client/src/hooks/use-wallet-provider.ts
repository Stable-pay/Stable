import { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletProvider {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
}

export function useWalletProvider(): WalletProvider {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            const web3Provider = new BrowserProvider((window as any).ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();
            
            setIsConnected(true);
            setAddress(accounts[0]);
            setChainId(Number(network.chainId));
            setProvider(web3Provider);
            setSigner(web3Signer);
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          const web3Provider = new BrowserProvider((window as any).ethereum);
          const web3Signer = await web3Provider.getSigner();
          
          setIsConnected(true);
          setAddress(accounts[0]);
          setProvider(web3Provider);
          setSigner(web3Signer);
        } else {
          setIsConnected(false);
          setAddress(null);
          setChainId(null);
          setProvider(null);
          setSigner(null);
        }
      };

      const handleChainChanged = async (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        
        if (isConnected) {
          const web3Provider = new BrowserProvider((window as any).ethereum);
          const web3Signer = await web3Provider.getSigner();
          setProvider(web3Provider);
          setSigner(web3Signer);
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if ((window as any).ethereum) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [isConnected]);

  const connect = async () => {
    if (!(window as any).ethereum) {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const web3Provider = new BrowserProvider((window as any).ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();
      
      setIsConnected(true);
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      setProvider(web3Provider);
      setSigner(web3Signer);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  return {
    isConnected,
    address,
    chainId,
    provider,
    signer,
    connect
  };
}