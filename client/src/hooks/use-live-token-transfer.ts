import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

interface TransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'approving' | 'transferring' | 'completed' | 'error';
  needsApproval: boolean;
}

// Admin wallet addresses for each chain
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Ethereum
  56: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // BSC
  137: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Polygon
  42161: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Arbitrum
  10: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Optimism
  43114: '0x742d35Cc6Df6A18647d95D5ae274C4D81dB7E88e', // Avalanche
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Local hardhat
};

// ERC20 ABI for token transfers
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export function useLiveTokenTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle',
    needsApproval: false
  });

  const getProvider = useCallback(async () => {
    if (!walletProvider || !isConnected) {
      throw new Error('Wallet not connected');
    }
    return new BrowserProvider(walletProvider as any);
  }, [walletProvider, isConnected]);

  const getAdminWallet = useCallback(() => {
    if (!caipNetwork?.id) return null;
    const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
    return ADMIN_WALLETS[chainId] || null;
  }, [caipNetwork]);

  const checkTokenApproval = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    try {
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        return true; // Native tokens don't need approval
      }

      const provider = await getProvider();
      const adminWallet = getAdminWallet();
      
      if (!adminWallet || !address) return false;

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await tokenContract.decimals();
      const amountWei = parseUnits(amount, decimals);
      const allowance = await tokenContract.allowance(address, adminWallet);

      return allowance >= amountWei;
    } catch (error) {
      console.error('Failed to check token approval:', error);
      return false;
    }
  }, [getProvider, getAdminWallet, address]);

  const approveToken = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    try {
      setTransferState(prev => ({ ...prev, step: 'approving', isTransferring: true }));

      const provider = await getProvider();
      const signer = await provider.getSigner();
      const adminWallet = getAdminWallet();
      
      if (!adminWallet) {
        throw new Error('Admin wallet not configured for this network');
      }

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      const decimals = await tokenContract.decimals();
      const amountWei = parseUnits(amount, decimals);

      console.log('Approving token:', { tokenAddress, amount, adminWallet, amountWei: amountWei.toString() });

      const tx = await tokenContract.approve(adminWallet, amountWei);
      const receipt = await tx.wait();

      console.log('Token approval successful:', receipt.hash);
      setTransferState(prev => ({ ...prev, transactionHash: receipt.hash }));
      
      return true;
    } catch (error) {
      console.error('Token approval failed:', error);
      setTransferState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isTransferring: false
      }));
      return false;
    }
  }, [getProvider, getAdminWallet]);

  const executeTransfer = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    try {
      setTransferState(prev => ({ ...prev, step: 'transferring', isTransferring: true }));

      const provider = await getProvider();
      const signer = await provider.getSigner();
      const adminWallet = getAdminWallet();
      
      if (!adminWallet) {
        throw new Error('Admin wallet not configured for this network');
      }

      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer
        const amountWei = parseUnits(amount, 18);
        console.log('Transferring native token:', { amount, adminWallet, amountWei: amountWei.toString() });
        
        tx = await signer.sendTransaction({
          to: adminWallet,
          value: amountWei
        });
      } else {
        // ERC20 token transfer
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
        const decimals = await tokenContract.decimals();
        const amountWei = parseUnits(amount, decimals);
        
        console.log('Transferring ERC20 token:', { tokenAddress, amount, adminWallet, amountWei: amountWei.toString() });
        
        tx = await tokenContract.transfer(adminWallet, amountWei);
      }

      const receipt = await tx.wait();
      console.log('Transfer successful:', receipt.hash);

      setTransferState(prev => ({
        ...prev,
        step: 'completed',
        transactionHash: receipt.hash,
        isTransferring: false
      }));

      return receipt.hash;
    } catch (error) {
      console.error('Transfer failed:', error);
      setTransferState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isTransferring: false
      }));
      return null;
    }
  }, [getProvider, getAdminWallet]);

  const transferToAdmin = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    try {
      console.log('Starting live token transfer to admin wallet:', { tokenAddress, amount });
      
      // Reset state
      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'idle',
        needsApproval: false
      });

      // Check if approval is needed for ERC20 tokens
      if (tokenAddress !== '0x0000000000000000000000000000000000000000') {
        const hasApproval = await checkTokenApproval(tokenAddress, amount);
        
        if (!hasApproval) {
          setTransferState(prev => ({ ...prev, needsApproval: true }));
          const approved = await approveToken(tokenAddress, amount);
          if (!approved) {
            return null;
          }
        }
      }

      // Execute the transfer
      const transferHash = await executeTransfer(tokenAddress, amount);
      return transferHash;

    } catch (error) {
      console.error('Live token transfer failed:', error);
      setTransferState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isTransferring: false
      }));
      return null;
    }
  }, [checkTokenApproval, approveToken, executeTransfer]);

  const resetState = useCallback(() => {
    setTransferState({
      isTransferring: false,
      transactionHash: null,
      error: null,
      step: 'idle',
      needsApproval: false
    });
  }, []);

  return {
    transferState,
    transferToAdmin,
    resetState,
    getAdminWallet: getAdminWallet()
  };
}