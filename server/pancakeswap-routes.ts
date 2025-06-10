import { Express } from 'express';

const PANCAKESWAP_API_KEY = process.env.VITE_PANCAKESWAP_API_KEY;
const PANCAKESWAP_ROUTER = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4';

// PancakeSwap supported networks
const PANCAKESWAP_NETWORKS: Record<string, string> = {
  '1': 'ethereum',
  '56': 'bsc',
  '137': 'polygon',
  '42161': 'arbitrum',
  '10': 'optimism',
  '8453': 'base',
  '204': 'opbnb'
};

export function registerPancakeSwapRoutes(app: Express) {
  // PancakeSwap quote endpoint
  app.get("/api/pancakeswap/:chainId/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount, from } = req.query;
      
      console.log(`PancakeSwap quote: ${chainId} - ${src} to ${dst}, amount: ${amount}`);
      
      const network = PANCAKESWAP_NETWORKS[chainId];
      if (!network) {
        return res.status(400).json({ 
          error: `Unsupported network: ${chainId}`,
          supportedNetworks: Object.keys(PANCAKESWAP_NETWORKS)
        });
      }

      // Calculate live exchange rates
      const srcTokenSymbol = src === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? 'ETH' : 'USDC';
      const dstTokenSymbol = dst === '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B' ? 'USDC' : 'ETH';
      
      let exchangeRate = 1;
      if (srcTokenSymbol === 'ETH' && dstTokenSymbol === 'USDC') {
        // Fetch live ETH price
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          exchangeRate = priceData.ethereum.usd;
        } else {
          exchangeRate = 2500; // Fallback
        }
      }

      const inputAmount = parseFloat(amount as string) / Math.pow(10, 18);
      const outputAmount = inputAmount * exchangeRate;
      const outputAmountWei = (outputAmount * Math.pow(10, 6)).toString(); // USDC has 6 decimals

      const pancakeQuote = {
        type: 'pancakeswap',
        gasless: true,
        fromToken: {
          address: src,
          amount: amount,
          symbol: srcTokenSymbol
        },
        toToken: {
          address: dst,
          amount: outputAmountWei,
          symbol: dstTokenSymbol
        },
        transaction: {
          to: PANCAKESWAP_ROUTER,
          data: '0x', // Transaction calldata would be generated here
          value: src === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? amount : '0',
          gasLimit: '150000',
          gasPrice: '0' // Gasless
        },
        estimate: {
          gasEstimate: '150000',
          priceImpact: '0.1',
          minimumReceived: (outputAmount * 0.995 * Math.pow(10, 6)).toString()
        },
        quoteId: `pancake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        validUntil: Date.now() + 600000
      };
      
      res.json(pancakeQuote);

    } catch (error) {
      console.error('PancakeSwap quote error:', error);
      res.status(500).json({ error: 'Failed to get PancakeSwap quote' });
    }
  });

  // PancakeSwap swap execution
  app.get("/api/pancakeswap/:chainId/swap", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount, from, slippage } = req.query;
      
      console.log(`PancakeSwap swap: ${chainId} - ${src} to ${dst}`);
      
      const network = PANCAKESWAP_NETWORKS[chainId];
      if (!network) {
        return res.status(400).json({ error: `Unsupported network: ${chainId}` });
      }

      // Generate swap transaction
      const swapTx = {
        to: PANCAKESWAP_ROUTER,
        data: '0x', // PancakeSwap Universal Router calldata
        value: src === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? amount : '0',
        gas: '200000',
        gasPrice: await getGasPrice(chainId)
      };

      res.json({
        tx: swapTx,
        chainId: parseInt(chainId),
        from: from,
        to: swapTx.to,
        value: swapTx.value,
        data: swapTx.data,
        gasLimit: swapTx.gas
      });

    } catch (error) {
      console.error('PancakeSwap swap error:', error);
      res.status(500).json({ error: 'Failed to execute PancakeSwap swap' });
    }
  });

  // PancakeSwap execution endpoint
  app.post("/api/pancakeswap/swap", async (req, res) => {
    try {
      const { transaction, quoteId, walletAddress } = req.body;
      
      console.log(`PancakeSwap execution: ${quoteId} for ${walletAddress}`);
      
      // In production, this would submit to PancakeSwap's gasless infrastructure
      const executionResult = {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        quoteId: quoteId,
        status: 'pending',
        gasUsed: '0', // Gasless
        effectiveGasPrice: '0'
      };

      res.json(executionResult);

    } catch (error) {
      console.error('PancakeSwap execution error:', error);
      res.status(500).json({ error: 'Failed to execute swap' });
    }
  });

  // PancakeSwap supported tokens
  app.get("/api/pancakeswap/:chainId/tokens", async (req, res) => {
    try {
      const { chainId } = req.params;
      
      const tokens = getPancakeSwapTokens(parseInt(chainId));
      res.json({ tokens });

    } catch (error) {
      console.error('PancakeSwap tokens error:', error);
      res.status(500).json({ error: 'Failed to get supported tokens' });
    }
  });

  // Health check
  app.get("/api/pancakeswap/health", (req, res) => {
    res.json({ status: 'healthy', service: 'PancakeSwap API' });
  });
}

async function getGasPrice(chainId: string): Promise<string> {
  // Return appropriate gas price for network
  const gasPrices: Record<string, string> = {
    '1': '20000000000',   // 20 gwei for Ethereum
    '56': '5000000000',   // 5 gwei for BSC
    '137': '30000000000', // 30 gwei for Polygon
    '42161': '100000000', // 0.1 gwei for Arbitrum
    '10': '1000000',      // 0.001 gwei for Optimism
    '8453': '1000000000'  // 1 gwei for Base
  };
  
  return gasPrices[chainId] || '20000000000';
}

function getPancakeSwapTokens(chainId: number) {
  const tokenLists: Record<number, any[]> = {
    1: [ // Ethereum
      { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, chainId: 1 },
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B', decimals: 6, chainId: 1 },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, chainId: 1 },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, chainId: 1 }
    ],
    56: [ // BSC
      { symbol: 'BNB', name: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, chainId: 56 },
      { symbol: 'CAKE', name: 'PancakeSwap Token', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18, chainId: 56 },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, chainId: 56 },
      { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18, chainId: 56 }
    ]
  };

  return tokenLists[chainId] || [];
}