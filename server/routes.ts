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

export async function registerRoutes(app: Express): Promise<Server> {
  
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
