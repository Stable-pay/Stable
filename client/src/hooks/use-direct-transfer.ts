import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

interface DirectTransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'preparing' | 'signing' | 'confirming' | 'completed' | 'error';
}

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Fallback admin wallets for each chain
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3',     // Ethereum
  137: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3',   // Polygon
  56: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3',    // BSC
  42161: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Arbitrum
  10: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3',    // Optimism
  43114: '0x0f9947c3e98c59975a033843d90cc1ecc17f06f3', // Avalanche
};

export function useDirectTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();

  const [transferState, setTransferState] = useState<DirectTransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const executeDirectTransfer = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    if (!isConnected || !address || !caipNetwork) {
      throw new Error('Wallet not connected');
    }

    const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
    const adminWallet = ADMIN_WALLETS[chainId];
    
    if (!adminWallet) {
      throw new Error(`No admin wallet configured for chain ${chainId}`);
    }

    setTransferState({
      isTransferring: true,
      transactionHash: null,
      error: null,
      step: 'preparing'
    });

    try {
      console.log('Starting direct transfer:', { tokenAddress, amount, adminWallet, chainId });

      // Get provider and signer
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      setTransferState(prev => ({ ...prev, step: 'signing' }));

      let txHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer
        console.log('Executing native token transfer');
        
        const tx = await signer.sendTransaction({
          to: adminWallet,
          value: parseUnits(amount, 18),
          gasLimit: 21000
        });

        console.log('Native transaction sent:', tx.hash);
        
        setTransferState(prev => ({ ...prev, step: 'confirming' }));
        
        const receipt = await tx.wait();
        txHash = receipt?.hash || tx.hash;
        
      } else {
        // ERC20 token transfer
        console.log('Executing ERC20 token transfer');
        
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
        const decimals = await tokenContract.decimals();
        const amountBigInt = parseUnits(amount, decimals);

        const tx = await tokenContract.transfer(adminWallet, amountBigInt);
        console.log('ERC20 transaction sent:', tx.hash);
        
        setTransferState(prev => ({ ...prev, step: 'confirming' }));
        
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
      console.error('Direct transfer failed:', error);
      
      const errorMessage = (error as Error).message;
      setTransferState({
        isTransferring: false,
        transactionHash: null,
        error: errorMessage,
        step: 'error'
      });

      return null;
    }
  }, [isConnected, address, caipNetwork]);

  const resetTransferState = useCallback(() => {
    setTransferState({
      isTransferring: false,
      transactionHash: null,
      error: null,
      step: 'idle'
    });
  }, []);

  return {
    transferState,
    executeDirectTransfer,
    resetTransferState
  };
}