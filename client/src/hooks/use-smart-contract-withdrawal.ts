import { useState } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

export interface SmartContractWithdrawalState {
  isInitiating: boolean;
  isCompleting: boolean;
  withdrawalId: number | null;
  transactionHash: string | null;
  error: string | null;
  step: 'idle' | 'initiating' | 'awaiting_completion' | 'completed' | 'error';
}

// Smart contract addresses for each chain (to be deployed)
const CONTRACT_ADDRESSES: Record<number, string> = {
  1: '', // Ethereum - Deploy contract here
  137: '', // Polygon - Deploy contract here
  56: '', // BSC - Deploy contract here
  42161: '', // Arbitrum - Deploy contract here
  10: '', // Optimism - Deploy contract here
  8453: '', // Base - Deploy contract here
};

// Smart contract ABI
const WITHDRAWAL_CONTRACT_ABI = [
  "function initiateWithdrawal(address token, uint256 amount, string calldata inrAmount, string calldata bankAccount) external payable returns (uint256)",
  "function completeWithdrawal(uint256 withdrawalId) external",
  "function cancelWithdrawal(uint256 withdrawalId, string calldata reason) external",
  "function getWithdrawalRequest(uint256 withdrawalId) external view returns (tuple(address user, address token, uint256 amount, string inrAmount, string bankAccount, uint256 timestamp, bool completed, bool cancelled, address adminWallet))",
  "function calculateFees(uint256 amount) external view returns (uint256 fee, uint256 netAmount)",
  "function getUserWithdrawals(address user) external view returns (uint256[])",
  "function serviceFeePercentage() external view returns (uint256)",
  "function minimumTransferAmount() external view returns (uint256)",
  "event WithdrawalInitiated(address indexed user, address indexed token, uint256 amount, uint256 indexed withdrawalId, string inrAmount, string bankAccount)",
  "event WithdrawalCompleted(address indexed user, address indexed token, uint256 amount, uint256 indexed withdrawalId, address adminWallet)"
];

export function useSmartContractWithdrawal() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  
  const [withdrawalState, setWithdrawalState] = useState<SmartContractWithdrawalState>({
    isInitiating: false,
    isCompleting: false,
    withdrawalId: null,
    transactionHash: null,
    error: null,
    step: 'idle'
  });

  const getContract = async () => {
    if (!address || !isConnected || !caipNetwork?.id) {
      throw new Error('Wallet not connected');
    }

    const chainId = parseInt(caipNetwork.id.toString());
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    
    if (!contractAddress) {
      throw new Error(`Smart contract not deployed on chain ${chainId}`);
    }

    if (!window.ethereum) {
      throw new Error('No ethereum provider found');
    }

    const provider = new BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    
    return new Contract(contractAddress, WITHDRAWAL_CONTRACT_ABI, signer);
  };

  const initiateWithdrawal = async (
    tokenAddress: string,
    amount: string,
    inrAmount: string,
    bankAccount: string
  ): Promise<number | null> => {
    try {
      setWithdrawalState(prev => ({
        ...prev,
        isInitiating: true,
        step: 'initiating',
        error: null
      }));

      const contract = await getContract();
      
      // Calculate fees first
      const amountWei = parseUnits(amount, tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 18);
      const [fee, netAmount] = await contract.calculateFees(amountWei);
      
      // Show user consent modal with fee information
      const userConsented = await showConsentModal(tokenAddress, amount, inrAmount, bankAccount, fee, netAmount);
      if (!userConsented) {
        setWithdrawalState(prev => ({
          ...prev,
          isInitiating: false,
          step: 'idle',
          error: 'User cancelled withdrawal'
        }));
        return null;
      }

      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token withdrawal
        tx = await contract.initiateWithdrawal(
          tokenAddress,
          amountWei,
          inrAmount,
          bankAccount,
          { value: amountWei }
        );
      } else {
        // ERC20 token withdrawal - user must approve first
        await requestTokenApproval(tokenAddress, amount);
        tx = await contract.initiateWithdrawal(
          tokenAddress,
          amountWei,
          inrAmount,
          bankAccount
        );
      }

      const receipt = await tx.wait();
      
      // Extract withdrawal ID from event
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === contract.interface.getEvent('WithdrawalInitiated')?.topicHash
      );
      
      let withdrawalId = null;
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        if (parsedEvent) {
          withdrawalId = parseInt(parsedEvent.args.withdrawalId.toString());
        }
      }

      setWithdrawalState(prev => ({
        ...prev,
        isInitiating: false,
        withdrawalId,
        transactionHash: tx.hash,
        step: 'awaiting_completion'
      }));

      return withdrawalId;
    } catch (error: any) {
      console.error('Withdrawal initiation failed:', error);
      setWithdrawalState(prev => ({
        ...prev,
        isInitiating: false,
        step: 'error',
        error: error.message || 'Withdrawal initiation failed'
      }));
      return null;
    }
  };

  const completeWithdrawal = async (withdrawalId: number): Promise<boolean> => {
    try {
      setWithdrawalState(prev => ({
        ...prev,
        isCompleting: true,
        error: null
      }));

      const contract = await getContract();
      const tx = await contract.completeWithdrawal(withdrawalId);
      await tx.wait();

      setWithdrawalState(prev => ({
        ...prev,
        isCompleting: false,
        transactionHash: tx.hash,
        step: 'completed'
      }));

      return true;
    } catch (error: any) {
      console.error('Withdrawal completion failed:', error);
      setWithdrawalState(prev => ({
        ...prev,
        isCompleting: false,
        step: 'error',
        error: error.message || 'Withdrawal completion failed'
      }));
      return false;
    }
  };

  const cancelWithdrawal = async (withdrawalId: number, reason: string): Promise<boolean> => {
    try {
      const contract = await getContract();
      const tx = await contract.cancelWithdrawal(withdrawalId, reason);
      await tx.wait();

      setWithdrawalState(prev => ({
        ...prev,
        step: 'idle',
        withdrawalId: null,
        transactionHash: tx.hash
      }));

      return true;
    } catch (error: any) {
      console.error('Withdrawal cancellation failed:', error);
      setWithdrawalState(prev => ({
        ...prev,
        error: error.message || 'Withdrawal cancellation failed'
      }));
      return false;
    }
  };

  const getWithdrawalDetails = async (withdrawalId: number) => {
    try {
      const contract = await getContract();
      return await contract.getWithdrawalRequest(withdrawalId);
    } catch (error) {
      console.error('Failed to get withdrawal details:', error);
      return null;
    }
  };

  const getUserWithdrawals = async () => {
    try {
      if (!address) return [];
      const contract = await getContract();
      return await contract.getUserWithdrawals(address);
    } catch (error) {
      console.error('Failed to get user withdrawals:', error);
      return [];
    }
  };

  const showConsentModal = (
    tokenAddress: string,
    amount: string,
    inrAmount: string,
    bankAccount: string,
    fee: bigint,
    netAmount: bigint
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Smart Contract Withdrawal Consent
          </h3>
          <div class="space-y-4 mb-6">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 class="font-medium text-blue-900 dark:text-blue-300 mb-2">Withdrawal Details</h4>
              <div class="text-sm space-y-1">
                <div><strong>Amount:</strong> ${amount} ${tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'tokens'}</div>
                <div><strong>INR Value:</strong> ₹${inrAmount}</div>
                <div><strong>Bank Account:</strong> ***${bankAccount.slice(-4)}</div>
              </div>
            </div>
            
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 class="font-medium text-yellow-900 dark:text-yellow-300 mb-2">Fee Information</h4>
              <div class="text-sm space-y-1">
                <div><strong>Service Fee:</strong> ${(Number(fee) / 1e18).toFixed(6)}</div>
                <div><strong>Net Amount:</strong> ${(Number(netAmount) / 1e18).toFixed(6)}</div>
              </div>
            </div>
            
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 class="font-medium text-green-900 dark:text-green-300 mb-2">Smart Contract Benefits</h4>
              <ul class="text-sm space-y-1">
                <li>• Transparent and secure on-chain transaction</li>
                <li>• Immutable transaction record</li>
                <li>• Automated fee calculation</li>
                <li>• 24-hour completion window</li>
              </ul>
            </div>
          </div>
          
          <div class="flex gap-3">
            <button id="cancel-withdrawal" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button id="confirm-withdrawal" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Confirm Smart Contract Withdrawal
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const handleConfirm = () => {
        document.body.removeChild(modal);
        resolve(true);
      };

      const handleCancel = () => {
        document.body.removeChild(modal);
        resolve(false);
      };

      modal.querySelector('#confirm-withdrawal')?.addEventListener('click', handleConfirm);
      modal.querySelector('#cancel-withdrawal')?.addEventListener('click', handleCancel);
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleCancel();
        }
      });
    });
  };

  const requestTokenApproval = async (tokenAddress: string, amount: string) => {
    if (!window.ethereum) {
      throw new Error('No ethereum provider found');
    }

    const provider = new BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    
    const tokenContract = new Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) external returns (bool)'],
      signer
    );

    const chainId = parseInt(caipNetwork!.id.toString());
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    
    const amountWei = parseUnits(amount, 18);
    const tx = await tokenContract.approve(contractAddress, amountWei);
    await tx.wait();
  };

  const resetState = () => {
    setWithdrawalState({
      isInitiating: false,
      isCompleting: false,
      withdrawalId: null,
      transactionHash: null,
      error: null,
      step: 'idle'
    });
  };

  return {
    withdrawalState,
    initiateWithdrawal,
    completeWithdrawal,
    cancelWithdrawal,
    getWithdrawalDetails,
    getUserWithdrawals,
    resetState
  };
}