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

// 0x API configuration - Gasless v2 Implementation
const ZX_API_KEY = '12be1743-8f3e-4867-a82b-501263f3c4b6';
const ZX_BASE_URL = 'https://api.0x.org';

// Supported networks for gasless swaps (based on 0x documentation)
const GASLESS_SUPPORTED_CHAINS: Record<string, boolean> = {
  '1': true,     // Ethereum
  '137': true,   // Polygon
  '42161': true, // Arbitrum
  '8453': true,  // Base
  '10': true,    // Optimism
};

// USDC contract addresses per chain (verified addresses)
const USDC_ADDRESSES: Record<string, string> = {
  '1': '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B',      // Ethereum USDC
  '137': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',    // Polygon USDC
  '42161': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum USDC
  '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base USDC
  '10': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',    // Optimism USDC
};

// Native token representation
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // 0x swap quote endpoint - API access limited feedback
  app.get("/api/0x/:chainId/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { sellToken, buyToken, sellAmount, takerAddress, slippagePercentage } = req.query;
      
      console.log(`0x quote request: ${chainId} - ${sellToken} to ${buyToken}, amount: ${sellAmount}`);
      
      // Auto-convert to USDC if buyToken not specified
      const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
      
      // Test API access with current key
      const testParams = new URLSearchParams({
        chainId: chainId as string,
        sellToken: sellToken as string,
        buyToken: targetBuyToken as string,
        sellAmount: sellAmount as string
      });
      
      const response = await fetch(`${ZX_BASE_URL}/swap/v1/price?${testParams}`, {
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`0x API test response status: ${response.status}`);
      
      if (response.status === 403) {
        // API key doesn't have required access
        return res.status(403).json({
          error: 'API access restricted',
          message: 'The current 0x Protocol API key does not have access to swap endpoints. Please upgrade your API key plan to enable swapping functionality.',
          code: 'INSUFFICIENT_API_ACCESS'
        });
      }
      
      if (!response.ok) {
        const error = await response.text();
        console.error('0x API error:', error);
        return res.status(response.status).json({ 
          error: 'API request failed',
          details: error 
        });
      }
      
      const data = await response.json();
      console.log('0x response preview:', JSON.stringify(data).substring(0, 200));
      res.json(data);
      
    } catch (error) {
      console.error('0x quote proxy error:', error);
      res.status(500).json({ error: 'Failed to connect to 0x API' });
    }
  });

  // 0x Gasless v2 price endpoint - check gasless availability
  app.get("/api/0x/:chainId/gasless/price", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { sellToken, buyToken, sellAmount, takerAddress } = req.query;
      
      console.log(`0x gasless price request: ${chainId} - ${sellToken} to ${buyToken}, amount: ${sellAmount}`);
      
      // Check if gasless is supported on this chain
      if (!GASLESS_SUPPORTED_CHAINS[chainId]) {
        return res.status(400).json({ error: 'Gasless swaps not supported on this chain' });
      }
      
      // Auto-convert to USDC if buyToken not specified
      const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
      
      const params = new URLSearchParams({
        chainId: chainId,
        sellToken: sellToken as string,
        buyToken: targetBuyToken as string,
        sellAmount: sellAmount as string,
        takerAddress: takerAddress as string
      });
      
      const response = await fetch(`${ZX_BASE_URL}/gasless/price?${params}`, {
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          '0x-version': 'v2',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`0x gasless price response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('0x gasless price error:', error);
        return res.status(response.status).json({ error: 'Failed to get gasless price' });
      }
      
      const data = await response.json();
      console.log('0x gasless price response preview:', JSON.stringify(data).substring(0, 200));
      
      res.json(data);
    } catch (error) {
      console.error('0x gasless price proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch gasless price from 0x API' });
    }
  });

  // 0x Gasless v2 quote endpoint
  app.post("/api/0x/:chainId/gasless/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { sellToken, buyToken, sellAmount, takerAddress } = req.body;
      
      console.log(`0x gasless quote request: ${chainId} - ${sellToken} to ${buyToken}, amount: ${sellAmount}`);
      
      // Check if gasless is supported on this chain
      if (!GASLESS_SUPPORTED_CHAINS[chainId]) {
        return res.status(400).json({ error: 'Gasless swaps not supported on this chain' });
      }
      
      // Auto-convert to USDC if buyToken not specified
      const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
      
      const requestBody = {
        chainId: parseInt(chainId),
        sellToken: sellToken === 'native' ? NATIVE_TOKEN_ADDRESS : sellToken,
        buyToken: targetBuyToken,
        sellAmount,
        takerAddress
      };
      
      const response = await fetch(`${ZX_BASE_URL}/gasless/quote`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          '0x-version': 'v2',
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

  // 0x Gasless v2 submit endpoint
  app.post("/api/0x/:chainId/gasless/submit", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { signature, trade } = req.body;
      
      console.log(`0x gasless submit request: ${chainId} - trade ID: ${trade?.tradeHash}`);
      
      // Check if gasless is supported on this chain
      if (!GASLESS_SUPPORTED_CHAINS[chainId]) {
        return res.status(400).json({ error: 'Gasless swaps not supported on this chain' });
      }
      
      const requestBody = {
        signature,
        trade
      };
      
      const response = await fetch(`${ZX_BASE_URL}/gasless/submit`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          '0x-version': 'v2',
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

  // 0x Gasless v2 status endpoint
  app.get("/api/0x/:chainId/gasless/status/:tradeHash", async (req, res) => {
    try {
      const { chainId, tradeHash } = req.params;
      
      console.log(`0x gasless status request: ${chainId} - tradeHash: ${tradeHash}`);
      
      // Check if gasless is supported on this chain
      if (!GASLESS_SUPPORTED_CHAINS[chainId]) {
        return res.status(400).json({ error: 'Gasless swaps not supported on this chain' });
      }
      
      const response = await fetch(`${ZX_BASE_URL}/gasless/status/${tradeHash}`, {
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          '0x-version': 'v2',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`0x gasless status response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('0x gasless status error:', error);
        return res.status(response.status).json({ error: 'Failed to get gasless swap status' });
      }
      
      const data = await response.json();
      console.log('0x gasless status response preview:', JSON.stringify(data).substring(0, 200));
      
      res.json(data);
    } catch (error) {
      console.error('0x gasless status proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch gasless swap status from 0x API' });
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
