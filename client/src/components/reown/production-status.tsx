import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, Clock, Wifi, Server, Shield, ExternalLink } from "lucide-react";

interface SystemStatus {
  verificationFile: 'active' | 'error' | 'checking';
  httpsAccess: 'available' | 'unavailable' | 'checking';
  apiHealth: 'healthy' | 'error' | 'checking';
  reownIntegration: 'configured' | 'pending' | 'checking';
}

export function ProductionStatus() {
  const { toast } = useToast();
  const [status, setStatus] = useState<SystemStatus>({
    verificationFile: 'checking',
    httpsAccess: 'checking',
    apiHealth: 'checking',
    reownIntegration: 'checking'
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const currentDomain = window.location.origin;
  const projectId = '6dfca9af31141b1fb9220aa7db3eee37';

  const runStatusCheck = async () => {
    const newStatus: SystemStatus = {
      verificationFile: 'checking',
      httpsAccess: 'checking',
      apiHealth: 'checking',
      reownIntegration: 'checking'
    };

    try {
      // Check HTTPS availability
      newStatus.httpsAccess = currentDomain.startsWith('https://') ? 'available' : 'unavailable';

      // Check verification file
      const verificationResponse = await fetch('/.well-known/walletconnect.txt');
      if (verificationResponse.ok) {
        const content = await verificationResponse.text();
        newStatus.verificationFile = content.trim() === projectId ? 'active' : 'error';
      } else {
        newStatus.verificationFile = 'error';
      }

      // Check API health
      const healthResponse = await fetch('/api/health');
      newStatus.apiHealth = healthResponse.ok ? 'healthy' : 'error';

      // Check Reown integration status
      newStatus.reownIntegration = newStatus.httpsAccess === 'available' && newStatus.verificationFile === 'active' ? 'configured' : 'pending';

    } catch (error) {
      console.error('Status check failed:', error);
      newStatus.verificationFile = 'error';
      newStatus.apiHealth = 'error';
    }

    setStatus(newStatus);
    setLastChecked(new Date());
  };

  useEffect(() => {
    runStatusCheck();
    const interval = setInterval(runStatusCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (value: string) => {
    switch (value) {
      case 'active':
      case 'available':
      case 'healthy':
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
      case 'unavailable':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (value: string) => {
    switch (value) {
      case 'active':
      case 'available':
      case 'healthy':
      case 'configured':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusText = (key: keyof SystemStatus, value: string) => {
    if (value === 'checking') return 'Checking...';
    
    switch (key) {
      case 'verificationFile':
        return value === 'active' ? 'Active' : 'Error';
      case 'httpsAccess':
        return value === 'available' ? 'Available' : 'HTTP Only';
      case 'apiHealth':
        return value === 'healthy' ? 'Healthy' : 'Error';
      case 'reownIntegration':
        return value === 'configured' ? 'Ready' : 'Needs Setup';
      default:
        return value;
    }
  };

  const allSystemsReady = status.verificationFile === 'active' && 
                          status.apiHealth === 'healthy' &&
                          status.httpsAccess === 'available';

  const statusItems = [
    {
      key: 'verificationFile' as keyof SystemStatus,
      label: 'Verification File',
      icon: <Server className="h-4 w-4" />,
      description: 'Domain verification file serving correctly'
    },
    {
      key: 'httpsAccess' as keyof SystemStatus,
      label: 'HTTPS Access',
      icon: <Shield className="h-4 w-4" />,
      description: 'Secure connection for Reown verification'
    },
    {
      key: 'apiHealth' as keyof SystemStatus,
      label: 'API Health',
      icon: <Wifi className="h-4 w-4" />,
      description: 'Backend services operational'
    },
    {
      key: 'reownIntegration' as keyof SystemStatus,
      label: 'Reown Integration',
      icon: <ExternalLink className="h-4 w-4" />,
      description: 'AppKit configuration status'
    }
  ];

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${allSystemsReady ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <span>Production Readiness</span>
            <Badge className={allSystemsReady ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {allSystemsReady ? 'Ready' : 'Setup Required'}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={runStatusCheck}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {statusItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status[item.key])}
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
              </div>
              <Badge className={getStatusColor(status[item.key])}>
                {getStatusText(item.key, status[item.key])}
              </Badge>
            </div>
          ))}
        </div>

        {lastChecked && (
          <p className="text-sm text-slate-600">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Current Domain</label>
            <div className="bg-slate-100 border rounded px-3 py-2 mt-1">
              <code className="text-sm font-mono text-slate-700">{currentDomain}</code>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Verification Endpoint</label>
            <div className="bg-slate-100 border rounded px-3 py-2 mt-1">
              <code className="text-sm font-mono text-slate-700">{currentDomain}/.well-known/walletconnect.txt</code>
            </div>
          </div>
        </div>

        {allSystemsReady ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Production Ready</h4>
                <p className="text-green-800 text-sm mb-3">
                  All systems are operational. Add this domain to your Reown project allowlist to complete setup.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-800 hover:bg-green-100"
                  onClick={() => window.open('https://cloud.reown.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configure Reown
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Configuration Required</h4>
                <p className="text-amber-800 text-sm">
                  {status.httpsAccess === 'unavailable' 
                    ? 'HTTPS access is required for Reown domain verification. The platform is configured correctly and will work once HTTPS is available.'
                    : 'Complete the configuration steps above to enable full Reown AppKit functionality.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}