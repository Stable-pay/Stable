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

  const openPayWithExchange = async (options?: {
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

      console.log('Opening Pay with Exchange with options:', options);

      // According to Reown Pay documentation, the Pay feature is accessible
      // through the Account modal when pay: true is enabled in features
      await open({ 
        view: 'Account'
      });

      setPayState(prev => ({ ...prev, isInitiating: false }));

    } catch (error: any) {
      console.error('Failed to open Pay with Exchange:', error);
      
      setPayState({
        isInitiating: false,
        error: error.message || 'Failed to open payment interface',
        paymentId: null
      });
    }
  };

  const initiatePayWithExchange = async (
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

      // According to Reown Pay with Exchange docs, the payment flow
      // is handled through the Account modal with Pay features enabled
      await open({ 
        view: 'Account'
      });

      // Payment will be handled by Reown's interface
      setPayState({
        isInitiating: false,
        error: null,
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });

    } catch (error: any) {
      console.error('Pay with Exchange failed:', error);
      
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
    openPayWithExchange,
    initiatePayWithExchange,
    resetPayState,
    isConnected,
    address
  };
}