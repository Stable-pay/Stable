import { useState, useCallback } from 'react';
import { ethers, parseUnits, formatUnits } from 'ethers';

interface WithdrawalState {
  isProcessing: boolean;
  transactionHash: string | null;
  error: string | null;
  requestId: string | null;
  step: 'idle' | 'calculating' | 'approving' | 'withdrawing' | 'completed' | 'error';
}

interface TokenOption {
  symbol: string;
  address: string;
  decimals: number;
  balance: string;
  usdPrice: number;
}

const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Will be updated after deployment

const CONTRACT_ABI = [
  "function requestWithdrawal(address token, uint256 tokenAmount, uint256 expectedInrAmount) external payable",
  "function calculateInrAmount(address token, uint256 tokenAmount) external view returns (uint256)",
  "function allowedTokens(address) external view returns (bool)",
  "function tokenToInrRate(address) external view returns (uint256)",
  "function getUserWithdrawals(address user) external view returns (tuple(address user, address token, uint256 tokenAmount, uint256 inrAmount, uint256 exchangeRate, bool completed, uint256 timestamp, string transactionId)[])",
  "event WithdrawalRequested(uint256 indexed requestId, address indexed user, address indexed token, uint256 tokenAmount, uint256 inrAmount, uint256 exchangeRate)"
];

export function useWithdrawalContract() {
  const [state, setState] = useState<WithdrawalState>({
    isProcessing: false,
    transactionHash: null,
    error: null,
    requestId: null,
    step: 'idle'
  });

  const [supportedTokens] = useState<TokenOption[]>([
    {
      symbol: 'USDC',
      address: '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B',
      decimals: 6,
      balance: '0',
      usdPrice: 1.0
    },
    {
      symbol: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      balance: '0',
      usdPrice: 1.0
    },
    {
      symbol: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      balance: '0',
      usdPrice: 2800
    }
  ]);

  const calculateInrAmount = useCallback(async (
    tokenAddress: string,
    tokenAmount: string,
    provider: any
  ): Promise<string> => {
    try {
      setState(prev => ({ ...prev, step: 'calculating' }));

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const tokenDecimals = supportedTokens.find(t => t.address === tokenAddress)?.decimals || 18;
      const amount = parseUnits(tokenAmount, tokenDecimals);
      
      const inrAmount = await contract.calculateInrAmount(tokenAddress, amount);
      const formattedInrAmount = formatUnits(inrAmount, 18);
      
      return formattedInrAmount;
    } catch (error) {
      console.error('INR calculation failed:', error);
      throw new Error('Failed to calculate INR amount');
    }
  }, [supportedTokens]);

  const initiateWithdrawal = useCallback(async (
    tokenAddress: string,
    tokenAmount: string,
    expectedInrAmount: string,
    provider: any,
    signer: any
  ): Promise<string> => {
    try {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        step: 'approving'
      }));

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tokenDecimals = supportedTokens.find(t => t.address === tokenAddress)?.decimals || 18;
      const amount = parseUnits(tokenAmount, tokenDecimals);
      const expectedInr = parseUnits(expectedInrAmount, 18);

      // Handle ETH vs ERC20 tokens differently
      let tx;
      if (tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        // ETH withdrawal
        setState(prev => ({ ...prev, step: 'withdrawing' }));
        tx = await contract.requestWithdrawal(tokenAddress, amount, expectedInr, {
          value: amount
        });
      } else {
        // ERC20 token withdrawal - need approval first
        const tokenContract = new ethers.Contract(tokenAddress, [
          "function approve(address spender, uint256 amount) external returns (bool)"
        ], signer);

        // Check and approve if needed
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
        await approveTx.wait();

        setState(prev => ({ ...prev, step: 'withdrawing' }));
        tx = await contract.requestWithdrawal(tokenAddress, amount, expectedInr);
      }

      const receipt = await tx.wait();
      
      // Extract request ID from events
      const withdrawalEvent = receipt.events?.find(
        (event: any) => event.event === 'WithdrawalRequested'
      );
      const requestId = withdrawalEvent?.args?.requestId?.toString() || '';

      setState(prev => ({
        ...prev,
        isProcessing: false,
        transactionHash: tx.hash,
        requestId,
        step: 'completed'
      }));

      return requestId;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Withdrawal failed',
        step: 'error'
      }));
      throw error;
    }
  }, [supportedTokens]);

  const getUserWithdrawals = useCallback(async (
    userAddress: string,
    provider: any
  ) => {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const withdrawals = await contract.getUserWithdrawals(userAddress);
      
      return withdrawals.map((w: any, index: number) => ({
        id: index + 1,
        token: w.token,
        tokenAmount: formatUnits(w.tokenAmount, 18),
        inrAmount: formatUnits(w.inrAmount, 18),
        exchangeRate: formatUnits(w.exchangeRate, 18),
        completed: w.completed,
        timestamp: new Date(Number(w.timestamp) * 1000),
        transactionId: w.transactionId
      }));
    } catch (error) {
      console.error('Failed to fetch user withdrawals:', error);
      return [];
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      transactionHash: null,
      error: null,
      requestId: null,
      step: 'idle'
    });
  }, []);

  return {
    state,
    supportedTokens,
    calculateInrAmount,
    initiateWithdrawal,
    getUserWithdrawals,
    resetState
  };
}