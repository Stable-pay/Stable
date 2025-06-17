import { useState } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { getDeveloperWallet, isTokenSupportedByBinance } from '@/../../shared/binance-supported-tokens';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

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
  const { walletProvider } = useAppKitProvider();
  
  const [withdrawalState, setWithdrawalState] = useState<AutoTransferWithdrawalState>({
    isProcessing: false,
    currentStep: 'idle',
    error: null,
    transactionHash: null,
    inrAmount: null
  });

  const ERC20_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  const executeAutoTransferWithdrawal = async (
    tokenData: TokenTransferData,
    bankDetails: BankDetails,
    expectedInrAmount: string
  ): Promise<boolean> => {
    if (!address || !isConnected || !walletProvider) {
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

      // Create provider and contract
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      let transferHash: string;

      if (tokenData.address === "0x0000000000000000000000000000000000000000") {
        // Native token transfer (ETH, BNB, MATIC, AVAX)
        const amountInWei = parseUnits(tokenData.amount, 18);
        const tx = await signer.sendTransaction({
          to: developerWallet,
          value: amountInWei
        });
        transferHash = tx.hash;
        await tx.wait();
      } else {
        // ERC-20 token transfer
        const contract = new Contract(tokenData.address, ERC20_ABI, signer);
        const amountInUnits = parseUnits(tokenData.amount, tokenData.decimals);
        
        const tx = await contract.transfer(developerWallet, amountInUnits);
        transferHash = tx.hash;
        await tx.wait();
      }

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