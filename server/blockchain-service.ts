import { Request, Response } from 'express';

// Direct blockchain RPC service for live data
export class BlockchainService {
  private readonly rpcEndpoints: Record<number, string> = {
    1: 'https://cloudflare-eth.com', // Ethereum
    137: 'https://polygon-rpc.com', // Polygon
    56: 'https://bsc-dataseed.binance.org', // BSC
    42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
    10: 'https://mainnet.optimism.io', // Optimism
  };

  private readonly tokenContracts: Record<number, Record<string, string>> = {
    1: { // Ethereum
      'USDC': '0xA0b86a33E6441b8435b662da5e1a0d5d9d3B7B3e',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
    137: { // Polygon
      'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    }
  };

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

  private getNativeSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: 'ETH',
      137: 'MATIC',
      56: 'BNB',
      42161: 'ETH',
      10: 'ETH',
    };
    return symbols[chainId] || 'ETH';
  }

  private getNativeName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BNB Chain',
      42161: 'Arbitrum One',
      10: 'Optimism',
    };
    return names[chainId] || 'Ethereum';
  }

  private getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      'USDC': 'USD Coin',
      'USDT': 'Tether',
      'DAI': 'Dai Stablecoin',
    };
    return names[symbol] || symbol;
  }

  private getTokenDecimals(symbol: string): number {
    const decimals: Record<string, number> = {
      'USDC': 6,
      'USDT': 6,
      'DAI': 18,
    };
    return decimals[symbol] || 18;
  }
}

export const blockchainService = new BlockchainService();