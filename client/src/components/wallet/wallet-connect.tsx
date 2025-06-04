import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const { toast } = useToast();

  // Mock wallet connection - in production, integrate with Reown AppKit
  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock wallet address
      const mockAddress = "0x742d35Cc632C4532c76b78aaE1cbAd4b5E3D6F8";
      setWalletAddress(mockAddress);
      setIsConnected(true);
      
      // Create or get user
      await apiRequest("POST", "/api/users", {
        walletAddress: mockAddress,
        kycStatus: "pending",
        kycTier: 1
      });
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your wallet",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div>
      {!isConnected ? (
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-primary hover:bg-indigo-700"
        >
          {isConnecting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Connecting...
            </>
          ) : (
            <>
              <i className="fas fa-wallet mr-2"></i>
              Connect Wallet
            </>
          )}
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={disconnectWallet}
          className="bg-secondary hover:bg-green-700 text-white"
        >
          <i className="fas fa-check-circle mr-2"></i>
          {formatAddress(walletAddress)}
        </Button>
      )}
    </div>
  );
}
