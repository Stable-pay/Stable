import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { VerificationMonitor } from "@/components/system/verification-monitor";
import { CheckCircle, Copy, ExternalLink, Settings, AlertTriangle, Info, Clock } from "lucide-react";

export default function Setup() {
  const { toast } = useToast();
  const [currentDomain] = useState(window.location.origin);
  const [projectId] = useState('6dfca9af31141b1fb9220aa7db3eee37');
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'pending'>('checking');

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await fetch('/.well-known/walletconnect.txt');
        if (response.ok) {
          const content = await response.text();
          if (content.trim() === projectId) {
            setVerificationStatus('verified');
          } else {
            setVerificationStatus('pending');
          }
        } else {
          setVerificationStatus('pending');
        }
      } catch (error) {
        setVerificationStatus('pending');
      }
    };

    checkVerification();
  }, [projectId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} copied successfully`,
    });
  };

  const setupSteps = [
    {
      id: 1,
      title: "Open Reown Cloud Console",
      description: "Navigate to your Reown project dashboard",
      action: () => window.open('https://cloud.reown.com', '_blank'),
      buttonText: "Open Console",
      icon: ExternalLink
    },
    {
      id: 2,
      title: "Select Your Project",
      description: `Find project ID: ${projectId}`,
      action: () => copyToClipboard(projectId, "Project ID"),
      buttonText: "Copy Project ID",
      icon: Copy
    },
    {
      id: 3,
      title: "Add Domain to Allowlist",
      description: "Add the current domain to allowed origins",
      action: () => copyToClipboard(currentDomain, "Domain"),
      buttonText: "Copy Domain",
      icon: Copy
    },
    {
      id: 4,
      title: "Save Configuration",
      description: "Save changes and wait for propagation",
      action: () => window.location.reload(),
      buttonText: "Refresh Page",
      icon: CheckCircle
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Reown AppKit Setup
        </h1>
        <p className="text-xl text-gray-600">
          Configure your Reown project to enable full wallet connectivity
        </p>
      </div>

      {/* Real-time System Monitor */}
      <VerificationMonitor />

      {/* Verification Status */}
      <Card className={`${verificationStatus === 'verified' ? 'border-green-200 bg-green-50' : verificationStatus === 'pending' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {verificationStatus === 'verified' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : verificationStatus === 'pending' ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600" />
            )}
            <span>Domain Verification Status</span>
            <Badge className={`${verificationStatus === 'verified' ? 'bg-green-100 text-green-800 border-green-300' : verificationStatus === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>
              {verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Needs Configuration' : 'Checking...'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verificationStatus === 'verified' ? (
            <p className="text-green-800">Domain verification file is accessible. You can now add this domain to your Reown project allowlist.</p>
          ) : verificationStatus === 'pending' ? (
            <p className="text-amber-800">Domain verification file is ready. Add this domain to your Reown project allowlist at cloud.reown.com to complete setup.</p>
          ) : (
            <p className="text-blue-800">Checking domain verification status...</p>
          )}
        </CardContent>
      </Card>

      {/* Current Configuration */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span>Current Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-blue-900">Project ID</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input 
                value={projectId} 
                readOnly 
                className="bg-white border-blue-200 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(projectId, "Project ID")}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-blue-900">Current Domain</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input 
                value={currentDomain} 
                readOnly 
                className="bg-white border-blue-200 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentDomain, "Domain")}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Configuration Steps</h2>
        
        {setupSteps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <Card key={step.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.id}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  
                  <Button
                    onClick={step.action}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {step.buttonText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Troubleshooting */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Troubleshooting</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">Common Issues</h4>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>Domain not added to allowlist - Add the exact domain shown above</li>
              <li>Configuration not propagated - Wait 5-10 minutes after saving</li>
              <li>Wrong project selected - Ensure you're editing the correct project</li>
              <li>Browser cache - Try refreshing the page or clearing cache</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">Need Help?</h4>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => window.open('https://docs.reown.com/appkit/overview', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => window.open('https://discord.gg/reown', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Discord Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => window.open('https://cloud.reown.com', '_blank')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8 font-semibold"
          size="lg"
        >
          <Settings className="h-5 w-5 mr-2" />
          Open Reown Console
        </Button>
        
        <Button
          onClick={() => window.location.href = '/swap'}
          variant="outline"
          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-8 font-semibold"
          size="lg"
        >
          Back to Platform
        </Button>
      </div>
    </div>
  );
}