import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

interface TransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'checking-allowance' | 'requesting-approval' | 'approving' | 'transferring' | 'completed' | 'error';
  needsApproval: boolean;
  approvalHash: string | null;
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

// ERC20 ABI for token transfers and approvals
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export function useDirectWalletTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle',
    needsApproval: false,
    approvalHash: null
  });

  const transferToAdmin = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    if (!isConnected || !address || !walletProvider || !caipNetwork?.id) {
      console.error('Wallet not connected or network not available');
      return null;
    }

    try {
      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'transferring'
      });

      const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
      const adminWallet = ADMIN_WALLETS[chainId];
      
      if (!adminWallet) {
        throw new Error(`Admin wallet not configured for chain ${chainId}`);
      }

      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer (ETH, BNB, MATIC, etc.)
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

      setTransferState({
        isTransferring: false,
        transactionHash: receipt.hash,
        error: null,
        step: 'completed'
      });

      return receipt.hash;

    } catch (error) {
      console.error('Transfer failed:', error);
      setTransferState({
        isTransferring: false,
        transactionHash: null,
        error: (error as Error).message,
        step: 'error'
      });
      return null;
    }
  }, [isConnected, address, walletProvider, caipNetwork]);

  const resetState = useCallback(() => {
    setTransferState({
      isTransferring: false,
      transactionHash: null,
      error: null,
      step: 'idle'
    });
  }, []);

  const getAdminWallet = useCallback(() => {
    if (!caipNetwork?.id) return null;
    const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
    return ADMIN_WALLETS[chainId] || null;
  }, [caipNetwork]);

  return {
    transferState,
    transferToAdmin,
    resetState,
    getAdminWallet: getAdminWallet()
  };
}