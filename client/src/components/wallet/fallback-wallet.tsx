import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, AlertCircle, ExternalLink } from "lucide-react";

interface FallbackWalletProps {
  onConnect: () => void;
}

export function FallbackWallet({ onConnect }: FallbackWalletProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate wallet connection for demo purposes
    setTimeout(() => {
      onConnect();
      setIsConnecting(false);
      toast({
        title: "Demo Wallet Connected",
        description: "Using fallback wallet for demonstration",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Domain Configuration Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">Domain Configuration Required</h3>
              <p className="text-amber-800 mb-4">
                To enable full Reown AppKit functionality, add this domain to your project allowlist:
              </p>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-sm">
                https://fc0fcb6c-8722-458b-9985-8a31854bcfb6-00-9b41tf5yjab1.spock.replit.dev
              </Badge>
              <div className="mt-4">
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
        </CardContent>
      </Card>

      {/* Fallback Connection */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Demo Mode Available</h3>
          <p className="text-blue-800 mb-6">
            Experience the platform functionality with a demonstration wallet connection
          </p>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold h-12 px-8"
            size="lg"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 mr-2" />
                Connect Demo Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}