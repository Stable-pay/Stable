/**
 * Network error handling utilities for API calls
 * Provides user-friendly error messages and proper error logging
 */

export interface ApiError {
  status: number;
  message: string;
  userMessage: string;
  code: string;
  timestamp?: string;
  path?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Enhanced fetch with error handling and user-friendly messages
 */
export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle different HTTP status codes with user-friendly messages
      const apiError: ApiError = {
        status: response.status,
        message: responseData.error || responseData.message || 'Unknown error',
        userMessage: getUserFriendlyMessage(response.status, responseData),
        code: responseData.code || `HTTP_${response.status}`,
        timestamp: responseData.timestamp,
        path: responseData.path || url
      };

      // Log 403 errors specifically for debugging
      if (response.status === 403) {
        console.error('🚫 403 Forbidden Error Details:');
        console.error(`   📍 URL: ${url}`);
        console.error(`   📋 Response:`, responseData);
        console.error(`   🔍 Headers:`, Object.fromEntries(response.headers.entries()));
      }

      // Log other errors
      console.error(`❌ API Error (${response.status}):`, apiError);

      return {
        success: false,
        error: apiError
      };
    }

    console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
    return {
      success: true,
      data: responseData
    };

  } catch (error) {
    console.error('🔥 Network Error:', error);
    
    const networkError: ApiError = {
      status: 0,
      message: error instanceof Error ? error.message : 'Network error',
      userMessage: getNetworkErrorMessage(error),
      code: 'NETWORK_ERROR'
    };

    return {
      success: false,
      error: networkError
    };
  }
}

/**
 * Get user-friendly error messages based on HTTP status codes
 */
function getUserFriendlyMessage(status: number, responseData: any): string {
  // Use server-provided user message if available
  if (responseData.userMessage) {
    return responseData.userMessage;
  }

  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in and try again.';
    case 403:
      return 'Access denied. You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'A server error occurred. Please try again later.';
    case 502:
      return 'Service temporarily unavailable. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return responseData.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get user-friendly network error messages
 */
function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
  }
  
  return 'A network error occurred. Please check your connection and try again.';
}

/**
 * Wrapper for GET requests
 */
export async function apiGet<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiCall<T>(url, { method: 'GET' });
}

/**
 * Wrapper for POST requests
 */
export async function apiPost<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Wrapper for PUT requests
 */
export async function apiPut<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Wrapper for DELETE requests
 */
export async function apiDelete<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiCall<T>(url, { method: 'DELETE' });
}

/**
 * React hook for API calls with error handling
 */
export function useApi() {
  const handleApiError = (error: ApiError) => {
    // Show user-friendly error message to user (you can integrate with your toast/notification system)
    console.error('API Error:', error.userMessage);
    
    // In a real app, you might want to show a toast notification:
    // toast.error(error.userMessage);
    
    return error;
  };

  const get = async <T = any>(url: string): Promise<T | null> => {
    const response = await apiGet<T>(url);
    if (!response.success) {
      handleApiError(response.error!);
      return null;
    }
    return response.data!;
  };

  const post = async <T = any>(url: string, data?: any): Promise<T | null> => {
    const response = await apiPost<T>(url, data);
    if (!response.success) {
      handleApiError(response.error!);
      return null;
    }
    return response.data!;
  };

  const put = async <T = any>(url: string, data?: any): Promise<T | null> => {
    const response = await apiPut<T>(url, data);
    if (!response.success) {
      handleApiError(response.error!);
      return null;
    }
    return response.data!;
  };

  const del = async <T = any>(url: string): Promise<T | null> => {
    const response = await apiDelete<T>(url);
    if (!response.success) {
      handleApiError(response.error!);
      return null;
    }
    return response.data!;
  };

  return {
    get,
    post,
    put,
    delete: del,
    handleApiError
  };
}