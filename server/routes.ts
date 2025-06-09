import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertKycDocumentSchema, insertBankAccountSchema, insertTransactionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const uploadStorage = multer.memoryStorage();
const upload = multer({ 
  storage: uploadStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Alternative pricing function using CoinGecko
async function handleAlternativePricing(req: any, res: any, chainId: string, queryParams: URLSearchParams) {
  try {
    const fromTokenAddress = queryParams.get('fromTokenAddress');
    const toTokenAddress = queryParams.get('toTokenAddress');
    const amount = queryParams.get('amount');
    
    // Token ID mapping for CoinGecko
    const tokenMapping: Record<string, string> = {
      // Ethereum
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': 'ethereum',
      '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B': 'usd-coin',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'tether',
      // Polygon
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': 'matic-network',
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'usd-coin',
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': 'tether',
      // Native tokens
      '137-native': 'matic-network',
      '1-native': 'ethereum',
      '42161-native': 'ethereum',
      '8453-native': 'ethereum',
      '10-native': 'ethereum'
    };
    
    const fromTokenId = tokenMapping[fromTokenAddress || ''] || tokenMapping[`${chainId}-native`];
    const toTokenId = tokenMapping[toTokenAddress || ''] || 'usd-coin';
    
    if (!fromTokenId) {
      return res.status(400).json({ error: 'Unsupported token for pricing' });
    }
    
    // Fetch real-time prices from CoinGecko
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${fromTokenId},${toTokenId}&vs_currencies=usd`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!priceResponse.ok) {
      throw new Error('CoinGecko API failed');
    }
    
    const prices = await priceResponse.json();
    const fromPrice = prices[fromTokenId]?.usd || 0;
    const toPrice = prices[toTokenId]?.usd || 1;
    
    if (!fromPrice) {
      return res.status(400).json({ error: 'Token price not available' });
    }
    
    // Calculate conversion
    const rate = fromPrice / toPrice;
    const fromAmount = parseFloat(amount || '0');
    const decimals = fromTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? 18 : 6; // ETH vs USDT/USDC
    const actualFromAmount = fromAmount / Math.pow(10, decimals);
    const toAmount = actualFromAmount * rate;
    const toAmountWei = Math.floor(toAmount * 1e6); // USDC has 6 decimals
    
    // Return 1inch-compatible response
    const response = {
      fromToken: {
        symbol: fromTokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? 'ETH' : 'USDT',
        decimals: decimals,
        address: fromTokenAddress
      },
      toToken: {
        symbol: 'USDC',
        decimals: 6,
        address: toTokenAddress
      },
      toTokenAmount: toAmountWei.toString(),
      fromTokenAmount: amount,
      protocols: [['CoinGecko Real-Time Pricing']],
      estimatedGas: '150000'
    };
    
    console.log('Alternative pricing successful:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Alternative pricing error:', error);
    res.status(500).json({ error: 'Alternative pricing failed' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 1inch API proxy routes to fix CORS issues
  app.get("/api/1inch/:chainId/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const queryParams = new URLSearchParams(req.query as Record<string, string>);
      
      console.log(`1inch quote proxy request: ${chainId} - ${queryParams}`);
      
      const response = await fetch(`https://api.1inch.dev/swap/v6.0/${chainId}/quote?${queryParams}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      
      console.log(`1inch quote response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('1inch quote error:', error);
        // Fallback to alternative pricing when 1inch is unavailable
        return await handleAlternativePricing(req, res, chainId, queryParams);
      }
      
      const responseText = await response.text();
      console.log('1inch response preview:', responseText.substring(0, 200));
      
      // Check if response is HTML (blocked by 1inch)
      if (responseText.trim().startsWith('<')) {
        console.log('1inch returned HTML, using alternative pricing');
        return await handleAlternativePricing(req, res, chainId, queryParams);
      }
      
      try {
        const data = JSON.parse(responseText);
        res.json(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return await handleAlternativePricing(req, res, chainId, queryParams);
      }
    } catch (error) {
      console.error('1inch quote proxy error:', error);
      // Fallback to alternative pricing on any error
      return await handleAlternativePricing(req, res, chainId, queryParams);
    }
  });

  app.get("/api/1inch/:chainId/swap", async (req, res) => {
    try {
      const { chainId } = req.params;
      const queryParams = new URLSearchParams(req.query as Record<string, string>);
      
      console.log(`1inch swap proxy request: ${chainId} - ${queryParams}`);
      
      const response = await fetch(`https://api.1inch.dev/swap/v6.0/${chainId}/swap?${queryParams}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      
      console.log(`1inch swap response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('1inch swap error:', error);
        return res.status(response.status).json({ error });
      }
      
      const responseText = await response.text();
      console.log('1inch swap response preview:', responseText.substring(0, 200));
      
      // Check if response is HTML (blocked by 1inch)
      if (responseText.trim().startsWith('<')) {
        console.log('1inch swap returned HTML, API may be restricted');
        return res.status(400).json({ error: 'Swap API temporarily unavailable' });
      }
      
      try {
        const data = JSON.parse(responseText);
        res.json(data);
      } catch (parseError) {
        console.error('JSON parse error on swap:', parseError);
        return res.status(500).json({ error: 'Invalid response from swap API' });
      }
    } catch (error) {
      console.error('1inch swap proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch swap data from 1inch API' });
    }
  });
  
  // WalletConnect domain verification
  app.get("/.well-known/walletconnect.txt", (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send('6dfca9af31141b1fb9220aa7db3eee37');
  });
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByWalletAddress(userData.walletAddress);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // KYC routes
  app.get("/api/users/:userId/kyc", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const documents = await storage.getKycDocuments(userId);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:userId/kyc", upload.single('document'), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { documentType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: "Document file is required" });
      }

      // In a real implementation, you would upload to cloud storage
      // For now, we'll simulate with a fake URL
      const documentUrl = `https://storage.example.com/kyc/${userId}/${documentType}_${Date.now()}.${req.file.originalname.split('.').pop()}`;
      
      const documentData = {
        userId,
        documentType,
        documentUrl,
        status: "pending" as const
      };
      
      const document = await storage.createKycDocument(documentData);
      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/kyc/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const document = await storage.updateKycDocument(id, updates);
      if (!document) {
        return res.status(404).json({ error: "KYC document not found" });
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bank account routes
  app.get("/api/users/:userId/bank-accounts", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const accounts = await storage.getBankAccounts(userId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:userId/bank-accounts", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const accountData = insertBankAccountSchema.parse({ ...req.body, userId });
      
      const account = await storage.createBankAccount(accountData);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Transaction routes
  app.get("/api/users/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactionData = insertTransactionSchema.parse({ ...req.body, userId });
      
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const transaction = await storage.updateTransaction(id, updates);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Custody wallet routes
  app.get("/api/custody-wallets", async (req, res) => {
    try {
      const wallets = await storage.getCustodyWallets();
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/custody-wallets/:network", async (req, res) => {
    try {
      const { network } = req.params;
      const wallet = await storage.getCustodyWalletByNetwork(network);
      
      if (!wallet) {
        return res.status(404).json({ error: "Custody wallet not found for network" });
      }
      
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Exchange rates (mock implementation)
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const { from, to, network } = req.query;
      
      // Mock exchange rates - in production, fetch from real APIs
      const rates = {
        'ETH/USDC': 2451.32,
        'MATIC/USDC': 0.85,
        'SOL/USDC': 142.50,
        'BNB/USDC': 325.75,
        'AVAX/USDC': 28.45,
        'USDC/INR': 83.24
      };
      
      const rateKey = `${from}/${to}`;
      const rate = rates[rateKey as keyof typeof rates] || 1;
      
      res.json({
        from,
        to,
        network,
        rate,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Simulate swap transaction
  app.post("/api/swap", async (req, res) => {
    try {
      const { userId, network, fromToken, toToken, fromAmount, slippage } = req.body;
      
      // Mock swap execution
      const exchangeRate = 2451.32; // ETH to USDC
      const toAmount = parseFloat(fromAmount) * exchangeRate;
      const networkFee = 0.005; // 0.005 ETH
      const processingFee = 2.50; // $2.50 in USDC
      
      const transactionData = {
        userId,
        type: "swap" as const,
        network,
        fromToken,
        toToken,
        fromAmount: fromAmount.toString(),
        toAmount: toAmount.toString(),
        exchangeRate: exchangeRate.toString(),
        networkFee: networkFee.toString(),
        processingFee: processingFee.toString(),
        status: "completed" as const,
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        metadata: { slippage }
      };
      
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Simulate withdrawal transaction
  app.post("/api/withdraw", async (req, res) => {
    try {
      const { userId, usdcAmount, bankAccountId, inrAmount } = req.body;
      
      const transactionData = {
        userId,
        type: "withdrawal" as const,
        network: "fiat",
        fromToken: "USDC",
        toToken: "INR",
        fromAmount: usdcAmount.toString(),
        toAmount: inrAmount.toString(),
        exchangeRate: "83.24",
        processingFee: "25.00",
        status: "processing" as const,
        metadata: { bankAccountId }
      };
      
      const transaction = await storage.createTransaction(transactionData);
      
      // Simulate processing delay
      setTimeout(async () => {
        await storage.updateTransaction(transaction.id, { status: "completed" });
      }, 5000);
      
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
