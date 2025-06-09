import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, ChevronDown, Copy, AlertCircle } from "lucide-react";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
}

export function DirectWalletConnect() {
  const { toast } = useToast();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: '0.00'
  });
  const [userCreated, setUserCreated] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            const chainId = await (window as any).ethereum.request({ 
              method: 'eth_chainId' 
            });
            
            const balance = await (window as any).ethereum.request({
              method: 'eth_getBalance',
              params: [accounts[0], 'latest']
            });
            
            const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
            
            setWalletState({
              isConnected: true,
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              balance: balanceInEth.toFixed(4)
            });
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0]
          }));
        } else {
          setWalletState({
            isConnected: false,
            address: null,
            chainId: null,
            balance: '0.00'
          });
          setUserCreated(false);
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16)
        }));
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if ((window as any).ethereum) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Create user when wallet connects
  useEffect(() => {
    const createUser = async () => {
      if (walletState.isConnected && walletState.address && !userCreated) {
        try {
          await apiRequest("POST", "/api/users", {
            walletAddress: walletState.address,
            kycStatus: "pending",
            kycTier: 1
          });
          setUserCreated(true);
          toast({
            title: "Wallet Connected Successfully",
            description: `Connected to ${getNetworkName(walletState.chainId)} network`,
          });
        } catch (error) {
          console.error("Failed to create user:", error);
        }
      }
    };

    createUser();
  }, [walletState.isConnected, walletState.address, userCreated, toast, walletState.chainId]);

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive"
      });
      return;
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const chainId = await (window as any).ethereum.request({
        method: 'eth_chainId'
      });

      const balance = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });
      
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      
      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        balance: balanceInEth.toFixed(4)
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getNetworkName = (chainId: number | null) => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BNB Chain',
      8453: 'Base',
      43114: 'Avalanche',
      42161: 'Arbitrum',
      10: 'Optimism'
    };
    return networks[chainId || 1] || 'Unknown';
  };

  const getNetworkColor = (chainId: number | null) => {
    const colors: { [key: number]: string } = {
      1: 'from-blue-500 to-blue-600',
      137: 'from-purple-500 to-purple-600',
      56: 'from-yellow-400 to-yellow-500',
      8453: 'from-blue-400 to-indigo-500',
      43114: 'from-red-500 to-red-600',
      42161: 'from-blue-500 to-cyan-500',
      10: 'from-red-500 to-pink-500'
    };
    return colors[chainId || 1] || 'from-gray-500 to-gray-600';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (walletState.address) {
      await navigator.clipboard.writeText(walletState.address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  if (!walletState.isConnected) {
    return (
      <Button
        onClick={connectWallet}
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
      {/* Network Display */}
      <Badge
        variant="outline"
        className="border-slate-200 text-slate-700 h-11 px-4 font-medium"
      >
        <div className={`w-3 h-3 bg-gradient-to-r ${getNetworkColor(walletState.chainId)} rounded-full mr-2 shadow-sm`}></div>
        <span className="hidden sm:inline">{getNetworkName(walletState.chainId)}</span>
      </Badge>
      
      {/* Wallet Info */}
      <div className="flex items-center space-x-2">
        <div className="hidden md:flex flex-col items-end text-right">
          <div className="text-sm font-semibold text-slate-900">{walletState.balance} ETH</div>
          <div className="text-xs text-slate-500">${(parseFloat(walletState.balance) * 2451.32).toFixed(2)}</div>
        </div>
        
        <Button
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold h-11 px-4"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
            <span>{formatAddress(walletState.address || '')}</span>
          </div>
        </Button>

        {/* Copy Address */}
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