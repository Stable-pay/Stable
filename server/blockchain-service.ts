import { Request, Response } from 'express';
import { getBinanceTokensByChain, BINANCE_SUPPORTED_CHAINS, getDeveloperWallet } from '../shared/binance-supported-tokens';

// Comprehensive blockchain RPC service for all supported chains
export class BlockchainService {
  private readonly rpcEndpoints: Record<number, string> = {
    1: 'https://cloudflare-eth.com', // Ethereum
    137: 'https://polygon-rpc.com', // Polygon
    56: 'https://bsc-dataseed1.defibit.io', // BSC
    42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
    10: 'https://mainnet.optimism.io', // Optimism
    8453: 'https://mainnet.base.org', // Base
    43114: 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
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
    
    // Fetch balances from supported chains with error handling
    const supportedChains = [1, 137, 56]; // Ethereum, Polygon, BSC
    
    for (const chainId of supportedChains) {
      try {
        const chainBalances = await this.fetchLiveBalance(address, chainId);
        allBalances.push(...chainBalances);
      } catch (error) {
        console.error(`Failed to fetch balance for chain ${chainId}:`, error);
        // Continue with other chains instead of failing completely
      }
    }

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
          address: '0x0000000000000000000000000000000000000000',
          balance: nativeBalance,
          decimals: 18,
          chainId,
          chainName: this.getChainName(chainId),
          usdValue: 0, // Will be calculated from price APIs
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
              address: contractAddress,
              balance: tokenBalance,
              decimals: this.getTokenDecimals(symbol),
              chainId,
              chainName: this.getChainName(chainId),
              usdValue: 0, // Will be calculated from price APIs
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
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        })
      });

      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Convert from wei to ether
      const balanceWei = BigInt(data.result || '0x0');
      const balanceEther = Number(balanceWei) / Math.pow(10, 18);
      return balanceEther.toFixed(8);
    } catch (error) {
      console.warn(`Native balance fetch failed for ${rpcUrl}:`, error);
      return '0';
    }
  }

  private async getTokenBalance(address: string, contractAddress: string, rpcUrl: string): Promise<string> {
    try {
      // ERC-20 balanceOf call
      const callData = '0x70a08231' + address.slice(2).padStart(64, '0');
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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

      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Convert hex result to decimal
      const balanceHex = data.result || '0x0';
      const balanceWei = BigInt(balanceHex);
      const balanceFormatted = Number(balanceWei) / Math.pow(10, 18); // Assume 18 decimals for now
      return balanceFormatted.toFixed(8);
    } catch (error) {
      console.warn(`Token balance fetch failed for ${contractAddress}:`, error);
      return '0';
    }
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