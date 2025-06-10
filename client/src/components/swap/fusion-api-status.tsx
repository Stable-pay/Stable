import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from 'lucide-react';

export function FusionAPIStatus() {
  const [status, setStatus] = useState<'checking' | 'live' | 'demo' | 'offline'>('checking');
  const [apiDetails, setApiDetails] = useState<{
    hasApiKey: boolean;
    endpoint: string;
    lastCheck: string;
    fusionAvailable?: boolean;
    regularAvailable?: boolean;
  } | null>(null);

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        // Check if API key is configured
        const apiKey = import.meta.env.VITE_ONEINCH_API_KEY;
        const hasApiKey = !!apiKey;

        if (!hasApiKey) {
          setStatus('demo');
          setApiDetails({
            hasApiKey: false,
            endpoint: 'Demo Mode - Add API key for live trading',
            lastCheck: new Date().toLocaleTimeString(),
            fusionAvailable: false,
            regularAvailable: false
          });
          return;
        }

        // Test API connection with proper USDC address
        const testResponse = await fetch('/api/1inch/1/fusion/quote?src=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dst=0xA0b86a33E6441ED88A30C99A7a9449Aa84174&amount=1000000000000000000&from=0x0000000000000000000000000000000000000000');

        if (testResponse.ok) {
          const data = await testResponse.json();
          const fusionAvailable = data.type === 'fusion' && data.gasless;
          const regularAvailable = data.type === 'regular' || (data.type === 'mock' && !data.error);

          setStatus(fusionAvailable || regularAvailable ? 'live' : 'demo');
          setApiDetails({
            hasApiKey,
            endpoint: fusionAvailable ? '1inch Fusion (Gasless)' : regularAvailable ? '1inch Protocol' : 'Fallback Mode',
            lastCheck: new Date().toLocaleTimeString(),
            fusionAvailable,
            regularAvailable
          });
        } else {
          setStatus('demo');
          setApiDetails({
            hasApiKey,
            endpoint: 'API Error - Using fallback',
            lastCheck: new Date().toLocaleTimeString(),
            fusionAvailable: false,
            regularAvailable: false
          });
        }

      } catch (error) {
        console.error('API status check failed:', error);
        setStatus('offline');
        setApiDetails({
          hasApiKey: false,
          endpoint: 'Connection failed',
          lastCheck: new Date().toLocaleTimeString(),
          fusionAvailable: false,
          regularAvailable: false
        });
      }
    };

    checkAPIStatus();
    const interval = setInterval(checkAPIStatus, 45000); // Check every 45 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          variant: 'secondary' as const,
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Checking API...'
        };
      case 'live':
        return {
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Live Trading'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'API Error'
        };
      case 'demo':
        return {
          variant: 'secondary' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'Demo Mode'
        };
      case 'offline':
        return {
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'API Offline'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-2">
      {status === 'checking' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
          <span className="text-xs text-gray-500">Checking...</span>
        </>
      )}

      {status === 'live' && (
        <>
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600 font-medium">
            {apiDetails?.fusionAvailable ? 'FUSION LIVE' : 'LIVE'}
          </span>
        </>
      )}

      {status === 'demo' && (
        <>
          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          <span className="text-xs text-yellow-600 font-medium">DEMO</span>
        </>
      )}

      {status === 'offline' && (
        <>
          <div className="h-2 w-2 bg-red-500 rounded-full" />
          <span className="text-xs text-red-600 font-medium">OFFLINE</span>
        </>
      )}

      {apiDetails && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p><strong>Endpoint:</strong> {apiDetails.endpoint}</p>
                <p><strong>API Key:</strong> {apiDetails.hasApiKey ? '✅ Configured' : '❌ Missing'}</p>
                <p><strong>Fusion Gasless:</strong> {apiDetails.fusionAvailable ? '✅ Available' : '❌ Not Available'}</p>
                <p><strong>Regular Swap:</strong> {apiDetails.regularAvailable ? '✅ Available' : '❌ Not Available'}</p>
                <p><strong>Last Check:</strong> {apiDetails.lastCheck}</p>
                <p className="text-blue-400 mt-2">
                  {status === 'live' ? '🚀 Production trading active' : 
                   status === 'demo' ? '⚠️ Demo mode - add API key for live trading' :
                   '🔴 Service unavailable'}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}