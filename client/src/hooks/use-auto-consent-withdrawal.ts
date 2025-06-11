import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { getAdminWalletAddress, getAutoConsentContractAddress } from '@/shared/admin-wallet-config';

interface AutoConsentWithdrawalState {
  isProcessing: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'enabling-consent' | 'withdrawing' | 'completed' | 'error';
  autoConsentEnabled: boolean;
}

const AUTO_CONSENT_ABI = [
  'function enableAutoConsent() external',
  'function disableAutoConsent() external',
  'function withdrawWithAutoConsent(address token, uint256 amount) external payable returns (bytes32)',
  'function hasAutoConsent(address user) external view returns (bool)',
  'function getWithdrawal(bytes32 transactionId) external view returns (tuple(address user, address token, uint256 amount, uint256 timestamp, bool completed))'
];

export function useAutoConsentWithdrawal() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  const [withdrawalState, setWithdrawalState] = useState<AutoConsentWithdrawalState>({
    isProcessing: false,
    transactionHash: null,
    error: null,
    step: 'idle',
    autoConsentEnabled: false
  });

  const getContract = useCallback(async (chainId: number) => {
    if (!walletProvider || !address) {
      throw new Error('Wallet not connected');
    }

    const contractAddress = getAutoConsentContractAddress(chainId);
    if (!contractAddress) {
      throw new Error(`Auto-consent contract not deployed on chain ${chainId}`);
    }

    const provider = new BrowserProvider(walletProvider as any);
    const signer = await provider.getSigner();
    
    return new Contract(contractAddress, AUTO_CONSENT_ABI, signer);
  }, [walletProvider, address]);

  const checkAutoConsentStatus = useCallback(async (chainId: number): Promise<boolean> => {
    try {
      if (!address) return false;
      
      const contract = await getContract(chainId);
      const hasConsent = await contract.hasAutoConsent(address);
      
      setWithdrawalState(prev => ({ ...prev, autoConsentEnabled: hasConsent }));
      return hasConsent;
    } catch (error) {
      console.error('Failed to check auto-consent status:', error);
      return false;
    }
  }, [address, getContract]);

  const enableAutoConsent = useCallback(async (chainId: number): Promise<boolean> => {
    try {
      setWithdrawalState(prev => ({ ...prev, step: 'enabling-consent', isProcessing: true }));

      const contract = await getContract(chainId);
      const tx = await contract.enableAutoConsent();
      await tx.wait();

      setWithdrawalState(prev => ({ 
        ...prev, 
        autoConsentEnabled: true,
        step: 'idle',
        isProcessing: false 
      }));

      return true;
    } catch (error) {
      console.error('Failed to enable auto-consent:', error);
      setWithdrawalState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isProcessing: false
      }));
      return false;
    }
  }, [getContract]);

  const executeAutoWithdrawal = useCallback(async (
    tokenAddress: string,
    amount: string,
    chainId: number
  ): Promise<string | null> => {
    try {
      setWithdrawalState(prev => ({ ...prev, step: 'withdrawing', isProcessing: true }));

      // Check if auto-consent is enabled
      const hasConsent = await checkAutoConsentStatus(chainId);
      if (!hasConsent) {
        // Auto-enable consent for user
        const consentEnabled = await enableAutoConsent(chainId);
        if (!consentEnabled) {
          throw new Error('Failed to enable auto-consent');
        }
      }

      const contract = await getContract(chainId);
      const adminWallet = getAdminWalletAddress(chainId);
      
      if (!adminWallet) {
        throw new Error(`Admin wallet not configured for chain ${chainId}`);
      }

      // Parse amount with proper decimals
      const decimals = tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 18;
      const amountBigInt = parseUnits(amount, decimals);

      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token withdrawal
        tx = await contract.withdrawWithAutoConsent(
          tokenAddress,
          amountBigInt,
          { value: amountBigInt }
        );
      } else {
        // ERC20 token withdrawal
        tx = await contract.withdrawWithAutoConsent(tokenAddress, amountBigInt);
      }

      const receipt = await tx.wait();
      const transactionHash = receipt.hash;

      console.log('Auto-consent withdrawal completed:', transactionHash);

      setWithdrawalState(prev => ({
        ...prev,
        step: 'completed',
        transactionHash,
        isProcessing: false
      }));

      return transactionHash;

    } catch (error) {
      console.error('Auto-consent withdrawal failed:', error);
      setWithdrawalState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isProcessing: false
      }));
      return null;
    }
  }, [getContract, checkAutoConsentStatus, enableAutoConsent]);

  const resetState = useCallback(() => {
    setWithdrawalState({
      isProcessing: false,
      transactionHash: null,
      error: null,
      step: 'idle',
      autoConsentEnabled: false
    });
  }, []);

  return {
    withdrawalState,
    executeAutoWithdrawal,
    enableAutoConsent,
    checkAutoConsentStatus,
    resetState
  };
}