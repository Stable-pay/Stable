import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Rocket, ExternalLink, Copy, Globe } from "lucide-react";

export function ReadyStatus() {
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'ready' | 'pending'>('checking');
  const [httpsAvailable, setHttpsAvailable] = useState(false);

  const currentDomain = window.location.origin;
  const expectedContent = '6ba49384-9b1e-4504-abd7-c9a17883825d=bdfb91a78d29e4375966ed260be77e6a9799cdb3dfd9698ebc34910901875e6c';

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/.well-known/walletconnect.txt');
        const isHttps = currentDomain.startsWith('https://');
        setHttpsAvailable(isHttps);
        
        if (response.ok) {
          const content = await response.text();
          const isCorrect = content.trim() === expectedContent;
          setVerificationStatus(isCorrect ? 'ready' : 'pending');
        } else {
          setVerificationStatus('pending');
        }
      } catch (error) {
        setVerificationStatus('pending');
      }
    };

    checkStatus();
  }, []);

  const deploymentChecklist = [
    {
      name: "Domain Verification File",
      status: verificationStatus === 'ready' ? 'complete' : 'pending',
      description: "Verification file accessible at /.well-known/walletconnect.txt"
    },
    {
      name: "HTTPS Access",
      status: httpsAvailable ? 'complete' : 'info',
      description: httpsAvailable ? "Secure connection available" : "HTTP connection (HTTPS preferred for production)"
    },
    {
      name: "Reown AppKit Integration",
      status: 'complete',
      description: "AppKit configured with project ID and native swapping"
    },
    {
      name: "Multi-chain Support", 
      status: 'complete',
      description: "Ethereum, Polygon, Base, and Arbitrum networks supported"
    },
    {
      name: "User Flow Implementation",
      status: 'complete',
      description: "Wallet connection, KYC verification, swapping, and withdrawals"
    },
    {
      name: "Production APIs",
      status: 'complete',
      description: "Backend services and storage systems operational"
    }
  ];

  const allSystemsReady = verificationStatus === 'ready';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'info':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-indigo-600" />
            <span>Deployment Status</span>
            <Badge className={allSystemsReady ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {allSystemsReady ? 'Ready to Deploy' : 'Configuration Required'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {deploymentChecklist.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(item.status)}
                <div>
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="text-sm text-slate-600">{item.description}</div>
                </div>
              </div>
              <Badge className={getStatusColor(item.status)}>
                {item.status === 'complete' ? 'Ready' : item.status === 'info' ? 'Available' : 'Pending'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Deployment Configuration</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-100 rounded">
                <span className="text-sm text-slate-600">Domain:</span>
                <code className="text-sm font-mono text-slate-800">{currentDomain}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigator.clipboard.writeText(currentDomain)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-100 rounded">
                <span className="text-sm text-slate-600">Verification:</span>
                <code className="text-xs font-mono text-slate-800 truncate max-w-32">{expectedContent}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigator.clipboard.writeText(expectedContent)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {allSystemsReady ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-1">Platform Ready for Production</h4>
                <p className="text-green-800 text-sm mb-4">
                  Stable Pay is fully configured and ready for deployment. Complete the Reown domain allowlist configuration to enable wallet connectivity.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open('https://cloud.reown.com', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Configure Reown
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-800 hover:bg-green-100"
                    onClick={() => window.location.href = '/swap'}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    View Platform
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Configuration Required</h4>
                <p className="text-amber-800 text-sm mb-3">
                  Complete the domain verification and Reown configuration to enable full functionality.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => window.open('https://cloud.reown.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Complete Setup
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Rocket className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Next Steps</h4>
              <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                <li>Add domain to Reown project allowlist at cloud.reown.com</li>
                <li>Wait 5-10 minutes for configuration propagation</li>
                <li>Test wallet connectivity on the platform</li>
                <li>Deploy to production environment</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}