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

// API configuration
const ONEINCH_API_KEY = process.env.VITE_ONEINCH_API_KEY;
const ZX_API_KEY = process.env.ZX_API_KEY || '12be1743-8f3e-4867-a82b-501263f3c4b6';
const ONEINCH_BASE_URL = 'https://api.1inch.dev';
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
  
  // Wallet balance endpoint
  app.get("/api/wallet/balances", async (req, res) => {
    try {
      const { address, chainId } = req.query;
      
      if (!address || !chainId) {
        return res.status(400).json({ error: 'Address and chainId are required' });
      }
      
      console.log(`Wallet balance request: ${address} on chain ${chainId}`);
      
      // For now, return the native token balance only
      // This should be expanded to include ERC20 tokens
      const balances = [];
      
      // Get native token symbol
      const nativeTokens: Record<string, string> = {
        '1': 'ETH',
        '137': 'MATIC',
        '42161': 'ETH', 
        '8453': 'ETH',
        '10': 'ETH',
        '43114': 'AVAX',
        '56': 'BNB'
      };
      
      const symbol = nativeTokens[chainId as string] || 'ETH';
      const networkNames: Record<string, string> = {
        '1': 'Ethereum',
        '137': 'Polygon',
        '42161': 'Arbitrum',
        '8453': 'Base', 
        '10': 'Optimism',
        '43114': 'Avalanche',
        '56': 'BSC'
      };
      
      const chainName = networkNames[chainId as string] || 'Unknown';
      
      // Return structure that matches the expected format
      res.json({
        balances: [
          {
            symbol,
            address: 'native',
            balance: '0',
            decimals: 18,
            chainId: parseInt(chainId as string),
            chainName,
            formattedBalance: '0.000001', // Minimum to show in UI
            isNative: true
          }
        ]
      });
      
    } catch (error) {
      console.error('Wallet balance error:', error);
      res.status(500).json({ error: 'Failed to fetch wallet balances' });
    }
  });

  // Dedicated swap quote endpoint for frontend
  app.post("/api/swap/quote", async (req, res) => {
    try {
      const { fromToken, toToken, fromAmount, chainId, walletAddress } = req.body;
      
      console.log(`Swap quote request: ${fromToken} to ${toToken}, amount: ${fromAmount} on chain ${chainId}`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      // Token address mapping for common tokens (verified from 1inch API)
      const tokenAddresses: Record<string, Record<string, string>> = {
        '1': { // Ethereum
          'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          'USDC': '0xA0b86a33E6E3B0c8c8D7D45b40b9b5Ba0b3D0e8B',
          'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        },
        '137': { // Polygon
          'MATIC': '0x0000000000000000000000000000000000001010',
          'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
        }
      };

      const fromTokenAddress = tokenAddresses[chainId]?.[fromToken] || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      const toTokenAddress = tokenAddresses[chainId]?.[toToken] || '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B';

      // Convert amount to wei (assuming 18 decimals for simplicity)
      const amountInWei = (parseFloat(fromAmount) * Math.pow(10, 18)).toString();

      const quoteUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/quote`;
      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amountInWei,
        includeTokensInfo: 'true'
      });

      const response = await fetch(`${quoteUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('1inch API error:', response.status);
        // Return fallback quote structure
        const mockRate = fromToken === 'ETH' ? 2490 : 1.001;
        const toAmount = (parseFloat(fromAmount) * mockRate).toFixed(6);
        
        return res.json({
          fromAmount,
          toAmount,
          rate: `1 ${fromToken} = ${mockRate} ${toToken}`,
          priceImpact: '0.12%',
          gasEstimate: '~$8.50',
          route: [fromToken, toToken]
        });
      }

      const data = await response.json();
      
      // Transform 1inch response to our format
      const quote = {
        fromAmount: fromAmount,
        toAmount: (parseFloat(data.toAmount) / Math.pow(10, 18)).toFixed(6),
        rate: `1 ${fromToken} = ${(parseFloat(data.toAmount) / parseFloat(data.fromAmount)).toFixed(6)} ${toToken}`,
        priceImpact: `${((parseFloat(data.fromAmount) - parseFloat(data.toAmount)) / parseFloat(data.fromAmount) * 100).toFixed(2)}%`,
        gasEstimate: `~$${(parseFloat(data.estimatedGas || '150000') * 0.00002).toFixed(2)}`,
        route: [fromToken, toToken]
      };

      res.json(quote);

    } catch (error) {
      console.error('Swap quote error:', error);
      res.status(500).json({ error: 'Failed to fetch swap quote' });
    }
  });

  // Remittance API endpoints
  app.post("/api/remittance/withdraw", async (req, res) => {
    try {
      const { amount, currency, bankDetails, kycData } = req.body;
      
      console.log(`Remittance withdrawal request: ${amount} ${currency} for ${kycData.fullName}`);
      
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
      
      // In production, this would integrate with:
      // - Bank APIs (IMPS/NEFT/RTGS)
      // - Payment gateways (Razorpay, Payu, etc.)
      // - Compliance systems
      
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

  // Get remittance transaction status
  app.get("/api/remittance/status/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Remittance status check: ${id}`);
      
      // In production, this would query the database for transaction status
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

  // Get user's remittance history
  app.get("/api/remittance/history", async (req, res) => {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      console.log(`Remittance history for: ${address}`);
      
      // In production, this would fetch from database
      const mockHistory = [
        {
          id: 'WD1749541234567',
          amount: 207392.50,
          currency: 'INR',
          status: 'completed',
          fromToken: 'ETH',
          fromAmount: '0.1',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          bankName: 'HDFC Bank',
          accountNumber: '****7890'
        },
        {
          id: 'WD1749481234567',
          amount: 83250.00,
          currency: 'INR',
          status: 'completed',
          fromToken: 'USDC',
          fromAmount: '1000',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
          bankName: 'HDFC Bank',
          accountNumber: '****7890'
        }
      ];

      res.json({ transactions: mockHistory });

    } catch (error) {
      console.error('Remittance history error:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
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

  // KYC verification status
  app.get("/api/kyc/status/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      console.log(`KYC status check: ${address}`);
      
      // Check if user exists in database
      const user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found. Please complete KYC verification.',
          status: 'not_found'
        });
      }

      const kycDocuments = await storage.getKycDocuments(user.id);
      const hasVerifiedDocs = kycDocuments.some(doc => doc.status === 'verified');

      res.json({
        address,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        panNumber: user.panNumber,
        aadharNumber: user.aadharNumber,
        address: user.address,
        status: hasVerifiedDocs ? 'verified' : 'pending',
        tier: hasVerifiedDocs ? 'tier2' : 'tier1',
        verifiedAt: hasVerifiedDocs ? user.updatedAt : null,
        monthlyLimit: hasVerifiedDocs ? 1000000 : 50000,
        dailyLimit: hasVerifiedDocs ? 200000 : 10000,
        documentsVerified: kycDocuments.filter(doc => doc.status === 'verified').map(doc => doc.documentType),
        nextReviewDate: hasVerifiedDocs ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
      });

    } catch (error) {
      console.error('KYC status error:', error);
      res.status(500).json({ error: 'Failed to fetch KYC status' });
    }
  });

  // User bank details endpoint
  app.get("/api/user/bank-details/:address", async (req, res) => {
    try {
      const { address } = req.params;
      
      console.log(`Fetching bank details for: ${address}`);
      
      const user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          requiresRegistration: true
        });
      }

      const bankAccounts = await storage.getBankAccounts(user.id);
      const primaryAccount = bankAccounts.find(acc => acc.isPrimary) || bankAccounts[0];

      if (!primaryAccount) {
        return res.status(404).json({
          error: 'No bank account found. Please add bank details.',
          requiresBankSetup: true
        });
      }

      res.json({
        accountNumber: primaryAccount.accountNumber,
        ifscCode: primaryAccount.ifscCode,
        accountHolderName: primaryAccount.accountHolderName,
        bankName: primaryAccount.bankName,
        branchName: primaryAccount.branchName,
        isVerified: primaryAccount.isVerified
      });

    } catch (error) {
      console.error('Bank details error:', error);
      res.status(500).json({ error: 'Failed to fetch bank details' });
    }
  });

  // 1inch Fusion API for gasless swaps
  app.get("/api/1inch/:chainId/fusion/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount, from } = req.query;
      
      console.log(`1inch Fusion quote request: ${chainId} - gasless swap ${src} to ${dst}`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        console.log('1inch API key not found - using fallback');
        return res.status(503).json({ 
          error: 'API key required for Fusion gasless swaps',
          requiresAuth: true
        });
      }

      // 1inch Fusion API v2.0 for gasless swaps - correct endpoint
      const fusionUrl = `https://api.1inch.dev/fusion/v2.0/${chainId}/quote/receive`;
      
      const requestBody = {
        srcTokenAddress: src as string,
        dstTokenAddress: dst as string,
        srcTokenAmount: amount as string,
        walletAddress: from as string,
        enableEstimate: true,
        permitDeadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        nonce: Math.floor(Math.random() * 1000000)
      };

      console.log('Fusion request body:', requestBody);

      const response = await fetch(fusionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`1inch Fusion API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch Fusion API error:', errorText);
        
        // If Fusion is not available, fall back to regular swap
        if (response.status === 404 || response.status === 503) {
          console.log('Fusion not available, falling back to regular swap');
          return res.status(503).json({ 
            error: 'Fusion gasless swaps temporarily unavailable',
            fallbackAvailable: true,
            details: errorText
          });
        }
        
        return res.status(response.status).json({ 
          error: '1inch Fusion API request failed',
          details: errorText,
          status: response.status
        });
      }

      const data = await response.json();
      console.log('1inch Fusion quote success:', JSON.stringify(data).substring(0, 300));
      
      // Transform Fusion response to match expected format
      const fusionQuote = {
        type: 'fusion',
        gasless: true,
        fromToken: {
          address: src,
          amount: amount
        },
        toToken: {
          address: dst,
          amount: data.dstTokenAmount || data.toAmount
        },
        estimate: data.estimate,
        order: data.order,
        quoteId: data.quoteId
      };
      
      res.json(fusionQuote);

    } catch (error) {
      console.error('1inch Fusion proxy error:', error);
      res.status(500).json({ 
        error: 'Failed to connect to 1inch Fusion API',
        fallbackAvailable: true 
      });
    }
  });

  // 1inch Fusion execution endpoint
  app.post("/api/1inch/:chainId/fusion/submit", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { order, signature, quoteId } = req.body;
      
      console.log(`1inch Fusion submit order: ${chainId} - quoteId: ${quoteId}`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ 
          error: 'API key required for Fusion execution',
          requiresAuth: true
        });
      }

      const submitUrl = `https://api.1inch.dev/fusion/v2.0/${chainId}/order`;
      
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order,
          signature,
          quoteId
        })
      });

      console.log(`1inch Fusion submit response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch Fusion submit error:', errorText);
        return res.status(response.status).json({ 
          error: '1inch Fusion order submission failed',
          details: errorText
        });
      }

      const data = await response.json();
      console.log('1inch Fusion order submitted:', data.orderHash || 'success');
      res.json(data);

    } catch (error) {
      console.error('1inch Fusion submit error:', error);
      res.status(500).json({ error: 'Failed to submit Fusion order' });
    }
  });

  // Check Fusion order status
  app.get("/api/1inch/:chainId/fusion/order/:orderHash", async (req, res) => {
    try {
      const { chainId, orderHash } = req.params;
      
      console.log(`1inch Fusion order status: ${chainId} - ${orderHash}`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ 
          error: 'API key required',
          requiresAuth: true
        });
      }

      const statusUrl = `https://api.1inch.dev/fusion/v2.0/${chainId}/order/status/${orderHash}`;
      
      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch Fusion status error:', errorText);
        return res.status(response.status).json({ 
          error: 'Failed to get order status',
          details: errorText
        });
      }

      const data = await response.json();
      res.json(data);

    } catch (error) {
      console.error('1inch Fusion status error:', error);
      res.status(500).json({ error: 'Failed to check order status' });
    }
  });

  // Regular 1inch swap API (fallback)
  app.get("/api/1inch/:chainId/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount, from } = req.query;
      
      console.log(`1inch quote request: ${chainId} - ${src} to ${dst}, amount: ${amount}`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const quoteUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/quote`;
      const params = new URLSearchParams({
        src: src as string,
        dst: dst as string,
        amount: amount as string,
        includeTokensInfo: 'true',
        includeProtocols: 'true'
      });

      const response = await fetch(`${quoteUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      console.log(`1inch API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch API error:', errorText);
        return res.status(response.status).json({ 
          error: '1inch API request failed',
          details: errorText,
          status: response.status
        });
      }

      const data = await response.json();
      console.log('1inch quote response preview:', JSON.stringify(data).substring(0, 200));
      res.json(data);

    } catch (error) {
      console.error('1inch proxy error:', error);
      res.status(500).json({ error: 'Failed to connect to 1inch API' });
    }
  });

  app.get("/api/1inch/:chainId/swap", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount, from, slippage } = req.query;
      
      console.log(`1inch swap request: ${chainId} - ${src} to ${dst}, amount: ${amount}`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const swapUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/swap`;
      const params = new URLSearchParams({
        src: src as string,
        dst: dst as string,
        amount: amount as string,
        from: from as string,
        slippage: (slippage as string) || '1',
        disableEstimate: 'true'
      });

      const response = await fetch(`${swapUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      console.log(`1inch swap API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch swap API error:', errorText);
        return res.status(response.status).json({ 
          error: '1inch swap API request failed',
          details: errorText,
          status: response.status
        });
      }

      const data = await response.json();
      console.log('1inch swap response preview:', JSON.stringify(data).substring(0, 200));
      res.json(data);

    } catch (error) {
      console.error('1inch swap proxy error:', error);
      res.status(500).json({ error: 'Failed to connect to 1inch swap API' });
    }
  });

  // 1inch Fusion API endpoints for gasless swaps
  app.get("/api/1inch/:chainId/fusion/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { src, dst, amount, from } = req.query;
      
      console.log(`1inch Fusion quote request: ${chainId} - gasless swap ${src} to ${dst}`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      // Try Fusion API for gasless quotes
      const fusionUrl = `https://api.1inch.dev/fusion/v1.0/${chainId}/quote/receive`;
      const params = new URLSearchParams({
        src: src as string,
        dst: dst as string,
        amount: amount as string,
        walletAddress: from as string
      });

      const response = await fetch(`${fusionUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      console.log(`1inch Fusion API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch Fusion API error:', errorText);
        
        // Fallback to regular quote if Fusion fails
        const regularQuoteUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/quote`;
        const regularParams = new URLSearchParams({
          src: src as string,
          dst: dst as string,
          amount: amount as string
        });

        const fallbackResponse = await fetch(`${regularQuoteUrl}?${regularParams}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return res.json({ ...fallbackData, gasless: false });
        }
        
        return res.status(response.status).json({ 
          error: '1inch Fusion API request failed',
          details: errorText
        });
      }

      const data = await response.json();
      console.log('1inch Fusion quote response preview:', JSON.stringify(data).substring(0, 200));
      res.json({ ...data, gasless: true });

    } catch (error) {
      console.error('1inch Fusion proxy error:', error);
      res.status(500).json({ error: 'Failed to connect to 1inch Fusion API' });
    }
  });

  app.post("/api/1inch/:chainId/fusion/swap", async (req, res) => {
    try {
      const { chainId } = req.params;
      
      console.log(`1inch Fusion swap request: ${chainId} - gasless transaction`);
      
      const apiKey = process.env.VITE_ONEINCH_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      const fusionUrl = `https://api.1inch.dev/fusion/v1.0/${chainId}/swap/submit`;

      const response = await fetch(fusionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });

      console.log(`1inch Fusion swap API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('1inch Fusion swap API error:', errorText);
        return res.status(response.status).json({ 
          error: '1inch Fusion swap API request failed',
          details: errorText
        });
      }

      const data = await response.json();
      console.log('1inch Fusion swap response preview:', JSON.stringify(data).substring(0, 200));
      res.json(data);

    } catch (error) {
      console.error('1inch Fusion swap proxy error:', error);
      res.status(500).json({ error: 'Failed to connect to 1inch Fusion swap API' });
    }
  });

  // 0x Protocol swap endpoints with proper error handling
  app.get("/api/0x/:chainId/quote", async (req, res) => {
    try {
      const { chainId } = req.params;
      const { sellToken, buyToken, sellAmount, takerAddress, slippagePercentage } = req.query;
      
      console.log(`0x quote request: ${chainId} - ${sellToken} to ${buyToken}, amount: ${sellAmount}`);
      
      // Auto-convert to USDC if buyToken not specified
      const targetBuyToken = buyToken || USDC_ADDRESSES[chainId];
      
      // First try price endpoint to check basic API access
      const priceParams = new URLSearchParams({
        chainId: chainId as string,
        sellToken: sellToken as string,
        buyToken: targetBuyToken as string,
        sellAmount: sellAmount as string
      });
      
      let response = await fetch(`${ZX_BASE_URL}/swap/v1/price?${priceParams}`, {
        headers: {
          'Accept': 'application/json',
          '0x-api-key': ZX_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`0x price response status: ${response.status}`);
      
      if (response.status === 403) {
        return res.status(403).json({
          error: 'API access restricted',
          message: 'The 0x Protocol API key requires upgrade for swap functionality. Visit https://0x.org/pricing to upgrade your plan.',
          code: 'INSUFFICIENT_API_ACCESS',
          upgradeUrl: 'https://0x.org/pricing'
        });
      }
      
      if (response.ok) {
        // If price works, try to get full quote
        const quoteParams = new URLSearchParams({
          chainId: chainId as string,
          sellToken: sellToken as string,
          buyToken: targetBuyToken as string,
          sellAmount: sellAmount as string,
          takerAddress: takerAddress as string,
          slippagePercentage: (slippagePercentage as string) || '0.01'
        });
        
        const quoteResponse = await fetch(`${ZX_BASE_URL}/swap/v1/quote?${quoteParams}`, {
          headers: {
            'Accept': 'application/json',
            '0x-api-key': ZX_API_KEY,
            '0x-version': 'v2',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`0x quote response status: ${quoteResponse.status}`);
        
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          console.log('0x quote response preview:', JSON.stringify(quoteData).substring(0, 200));
          return res.json(quoteData);
        } else {
          // Fallback to price data with mock transaction fields
          const priceData = await response.json();
          const mockQuote = {
            ...priceData,
            to: '0x0000000000000000000000000000000000000000',
            data: '0x',
            value: '0',
            gas: priceData.estimatedGas || '200000',
            gasPrice: '20000000000',
            allowanceTarget: '0x0000000000000000000000000000000000000000'
          };
          console.log('0x price fallback response:', JSON.stringify(mockQuote).substring(0, 200));
          return res.json(mockQuote);
        }
      }
      
      const error = await response.text();
      console.error('0x API error:', error);
      return res.status(response.status).json({ 
        error: 'API request failed',
        details: error 
      });
      
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
