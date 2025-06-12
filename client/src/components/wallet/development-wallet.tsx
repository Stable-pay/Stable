import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDevelopmentWallet } from "@/hooks/use-development-wallet";
import { Wallet, Power, RefreshCw, Copy, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NETWORKS = [
  { id: 1, name: "Ethereum", symbol: "ETH" },
  { id: 137, name: "Polygon", symbol: "MATIC" },
  { id: 56, name: "BSC", symbol: "BNB" },
  { id: 42161, name: "Arbitrum", symbol: "ETH" }
];

interface DevelopmentWalletProps {
  onConnect: () => void;
}

export function DevelopmentWallet({ onConnect }: DevelopmentWalletProps) {
  const { toast } = useToast();
  const {
    isConnected,
    address,
    chainId,
    balance,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useDevelopmentWallet();

  const handleConnect = async () => {
    await connectWallet();
    onConnect();
    toast({
      title: "Wallet Connected",
      description: "Successfully connected to development wallet",
    });
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "Development wallet has been disconnected",
    });
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const handleNetworkChange = (networkId: string) => {
    switchNetwork(parseInt(networkId));
  };

  const getCurrentNetwork = () => {
    return NETWORKS.find(network => network.id === chainId) || NETWORKS[0];
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Wallet className="h-12 w-12 text-blue-600" />
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 mb-2">Development Mode</h3>
              <p className="text-blue-800 text-sm mb-4">
                Connect your wallet to start using the platform
              </p>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-green-600" />
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
            <Power className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
              Wallet Address
            </label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="flex-1 bg-white/80 border border-green-200 rounded px-3 py-2 text-sm font-mono text-green-800">
                {address ? formatAddress(address) : 'N/A'}
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
            <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
              Balance
            </label>
            <div className="bg-white/80 border border-green-200 rounded px-3 py-2 mt-1">
              <span className="text-sm font-semibold text-green-800">
                {balance} {getCurrentNetwork().symbol}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
            Network
          </label>
          <Select 
            value={chainId?.toString()} 
            onValueChange={handleNetworkChange}
          >
            <SelectTrigger className="mt-1 border-green-200 bg-white/80">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-800">
                    {getCurrentNetwork().name}
                  </span>
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

        <div className="bg-white/60 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Development wallet active - no domain verification required</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}