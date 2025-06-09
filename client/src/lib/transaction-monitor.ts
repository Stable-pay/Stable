import { getDeveloperWallet, isValidNetwork } from './wallet-config';

interface TransactionMonitor {
  hash: string;
  network: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  expectedUSDC: string;
  developerWallet: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  blockNumber?: number;
}

class TransactionMonitorService {
  private readonly API_KEY = '1Fqf1TSnyq86janyEBVQ9wcd65Ml6yBf';
  private transactions: Map<string, TransactionMonitor> = new Map();

  async monitorTransaction(
    hash: string,
    network: string,
    fromToken: string,
    toToken: string,
    fromAmount: string,
    expectedUSDC: string
  ): Promise<TransactionMonitor> {
    if (!isValidNetwork(network)) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const developerWallet = getDeveloperWallet(network as any);
    
    const transaction: TransactionMonitor = {
      hash,
      network,
      fromToken,
      toToken,
      fromAmount,
      expectedUSDC,
      developerWallet,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.transactions.set(hash, transaction);
    
    // Start monitoring in background
    this.startMonitoring(hash);
    
    return transaction;
  }

  private async startMonitoring(hash: string): Promise<void> {
    const transaction = this.transactions.get(hash);
    if (!transaction) return;

    const maxAttempts = 60; // Monitor for 5 minutes (5 second intervals)
    let attempts = 0;

    const monitor = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        transaction.status = 'failed';
        this.transactions.set(hash, transaction);
        return;
      }

      try {
        const status = await this.checkTransactionStatus(hash, transaction.network);
        
        if (status.confirmed) {
          transaction.status = 'confirmed';
          transaction.gasUsed = status.gasUsed;
          transaction.blockNumber = status.blockNumber;
          this.transactions.set(hash, transaction);
          
          // Verify USDC arrived in developer wallet
          await this.verifyUSDCTransfer(transaction);
          return;
        }

        attempts++;
        setTimeout(monitor, 5000); // Check every 5 seconds
      } catch (error) {
        console.error('Transaction monitoring error:', error);
        attempts++;
        setTimeout(monitor, 5000);
      }
    };

    monitor();
  }

  private async checkTransactionStatus(hash: string, network: string): Promise<{
    confirmed: boolean;
    gasUsed?: string;
    blockNumber?: number;
  }> {
    // In production, this would query the blockchain directly
    // For now, simulate transaction confirmation after 30 seconds
    const transaction = this.transactions.get(hash);
    if (!transaction) return { confirmed: false };

    const elapsed = Date.now() - transaction.timestamp;
    const confirmed = elapsed > 30000; // 30 seconds

    return {
      confirmed,
      gasUsed: confirmed ? '0.005' : undefined,
      blockNumber: confirmed ? Math.floor(Math.random() * 1000000) + 18000000 : undefined
    };
  }

  private async verifyUSDCTransfer(transaction: TransactionMonitor): Promise<void> {
    try {
      // In production, this would verify USDC balance in developer wallet
      console.log(`USDC transfer verification for ${transaction.hash}:`, {
        developerWallet: transaction.developerWallet,
        expectedUSDC: transaction.expectedUSDC,
        network: transaction.network
      });

      // Log to backend for record keeping
      await this.logTransactionCompletion(transaction);
    } catch (error) {
      console.error('USDC transfer verification failed:', error);
    }
  }

  private async logTransactionCompletion(transaction: TransactionMonitor): Promise<void> {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 1, // Would be actual user ID
          type: 'swap',
          network: transaction.network,
          fromToken: transaction.fromToken,
          toToken: transaction.toToken,
          fromAmount: transaction.fromAmount,
          toAmount: transaction.expectedUSDC,
          txHash: transaction.hash,
          status: 'completed',
          metadata: {
            developerWallet: transaction.developerWallet,
            gasUsed: transaction.gasUsed,
            blockNumber: transaction.blockNumber
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to log transaction completion');
      }
    } catch (error) {
      console.error('Transaction logging error:', error);
    }
  }

  getTransaction(hash: string): TransactionMonitor | undefined {
    return this.transactions.get(hash);
  }

  getAllTransactions(): TransactionMonitor[] {
    return Array.from(this.transactions.values());
  }

  getTransactionsByStatus(status: TransactionMonitor['status']): TransactionMonitor[] {
    return this.getAllTransactions().filter(tx => tx.status === status);
  }

  async getUSDCBalance(network: string): Promise<string> {
    if (!isValidNetwork(network)) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const developerWallet = getDeveloperWallet(network as any);
    
    try {
      // In production, this would query the actual USDC balance
      // For now, return a simulated balance
      const mockBalance = (Math.random() * 10000).toFixed(2);
      console.log(`USDC balance for ${developerWallet} on ${network}: ${mockBalance}`);
      return mockBalance;
    } catch (error) {
      console.error('Failed to get USDC balance:', error);
      return '0';
    }
  }

  async getTotalCollectedUSDC(): Promise<Record<string, string>> {
    const networks = ['ethereum', 'polygon', 'arbitrum', 'base'];
    const balances: Record<string, string> = {};

    for (const network of networks) {
      try {
        balances[network] = await this.getUSDCBalance(network);
      } catch (error) {
        balances[network] = '0';
      }
    }

    return balances;
  }
}

export const transactionMonitor = new TransactionMonitorService();
export type { TransactionMonitor };