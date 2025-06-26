import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  RefreshCw, 
  ArrowRight, 
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

// Supported networks configuration
const SUPPORTED_NETWORKS = {
  EVM: {
    1: { name: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY' },
    137: { name: 'Polygon', symbol: 'MATIC', rpcUrl: 'https://polygon-rpc.com' },
    56: { name: 'BSC', symbol: 'BNB', rpcUrl: 'https://bsc-dataseed1.binance.org' },
    42161: { name: 'Arbitrum', symbol: 'ETH', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
    10: { name: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io' },
    8453: { name: 'Base', symbol: 'ETH', rpcUrl: 'https://mainnet.base.org' },
    43114: { name: 'Avalanche', symbol: 'AVAX', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc' }
  },
  SOLANA: {
    'mainnet-beta': { name: 'Solana', symbol: 'SOL', rpcUrl: 'https://api.mainnet-beta.solana.com' }
  }
};

// Token contracts for each network
const TOKEN_CONTRACTS = {
  1: { // Ethereum
    'USDC': '0xA0b86a33E6417cEb8127E1d5f6e99D4a4a95f8f0',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
  },
  137: { // Polygon
    'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    'WMATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    'LINK': '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39'
  },
  56: { // BSC
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
    'WBNB': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    'CAKE': '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82'
  },
  42161: { // Arbitrum
    'USDC': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'ARB': '0x912CE59144191C1204E64559FE8253a0e49E6548'
  }
};

// ERC-20 ABI for balance checking
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

// INR exchange rates (mock - in production, fetch from API)
const INR_RATES = {
  'ETH': 208500,
  'BTC': 4125000,
  'MATIC': 58.5,
  'BNB': 24500,
  'USDC': 83.25,
  'USDT': 83.20,
  'AVAX': 2850,
  'SOL': 8950,
  'LINK': 1125,
  'UNI': 580,
  'ARB': 75.5,
  'CAKE': 145
};

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
  usdValue: number;
  inrValue: number;
  chainId: number;
  chainName: string;
}

interface ProductionBalanceFetcherProps {
  onTokenSelect: (token: TokenBalance, amount: string) => void;
  selectedNetwork?: 'EVM' | 'SOLANA';
  onNetworkChange?: (network: 'EVM' | 'SOLANA') => void;
}

export function ProductionBalanceFetcher({ 
  onTokenSelect, 
  selectedNetwork = 'EVM',
  onNetworkChange 
}: ProductionBalanceFetcherProps) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState<number>(1);
  const [tokenAmounts, setTokenAmounts] = useState<Record<string, string>>({});
  const [showSocialCreator, setShowSocialCreator] = useState(false);

  // Fetch native balance
  const fetchNativeBalance = async (walletAddress: string, rpcUrl: string, chainId: number): Promise<string> => {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
          id: 1
        })
      });
      const data = await response.json();
      return data.result || '0x0';
    } catch (error) {
      console.error(`Failed to fetch native balance for chain ${chainId}:`, error);
      return '0x0';
    }
  };

  // Fetch token balance using contract call
  const fetchTokenBalance = async (walletAddress: string, contractAddress: string, rpcUrl: string): Promise<{ balance: string; decimals: number; symbol: string }> => {
    try {
      // Get balance
      const balanceResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: contractAddress,
            data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`
          }, 'latest'],
          id: 1
        })
      });
      const balanceData = await balanceResponse.json();

      // Get decimals
      const decimalsResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: contractAddress,
            data: '0x313ce567'
          }, 'latest'],
          id: 2
        })
      });
      const decimalsData = await decimalsResponse.json();

      // Get symbol
      const symbolResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: contractAddress,
            data: '0x95d89b41'
          }, 'latest'],
          id: 3
        })
      });
      const symbolData = await symbolResponse.json();

      const balance = balanceData.result || '0x0';
      const decimals = parseInt(decimalsData.result || '0x12', 16);
      const symbolHex = symbolData.result || '0x';
      const symbol = symbolHex !== '0x' ? Buffer.from(symbolHex.slice(2), 'hex').toString().replace(/\0/g, '') : 'UNKNOWN';

      return { balance, decimals, symbol };
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
      return { balance: '0x0', decimals: 18, symbol: 'UNKNOWN' };
    }
  };

  // Convert hex balance to readable format
  const formatBalance = (hexBalance: string, decimals: number): string => {
    try {
      const balance = BigInt(hexBalance);
      const divisor = BigInt(Math.pow(10, decimals));
      const quotient = balance / divisor;
      const remainder = balance % divisor;
      
      if (remainder === BigInt(0)) {
        return quotient.toString();
      }
      
      const remainderStr = remainder.toString().padStart(decimals, '0');
      const trimmedRemainder = remainderStr.replace(/0+$/, '');
      
      if (trimmedRemainder === '') {
        return quotient.toString();
      }
      
      return `${quotient}.${trimmedRemainder}`;
    } catch (error) {
      console.error('Error formatting balance:', error);
      return '0';
    }
  };

  // Fetch all balances for connected wallet
  const fetchAllBalances = useCallback(async () => {
    if (!address || !isConnected) return;

    setIsLoading(true);
    const newBalances: TokenBalance[] = [];

    try {
      if (selectedNetwork === 'EVM') {
        const chains = selectedChain ? [selectedChain] : Object.keys(SUPPORTED_NETWORKS.EVM).map(Number);
        
        for (const chain of chains) {
          const networkConfig = SUPPORTED_NETWORKS.EVM[chain as keyof typeof SUPPORTED_NETWORKS.EVM];
          if (!networkConfig) continue;

          // Fetch native token balance
          const nativeBalance = await fetchNativeBalance(address, networkConfig.rpcUrl, chain);
          const formattedNativeBalance = formatBalance(nativeBalance, 18);
          
          if (parseFloat(formattedNativeBalance) > 0) {
            const inrValue = (parseFloat(formattedNativeBalance) * (INR_RATES[networkConfig.symbol as keyof typeof INR_RATES] || 0));
            newBalances.push({
              symbol: networkConfig.symbol,
              balance: formattedNativeBalance,
              decimals: 18,
              usdValue: parseFloat(formattedNativeBalance) * (INR_RATES[networkConfig.symbol as keyof typeof INR_RATES] || 0) / 83.25,
              inrValue,
              chainId: chain,
              chainName: networkConfig.name
            });
          }

          // Fetch token balances
          const tokenContracts = TOKEN_CONTRACTS[chain as keyof typeof TOKEN_CONTRACTS] || {};
          
          for (const [tokenSymbol, contractAddress] of Object.entries(tokenContracts)) {
            const tokenData = await fetchTokenBalance(address, contractAddress, networkConfig.rpcUrl);
            const formattedBalance = formatBalance(tokenData.balance, tokenData.decimals);
            
            if (parseFloat(formattedBalance) > 0) {
              const inrValue = parseFloat(formattedBalance) * (INR_RATES[tokenSymbol as keyof typeof INR_RATES] || 0);
              newBalances.push({
                symbol: tokenSymbol,
                balance: formattedBalance,
                decimals: tokenData.decimals,
                contractAddress,
                usdValue: parseFloat(formattedBalance) * (INR_RATES[tokenSymbol as keyof typeof INR_RATES] || 0) / 83.25,
                inrValue,
                chainId: chain,
                chainName: networkConfig.name
              });
            }
          }
        }
      } else if (selectedNetwork === 'SOLANA') {
        // Solana balance fetching would go here
        // For now, we'll add a placeholder
        console.log('Solana balance fetching not implemented yet');
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, selectedNetwork, selectedChain]);

  // Fetch balances when wallet connects or network changes
  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // Handle amount input change
  const handleAmountChange = (tokenSymbol: string, amount: string) => {
    setTokenAmounts(prev => ({
      ...prev,
      [tokenSymbol]: amount
    }));
  };

  // Handle max button click
  const handleMaxClick = (token: TokenBalance) => {
    setTokenAmounts(prev => ({
      ...prev,
      [token.symbol]: token.balance
    }));
  };

  // Handle token selection for INR conversion
  const handleTokenSelect = (token: TokenBalance) => {
    const amount = tokenAmounts[token.symbol] || '0';
    if (parseFloat(amount) > 0) {
      onTokenSelect(token, amount);
    }
  };

  // Calculate INR value for entered amount
  const calculateINRValue = (token: TokenBalance, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount * (INR_RATES[token.symbol as keyof typeof INR_RATES] || 0);
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6" />
            Connect Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-muted-foreground mb-6">
            Connect your wallet or create a new one with social login to start converting crypto to INR
          </div>
          
          <div className="grid gap-4">
            <Button 
              onClick={() => setShowSocialCreator(true)}
              className="w-full h-12 text-lg"
              variant="default"
            >
              Create Wallet (Social Login)
            </Button>
            
            <Button 
              onClick={() => {/* Open existing wallet connection */}}
              variant="outline"
              className="w-full h-12 text-lg"
            >
              Connect Existing Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Token Balances & INR Conversion
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select 
              value={selectedNetwork} 
              onValueChange={(value: 'EVM' | 'SOLANA') => onNetworkChange?.(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EVM">EVM Chains</SelectItem>
                <SelectItem value="SOLANA">Solana</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedNetwork === 'EVM' && (
              <Select 
                value={selectedChain.toString()} 
                onValueChange={(value) => setSelectedChain(parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Chains</SelectItem>
                  {Object.entries(SUPPORTED_NETWORKS.EVM).map(([chainId, config]) => (
                    <SelectItem key={chainId} value={chainId}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button 
              onClick={fetchAllBalances} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Fetching balances...</span>
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Token Balances Found</h3>
            <p className="text-muted-foreground">
              No tokens found in your wallet on the selected network(s)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {balances.map((token, index) => (
              <motion.div
                key={`${token.chainId}-${token.symbol}-${token.contractAddress || 'native'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{token.symbol}</span>
                        <Badge variant="secondary">{token.chainName}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Balance: {parseFloat(token.balance).toFixed(6)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{token.inrValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    <div className="text-sm text-muted-foreground">
                      ${token.usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`amount-${token.symbol}-${token.chainId}`}>
                      Amount to Convert
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`amount-${token.symbol}-${token.chainId}`}
                        type="number"
                        placeholder="0.00"
                        value={tokenAmounts[token.symbol] || ''}
                        onChange={(e) => handleAmountChange(token.symbol, e.target.value)}
                        step="any"
                        min="0"
                        max={token.balance}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMaxClick(token)}
                        className="px-3"
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>INR Value</Label>
                    <div className="p-2 bg-muted rounded-md">
                      <span className="font-semibold">
                        ₹{calculateINRValue(token, tokenAmounts[token.symbol] || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleTokenSelect(token)}
                    disabled={!tokenAmounts[token.symbol] || parseFloat(tokenAmounts[token.symbol]) <= 0}
                    className="w-full"
                  >
                    Convert to INR
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}