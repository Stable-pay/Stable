import { useState } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

interface SendState {
  isSending: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'preparing' | 'sending' | 'completed' | 'error';
}

interface SendParams {
  tokenAddress: string;
  amount: string;
  recipient: string;
  chainId: number;
}

export function useReownSend() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  
  const [sendState, setSendState] = useState<SendState>({
    isSending: false,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const openSendModal = async (params: SendParams) => {
    try {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      setSendState({
        isSending: true,
        transactionHash: null,
        error: null,
        step: 'preparing'
      });

      // Open Reown AppKit with Send functionality
      await open({ 
        view: 'Connect'
      });

      setSendState(prev => ({
        ...prev,
        step: 'sending'
      }));

    } catch (error: any) {
      console.error('Failed to open Send modal:', error);
      setSendState({
        isSending: false,
        transactionHash: null,
        error: error.message || 'Failed to initiate send',
        step: 'error'
      });
    }
  };

  const quickSend = async (params: SendParams) => {
    try {
      if (!isConnected || !address) {
        throw new Error('Please connect your wallet first');
      }

      setSendState({
        isSending: true,
        transactionHash: null,
        error: null,
        step: 'preparing'
      });

      // Open AppKit Account view for transaction management
      await open({ view: 'Account' });

      setSendState(prev => ({
        ...prev,
        step: 'sending'
      }));

    } catch (error: any) {
      console.error('Quick send failed:', error);
      setSendState({
        isSending: false,
        transactionHash: null,
        error: error.message || 'Quick send failed',
        step: 'error'
      });
    }
  };

  const openSendView = async (recipient?: string, amount?: string, token?: string) => {
    try {
      setSendState({
        isSending: true,
        transactionHash: null,
        error: null,
        step: 'preparing'
      });

      // Open the Account view in AppKit for transaction management
      await open({ view: 'Account' });

      setSendState(prev => ({
        ...prev,
        step: 'sending'
      }));

    } catch (error: any) {
      console.error('Failed to open send view:', error);
      setSendState({
        isSending: false,
        transactionHash: null,
        error: error.message || 'Failed to open send view',
        step: 'error'
      });
    }
  };

  const resetSendState = () => {
    setSendState({
      isSending: false,
      transactionHash: null,
      error: null,
      step: 'idle'
    });
  };

  // Generate ERC20 transfer transaction data
  const generateERC20TransferData = (to: string, amount: string): string => {
    // ERC20 transfer function signature: transfer(address,uint256)
    const functionSelector = '0xa9059cbb';
    const addressParam = to.slice(2).padStart(64, '0');
    const amountParam = parseInt(amount).toString(16).padStart(64, '0');
    return functionSelector + addressParam + amountParam;
  };

  return {
    sendState,
    openSendModal,
    quickSend,
    openSendView,
    resetSendState,
    isConnected,
    address,
    chainId: caipNetwork?.id
  };
}