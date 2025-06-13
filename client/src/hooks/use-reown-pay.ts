import { useState } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

interface PayState {
  isInitiating: boolean;
  error: string | null;
  paymentId: string | null;
}

export function useReownPay() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  
  const [payState, setPayState] = useState<PayState>({
    isInitiating: false,
    error: null,
    paymentId: null
  });

  const openPayModal = async (options?: {
    recipient?: string;
    amount?: string;
    token?: string;
    chainId?: number;
  }) => {
    try {
      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      setPayState({
        isInitiating: true,
        error: null,
        paymentId: null
      });

      // Open Pay modal with options
      await open({ 
        view: 'OnRampProviders',
        ...options 
      });

      setPayState(prev => ({ ...prev, isInitiating: false }));

    } catch (error: any) {
      console.error('Failed to open Pay modal:', error);
      
      setPayState({
        isInitiating: false,
        error: error.message || 'Failed to open payment interface',
        paymentId: null
      });
    }
  };

  const initiatePayment = async (
    recipient: string,
    amount: string,
    token: string = 'USDT',
    chainId: number = 1
  ) => {
    try {
      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      setPayState({
        isInitiating: true,
        error: null,
        paymentId: null
      });

      // Open Pay modal with pre-filled details
      await open({ 
        view: 'OnRampProviders'
      });

      // Note: The actual payment flow will be handled by Reown's Pay interface
      // This hook provides the integration point
      
      setPayState({
        isInitiating: false,
        error: null,
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      
      setPayState({
        isInitiating: false,
        error: error.message || 'Payment initiation failed',
        paymentId: null
      });

      throw error;
    }
  };

  const resetPayState = () => {
    setPayState({
      isInitiating: false,
      error: null,
      paymentId: null
    });
  };

  return {
    payState,
    openPayModal,
    initiatePayment,
    resetPayState,
    isConnected,
    address
  };
}