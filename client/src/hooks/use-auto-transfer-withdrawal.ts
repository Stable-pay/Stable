import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { getDeveloperWallet, isTokenSupportedByBinance } from '@/../../shared/binance-supported-tokens';

interface AutoTransferWithdrawalState {
  isProcessing: boolean;
  currentStep: 'idle' | 'transferring' | 'converting' | 'completing' | 'complete' | 'error';
  error: string | null;
  transactionHash: string | null;
  inrAmount: string | null;
}

interface TokenTransferData {
  symbol: string;
  address: string;
  chainId: number;
  amount: string;
  decimals: number;
}

interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
}

export function useAutoTransferWithdrawal() {
  const { address, isConnected } = useAppKitAccount();
  
  const [withdrawalState, setWithdrawalState] = useState<AutoTransferWithdrawalState>({
    isProcessing: false,
    currentStep: 'idle',
    error: null,
    transactionHash: null,
    inrAmount: null
  });

  const executeAutoTransferWithdrawal = async (
    tokenData: TokenTransferData,
    bankDetails: BankDetails,
    expectedInrAmount: string
  ): Promise<boolean> => {
    if (!address || !isConnected) {
      setWithdrawalState(prev => ({ 
        ...prev, 
        error: 'Wallet not connected',
        currentStep: 'error'
      }));
      return false;
    }

    try {
      setWithdrawalState({
        isProcessing: true,
        currentStep: 'transferring',
        error: null,
        transactionHash: null,
        inrAmount: null
      });

      // Validate token support
      if (!isTokenSupportedByBinance(tokenData.symbol, tokenData.chainId)) {
        throw new Error(`${tokenData.symbol} is not supported for INR conversion`);
      }

      // Get developer wallet for this chain
      const developerWallet = getDeveloperWallet(tokenData.chainId);
      if (!developerWallet) {
        throw new Error(`No developer wallet configured for chain ${tokenData.chainId}`);
      }

      // Simulate token transfer (in real implementation, this would use wallet provider)
      const transferHash = `TRANSFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setWithdrawalState(prev => ({ 
        ...prev, 
        currentStep: 'converting',
        transactionHash: transferHash
      }));

      // Initiate INR bank transfer
      const withdrawalResponse = await fetch('/api/withdrawal/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          tokenSymbol: tokenData.symbol,
          tokenAmount: tokenData.amount,
          chainId: tokenData.chainId,
          transferHash: transferHash,
          inrAmount: expectedInrAmount,
          bankDetails: {
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            accountHolderName: bankDetails.accountHolderName,
            bankName: bankDetails.bankName
          }
        })
      });

      if (!withdrawalResponse.ok) {
        const errorData = await withdrawalResponse.json();
        throw new Error(errorData.error || 'Failed to initiate INR withdrawal');
      }

      const withdrawalResult = await withdrawalResponse.json();

      setWithdrawalState({
        isProcessing: false,
        currentStep: 'complete',
        error: null,
        transactionHash: transferHash,
        inrAmount: expectedInrAmount
      });

      return true;

    } catch (error: any) {
      console.error('Auto transfer withdrawal failed:', error);
      setWithdrawalState({
        isProcessing: false,
        currentStep: 'error',
        error: error.message || 'Auto transfer withdrawal failed',
        transactionHash: null,
        inrAmount: null
      });
      return false;
    }
  };

  const resetWithdrawal = () => {
    setWithdrawalState({
      isProcessing: false,
      currentStep: 'idle',
      error: null,
      transactionHash: null,
      inrAmount: null
    });
  };

  return {
    withdrawalState,
    executeAutoTransferWithdrawal,
    resetWithdrawal
  };
}