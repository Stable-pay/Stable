import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Environment validation function
function validateEnvironment() {
  const requiredEnvVars = [
    'VITE_WALLETCONNECT_PROJECT_ID',
    'VITE_DOMAIN_VERIFICATION_ID'
  ];

  const optionalEnvVars = [
    'PARTICLE_PROJECT_ID',
    'PARTICLE_SERVER_KEY',
    'PARTICLE_CLIENT_KEY',
    'VITE_PARTICLE_PROJECT_ID',
    'VITE_PARTICLE_CLIENT_KEY',
    'VITE_PARTICLE_APP_ID',
    'VITE_PANCAKESWAP_API_KEY',
    'ETHEREUM_RPC_URL',
    'POLYGON_RPC_URL',
    'BSC_RPC_URL',
    'ARBITRUM_RPC_URL',
    'OPTIMISM_RPC_URL',
    'AVALANCHE_RPC_URL',
    'PRIVATE_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\n💡 Please add these to your .env file');
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables (some features may not work):');
    missingOptional.forEach(envVar => {
      console.warn(`   - ${envVar}`);
    });
  }

  console.log('✅ Environment validation passed');
  console.log(`📊 Required vars: ${requiredEnvVars.length - missing.length}/${requiredEnvVars.length}`);
  console.log(`📊 Optional vars: ${optionalEnvVars.length - missingOptional.length}/${optionalEnvVars.length}`);
}

// Enhanced global error handlers to prevent unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise);
  console.error('🔍 Reason:', reason);
  
  // Log stack trace if available
  if (reason instanceof Error) {
    console.error('📋 Stack:', reason.stack);
  }
  
  // Don't exit in production to avoid service interruption
  if (process.env.NODE_ENV !== 'production') {
    console.error('💥 Exiting due to unhandled rejection...');
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('📋 Stack:', error.stack);
  
  // Always exit on uncaught exceptions
  console.error('💥 Exiting due to uncaught exception...');
  process.exit(1);
});

// Additional error handlers for graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Validate environment before starting server
console.log('🔧 Validating environment configuration...');
validateEnvironment();

const app = express();

// Enhanced CORS configuration with environment-based origins
app.use((req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://stablepay.replit.app',
        'https://stable-pay.github.io',
        'https://stable.replit.dev'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5000', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'https://stablepay.replit.app'
      ];

  const origin = req.get('Origin');
  
  // Log CORS requests for debugging 403 issues
  console.log(`🌐 CORS request from origin: ${origin || 'no-origin'}`);
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    console.warn(`🚫 CORS blocked origin: ${origin}`);
    res.header('Access-Control-Allow-Origin', 'null');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Direct route for WalletConnect verification file
  app.get('/.well-known/walletconnect.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send('6ba49384-9b1e-4504-abd7-c9a17883825d=a960fcfcc04f45cd58e81d5ab23661c3e6d6b0b0f28a815e61d84ccaa1e9bc81');
  });

  // Serve other .well-known files statically
  app.use('/.well-known', express.static(path.resolve('.well-known')));

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // Enhanced logging for 403 errors
    if (status === 403) {
      console.error('🚫 403 Forbidden Error Details:');
      console.error(`   📍 URL: ${req.method} ${req.originalUrl}`);
      console.error(`   🌐 IP: ${ip}`);
      console.error(`   🖥️  User-Agent: ${userAgent}`);
      console.error(`   📋 Message: ${message}`);
      console.error(`   🔍 Headers:`, JSON.stringify(req.headers, null, 2));
      if (req.body && Object.keys(req.body).length > 0) {
        console.error(`   📦 Body:`, JSON.stringify(req.body, null, 2));
      }
    }

    // Enhanced error response with user-friendly messages
    const errorResponse: any = {
      error: message,
      status,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };

    // Add user-friendly messages for common errors
    switch (status) {
      case 403:
        errorResponse.userMessage = 'Access denied. Please check your permissions or contact support.';
        errorResponse.code = 'FORBIDDEN';
        break;
      case 404:
        errorResponse.userMessage = 'The requested resource was not found.';
        errorResponse.code = 'NOT_FOUND';
        break;
      case 401:
        errorResponse.userMessage = 'Authentication required. Please log in and try again.';
        errorResponse.code = 'UNAUTHORIZED';
        break;
      case 500:
        errorResponse.userMessage = 'An internal server error occurred. Please try again later.';
        errorResponse.code = 'INTERNAL_ERROR';
        break;
      default:
        errorResponse.userMessage = message;
        errorResponse.code = 'GENERIC_ERROR';
    }

    // Don't expose error details in production
    if (process.env.NODE_ENV === 'production' && status === 500) {
      errorResponse.error = 'Internal Server Error';
    }

    res.status(status).json(errorResponse);
    
    // Only throw in development for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('🔍 Error stack:', err.stack);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Directly serve assets with proper MIME types before Vite can intercept
    app.get('/assets/*', express.static(path.resolve('client/dist/assets'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        res.setHeader('Cache-Control', 'no-cache');
      }
    }));
    
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();