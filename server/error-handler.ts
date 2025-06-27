import { Request, Response, NextFunction } from 'express';

/**
 * Standardized API Error Response Interface
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Standardized API Success Response Interface
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common API Error Types
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} service error: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', true, details);
  }
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request ID middleware
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Centralized Error Handling Middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log error details
  console.error('🚨 API Error:', {
    requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Handle known application errors
  if (err instanceof AppError) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle mongoose/database validation errors
  if (err.name === 'ValidationError') {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.message,
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    return res.status(400).json(errorResponse);
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON format in request body',
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    return res.status(400).json(errorResponse);
  }

  // Handle unknown errors
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  res.status(500).json(errorResponse);
}

/**
 * 404 Handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.headers['x-request-id'] as string;
  
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  res.status(404).json(errorResponse);
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, req?: Request): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: req?.headers['x-request-id'] as string
  };
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * API timeout middleware
 */
export function timeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const requestId = req.headers['x-request-id'] as string;
        const errorResponse: ApiErrorResponse = {
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: `Request timeout after ${timeoutMs}ms`,
            timestamp: new Date().toISOString(),
            requestId
          }
        };
        res.status(408).json(errorResponse);
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
}