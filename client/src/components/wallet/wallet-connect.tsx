import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { Wallet, ChevronDown } from "lucide-react";

export function WalletConnect() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { toast } = useToast();
  const [userCreated, setUserCreated] = useState(false);

  // Create user when wallet connects
  useEffect(() => {
    const createUser = async () => {
      if (isConnected && address && !userCreated) {
        try {
          await apiRequest("POST", "/api/users", {
            walletAddress: address,
            kycStatus: "pending",
            kycTier: 1
          });
          setUserCreated(true);
          toast({
            title: "Wallet Connected",
            description: "Successfully connected to Stable Pay",
          });
        } catch (error) {
          console.error("Failed to create user:", error);
        }
      }
    };

    createUser();
  }, [isConnected, address, userCreated, toast]);

  // Reset user creation state when disconnected
  useEffect(() => {
    if (!isConnected) {
      setUserCreated(false);
    }
  }, [isConnected]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = () => {
    open();
  };

  const handleAccountClick = () => {
    open({ view: 'Account' });
  };

  const handleNetworkClick = () => {
    open({ view: 'Networks' });
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
        size="lg"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={handleNetworkClick}
        variant="outline"
        size="sm"
        className="border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-700"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        {chainId ? `Chain ${chainId}` : 'Network'}
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
      
      <Button
        onClick={handleAccountClick}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
        {address ? formatAddress(address) : 'Connected'}
      </Button>
    </div>
  );
}
