import { useState } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useSendTransaction, useWriteContract } from 'wagmi';
import { parseEther, parseUnits, getAddress } from 'viem';

interface TransferState {
  isTransferring: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'preparing' | 'confirming' | 'completed' | 'error';
}

export function useReownTransfer() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const openAccountModal = async () => {
    try {
      await open({ view: 'Account' });
    } catch (error) {
      console.error('Failed to open account modal:', error);
    }
  };

  const transferToAdmin = async (
    tokenAddress: string,
    amount: string,
    adminWallet: string,
    decimals: number
  ): Promise<string> => {
    try {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      setTransferState({
        isTransferring: true,
        transactionHash: null,
        error: null,
        step: 'preparing'
      });

      // Validate addresses using viem's getAddress
      const validatedAdmin = getAddress(adminWallet);
      const validatedToken = tokenAddress === '0x0000000000000000000000000000000000000000' 
        ? tokenAddress 
        : getAddress(tokenAddress);

      setTransferState(prev => ({ ...prev, step: 'confirming' }));

      let txHash: string;

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer using Reown/Wagmi
        const amountWei = parseEther(amount);
        
        txHash = await sendTransactionAsync({
          to: validatedAdmin as `0x${string}`,
          value: amountWei,
        });
      } else {
        // ERC20 token transfer using Reown/Wagmi
        const amountWei = parseUnits(amount, decimals);
        
        txHash = await writeContractAsync({
          address: validatedToken as `0x${string}`,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'transfer',
          args: [validatedAdmin as `0x${string}`, amountWei]
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
      console.error('Reown transfer failed:', error);
      
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

      setTransferState({
        isTransferring: false,
        transactionHash: null,
        error: errorMessage,
        step: 'error'
      });

      throw new Error(errorMessage);
    }
  };

  const openWalletModal = async () => {
    try {
      if (!isConnected) {
        await open({ view: 'Connect' });
      } else {
        await open({ view: 'Account' });
      }
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
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
    openAccountModal,
    openWalletModal,
    resetTransferState,
    isConnected,
    address,
    chainId: caipNetwork?.id
  };
}