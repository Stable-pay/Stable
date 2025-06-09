import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, AlertTriangle, Info, Copy } from "lucide-react";

export function VerificationGuide() {
  const currentDomain = window.location.origin;
  const isHttps = currentDomain.startsWith('https://');

  const steps = [
    {
      id: 1,
      title: "Navigate to Reown Cloud Console",
      description: "Open the Reown project dashboard in a new tab",
      status: "action",
      action: () => window.open('https://cloud.reown.com', '_blank'),
      buttonText: "Open Console"
    },
    {
      id: 2,
      title: "Select Your Project",
      description: "Find and select project: 6dfca9af31141b1fb9220aa7db3eee37",
      status: "manual",
      info: "Look for the project in your dashboard or use the search function"
    },
    {
      id: 3,
      title: "Navigate to Domain Settings",
      description: "Go to Project Settings → Domain Allowlist",
      status: "manual",
      info: "This section controls which domains can use your Reown project"
    },
    {
      id: 4,
      title: "Add Domain to Allowlist",
      description: `Add: ${currentDomain}`,
      status: isHttps ? "ready" : "warning",
      action: () => navigator.clipboard.writeText(currentDomain),
      buttonText: "Copy Domain",
      warning: !isHttps ? "HTTPS required for verification" : undefined
    },
    {
      id: 5,
      title: "Verify Domain",
      description: "Reown will verify your domain using the verification file",
      status: "auto",
      info: "Verification happens automatically after adding the domain"
    },
    {
      id: 6,
      title: "Save Configuration",
      description: "Save changes and wait for propagation (5-10 minutes)",
      status: "manual",
      info: "Changes may take a few minutes to propagate globally"
    }
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "action":
        return <ExternalLink className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-slate-600" />;
    }
  };

  const getStepBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Ready</Badge>;
      case "warning":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Warning</Badge>;
      case "action":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Action Required</Badge>;
      case "auto":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Automatic</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Manual</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-blue-600" />
          <span>Reown Configuration Guide</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="border rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {step.id}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    {getStepBadge(step.status)}
                  </div>
                  
                  <p className="text-slate-700 text-sm">{step.description}</p>
                  
                  {step.warning && (
                    <div className="flex items-center space-x-2 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{step.warning}</span>
                    </div>
                  )}
                  
                  {step.info && (
                    <div className="flex items-center space-x-2 text-slate-600 text-sm">
                      <Info className="h-4 w-4" />
                      <span>{step.info}</span>
                    </div>
                  )}
                  
                  {step.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={step.action}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      {step.status === "action" ? (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {step.buttonText}
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center">
                  {getStepIcon(step.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Important Notes</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Domain verification file is already configured and accessible</li>
                <li>• HTTPS access may be required for Reown's verification process</li>
                <li>• Configuration changes can take 5-10 minutes to propagate</li>
                <li>• Refresh the platform after completing configuration</li>
              </ul>
            </div>
          </div>
        </div>

        {!isHttps && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">HTTPS Notice</h4>
                <p className="text-amber-800 text-sm">
                  Current domain uses HTTP. Reown may require HTTPS for domain verification. 
                  The verification file is correctly configured and will work once HTTPS is available.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}