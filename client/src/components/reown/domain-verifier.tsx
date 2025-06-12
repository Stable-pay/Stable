import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, Clock, RefreshCw, ExternalLink, Copy } from "lucide-react";

interface DomainVerificationResult {
  status: 'verified' | 'pending' | 'checking' | 'error';
  message: string;
  httpsAccessible: boolean;
  correctContent: boolean;
}

export function DomainVerifier() {
  const { toast } = useToast();
  const [verificationResult, setVerificationResult] = useState<DomainVerificationResult>({
    status: 'checking',
    message: 'Initializing verification...',
    httpsAccessible: false,
    correctContent: false
  });
  const [isChecking, setIsChecking] = useState(false);

  const currentDomain = window.location.origin;
  const expectedContent = '6ba49384-9b1e-4504-abd7-c9a17883825d=a960fcfcc04f45cd58e81d5ab23661c3e6d6b0b0f28a815e61d84ccaa1e9bc81';
  const verificationUrl = `${currentDomain}/.well-known/walletconnect.txt`;

  const runVerification = async () => {
    setIsChecking(true);
    const result: DomainVerificationResult = {
      status: 'checking',
      message: 'Running verification checks...',
      httpsAccessible: false,
      correctContent: false
    };

    try {
      const response = await fetch('/.well-known/walletconnect.txt');
      
      if (response.ok) {
        const content = await response.text();
        result.correctContent = content.trim() === expectedContent;
        result.httpsAccessible = currentDomain.startsWith('https://');
        
        if (result.correctContent && result.httpsAccessible) {
          result.status = 'verified';
          result.message = 'Domain verification is properly configured and accessible via HTTPS';
        } else if (result.correctContent && !result.httpsAccessible) {
          result.status = 'pending';
          result.message = 'Verification file is correct but requires HTTPS access for Reown validation';
        } else if (!result.correctContent) {
          result.status = 'error';
          result.message = 'Verification file content does not match project ID';
        }
      } else {
        result.status = 'error';
        result.message = 'Verification file is not accessible';
      }
    } catch (error) {
      result.status = 'error';
      result.message = 'Failed to check verification file accessibility';
      console.error('Verification check failed:', error);
    }

    setVerificationResult(result);
    setIsChecking(false);
  };

  useEffect(() => {
    runVerification();
  }, []);

  const getStatusColor = () => {
    switch (verificationResult.status) {
      case 'verified':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-amber-200 bg-amber-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusIcon = () => {
    switch (verificationResult.status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (verificationResult.status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Ready for Verification</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Configuration Error</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">HTTPS Required</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Checking...</Badge>;
    }
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Domain Verification Status</span>
            {getStatusBadge()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runVerification}
            disabled={isChecking}
            className="border-slate-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-slate-700">
          {verificationResult.message}
        </p>

        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border">
            <div className="flex items-center space-x-3">
              {verificationResult.httpsAccessible ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              <span className="text-sm font-medium">HTTPS Access</span>
            </div>
            <Badge className={verificationResult.httpsAccessible ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {verificationResult.httpsAccessible ? 'Available' : 'Required'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border">
            <div className="flex items-center space-x-3">
              {verificationResult.correctContent ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">Verification File</span>
            </div>
            <Badge className={verificationResult.correctContent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {verificationResult.correctContent ? 'Correct' : 'Invalid'}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Current Domain</label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="flex-1 bg-white/80 border rounded px-3 py-2 text-sm font-mono text-slate-700">
                {currentDomain}
              </code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(currentDomain)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Verification Content</label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="flex-1 bg-white/80 border rounded px-3 py-2 text-sm font-mono text-slate-700 text-xs">
                {expectedContent}
              </code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(expectedContent)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {verificationResult.status === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Ready for Configuration</h4>
                <p className="text-green-800 text-sm mb-3">
                  Domain verification is properly configured. Add this domain to your Reown project allowlist.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-800 hover:bg-green-100"
                  onClick={() => window.open('https://cloud.reown.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configure at cloud.reown.com
                </Button>
              </div>
            </div>
          </div>
        )}

        {verificationResult.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">HTTPS Access Required</h4>
                <p className="text-amber-800 text-sm">
                  Verification file is correctly configured. Reown requires HTTPS access for domain verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}