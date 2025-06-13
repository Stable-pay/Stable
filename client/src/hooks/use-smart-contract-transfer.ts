import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits } from 'viem';

interface TransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'approving' | 'transferring' | 'completed' | 'error';
}

const STABLEPAY_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Update with deployed contract

const CONTRACT_ABI = [
  {
    name: 'transferToAdmin',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'directTransfer',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'getCurrentChainAdmin',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

export function useSmartContractTransfer() {
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const { writeContractAsync } = useWriteContract();

  const transferToAdmin = async (
    tokenAddress: string,
    amount: string,
    decimals: number,
    userAddress: string
  ): Promise<string> => {
    try {
      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'transferring'
      });

      let txHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer
        const amountWei = parseEther(amount);
        
        txHash = await writeContractAsync({
          address: STABLEPAY_CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'transferToAdmin',
          args: [
            '0x0000000000000000000000000000000000000000' as `0x${string}`,
            amountWei
          ],
          value: amountWei
        });
      } else {
        // ERC20 token transfer
        const amountWei = parseUnits(amount, decimals);

        // First check allowance
        setTransferState(prev => ({ ...prev, step: 'approving' }));
        
        // Approve the contract to spend tokens
        const approveHash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [STABLEPAY_CONTRACT_ADDRESS as `0x${string}`, amountWei]
        });

        // Wait for approval to be mined
        await new Promise(resolve => setTimeout(resolve, 3000));

        setTransferState(prev => ({ ...prev, step: 'transferring' }));

        // Execute the transfer
        txHash = await writeContractAsync({
          address: STABLEPAY_CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'transferToAdmin',
          args: [tokenAddress as `0x${string}`, amountWei]
        });
      }

      setTransferState({
        isTransferring: false,
        transactionHash: txHash,
        error: null,
        step: 'completed'
      });

      return txHash;

    } catch (error: any) {
      console.error('Smart contract transfer failed:', error);
      
      const errorMessage = error.message?.includes('User rejected') 
        ? 'Transaction rejected by user'
        : error.message?.includes('insufficient funds')
        ? 'Insufficient funds for transaction'
        : `Transfer failed: ${error.message || 'Unknown error'}`;

      setTransferState({
        isTransferring: false,
        transactionHash: null,
        error: errorMessage,
        step: 'error'
      });

      throw new Error(errorMessage);
    }
  };

  const directTransfer = async (
    tokenAddress: string,
    amount: string,
    recipient: string,
    decimals: number
  ): Promise<string> => {
    try {
      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'transferring'
      });

      let txHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer
        const amountWei = parseEther(amount);
        
        txHash = await writeContractAsync({
          address: STABLEPAY_CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'directTransfer',
          args: [
            '0x0000000000000000000000000000000000000000' as `0x${string}`,
            amountWei,
            recipient as `0x${string}`
          ],
          value: amountWei
        });
      } else {
        // ERC20 token transfer
        const amountWei = parseUnits(amount, decimals);

        // Approve first
        setTransferState(prev => ({ ...prev, step: 'approving' }));
        
        await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [STABLEPAY_CONTRACT_ADDRESS as `0x${string}`, amountWei]
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        setTransferState(prev => ({ ...prev, step: 'transferring' }));

        txHash = await writeContractAsync({
          address: STABLEPAY_CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'directTransfer',
          args: [
            tokenAddress as `0x${string}`,
            amountWei,
            recipient as `0x${string}`
          ]
        });
      }

      setTransferState({
        isTransferring: false,
        transactionHash: txHash,
        error: null,
        step: 'completed'
      });

      return txHash;

    } catch (error: any) {
      console.error('Direct transfer failed:', error);
      
      const errorMessage = error.message?.includes('User rejected')
        ? 'Transaction rejected by user'
        : error.message?.includes('insufficient funds')
        ? 'Insufficient funds for transaction'
        : `Transfer failed: ${error.message || 'Unknown error'}`;

      setTransferState({
        isTransferring: false,
        transactionHash: null,
        error: errorMessage,
        step: 'error'
      });

      throw new Error(errorMessage);
    }
  };

  const resetTransferState = () => {
    setTransferState({
      isTransferring: false,
      transactionHash: null,
      error: null,
      step: 'idle'
    });
  };

  return {
    transferState,
    transferToAdmin,
    directTransfer,
    resetTransferState
  };
}