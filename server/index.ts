import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { config } from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironmentOnStartup } from "./env-validator";
import { 
  errorHandler, 
  notFoundHandler, 
  requestIdMiddleware, 
  timeoutMiddleware 
} from "./error-handler";

// Load environment variables
config();

// Validate environment variables before starting server
if (!validateEnvironmentOnStartup()) {
  console.error('❌ Server startup failed due to environment validation errors');
  process.exit(1);
}

// Global error handlers to prevent unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Add logging service integration (e.g., Sentry, LogRocket)
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Add logging service integration (e.g., Sentry, LogRocket)
  }
  process.exit(1);
});

const app = express();

// Add request ID and timeout middleware
app.use(requestIdMiddleware);
app.use(timeoutMiddleware(30000)); // 30 second timeout

// Add CORS headers with improved error handling
app.use((req, res, next) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  } catch (error) {
    console.error('CORS middleware error:', error);
    next(error);
  }
});

// JSON parsing with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  }
}));
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Use our enhanced error handler instead
    errorHandler(err, _req, res, _next);
  });

  // Add 404 handler for unknown routes (before static files)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/.well-known')) {
      return next(); // Let static file handlers deal with it
    }
    notFoundHandler(req, res);
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