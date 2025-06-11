import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

interface WithdrawalState {
  isProcessing: boolean;
  step: 'idle' | 'consent' | 'requesting' | 'processing' | 'completed' | 'error';
  transactionHash: string | null;
  requestId: string | null;
  error: string | null;
}

const STABLEPAY_CONTRACT_ABI = [
  "function grantConsent(address token, uint256 amount) external",
  "function revokeConsent() external",
  "function hasValidConsent(address user, address token, uint256 amount) external view returns (bool)",
  "function executeDirectTransfer(address token, uint256 amount, string calldata kycId, string calldata bankAccount) external payable returns (bytes32)",
  "function requestWithdrawal(address token, uint256 amount, string calldata kycId, string calldata bankAccount) external returns (bytes32)",
  "function getWithdrawalRequest(bytes32 transactionId) external view returns (tuple(address user, address token, uint256 amount, string kycId, string bankAccount, bool processed, uint256 timestamp, bytes32 transactionId))",
  "function getUserConsent(address user) external view returns (tuple(address user, address token, uint256 amount, uint256 timestamp, bool granted))",
  "event ConsentGranted(address indexed user, address indexed token, uint256 amount)",
  "event WithdrawalRequested(bytes32 indexed transactionId, address indexed user, address indexed token, uint256 amount, string kycId, string bankAccount)",
  "event WithdrawalProcessed(bytes32 indexed transactionId, address indexed user, uint256 amountTransferred, uint256 feeDeducted)"
];

// Contract addresses for each chain
const CONTRACT_ADDRESSES: Record<number, string> = {
  1: '0x0000000000000000000000000000000000000000', // Ethereum - to be deployed
  137: '0x0000000000000000000000000000000000000000', // Polygon - to be deployed
  56: '0x0000000000000000000000000000000000000000', // BSC - to be deployed
  42161: '0x0000000000000000000000000000000000000000', // Arbitrum - to be deployed
  10: '0x0000000000000000000000000000000000000000', // Optimism - to be deployed
  43114: '0x0000000000000000000000000000000000000000', // Avalanche - to be deployed
  1337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Local hardhat - deployed contract address
};

export function useSmartContractWithdrawal() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();

  const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>({
    isProcessing: false,
    step: 'idle',
    transactionHash: null,
    requestId: null,
    error: null
  });

  const getContract = useCallback(async () => {
    if (!isConnected || !address || !caipNetwork) {
      throw new Error('Wallet not connected');
    }

    const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Smart contract not deployed on chain ${chainId}`);
    }

    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    
    return new Contract(contractAddress, STABLEPAY_CONTRACT_ABI, signer);
  }, [isConnected, address, caipNetwork]);

  const grantConsent = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    try {
      setWithdrawalState(prev => ({ ...prev, step: 'consent', isProcessing: true }));

      const contract = await getContract();
      const decimals = tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 18; // Assume 18 for simplicity
      const amountBigInt = parseUnits(amount, decimals);

      console.log('Granting consent for withdrawal:', { tokenAddress, amount, amountBigInt: amountBigInt.toString() });

      const tx = await contract.grantConsent(tokenAddress, amountBigInt);
      await tx.wait();

      console.log('Consent granted successfully');
      return true;

    } catch (error) {
      console.error('Failed to grant consent:', error);
      setWithdrawalState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isProcessing: false
      }));
      return false;
    }
  }, [getContract]);

  const checkConsent = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    try {
      const contract = await getContract();
      const decimals = tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 18;
      const amountBigInt = parseUnits(amount, decimals);

      return await contract.hasValidConsent(address, tokenAddress, amountBigInt);
    } catch (error) {
      console.error('Failed to check consent:', error);
      return false;
    }
  }, [getContract, address]);

  const executeDirectWithdrawal = useCallback(async (
    tokenAddress: string,
    amount: string,
    kycId: string,
    bankAccount: string
  ): Promise<string | null> => {
    try {
      setWithdrawalState(prev => ({ ...prev, step: 'processing', isProcessing: true }));

      const contract = await getContract();
      const decimals = tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 18;
      const amountBigInt = parseUnits(amount, decimals);

      console.log('Executing direct withdrawal:', { tokenAddress, amount, kycId, bankAccount });

      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer - send ETH value
        tx = await contract.executeDirectTransfer(
          tokenAddress,
          amountBigInt,
          kycId,
          bankAccount,
          { value: amountBigInt }
        );
      } else {
        // ERC20 token transfer - no ETH value needed
        tx = await contract.executeDirectTransfer(
          tokenAddress,
          amountBigInt,
          kycId,
          bankAccount
        );
      }

      const receipt = await tx.wait();
      const transactionHash = receipt.hash;

      console.log('Direct withdrawal completed:', transactionHash);

      setWithdrawalState(prev => ({
        ...prev,
        step: 'completed',
        transactionHash,
        isProcessing: false
      }));

      return transactionHash;

    } catch (error) {
      console.error('Direct withdrawal failed:', error);
      setWithdrawalState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isProcessing: false
      }));
      return null;
    }
  }, [getContract]);

  const requestWithdrawal = useCallback(async (
    tokenAddress: string,
    amount: string,
    kycId: string,
    bankAccount: string
  ): Promise<string | null> => {
    try {
      setWithdrawalState(prev => ({ ...prev, step: 'requesting', isProcessing: true }));

      const contract = await getContract();
      const decimals = tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 18;
      const amountBigInt = parseUnits(amount, decimals);

      console.log('Requesting withdrawal:', { tokenAddress, amount, kycId, bankAccount });

      const tx = await contract.requestWithdrawal(
        tokenAddress,
        amountBigInt,
        kycId,
        bankAccount
      );

      const receipt = await tx.wait();
      
      // Extract request ID from events
      const withdrawalRequestedTopic = '0x' + contract.interface.getEvent('WithdrawalRequested').topicHash.slice(2);
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === withdrawalRequestedTopic
      );
      
      const requestId = event ? event.topics[1] : null;

      console.log('Withdrawal requested:', { transactionHash: receipt.hash, requestId });

      setWithdrawalState(prev => ({
        ...prev,
        step: 'completed',
        transactionHash: receipt.hash,
        requestId,
        isProcessing: false
      }));

      return receipt.hash;

    } catch (error) {
      console.error('Withdrawal request failed:', error);
      setWithdrawalState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isProcessing: false
      }));
      return null;
    }
  }, [getContract]);

  const initiateWithdrawal = useCallback(async (
    tokenAddress: string,
    amount: string,
    kycId: string,
    bankAccount: string,
    useDirectTransfer: boolean = true
  ): Promise<string | null> => {
    try {
      // First, grant consent
      const consentGranted = await grantConsent(tokenAddress, amount);
      if (!consentGranted) {
        throw new Error('Failed to grant consent');
      }

      // Then execute withdrawal
      if (useDirectTransfer) {
        return await executeDirectWithdrawal(tokenAddress, amount, kycId, bankAccount);
      } else {
        return await requestWithdrawal(tokenAddress, amount, kycId, bankAccount);
      }

    } catch (error) {
      console.error('Withdrawal initiation failed:', error);
      setWithdrawalState(prev => ({
        ...prev,
        step: 'error',
        error: (error as Error).message,
        isProcessing: false
      }));
      return null;
    }
  }, [grantConsent, executeDirectWithdrawal, requestWithdrawal]);

  const resetState = useCallback(() => {
    setWithdrawalState({
      isProcessing: false,
      step: 'idle',
      transactionHash: null,
      requestId: null,
      error: null
    });
  }, []);

  const revokeConsent = useCallback(async (): Promise<boolean> => {
    try {
      const contract = await getContract();
      const tx = await contract.revokeConsent();
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to revoke consent:', error);
      return false;
    }
  }, [getContract]);

  return {
    withdrawalState,
    initiateWithdrawal,
    grantConsent,
    checkConsent,
    revokeConsent,
    executeDirectWithdrawal,
    requestWithdrawal,
    resetState,
    isContractAvailable: () => {
      if (!caipNetwork) return false;
      const chainId = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
      const contractAddress = CONTRACT_ADDRESSES[chainId];
      return contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000';
    }
  };
}