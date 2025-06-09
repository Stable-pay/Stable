import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { Wallet, ChevronDown, Copy } from "lucide-react";

export function WalletConnect() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { toast } = useToast();
  const [userCreated, setUserCreated] = useState(false);
  const [balance, setBalance] = useState<string>('0.00');

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
            title: "Wallet Connected Successfully",
            description: `Connected to ${getNetworkName(chainId)} network`,
          });
        } catch (error) {
          console.error("Failed to create user:", error);
        }
      }
    };

    createUser();
  }, [isConnected, address, userCreated, toast, chainId]);

  // Fetch balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && address) {
        try {
          // Production balance would be fetched from real provider
          const mockBalance = (Math.random() * 5 + 0.1).toFixed(4);
          setBalance(mockBalance);
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setBalance('0.00');
        }
      }
    };

    fetchBalance();
  }, [isConnected, address, chainId]);

  // Reset states when disconnected
  useEffect(() => {
    if (!isConnected) {
      setUserCreated(false);
      setBalance('0.00');
    }
  }, [isConnected]);

  const getNetworkName = (chainId: number | string | undefined) => {
    const id = typeof chainId === 'string' ? parseInt(chainId) : chainId;
    const networks: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BNB Chain',
      8453: 'Base',
      43114: 'Avalanche',
      42161: 'Arbitrum',
      10: 'Optimism'
    };
    return networks[id || 1] || 'Unknown';
  };

  const getNetworkColor = (chainId: number | string | undefined) => {
    const id = typeof chainId === 'string' ? parseInt(chainId) : chainId;
    const colors: { [key: number]: string } = {
      1: 'from-blue-500 to-blue-600',
      137: 'from-purple-500 to-purple-600',
      56: 'from-yellow-400 to-yellow-500',
      8453: 'from-blue-400 to-indigo-500',
      43114: 'from-red-500 to-red-600',
      42161: 'from-blue-500 to-cyan-500',
      10: 'from-red-500 to-pink-500'
    };
    return colors[id || 1] || 'from-gray-500 to-gray-600';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
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
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold h-12 px-6"
        size="lg"
      >
        <Wallet className="h-5 w-5 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Network Selector */}
      <Button
        onClick={handleNetworkClick}
        variant="outline"
        className="border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 h-11 px-4 font-medium transition-all duration-200"
      >
        <div className={`w-3 h-3 bg-gradient-to-r ${getNetworkColor(chainId)} rounded-full mr-2 shadow-sm`}></div>
        <span className="hidden sm:inline">{getNetworkName(chainId)}</span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      
      {/* Wallet Info */}
      <div className="flex items-center space-x-2">
        <div className="hidden md:flex flex-col items-end text-right">
          <div className="text-sm font-semibold text-slate-900">{balance} ETH</div>
          <div className="text-xs text-slate-500">${(parseFloat(balance) * 2451.32).toFixed(2)}</div>
        </div>
        
        <Button
          onClick={handleAccountClick}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold h-11 px-4"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
            <span>{formatAddress(address || '')}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>

        {/* Quick Actions */}
        <Button
          onClick={copyAddress}
          variant="ghost"
          size="sm"
          className="h-11 w-11 p-0 hover:bg-slate-100"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}