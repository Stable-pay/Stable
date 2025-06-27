import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * API Error Response Interface (matches server error format)
 */
interface ApiErrorResponse {
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
 * API Success Response Interface (matches server success format)
 */
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * Custom API Error class for better error handling
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly requestId?: string;
  public readonly timestamp: string;

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.error.message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = response.error.code;
    this.details = response.error.details;
    this.requestId = response.error.requestId;
    this.timestamp = response.error.timestamp;
  }

  /**
   * Check if error is a specific type
   */
  isType(code: string): boolean {
    return this.code === code;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'VALIDATION_ERROR':
        return this.message;
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'UNAUTHORIZED':
        return 'You are not authorized to access this resource.';
      case 'FORBIDDEN':
        return 'Access to this resource is forbidden.';
      case 'REQUEST_TIMEOUT':
        return 'Request timed out. Please check your connection and try again.';
      case 'EXTERNAL_SERVICE_ERROR':
        return 'External service is temporarily unavailable. Please try again later.';
      case 'INTERNAL_ERROR':
      default:
        return process.env.NODE_ENV === 'development' 
          ? this.message 
          : 'An unexpected error occurred. Please try again.';
    }
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorResponse: ApiErrorResponse;
    
    try {
      const jsonResponse = await res.json();
      
      // Check if it's our structured error format
      if (jsonResponse.success === false && jsonResponse.error) {
        errorResponse = jsonResponse;
      } else {
        // Fallback for non-structured errors
        errorResponse = {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: jsonResponse.message || res.statusText || 'Unknown error occurred',
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch {
      // Fallback if response is not JSON
      errorResponse = {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: res.statusText || 'Unknown error occurred',
          timestamp: new Date().toISOString()
        }
      };
    }

    throw new ApiError(errorResponse, res.status);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Log error for debugging
    console.error('API Request Error:', {
      method,
      url,
      error: error instanceof ApiError ? {
        code: error.code,
        message: error.message,
        requestId: error.requestId
      } : error
    });
    
    throw error;
  }
}

/**
 * Enhanced query function with better error handling
 */
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      const jsonResponse = await res.json();
      
      // Return data directly if it's our structured success format
      if (jsonResponse.success === true && jsonResponse.data !== undefined) {
        return jsonResponse.data;
      }
      
      // Return entire response for backwards compatibility
      return jsonResponse;
    } catch (error) {
      console.error('Query Error:', {
        url: queryKey[0],
        error: error instanceof ApiError ? {
          code: error.code,
          message: error.message,
          requestId: error.requestId
        } : error
      });
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry validation errors or client errors
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
    },
  },
});
