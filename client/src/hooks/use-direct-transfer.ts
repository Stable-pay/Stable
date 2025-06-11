import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, getAddress } from 'ethers';

interface DirectTransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'validating' | 'approving' | 'transferring' | 'completed' | 'error';
}

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Admin wallets for token transfers
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',     // Ethereum
  137: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',   // Polygon
  56: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',    // BSC
  42161: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Arbitrum
  10: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e',    // Optimism
  43114: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Avalanche
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'   // Local Hardhat
};

export function useDirectTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');

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
    if (!isConnected || !address || !walletProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'validating'
      });

      const chainId = typeof caipNetwork?.id === 'string' ? parseInt(caipNetwork.id) : (caipNetwork?.id || 1337);
      let adminWallet = ADMIN_WALLETS[chainId];
      
      // Fallback to local hardhat admin wallet
      if (!adminWallet) {
        adminWallet = ADMIN_WALLETS[1337];
      }

      // Validate and format admin wallet address with proper checksum
      try {
        adminWallet = getAddress(adminWallet);
      } catch (error) {
        console.error('Invalid admin wallet address:', adminWallet);
        throw new Error('Invalid admin wallet configuration');
      }

      console.log('Starting token transfer:', { tokenAddress, amount, adminWallet, chainId });

      // Use Reown provider directly to avoid JsonRPC issues
      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'approving'
      });

      let txHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer (ETH, MATIC, etc.)
        console.log('Executing native token transfer');
        
        const tx = await signer.sendTransaction({
          to: adminWallet,
          value: parseUnits(amount, 18),
          gasLimit: 21000
        });

        console.log('Native transaction sent:', tx.hash);
        
        setTransferState({
          isTransferring: true,
          transactionHash: tx.hash,
          error: null,
          step: 'confirming'
        });
        
        const receipt = await tx.wait();
        txHash = receipt?.hash || tx.hash;
        
      } else {
        // ERC20 token transfer with proper address validation
        console.log('Executing ERC20 token transfer');
        
        // Validate token address with proper checksum
        const validTokenAddress = getAddress(tokenAddress);
        
        const tokenContract = new Contract(validTokenAddress, ERC20_ABI, signer);
        
        // Get decimals with fallback to 18
        let decimals = 18;
        try {
          decimals = await tokenContract.decimals();
        } catch (error) {
          console.warn('Could not fetch token decimals, using default 18:', error);
        }
        
        const amountBigInt = parseUnits(amount, decimals);

        const tx = await tokenContract.transfer(adminWallet, amountBigInt);
        console.log('ERC20 transaction sent:', tx.hash);
        
        setTransferState({
          isTransferring: true,
          transactionHash: tx.hash,
          error: null,
          step: 'confirming'
        });
        
        const receipt = await tx.wait();
        txHash = receipt.hash;
      }

      console.log('Transfer completed successfully:', txHash);

      setTransferState({
        isTransferring: false,
        transactionHash: txHash,
        error: null,
        step: 'completed'
      });

      return txHash;

    } catch (error) {
      console.error('Token transfer failed:', error);
      
      const errorMessage = (error as Error).message;
      setTransferState({
        isTransferring: false,
        transactionHash: null,
        error: errorMessage,
        step: 'error'
      });

      return null;
    }
  }, [isConnected, address, caipNetwork, walletProvider]);

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