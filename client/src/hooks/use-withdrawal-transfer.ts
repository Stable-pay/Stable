import { useState } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { getAdminWallet } from '@shared/admin-wallets';

export interface WithdrawalTransferState {
  isTransferring: boolean;
  transferComplete: boolean;
  transactionHash: string | null;
  error: string | null;
}

// ERC20 ABI for token transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export function useWithdrawalTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  
  const [transferState, setTransferState] = useState<WithdrawalTransferState>({
    isTransferring: false,
    transferComplete: false,
    transactionHash: null,
    error: null
  });

  const executeTransfer = async (
    tokenAddress: string,
    amount: string,
    onUserConsent?: () => void
  ): Promise<boolean> => {
    if (!address || !isConnected || !caipNetwork?.id) {
      setTransferState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    const chainId = parseInt(caipNetwork.id.toString());
    const adminWallet = getAdminWallet(chainId);
    
    if (!adminWallet) {
      setTransferState(prev => ({ 
        ...prev, 
        error: `Admin wallet not configured for chain ${chainId}` 
      }));
      return false;
    }

    try {
      setTransferState({
        isTransferring: true,
        transferComplete: false,
        transactionHash: null,
        error: null
      });

      // Get user consent before proceeding
      const userConsented = await getUserConsent(tokenAddress, amount, adminWallet);
      if (!userConsented) {
        setTransferState(prev => ({ 
          ...prev, 
          isTransferring: false,
          error: 'Transfer cancelled by user' 
        }));
        return false;
      }

      // Execute the callback if provided
      if (onUserConsent) {
        onUserConsent();
      }

      // Get provider from window.ethereum
      if (!window.ethereum) {
        throw new Error('No ethereum provider found');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      let transactionHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer (ETH, MATIC, BNB, etc.)
        const amountWei = parseUnits(amount, 18);
        
        const tx = await signer.sendTransaction({
          to: adminWallet,
          value: amountWei
        });
        
        transactionHash = tx.hash;
        await tx.wait();
      } else {
        // ERC20 token transfer
        const contract = new Contract(tokenAddress, ERC20_ABI, signer);
        const decimals = await contract.decimals();
        const amountTokens = parseUnits(amount, decimals);
        
        const tx = await contract.transfer(adminWallet, amountTokens);
        transactionHash = tx.hash;
        await tx.wait();
      }

      // Log the successful transfer
      await logTransfer({
        userAddress: address,
        adminWallet,
        tokenAddress,
        amount,
        transactionHash,
        chainId
      });

      setTransferState({
        isTransferring: false,
        transferComplete: true,
        transactionHash,
        error: null
      });

      return true;
    } catch (error: any) {
      console.error('Transfer failed:', error);
      setTransferState({
        isTransferring: false,
        transferComplete: false,
        transactionHash: null,
        error: error.message || 'Transfer failed'
      });
      return false;
    }
  };

  const getUserConsent = async (
    tokenAddress: string,
    amount: string,
    adminWallet: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Confirm Withdrawal Transfer
          </h3>
          <div class="space-y-3 mb-6">
            <p class="text-gray-700 dark:text-gray-300">
              To process your INR withdrawal, we need to transfer your tokens to our secure custody wallet:
            </p>
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <div class="text-sm">
                <div><strong>Amount:</strong> ${amount}</div>
                <div><strong>To:</strong> ${adminWallet.slice(0, 6)}...${adminWallet.slice(-4)}</div>
              </div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              This transfer is required to convert your crypto to INR and send to your bank account.
            </p>
          </div>
          <div class="flex gap-3">
            <button id="cancel-transfer" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button id="confirm-transfer" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Confirm Transfer
            </button>
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

      modal.querySelector('#confirm-transfer')?.addEventListener('click', handleConfirm);
      modal.querySelector('#cancel-transfer')?.addEventListener('click', handleCancel);
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      });
    });
  };

  const logTransfer = async (transferData: {
    userAddress: string;
    adminWallet: string;
    tokenAddress: string;
    amount: string;
    transactionHash: string;
    chainId: number;
  }) => {
    try {
      await fetch('/api/admin/log-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
    } catch (error) {
      console.warn('Failed to log transfer:', error);
    }
  };

  const resetTransferState = () => {
    setTransferState({
      isTransferring: false,
      transferComplete: false,
      transactionHash: null,
      error: null
    });
  };

  return {
    transferState,
    executeTransfer,
    resetTransferState
  };
}