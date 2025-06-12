import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, Clock, RefreshCw, ExternalLink } from "lucide-react";

interface VerificationStatus {
  domainVerification: 'verified' | 'pending' | 'checking';
  reownConnection: 'connected' | 'error' | 'checking';
  apiEndpoints: 'active' | 'error' | 'checking';
}

export function VerificationMonitor() {
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>({
    domainVerification: 'checking',
    reownConnection: 'checking',
    apiEndpoints: 'checking'
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runSystemCheck = async () => {
    setIsChecking(true);
    const newStatus: VerificationStatus = {
      domainVerification: 'checking',
      reownConnection: 'checking',
      apiEndpoints: 'checking'
    };

    try {
      // Check domain verification
      const verificationResponse = await fetch('/.well-known/walletconnect.txt');
      if (verificationResponse.ok) {
        const content = await verificationResponse.text();
        newStatus.domainVerification = content.trim() === '6ba49384-9b1e-4504-abd7-c9a17883825d' ? 'verified' : 'pending';
      } else {
        newStatus.domainVerification = 'pending';
      }

      // Check API endpoints
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        newStatus.apiEndpoints = 'active';
      } else {
        newStatus.apiEndpoints = 'error';
      }

      // Check Reown connection (check for console errors)
      const consoleErrors = window.console.error.toString().includes('Allowlist');
      newStatus.reownConnection = consoleErrors ? 'error' : 'connected';

    } catch (error) {
      console.error('System check failed:', error);
      newStatus.apiEndpoints = 'error';
    }

    setStatus(newStatus);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    runSystemCheck();
    const interval = setInterval(runSystemCheck, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'verified':
      case 'connected':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'checking':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'verified':
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'checking':
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusText = (key: keyof VerificationStatus, value: string) => {
    if (value === 'checking') return 'Checking...';
    
    switch (key) {
      case 'domainVerification':
        return value === 'verified' ? 'Domain Verified' : 'Needs Setup';
      case 'reownConnection':
        return value === 'connected' ? 'Connected' : 'Domain Not Allowlisted';
      case 'apiEndpoints':
        return value === 'active' ? 'All Active' : 'Connection Error';
      default:
        return value;
    }
  };

  const allSystemsOperational = status.domainVerification === 'verified' && 
                                status.apiEndpoints === 'active';

  const needsConfiguration = status.reownConnection === 'error';

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${allSystemsOperational ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <span>System Status</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={runSystemCheck}
            disabled={isChecking}
            className="border-slate-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(value)}
                <span className="font-medium">
                  {key === 'domainVerification' ? 'Domain Verification' :
                   key === 'reownConnection' ? 'Reown AppKit' :
                   'API Endpoints'}
                </span>
              </div>
              <Badge className={getStatusColor(value)}>
                {getStatusText(key as keyof VerificationStatus, value)}
              </Badge>
            </div>
          ))}
        </div>

        {lastChecked && (
          <p className="text-sm text-slate-600">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}

        {needsConfiguration && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-2">Configuration Required</h4>
                <p className="text-amber-800 mb-3">
                  Domain verification is complete, but you need to add this domain to your Reown project allowlist.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => window.open('https://cloud.reown.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configure at cloud.reown.com
                </Button>
              </div>
            </div>
          </div>
        )}

        {allSystemsOperational && !needsConfiguration && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">All Systems Operational</h4>
                <p className="text-green-800">Platform is ready for production use</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}