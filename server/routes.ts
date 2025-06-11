import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { reownAPI } from "./reown-api";
import { insertUserSchema, insertKycDocumentSchema, insertBankAccountSchema, insertTransactionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Multer configuration for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// API configuration
const PANCAKESWAP_API_KEY = process.env.VITE_PANCAKESWAP_API_KEY;
const PANCAKESWAP_BASE_URL = 'https://api.pancakeswap.info';
const PANCAKESWAP_ROUTER = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4';

// USDC addresses for supported chains
const USDC_ADDRESSES: Record<string, string> = {
  '1': '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B',
  '137': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  '56': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  '42161': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  '10': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};

// Common token addresses for various chains
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  '1': {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'USDC': '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  },
  '56': {
    'BNB': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'CAKE': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
    'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
  }
};

// Native token representation
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Production Particle Network API routes
  app.post('/api/particle/auth/login', (req, res) => particleAPI.authenticateUser(req, res));
  app.post('/api/particle/auth/logout', (req, res) => particleAPI.logoutUser(req, res));
  app.post('/api/particle/wallet/balance', (req, res) => particleAPI.getWalletBalance(req, res));
  app.post('/api/particle/swap/quote', (req, res) => particleAPI.getSwapQuote(req, res));
  app.post('/api/particle/swap/transaction', (req, res) => particleAPI.executeSwap(req, res));
  app.get('/api/particle/paymaster/balance', (req, res) => particleAPI.getPaymasterBalance(req, res));



  // Wallet balance endpoint
  app.get("/api/wallet/balances", async (req, res) => {
    try {
      const { address, chainId } = req.query;
      
      if (!address) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }

      console.log(`Fetching balances for ${address} on chain ${chainId}`);
      
      // Mock balances for demonstration
      const mockBalances = [
        {
          symbol: 'ETH',
          balance: '1500000000000000000',
          formattedBalance: '1.5',
          decimals: 18,
          chainId: parseInt(chainId as string) || 1,
          address: NATIVE_TOKEN_ADDRESS,
          isNative: true
        },
        {
          symbol: 'USDC',
          balance: '5000000000',
          formattedBalance: '5000.0',
          decimals: 6,
          chainId: parseInt(chainId as string) || 1,
          address: USDC_ADDRESSES[chainId as string] || USDC_ADDRESSES['1'],
          isNative: false
        }
      ];

      res.json({ balances: mockBalances });

    } catch (error) {
      console.error('Balance fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch wallet balances' });
    }
  });

  // Token balance endpoint
  app.post("/api/wallet/token-balance", async (req, res) => {
    try {
      const { address, tokenAddress, chainId } = req.body;
      
      if (!address || !tokenAddress) {
        return res.status(400).json({ error: 'Address and token address required' });
      }

      // Return mock balance
      const balance = tokenAddress === NATIVE_TOKEN_ADDRESS ? '1500000000000000000' : '5000000000';
      const decimals = tokenAddress === NATIVE_TOKEN_ADDRESS ? 18 : 6;
      const symbol = tokenAddress === NATIVE_TOKEN_ADDRESS ? 'ETH' : 'USDC';

      res.json({
        balance,
        decimals,
        symbol,
        formattedBalance: (parseFloat(balance) / Math.pow(10, decimals)).toFixed(6)
      });

    } catch (error) {
      console.error('Token balance error:', error);
      res.status(500).json({ error: 'Failed to fetch token balance' });
    }
  });

  // Live exchange rate endpoint using CoinGecko API
  app.get("/api/remittance/rates", async (req, res) => {
    try {
      const { from, to } = req.query;
      
      console.log(`Live exchange rate request: ${from} to ${to}`);
      
      // Map token symbols to CoinGecko IDs
      const tokenMap: Record<string, string> = {
        'ETH': 'ethereum',
        'BTC': 'bitcoin', 
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'USD': 'usd'
      };

      const tokenId = tokenMap[from as string];
      if (!tokenId) {
        return res.status(400).json({ error: `Unsupported token: ${from}` });
      }

      // Fetch live price from CoinGecko
      const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=inr,usd&include_last_updated_at=true`;
      
      const response = await fetch(coingeckoUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status}`);
        return res.status(503).json({ error: 'Exchange rate service unavailable' });
      }

      const data = await response.json();
      const tokenData = data[tokenId];
      
      if (!tokenData) {
        return res.status(404).json({ error: 'Token price not found' });
      }

      const rate = tokenData.inr || 0;
      const usdRate = tokenData.usd || 0;
      
      console.log(`Live rate fetched: 1 ${from} = ₹${rate} (via CoinGecko)`);

      res.json({
        from,
        to,
        rate,
        usdRate,
        lastUpdated: new Date(tokenData.last_updated_at * 1000).toISOString(),
        spread: 0.25, // 0.25% spread
        source: 'CoinGecko API'
      });

    } catch (error) {
      console.error('Live exchange rate error:', error);
      res.status(500).json({ error: 'Failed to fetch live exchange rates' });
    }
  });

  // Remittance withdrawal endpoint
  app.post("/api/remittance/withdraw", async (req, res) => {
    try {
      const { amount, currency, bankDetails, kycData } = req.body;
      
      console.log(`Remittance withdrawal request: ${amount} ${currency} for ${kycData?.fullName}`);
      
      // Validate required fields
      if (!amount || !currency || !bankDetails || !kycData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate KYC status
      if (kycData.kycStatus !== 'verified') {
        return res.status(400).json({ error: 'KYC verification required' });
      }

      // Simulate bank transfer processing
      const withdrawalId = `WD${Date.now()}`;
      const estimatedTime = '5-10 minutes';
      
      const withdrawalData = {
        id: withdrawalId,
        amount: parseFloat(amount),
        currency,
        status: 'processing',
        bankDetails: {
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          accountHolderName: bankDetails.accountHolderName,
          bankName: bankDetails.bankName
        },
        estimatedTime,
        createdAt: new Date().toISOString(),
        processingFee: 0, // No fees for gasless
        exchangeRate: currency === 'INR' ? 83.25 : 1
      };

      console.log('Withdrawal processed:', withdrawalData);
      res.json(withdrawalData);

    } catch (error) {
      console.error('Remittance withdrawal error:', error);
      res.status(500).json({ error: 'Failed to process withdrawal' });
    }
  });

  // Remittance status endpoint
  app.get("/api/remittance/status/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Remittance status check: ${id}`);
      
      const mockStatus = {
        id,
        status: 'completed',
        completedAt: new Date().toISOString(),
        bankTransferRef: `IMPS${Date.now()}`,
        actualProcessingTime: '4 minutes 32 seconds'
      };

      res.json(mockStatus);

    } catch (error) {
      console.error('Remittance status error:', error);
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  });

  // Advanced swap quote endpoint
  app.post('/api/swap/quote', async (req, res) => {
    try {
      const { fromToken, toToken, amount, userAddress } = req.body;
      
      // Get real-time token prices using external API
      const fromPrice = await getTokenPrice(fromToken);
      const toPrice = await getTokenPrice(toToken);
      
      const fromAmountNum = parseFloat(amount);
      const exchangeRate = fromPrice / toPrice;
      const slippage = 0.005; // 0.5% slippage
      const priceImpact = Math.min(fromAmountNum * 0.001, 3); // Price impact based on amount
      
      const toAmount = (fromAmountNum * exchangeRate * (1 - slippage)).toFixed(6);
      const gasEstimate = "0.0045"; // Estimated gas in ETH
      
      const quote = {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount,
        priceImpact,
        gasEstimate,
        exchangeRate: exchangeRate.toFixed(6),
        timestamp: Date.now()
      };
      
      res.json(quote);
    } catch (error) {
      console.error('Swap quote error:', error);
      res.status(500).json({ error: 'Failed to get swap quote' });
    }
  });

  // Execute swap endpoint
  app.post('/api/swap/execute', async (req, res) => {
    try {
      const { quote, userAddress } = req.body;
      
      // Simulate swap execution with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate realistic transaction hash
      const txHash = '0x' + Math.random().toString(16).slice(2, 66);
      
      const result = {
        success: true,
        transactionHash: txHash,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        gasUsed: quote.gasEstimate,
        timestamp: Date.now()
      };
      
      res.json(result);
    } catch (error) {
      console.error('Swap execution error:', error);
      res.status(500).json({ error: 'Swap execution failed' });
    }
  });

  // Token price helper function
  async function getTokenPrice(symbol: string): Promise<number> {
    try {
      // Use CoinGecko API for real price data
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${getTokenId(symbol)}&vs_currencies=usd`);
      const data = await response.json();
      const tokenId = getTokenId(symbol);
      return data[tokenId]?.usd || getFallbackPrice(symbol);
    } catch (error) {
      console.error('Price fetch error:', error);
      return getFallbackPrice(symbol);
    }
  }

  function getTokenId(symbol: string): string {
    const tokenMap: Record<string, string> = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave'
    };
    return tokenMap[symbol] || 'ethereum';
  }

  function getFallbackPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'ETH': 2045.67,
      'BTC': 43256.89,
      'USDC': 1.0001,
      'USDT': 1.0002,
      'MATIC': 0.8234,
      'LINK': 14.56,
      'UNI': 7.89,
      'AAVE': 89.45
    };
    return prices[symbol] || 1;
  }

  const server = createServer(app);
  // StablePay custody transfer endpoint
  app.post('/api/custody/transfer', async (req, res) => {
    try {
      const { userAddress, usdcAmount, chainId, swapTxHash } = req.body;
      
      let user = await storage.getUserByWalletAddress(userAddress);
      if (!user) {
        user = await storage.createUser({
          walletAddress: userAddress,
          email: '',
          kycStatus: 'none'
        });
      }

      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'custody_transfer',
        network: `chain_${chainId}`,
        fromToken: 'CRYPTO',
        toToken: 'USDC',
        toAmount: usdcAmount,
        status: 'completed',
        txHash: swapTxHash,
        metadata: JSON.stringify({ chainId, originalSwapTx: swapTxHash })
      });

      res.json({ success: true, transactionId: transaction.id });
    } catch (error) {
      console.error('Custody transfer failed:', error);
      res.status(500).json({ error: 'Custody transfer failed' });
    }
  });

  // KYC initiation endpoint
  app.post('/api/kyc/initiate', async (req, res) => {
    try {
      const { userAddress } = req.body;
      
      let user = await storage.getUserByWalletAddress(userAddress);
      if (!user) {
        user = await storage.createUser({
          walletAddress: userAddress,
          email: '',
          kycStatus: 'pending'
        });
      } else {
        await storage.updateUser(user.id, { kycStatus: 'pending' });
      }

      const kycDocument = await storage.createKycDocument({
        userId: user.id,
        documentType: 'aadhaar',
        documentUrl: '',
        status: 'pending'
      });

      setTimeout(async () => {
        try {
          await storage.updateKycDocument(kycDocument.id, { status: 'verified' });
          await storage.updateUser(user.id, { kycStatus: 'verified' });
        } catch (error) {
          console.error('Failed to update KYC status:', error);
        }
      }, 3000);

      res.json({ success: true, kycId: kycDocument.id, status: 'pending' });
    } catch (error) {
      console.error('KYC initiation failed:', error);
      res.status(500).json({ error: 'KYC initiation failed' });
    }
  });

  // INR withdrawal initiation
  app.post('/api/withdrawal/initiate', async (req, res) => {
    try {
      const { userAddress, usdcAmount, inrAmount, bankDetails } = req.body;
      
      const user = await storage.getUserByWalletAddress(userAddress);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.kycStatus !== 'verified') {
        return res.status(403).json({ error: 'KYC verification required' });
      }

      const existingAccounts = await storage.getBankAccounts(user.id);
      let bankAccount = existingAccounts.find(acc => acc.accountNumber === bankDetails.accountNumber);
      
      if (!bankAccount) {
        bankAccount = await storage.createBankAccount({
          userId: user.id,
          bankName: 'Unknown Bank',
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          accountHolderName: bankDetails.accountHolderName
        });
      }

      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'withdrawal',
        network: 'INR_BANK',
        fromToken: 'USDC',
        toToken: 'INR',
        fromAmount: usdcAmount,
        toAmount: inrAmount,
        exchangeRate: (parseFloat(inrAmount) / parseFloat(usdcAmount)).toString(),
        status: 'pending',
        txHash: '',
        metadata: JSON.stringify({ 
          usdcAmount, 
          bankAccountId: bankAccount.id,
          exchangeRate: parseFloat(inrAmount) / parseFloat(usdcAmount)
        })
      });

      setTimeout(async () => {
        try {
          await storage.updateTransaction(transaction.id, {
            status: 'completed',
            txHash: `INR_${Date.now()}`
          });
        } catch (error) {
          console.error('Failed to update transaction status:', error);
        }
      }, 5000);

      res.json({ 
        success: true, 
        transactionId: transaction.id,
        estimatedTime: '24 hours',
        inrAmount 
      });
    } catch (error) {
      console.error('Withdrawal initiation failed:', error);
      res.status(500).json({ error: 'Withdrawal initiation failed' });
    }
  });

  // Get user transaction history
  app.get('/api/transactions/:address', async (req, res) => {
    try {
      const { address } = req.params;
      
      const user = await storage.getUserByWalletAddress(address);
      if (!user) {
        return res.json([]);
      }

      const transactions = await storage.getTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Reown WalletConnect API endpoints
  app.post('/api/tokens/balance', reownAPI.getTokenBalance.bind(reownAPI));
  app.post('/api/swap/quote', reownAPI.getSwapQuote.bind(reownAPI));
  app.post('/api/swap/execute', reownAPI.executeSwap.bind(reownAPI));

  return server;
}