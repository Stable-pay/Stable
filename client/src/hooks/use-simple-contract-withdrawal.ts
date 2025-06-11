import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

interface SimpleWithdrawalState {
  isProcessing: boolean;
  step: 'idle' | 'processing' | 'completed' | 'error';
  transactionHash: string | null;
  error: string | null;
}

const CONTRACT_ABI = [
  "function executeDirectTransfer(address token, uint256 amount, string calldata kycId, string calldata bankAccount) external payable returns (bytes32)"
];

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export function useSimpleContractWithdrawal() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  
  const [state, setState] = useState<SimpleWithdrawalState>({
    isProcessing: false,
    step: 'idle',
    transactionHash: null,
    error: null
  });

  const executeWithdrawal = useCallback(async (
    tokenAddress: string,
    amount: string,
    kycId: string,
    bankAccount: string
  ): Promise<string | null> => {
    try {
      setState({
        isProcessing: true,
        step: 'processing',
        transactionHash: null,
        error: null
      });

      if (!isConnected || !address || !walletProvider) {
        throw new Error('Wallet not connected');
      }

      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const decimals = tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 18;
      const amountWei = parseUnits(amount, decimals);

      console.log('Executing contract withdrawal:', { tokenAddress, amount, kycId, bankAccount });

      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        tx = await contract.executeDirectTransfer(
          tokenAddress,
          amountWei,
          kycId,
          bankAccount,
          { value: amountWei }
        );
      } else {
        tx = await contract.executeDirectTransfer(
          tokenAddress,
          amountWei,
          kycId,
          bankAccount
        );
      }

      const receipt = await tx.wait();
      console.log('Contract withdrawal successful:', receipt.hash);

      setState({
        isProcessing: false,
        step: 'completed',
        transactionHash: receipt.hash,
        error: null
      });

      return receipt.hash;

    } catch (error) {
      console.error('Contract withdrawal failed:', error);
      setState({
        isProcessing: false,
        step: 'error',
        transactionHash: null,
        error: (error as Error).message
      });
      return null;
    }
  }, [isConnected, address, walletProvider]);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      step: 'idle',
      transactionHash: null,
      error: null
    });
  }, []);

  return {
    state,
    executeWithdrawal,
    resetState
  };
}