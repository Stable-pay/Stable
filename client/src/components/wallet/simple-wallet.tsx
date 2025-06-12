import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Copy, RefreshCw, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NETWORKS = [
  { id: 1, name: "Ethereum", symbol: "ETH", rpc: "https://eth.llamarpc.com" },
  { id: 137, name: "Polygon", symbol: "MATIC", rpc: "https://polygon.llamarpc.com" },
  { id: 56, name: "BSC", symbol: "BNB", rpc: "https://bsc.llamarpc.com" },
  { id: 42161, name: "Arbitrum", symbol: "ETH", rpc: "https://arbitrum.llamarpc.com" }
];

const DEV_WALLETS = [
  "0x742d35Cc6661C0532C4f4e2C7B0e8c84C7b3fF9C",
  "0x8ba1f109551bD432803012645Hac136c22C89721", 
  "0x1234567890123456789012345678901234567890"
];

interface SimpleWalletProps {
  onConnect: () => void;
}

export function SimpleWallet({ onConnect }: SimpleWalletProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(DEV_WALLETS[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [customAddress, setCustomAddress] = useState("");
  const [balance] = useState("2.5");
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      onConnect();
      toast({
        title: "Wallet Connected",
        description: `Connected to ${selectedNetwork.name} network`,
      });
    }, 1000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Wallet Disconnected",
      description: "Development wallet disconnected",
    });
  };

  const copyAddress = () => {
    const address = customAddress || selectedWallet;
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <span>Development Wallet</span>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              No Domain Verification
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Development mode enabled - connect without domain verification requirements
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="wallet-select" className="text-sm font-medium text-blue-700">
                Select Wallet Address
              </Label>
              <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                <SelectTrigger className="mt-1 border-blue-200 bg-white/80">
                  <SelectValue>
                    <code className="text-sm">{formatAddress(selectedWallet)}</code>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DEV_WALLETS.map((wallet, index) => (
                    <SelectItem key={wallet} value={wallet}>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm">{formatAddress(wallet)}</code>
                        <Badge variant="outline" className="text-xs">
                          Dev {index + 1}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custom-address" className="text-sm font-medium text-blue-700">
                Or Use Custom Address
              </Label>
              <Input
                id="custom-address"
                placeholder="0x..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="mt-1 border-blue-200 bg-white/80"
              />
            </div>

            <div>
              <Label htmlFor="network-select" className="text-sm font-medium text-blue-700">
                Network
              </Label>
              <Select 
                value={selectedNetwork.id.toString()} 
                onValueChange={(value) => {
                  const network = NETWORKS.find(n => n.id.toString() === value);
                  if (network) setSelectedNetwork(network);
                }}
              >
                <SelectTrigger className="mt-1 border-blue-200 bg-white/80">
                  <SelectValue>
                    <div className="flex items-center space-x-2">
                      <span>{selectedNetwork.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedNetwork.symbol}
                      </Badge>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((network) => (
                    <SelectItem key={network.id} value={network.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{network.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {network.symbol}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Development Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentAddress = customAddress || selectedWallet;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Wallet Connected</span>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              Development
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="border-green-300 text-green-800 hover:bg-green-100"
          >
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-green-700 uppercase tracking-wide">
              Wallet Address
            </Label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="flex-1 bg-white/80 border border-green-200 rounded px-3 py-2 text-sm font-mono text-green-800">
                {formatAddress(currentAddress)}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyAddress}
                className="border-green-300 text-green-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-green-700 uppercase tracking-wide">
              Balance
            </Label>
            <div className="bg-white/80 border border-green-200 rounded px-3 py-2 mt-1">
              <span className="text-sm font-semibold text-green-800">
                {balance} {selectedNetwork.symbol}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-green-700 uppercase tracking-wide">
            Network
          </Label>
          <div className="bg-white/80 border border-green-200 rounded px-3 py-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">
                {selectedNetwork.name}
              </span>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                {selectedNetwork.symbol}
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-white/60 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Development mode - bypassing domain verification</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}