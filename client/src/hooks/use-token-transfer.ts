import { useState, useCallback } from 'react';
import { useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, getAddress } from 'ethers';

interface TransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'validating' | 'approving' | 'transferring' | 'completed' | 'error';
}

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Admin wallets for receiving transfers
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',
  137: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',
  56: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',
  42161: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',
  10: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',
  43114: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
};

export function useTokenTransfer() {
  const { walletProvider } = useAppKitProvider('eip155');
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const executeTransfer = useCallback(async (
    tokenAddress: string,
    amount: string,
    chainId: number,
    userAddress: string
  ): Promise<string | null> => {
    if (!walletProvider || !userAddress) {
      throw new Error('Wallet not connected');
    }

    setTransferState({
      isTransferring: true,
      transactionHash: null,
      error: null,
      step: 'validating'
    });

    try {
      // Get admin wallet for this chain
      const adminWallet = ADMIN_WALLETS[chainId];
      if (!adminWallet) {
        throw new Error(`No admin wallet configured for chain ${chainId}`);
      }

      // Validate admin wallet address
      const validAdminWallet = getAddress(adminWallet);
      
      console.log('Starting transfer:', {
        tokenAddress,
        amount,
        chainId,
        adminWallet: validAdminWallet
      });

      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      setTransferState(prev => ({ ...prev, step: 'approving' }));

      let txHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer
        const tx = await signer.sendTransaction({
          to: validAdminWallet,
          value: parseUnits(amount, 18),
          gasLimit: 21000
        });

        setTransferState(prev => ({
          ...prev,
          step: 'transferring',
          transactionHash: tx.hash
        }));

        const receipt = await tx.wait();
        txHash = receipt?.hash || tx.hash;
      } else {
        // ERC20 token transfer
        const validTokenAddress = getAddress(tokenAddress);
        const tokenContract = new Contract(validTokenAddress, ERC20_ABI, signer);
        
        // Get token decimals
        let decimals = 18;
        try {
          decimals = await tokenContract.decimals();
        } catch (error) {
          console.warn('Using default decimals (18):', error);
        }

        const amountBigInt = parseUnits(amount, decimals);
        
        const tx = await tokenContract.transfer(validAdminWallet, amountBigInt);

        setTransferState(prev => ({
          ...prev,
          step: 'transferring',
          transactionHash: tx.hash
        }));

        const receipt = await tx.wait();
        txHash = receipt.hash;
      }

      console.log('Transfer completed:', txHash);

      setTransferState({
        isTransferring: false,
        transactionHash: txHash,
        error: null,
        step: 'completed'
      });

      return txHash;

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
  }, [walletProvider]);

  const resetTransfer = useCallback(() => {
    setTransferState({
      isTransferring: false,
      transactionHash: null,
      error: null,
      step: 'idle'
    });
  }, []);

  return {
    transferState,
    executeTransfer,
    resetTransfer
  };
}