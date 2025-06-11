import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { useTokenValidation } from './use-token-validation';

interface DirectTransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'validating' | 'approving' | 'transferring' | 'completed' | 'error';
  needsApproval: boolean;
  userConsent: boolean;
}

// ERC20 ABI for transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Admin wallet addresses from your configuration
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Ethereum
  137: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Polygon  
  56: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // BSC
  42161: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Arbitrum
  10: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Optimism
  8453: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Base
};

export function useDirectTokenTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { validateTokenTransfer, approveToken } = useTokenValidation();

  const [transferState, setTransferState] = useState<DirectTransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle',
    needsApproval: false,
    userConsent: false
  });

  const initiateTransfer = useCallback(async (
    tokenAddress: string,
    amount: string,
    inrAmount: string,
    bankAccount: string,
    onUserConsent?: () => void
  ): Promise<string | null> => {
    if (!isConnected || !address || !caipNetwork) {
      setTransferState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return null;
    }

    const chainId = parseInt(caipNetwork.id.toString());
    const adminWallet = ADMIN_WALLETS[chainId];
    
    if (!adminWallet) {
      setTransferState(prev => ({ 
        ...prev, 
        error: `Admin wallet not configured for chain ${chainId}` 
      }));
      return null;
    }

    try {
      setTransferState(prev => ({ ...prev, step: 'validating', error: null }));

      // Validate token transfer
      const validation = await validateTokenTransfer(tokenAddress, amount, adminWallet);
      
      if (!validation.isValid) {
        if (!validation.hasBalance) {
          throw new Error('Insufficient token balance');
        }
        if (validation.needsApproval) {
          setTransferState(prev => ({ 
            ...prev, 
            step: 'approving',
            needsApproval: true 
          }));
          
          // For ERC20 tokens, we don't need approval for direct transfers
          // This is handled differently than smart contract interactions
        }
      }

      // Show user consent modal with transfer details
      const userConfirmed = await showUserConsentModal({
        tokenSymbol: await getTokenSymbol(tokenAddress),
        amount,
        inrAmount,
        bankAccount,
        adminWallet,
        chainId
      });

      if (!userConfirmed) {
        setTransferState(prev => ({ ...prev, step: 'idle' }));
        return null;
      }

      setTransferState(prev => ({ 
        ...prev, 
        userConsent: true,
        step: 'transferring' 
      }));

      if (onUserConsent) {
        onUserConsent();
      }

      // Execute the transfer
      const txHash = await executeDirectTransfer(tokenAddress, amount, adminWallet);
      
      setTransferState(prev => ({
        ...prev,
        step: 'completed',
        transactionHash: txHash,
        isTransferring: false
      }));

      return txHash;

    } catch (error) {
      const errorMessage = (error as Error).message;
      setTransferState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage,
        isTransferring: false
      }));
      return null;
    }
  }, [isConnected, address, caipNetwork, validateTokenTransfer]);

  const executeDirectTransfer = async (
    tokenAddress: string,
    amount: string,
    recipientAddress: string
  ): Promise<string> => {
    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();

    // Handle native token transfer (ETH, MATIC, BNB, etc.)
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: parseUnits(amount, 18)
      });
      
      const receipt = await tx.wait();
      return receipt?.hash || tx.hash;
    }

    // Handle ERC20 token transfer
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await tokenContract.decimals();
    const amountBigInt = parseUnits(amount, decimals);

    const tx = await tokenContract.transfer(recipientAddress, amountBigInt);
    const receipt = await tx.wait();
    
    return receipt.hash;
  };

  const getTokenSymbol = async (tokenAddress: string): Promise<string> => {
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      const chainId = parseInt(caipNetwork?.id?.toString() || '1');
      return getNativeTokenSymbol(chainId);
    }

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
      return await tokenContract.symbol();
    } catch {
      return 'Unknown';
    }
  };

  const getNativeTokenSymbol = (chainId: number): string => {
    const symbols: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB',
      42161: 'ETH',
      10: 'ETH',
      8453: 'ETH'
    };
    return symbols[chainId] || 'ETH';
  };

  const showUserConsentModal = (details: {
    tokenSymbol: string;
    amount: string;
    inrAmount: string;
    bankAccount: string;
    adminWallet: string;
    chainId: number;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Token Transfer</h3>
          <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div class="flex justify-between">
              <span>Token:</span>
              <span class="font-medium">${details.tokenSymbol}</span>
            </div>
            <div class="flex justify-between">
              <span>Amount:</span>
              <span class="font-medium">${details.amount}</span>
            </div>
            <div class="flex justify-between">
              <span>INR Value:</span>
              <span class="font-medium">₹${details.inrAmount}</span>
            </div>
            <div class="flex justify-between">
              <span>Bank Account:</span>
              <span class="font-medium">***${details.bankAccount.slice(-4)}</span>
            </div>
            <div class="flex justify-between">
              <span>Admin Wallet:</span>
              <span class="font-medium text-xs">${details.adminWallet.slice(0, 6)}...${details.adminWallet.slice(-4)}</span>
            </div>
          </div>
          <div class="mt-6 space-y-3">
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ This will transfer your tokens directly to our custody wallet. The transaction cannot be reversed.
            </div>
            <div class="flex space-x-3">
              <button id="consent-cancel" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancel
              </button>
              <button id="consent-confirm" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const handleConfirm = () => {
        document.body.removeChild(modal);
        resolve(true);
      };

      const handleCancel = () => {
        document.body.removeChild(modal);
        resolve(false);
      };

      modal.querySelector('#consent-confirm')?.addEventListener('click', handleConfirm);
      modal.querySelector('#consent-cancel')?.addEventListener('click', handleCancel);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) handleCancel();
      });
    });
  };

  const resetTransferState = useCallback(() => {
    setTransferState({
      isTransferring: false,
      transactionHash: null,
      error: null,
      step: 'idle',
      needsApproval: false,
      userConsent: false
    });
  }, []);

  return {
    transferState,
    initiateTransfer,
    resetTransferState
  };
}