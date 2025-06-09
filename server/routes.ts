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

// 0x API configuration
const ZX_API_KEY = '12be1743-8f3e-4867-a82b-501263f3c4b6';
const ZX_BASE_URL = 'https://api.0x.org';

// Chain ID mapping for 0x
const ZX_CHAIN_MAPPING: Record<string, string> = {
  '1': 'ethereum',
  '137': 'polygon',
  '42161': 'arbitrum',
  '8453': 'base',
  '10': 'optimism',
  '43114': 'avalanche'
};

// USDC contract addresses for each chain
const USDC_ADDRESSES: Record<string, string> = {
  '1': '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',      // Ethereum
  '137': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon
  '42161': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum
  '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base
  '10': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',    // Optimism
  '43114': '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'   // Avalanche
};

// Native token addresses for 0x API
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 0x API routes for token swapping
  app.get("/api/0x/:chainId/price", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { sellToken, buyToken, sellAmount, takerAddress } = req.query;
      
      console.log(`0x price request: ${chainId} - ${sellToken} to ${buyToken}, amount: ${sellAmount}`);
      
      // Convert chain ID to 0x network identifier
      const networkId = ZX_CHAIN_MAPPING[chainId];
      if (!networkId) {
        return res.status(400).json({ error: 'Unsupported network' });
      }
      
      // Auto-convert to USDC if buyToken not specified
      const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
      
      const params = new URLSearchParams({
        sellToken: sellToken as string,
        buyToken: targetBuyToken as string,
        sellAmount: sellAmount as string,
        ...(takerAddress && { takerAddress: takerAddress as string })
      });
      
      const response = await fetch(`${ZX_BASE_URL}/swap/v1/${networkId}/price?${params}`, {
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`0x price response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('0x price error:', error);
        return res.status(response.status).json({ error: 'Failed to get price quote' });
      }
      
      const data = await response.json();
      console.log('0x price response preview:', JSON.stringify(data).substring(0, 200));
      
      res.json(data);
    } catch (error) {
      console.error('0x price proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch price from 0x API' });
    }
  });

  app.get("/api/0x/:chainId/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { sellToken, buyToken, sellAmount, takerAddress, slippagePercentage } = req.query;
      
      console.log(`0x quote request: ${chainId} - ${sellToken} to ${buyToken}, amount: ${sellAmount}`);
      
      // Convert chain ID to 0x network identifier
      const networkId = ZX_CHAIN_MAPPING[chainId];
      if (!networkId) {
        return res.status(400).json({ error: 'Unsupported network' });
      }
      
      // Auto-convert to USDC if buyToken not specified
      const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
      
      const params = new URLSearchParams({
        sellToken: sellToken as string,
        buyToken: targetBuyToken as string,
        sellAmount: sellAmount as string,
        takerAddress: takerAddress as string,
        slippagePercentage: (slippagePercentage as string) || '0.01' // Default 1% slippage
      });
      
      const response = await fetch(`${ZX_BASE_URL}/swap/v1/${networkId}/quote?${params}`, {
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`0x quote response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('0x quote error:', error);
        return res.status(response.status).json({ error: 'Failed to get swap quote' });
      }
      
      const data = await response.json();
      console.log('0x quote response preview:', JSON.stringify(data).substring(0, 200));
      
      res.json(data);
    } catch (error) {
      console.error('0x quote proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch quote from 0x API' });
    }
  });

  // Gasless swap endpoint using 0x gasless API
  app.post("/api/0x/:chainId/gasless-quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { sellToken, buyToken, sellAmount, takerAddress } = req.body;
      
      console.log(`0x gasless quote request: ${chainId} - ${sellToken} to ${buyToken}, amount: ${sellAmount}`);
      
      // Convert chain ID to 0x network identifier
      const networkId = ZX_CHAIN_MAPPING[chainId];
      if (!networkId) {
        return res.status(400).json({ error: 'Unsupported network for gasless swaps' });
      }
      
      // Auto-convert to USDC if buyToken not specified
      const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
      
      const requestBody = {
        sellToken,
        buyToken: targetBuyToken,
        sellAmount,
        takerAddress,
        slippagePercentage: 0.01 // 1% slippage
      };
      
      const response = await fetch(`${ZX_BASE_URL}/gasless/v1/${networkId}/quote`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`0x gasless quote response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('0x gasless quote error:', error);
        return res.status(response.status).json({ error: 'Failed to get gasless quote' });
      }
      
      const data = await response.json();
      console.log('0x gasless quote response preview:', JSON.stringify(data).substring(0, 200));
      
      res.json(data);
    } catch (error) {
      console.error('0x gasless quote proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch gasless quote from 0x API' });
    }
  });

  app.post("/api/0x/:chainId/gasless-submit", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { signature, tradeHash } = req.body;
      
      console.log(`0x gasless submit request: ${chainId} - tradeHash: ${tradeHash}`);
      
      // Convert chain ID to 0x network identifier
      const networkId = ZX_CHAIN_MAPPING[chainId];
      if (!networkId) {
        return res.status(400).json({ error: 'Unsupported network for gasless swaps' });
      }
      
      const requestBody = {
        signature,
        tradeHash
      };
      
      const response = await fetch(`${ZX_BASE_URL}/gasless/v1/${networkId}/submit`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log(`0x gasless submit response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('0x gasless submit error:', error);
        return res.status(response.status).json({ error: 'Failed to submit gasless swap' });
      }
      
      const data = await response.json();
      console.log('0x gasless submit response preview:', JSON.stringify(data).substring(0, 200));
      
      res.json(data);
    } catch (error) {
      console.error('0x gasless submit proxy error:', error);
      res.status(500).json({ error: 'Failed to submit gasless swap to 0x API' });
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
