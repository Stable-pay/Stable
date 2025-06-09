import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';

// Comprehensive token list for all supported networks
const COMPREHENSIVE_TOKENS = {
  // Ethereum Mainnet
  1: [
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', address: '0xA0b86a33E6e3B0e8c8d7d45b40b9b5Ba0b3D0e8B', decimals: 6 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
    { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
    { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18 },
    { symbol: 'CRV', address: '0xD533a949740bb3306d119CC777fa900bA034cd52', decimals: 18 },
    { symbol: 'COMP', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', decimals: 18 },
    { symbol: 'MKR', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18 },
    { symbol: 'SNX', address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', decimals: 18 }
  ],
  // Polygon
  137: [
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
    { symbol: 'WBTC', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8 },
    { symbol: 'LINK', address: '0x53e0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18 },
    { symbol: 'UNI', address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18 },
    { symbol: 'AAVE', address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', decimals: 18 },
    { symbol: 'CRV', address: '0x172370d5Cd63279eFa6d502DAB29171933a610AF', decimals: 18 },
    { symbol: 'SUSHI', address: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a', decimals: 18 }
  ],
  // Arbitrum
  42161: [
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    { symbol: 'WBTC', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8 },
    { symbol: 'LINK', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18 },
    { symbol: 'UNI', address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', decimals: 18 },
    { symbol: 'AAVE', address: '0xba5DdD1f9d7F570dc94a51479a000E3BCE967196', decimals: 18 },
    { symbol: 'CRV', address: '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978', decimals: 18 },
    { symbol: 'SUSHI', address: '0xd4d42F0b6DEF4CE0383636770eF773390d85c61A', decimals: 18 },
    { symbol: 'GMX', address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', decimals: 18 }
  ],
  // Base
  8453: [
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    { symbol: 'cbETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18 },
    { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18 }
  ],
  // Optimism
  10: [
    { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
    { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    { symbol: 'DAI', address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    { symbol: 'WBTC', address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', decimals: 8 },
    { symbol: 'LINK', address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6', decimals: 18 },
    { symbol: 'UNI', address: '0x6fd9d7AD17242c41f7131d257212c54A0e816691', decimals: 18 },
    { symbol: 'AAVE', address: '0x76FB31fb4af56892A25e32cFC43De717950c9278', decimals: 18 },
    { symbol: 'CRV', address: '0xadDb6A0412DE1BA0F936DCaeb8Aaa24578dcF3B2', decimals: 18 },
    { symbol: 'SNX', address: '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4', decimals: 18 },
    { symbol: 'OP', address: '0x4200000000000000000000000000000000000042', decimals: 18 }
  ],
  // BNB Smart Chain
  56: [
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    { symbol: 'DAI', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18 },
    { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
    { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
    { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 },
    { symbol: 'LINK', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', decimals: 18 },
    { symbol: 'UNI', address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', decimals: 18 }
  ],
  // Avalanche
  43114: [
    { symbol: 'USDT', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 },
    { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
    { symbol: 'DAI', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18 },
    { symbol: 'WAVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18 },
    { symbol: 'WETH', address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', decimals: 18 },
    { symbol: 'WBTC', address: '0x50b7545627a5162F82A992c33b87aDc75187B218', decimals: 8 },
    { symbol: 'LINK', address: '0x5947BB275c521040051D82396192181b413227A3', decimals: 18 },
    { symbol: 'UNI', address: '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580', decimals: 18 },
    { symbol: 'AAVE', address: '0x63a72806098Bd3D9520cC43356dD78afe5D386D9', decimals: 18 }
  ]
} as const;

// Network information
const NETWORK_INFO = {
  1: { name: 'Ethereum', nativeSymbol: 'ETH', nativeDecimals: 18 },
  137: { name: 'Polygon', nativeSymbol: 'MATIC', nativeDecimals: 18 },
  42161: { name: 'Arbitrum', nativeSymbol: 'ETH', nativeDecimals: 18 },
  8453: { name: 'Base', nativeSymbol: 'ETH', nativeDecimals: 18 },
  10: { name: 'Optimism', nativeSymbol: 'ETH', nativeDecimals: 18 },
  56: { name: 'BNB Chain', nativeSymbol: 'BNB', nativeDecimals: 18 },
  43114: { name: 'Avalanche', nativeSymbol: 'AVAX', nativeDecimals: 18 }
} as const;

// RPC endpoints for each network
const RPC_URLS = {
  1: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  137: 'https://polygon-rpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  8453: 'https://mainnet.base.org',
  10: 'https://mainnet.optimism.io',
  56: 'https://bsc-dataseed1.binance.org',
  43114: 'https://api.avax.network/ext/bc/C/rpc'
} as const;

function getRpcUrl(chainId: number): string | null {
  return RPC_URLS[chainId as keyof typeof RPC_URLS] || null;
}

export interface ComprehensiveTokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  chainId: number;
  chainName: string;
  formattedBalance: string;
  isNative: boolean;
  usdValue?: number;
}

export function useComprehensiveWalletBalances() {
  const { address, isConnected, chainId } = useAccount();
  
  // Get native balance for current network
  const { data: nativeBalance } = useBalance({ 
    address,
    query: { enabled: !!address && isConnected }
  });

  // Get individual token balances using sequential calls for reliability
  const { data: processedBalances = [], isLoading } = useQuery({
    queryKey: ['comprehensiveBalances', address, chainId, nativeBalance?.value.toString()],
    queryFn: async (): Promise<ComprehensiveTokenBalance[]> => {
      if (!address || !chainId || !isConnected) return [];

      const results: ComprehensiveTokenBalance[] = [];
      const networkInfo = NETWORK_INFO[chainId as keyof typeof NETWORK_INFO];
      
      if (!networkInfo) return results;

      console.log('Processing balances for chainId:', chainId, 'address:', address);
      
      // Add native token if has balance
      if (nativeBalance) {
        const formattedNative = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals));
        console.log('Native balance formatted:', formattedNative);
        
        if (formattedNative > 0.000001) {
          results.push({
            symbol: networkInfo.nativeSymbol,
            address: 'native',
            balance: nativeBalance.value.toString(),
            decimals: networkInfo.nativeDecimals,
            chainId: chainId,
            chainName: networkInfo.name,
            formattedBalance: formattedNative.toFixed(6),
            isNative: true
          });
        }
      }

      // Get token list for current network
      const currentTokens = COMPREHENSIVE_TOKENS[chainId as keyof typeof COMPREHENSIVE_TOKENS] || [];
      console.log('Checking tokens for network:', networkInfo.name, 'token count:', currentTokens.length);

      // Check each token balance using direct RPC calls
      for (const token of currentTokens) {
        try {
          // Use RPC endpoint for each network
          const rpcUrl = getRpcUrl(chainId);
          if (!rpcUrl) continue;

          // ERC20 balanceOf call data
          const balanceOfCallData = `0x70a08231000000000000000000000000${address.slice(2)}`;
          
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [{
                to: token.address,
                data: balanceOfCallData
              }, 'latest'],
              id: 1
            })
          });

          const data = await response.json();
          
          if (data.result && data.result !== '0x') {
            const balance = BigInt(data.result);
            const formatted = formatUnits(balance, token.decimals);
            const formattedNum = parseFloat(formatted);
            
            console.log(`${token.symbol}: balance=${balance.toString()}, formatted=${formatted}`);
            
            if (formattedNum > 0.000001) {
              results.push({
                symbol: token.symbol,
                address: token.address,
                balance: balance.toString(),
                decimals: token.decimals,
                chainId: chainId,
                chainName: networkInfo.name,
                formattedBalance: formattedNum.toFixed(6),
                isNative: false
              });
            }
          }
        } catch (error) {
          console.log(`Error checking balance for ${token.symbol}:`, error);
        }
      }

      console.log('Final results:', results);
      return results.sort((a, b) => parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance));
    },
    enabled: !!address && isConnected && !!chainId,
    staleTime: 30000,
    refetchInterval: 60000 // Refresh every minute
  });

  return {
    balances: processedBalances,
    isLoading,
    currentChainId: chainId,
    currentChainName: chainId ? NETWORK_INFO[chainId as keyof typeof NETWORK_INFO]?.name : 'Unknown',
    supportedNetworks: Object.values(NETWORK_INFO).map(n => n.name),
    totalTokensFound: processedBalances.length,
    nativeTokenFound: processedBalances.some(b => b.isNative),
    erc20TokensFound: processedBalances.filter(b => !b.isNative).length
  };
}

export function useAllSwappableTokens() {
  const { balances, isLoading } = useComprehensiveWalletBalances();
  
  return {
    tokens: balances.filter(token => parseFloat(token.formattedBalance) > 0),
    isLoading,
    totalTokens: balances.length,
    totalValue: balances.reduce((sum, token) => sum + parseFloat(token.formattedBalance), 0)
  };
}