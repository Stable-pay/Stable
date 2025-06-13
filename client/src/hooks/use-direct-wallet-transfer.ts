import { useState } from 'react';
import { useWriteContract, useSendTransaction } from 'wagmi';
import { parseEther, parseUnits, getAddress } from 'viem';

interface TransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'checking-allowance' | 'requesting-approval' | 'approving' | 'transferring' | 'completed' | 'error';
  needsApproval: boolean;
  approvalHash: string | null;
}

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
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
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

export function useDirectWalletTransfer() {
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle',
    needsApproval: false,
    approvalHash: null
  });

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const transferToAddress = async (
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
        step: 'transferring',
        needsApproval: false,
        approvalHash: null
      });

      let txHash: string;

      // Validate and checksum addresses
      const validatedRecipient = getAddress(recipient);
      const validatedTokenAddress = tokenAddress === '0x0000000000000000000000000000000000000000' 
        ? tokenAddress 
        : getAddress(tokenAddress);

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer (ETH, BNB, MATIC, etc.)
        const amountWei = parseEther(amount);
        
        txHash = await sendTransactionAsync({
          to: validatedRecipient as `0x${string}`,
          value: amountWei,
        });
      } else {
        // ERC20 token transfer
        const amountWei = parseUnits(amount, decimals);
        
        txHash = await writeContractAsync({
          address: validatedTokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [validatedRecipient as `0x${string}`, amountWei]
        });
      }

      setTransferState(prev => ({
        ...prev,
        isTransferring: false,
        transactionHash: txHash,
        step: 'completed'
      }));

      return txHash;

    } catch (error: any) {
      console.error('Direct wallet transfer failed:', error);
      
      let errorMessage = 'Transfer failed';
      
      if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('Insufficient')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Please switch to the correct network in your wallet';
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Transaction failed due to gas estimation error';
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setTransferState(prev => ({
        ...prev,
        isTransferring: false,
        error: errorMessage,
        step: 'error'
      }));

      throw new Error(errorMessage);
    }
  };

  const resetTransferState = () => {
    setTransferState({
      isTransferring: false,
      transactionHash: null,
      error: null,
      step: 'idle',
      needsApproval: false,
      approvalHash: null
    });
  };

  return {
    transferState,
    transferToAddress,
    resetTransferState
  };
}