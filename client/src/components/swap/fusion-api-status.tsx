
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function FusionAPIStatus() {
  const [status, setStatus] = useState<'checking' | 'live' | 'error'>('checking');

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        // Test if our backend proxy can reach 1inch Fusion API
        const response = await fetch('/api/1inch/1/fusion/quote?src=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dst=0xA0b86a33E6e3B0c8c8d7d45b40b9b5Ba0b3D0e8B&amount=1000000000000000000&from=0x0000000000000000000000000000000000000000');
        
        if (response.ok || response.status === 400) { // 400 is expected for invalid params, means API is reachable
          setStatus('live');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    checkAPIStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkAPIStatus, 30000);
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
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Badge variant={statusInfo.variant} className="flex items-center gap-1">
      {statusInfo.icon}
      <span className="text-xs">{statusInfo.text}</span>
    </Badge>
  );
}
