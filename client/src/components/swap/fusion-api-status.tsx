
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function FusionAPIStatus() {
  const [status, setStatus] = useState<'checking' | 'live' | 'error'>('checking');

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        // Test if our backend proxy can reach 1inch Fusion API
        const response = await fetch('/api/1inch/1/fusion/quote?src=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dst=0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B&amount=1000000000000000000&from=0x0000000000000000000000000000000000000000');
        
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

  return (
    <div className="flex items-center gap-2">
      {status === 'checking' && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Checking API
        </Badge>
      )}
      {status === 'live' && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          1inch Fusion Live
        </Badge>
      )}
      {status === 'error' && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          API Error
        </Badge>
      )}
    </div>
  );
}
