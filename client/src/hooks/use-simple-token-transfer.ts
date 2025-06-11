import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

interface SimpleTransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'transferring' | 'completed' | 'error';
}

// ERC20 ABI for transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Admin wallet fallbacks
const ADMIN_WALLETS: Record<number, string> = {
  1: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Ethereum
  137: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Polygon  
  56: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // BSC
  42161: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Arbitrum
  10: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Optimism
  8453: '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e', // Base
};

export function useSimpleTokenTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();

  const [transferState, setTransferState] = useState<SimpleTransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const executeTransfer = useCallback(async (
    tokenAddress: string,
    amount: string,
    onUserConsent?: () => void
  ): Promise<string | null> => {
    if (!isConnected || !address || !caipNetwork) {
      setTransferState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return null;
    }

    const chainId = parseInt(caipNetwork.id?.toString() || '1');
    const adminWallet = ADMIN_WALLETS[chainId];
    
    if (!adminWallet) {
      setTransferState(prev => ({ 
        ...prev, 
        error: `Chain ${chainId} not supported` 
      }));
      return null;
    }

    try {
      setTransferState(prev => ({ 
        ...prev, 
        step: 'transferring', 
        error: null,
        isTransferring: true 
      }));

      console.log('Starting token transfer:', { tokenAddress, amount, adminWallet, chainId });

      // Validate sufficient balance before proceeding
      const web3Provider = new BrowserProvider((window as any).ethereum);
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        const balance = await web3Provider.getBalance(address);
        const requiredAmount = parseUnits(amount, 18);
        if (balance < requiredAmount) {
          throw new Error(`Insufficient balance. Available: ${formatUnits(balance, 18)} ETH, Required: ${amount} ETH`);
        }
      } else {
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, web3Provider);
        const [balance, decimals] = await Promise.all([
          tokenContract.balanceOf(address),
          tokenContract.decimals()
        ]);
        const requiredAmount = parseUnits(amount, decimals);
        if (balance < requiredAmount) {
          const symbol = await tokenContract.symbol();
          throw new Error(`Insufficient balance. Available: ${formatUnits(balance, decimals)} ${symbol}, Required: ${amount} ${symbol}`);
        }
      }

      // Show user consent
      console.log('Showing user consent modal');
      const userConfirmed = await showUserConsentModal(tokenAddress, amount, adminWallet, chainId);
      console.log('User consent result:', userConfirmed);
      if (!userConfirmed) {
        console.log('User cancelled transfer');
        setTransferState(prev => ({ ...prev, step: 'idle', isTransferring: false }));
        return null;
      }

      if (onUserConsent) {
        onUserConsent();
      }

      const signer = await web3Provider.getSigner();

      let txHash: string;

      // Handle native token transfer (ETH, MATIC, BNB, etc.)
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Transferring native token:', { amount, adminWallet });
        
        try {
          const tx = await signer.sendTransaction({
            to: adminWallet,
            value: parseUnits(amount, 18),
            gasLimit: 21000 // Standard gas limit for ETH transfer
          });
          
          console.log('Native token transaction sent:', tx.hash);
          const receipt = await tx.wait();
          console.log('Native token transaction confirmed:', receipt);
          txHash = receipt?.hash || tx.hash;
        } catch (nativeError) {
          console.error('Native token transfer failed:', nativeError);
          throw new Error(`Native token transfer failed: ${(nativeError as Error).message}`);
        }
      } else {
        // Handle ERC20 token transfer
        console.log('Transferring ERC20 token:', { tokenAddress, amount, adminWallet });
        
        try {
          const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
          const decimals = await tokenContract.decimals();
          const amountBigInt = parseUnits(amount, decimals);
          
          console.log('ERC20 transfer details:', { decimals, amountBigInt: amountBigInt.toString() });

          const tx = await tokenContract.transfer(adminWallet, amountBigInt);
          console.log('ERC20 token transaction sent:', tx.hash);
          
          const receipt = await tx.wait();
          console.log('ERC20 token transaction confirmed:', receipt);
          txHash = receipt.hash;
        } catch (erc20Error) {
          console.error('ERC20 token transfer failed:', erc20Error);
          throw new Error(`ERC20 token transfer failed: ${(erc20Error as Error).message}`);
        }
      }

      console.log('Transfer completed with hash:', txHash);
      
      setTransferState(prev => ({
        ...prev,
        step: 'completed',
        transactionHash: txHash,
        isTransferring: false
      }));

      return txHash;

    } catch (error) {
      console.error('Transfer failed with details:', {
        error: error,
        message: (error as Error).message,
        stack: (error as Error).stack,
        tokenAddress,
        amount,
        adminWallet,
        chainId,
        address
      });
      const errorMessage = (error as Error).message;
      setTransferState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage,
        isTransferring: false
      }));
      return null;
    }
  }, [isConnected, address, caipNetwork]);

  const showUserConsentModal = (
    tokenAddress: string,
    amount: string,
    adminWallet: string,
    chainId: number
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Token Transfer</h3>
          <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div class="flex justify-between">
              <span>Token:</span>
              <span class="font-medium">${getTokenSymbol(tokenAddress, chainId)}</span>
            </div>
            <div class="flex justify-between">
              <span>Amount:</span>
              <span class="font-medium">${amount}</span>
            </div>
            <div class="flex justify-between">
              <span>To Wallet:</span>
              <span class="font-medium text-xs">${adminWallet.slice(0, 6)}...${adminWallet.slice(-4)}</span>
            </div>
            <div class="flex justify-between">
              <span>Network:</span>
              <span class="font-medium">${getChainName(chainId)}</span>
            </div>
          </div>
          <div class="mt-6 space-y-3">
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ This will transfer your tokens to our custody wallet. The transaction cannot be reversed.
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

  const getTokenSymbol = (tokenAddress: string, chainId: number): string => {
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      const symbols: Record<number, string> = {
        1: 'ETH',
        137: 'MATIC',
        56: 'BNB',
        42161: 'ETH',
        10: 'ETH',
        8453: 'ETH'
      };
      return symbols[chainId] || 'ETH';
    }
    return 'Token';
  };

  const getChainName = (chainId: number): string => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
    };
    return chains[chainId] || 'Unknown';
  };

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
    executeTransfer,
    resetTransferState
  };
}