import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

interface TokenValidationState {
  isValidating: boolean;
  hasApproval: boolean;
  allowanceAmount: string;
  requiredAmount: string;
  error: string | null;
}

interface TokenValidationResult {
  isValid: boolean;
  needsApproval: boolean;
  hasBalance: boolean;
  allowance: string;
  balance: string;
  error?: string;
}

// ERC20 ABI for validation operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

export function useTokenValidation() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  
  const [validationState, setValidationState] = useState<TokenValidationState>({
    isValidating: false,
    hasApproval: false,
    allowanceAmount: '0',
    requiredAmount: '0',
    error: null
  });

  const validateTokenTransfer = useCallback(async (
    tokenAddress: string,
    amount: string,
    spenderAddress: string
  ): Promise<TokenValidationResult> => {
    if (!isConnected || !address || !caipNetwork) {
      return {
        isValid: false,
        needsApproval: false,
        hasBalance: false,
        allowance: '0',
        balance: '0',
        error: 'Wallet not connected'
      };
    }

    setValidationState(prev => ({ 
      ...prev, 
      isValidating: true, 
      error: null,
      requiredAmount: amount
    }));

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      // Handle native token (ETH, MATIC, BNB, etc.)
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        const balance = await provider.getBalance(address);
        const balanceFormatted = formatUnits(balance, 18);
        const amountBigInt = parseUnits(amount, 18);
        
        const hasBalance = balance >= amountBigInt;
        
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          hasApproval: true, // Native tokens don't need approval
          allowanceAmount: 'unlimited'
        }));

        return {
          isValid: hasBalance,
          needsApproval: false,
          hasBalance,
          allowance: 'unlimited',
          balance: balanceFormatted,
        };
      }

      // Handle ERC20 tokens
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      
      // Get token info
      const [balance, allowance, decimals] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.allowance(address, spenderAddress),
        tokenContract.decimals()
      ]);

      const balanceFormatted = formatUnits(balance, decimals);
      const allowanceFormatted = formatUnits(allowance, decimals);
      const amountBigInt = parseUnits(amount, decimals);

      const hasBalance = balance >= amountBigInt;
      const needsApproval = allowance < amountBigInt;
      const isValid = hasBalance && !needsApproval;

      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        hasApproval: !needsApproval,
        allowanceAmount: allowanceFormatted
      }));

      return {
        isValid,
        needsApproval,
        hasBalance,
        allowance: allowanceFormatted,
        balance: balanceFormatted,
      };

    } catch (error) {
      const errorMessage = (error as Error).message;
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        error: errorMessage
      }));

      return {
        isValid: false,
        needsApproval: false,
        hasBalance: false,
        allowance: '0',
        balance: '0',
        error: errorMessage
      };
    }
  }, [isConnected, address, caipNetwork]);

  const approveToken = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!isConnected || !address) {
      setValidationState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      
      const decimals = await tokenContract.decimals();
      const amountBigInt = parseUnits(amount, decimals);
      
      // Approve tokens
      const tx = await tokenContract.approve(spenderAddress, amountBigInt);
      await tx.wait();
      
      setValidationState(prev => ({
        ...prev,
        hasApproval: true,
        allowanceAmount: amount
      }));

      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setValidationState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [isConnected, address]);

  const resetValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      hasApproval: false,
      allowanceAmount: '0',
      requiredAmount: '0',
      error: null
    });
  }, []);

  return {
    validationState,
    validateTokenTransfer,
    approveToken,
    resetValidation
  };
}