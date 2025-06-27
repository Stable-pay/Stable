/**
 * Reown AppKit Integration for Real-time Balance Fetching
 * Uses Reown's native RPC endpoints and wallet connection
 */

import { BrowserProvider, Contract, formatUnits } from 'ethers'

// Token interface
interface SupportedToken {
  symbol: string
  name: string
  address: string
  chainId: number
  decimals: number
}

// Supported tokens for each chain (based on Binance supported tokens)
const SUPPORTED_TOKENS: SupportedToken[] = [
  // Ethereum (1)
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441c8C88546CB9b89cbefC5A6aF59f', chainId: 1, decimals: 6 },
  { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chainId: 1, decimals: 6 },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1, decimals: 18 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chainId: 1, decimals: 8 },
  { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', chainId: 1, decimals: 18 },
  { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', chainId: 1, decimals: 18 },
  
  // Polygon (137)
  { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', chainId: 137, decimals: 6 },
  { symbol: 'USDT', name: 'Tether', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', chainId: 137, decimals: 6 },
  { symbol: 'WMATIC', name: 'Wrapped Matic', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', chainId: 137, decimals: 18 },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', chainId: 137, decimals: 18 },
  
  // BSC (56)
  { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', chainId: 56, decimals: 18 },
  { symbol: 'USDT', name: 'Tether', address: '0x55d398326f99059fF775485246999027B3197955', chainId: 56, decimals: 18 },
  { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', chainId: 56, decimals: 18 },
  { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', chainId: 56, decimals: 18 },
  
  // Arbitrum (42161)
  { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', chainId: 42161, decimals: 6 },
  { symbol: 'USDT', name: 'Tether', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', chainId: 42161, decimals: 6 },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', chainId: 42161, decimals: 18 },
  
  // Optimism (10)
  { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', chainId: 10, decimals: 6 },
  { symbol: 'USDT', name: 'Tether', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', chainId: 10, decimals: 6 },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', chainId: 10, decimals: 18 },
  
  // Base (8453)
  { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', chainId: 8453, decimals: 6 },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', chainId: 8453, decimals: 18 },
  
  // Avalanche (43114)
  { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', chainId: 43114, decimals: 6 },
  { symbol: 'USDT', name: 'Tether', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', chainId: 43114, decimals: 6 },
  { symbol: 'WAVAX', name: 'Wrapped AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', chainId: 43114, decimals: 18 }
]

// ERC-20 ABI for token balance queries
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]

export interface ReownTokenBalance {
  symbol: string
  name: string
  balance: string
  decimals: number
  address: string
  chainId: number
  chainName: string
  usdValue: number
  isNative: boolean
}

export class ReownBalanceFetcher {
  private readonly coinGeckoIds: Record<string, string> = {
    'ETH': 'ethereum',
    'MATIC': 'matic-network', 
    'POLYGON': 'matic-network',
    'BNB': 'binancecoin',
    'AVAX': 'avalanche-2',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'WETH': 'weth',
    'WMATIC': 'wmatic',
    'WBNB': 'wbnb',
    'WBTC': 'wrapped-bitcoin',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'SUSHI': 'sushi',
    'AAVE': 'aave',
    'COMP': 'compound-governance-token',
    'MKR': 'maker',
    'SNX': 'havven',
    'CRV': 'curve-dao-token',
    'BAL': 'balancer',
    'YFI': 'yearn-finance',
    '1INCH': '1inch',
    'GRT': 'the-graph'
  }

  private readonly networkNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BSC',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
    43114: 'Avalanche',
    250: 'Fantom',
    42220: 'Celo',
    1284: 'Moonbeam',
    100: 'Gnosis',
    324: 'zkSync'
  }

  private readonly nativeTokens: Record<number, { symbol: string; name: string; decimals: number }> = {
    1: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    137: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
    56: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    42161: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    10: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    8453: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    43114: { symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
    250: { symbol: 'FTM', name: 'Fantom', decimals: 18 },
    42220: { symbol: 'CELO', name: 'Celo', decimals: 18 },
    1284: { symbol: 'GLMR', name: 'Moonbeam', decimals: 18 },
    100: { symbol: 'xDAI', name: 'Gnosis', decimals: 18 },
    324: { symbol: 'ETH', name: 'Ethereum', decimals: 18 }
  }

  /**
   * Fetch all token balances for connected wallet using Reown AppKit
   */
  async fetchWalletBalances(
    provider: any,
    address: string,
    chainId: number
  ): Promise<ReownTokenBalance[]> {
    if (!provider || !address || !chainId) {
      console.log('Missing required parameters for balance fetching')
      return []
    }

    try {
      console.log(`Fetching balances for ${address} on chain ${chainId}`)
      
      const balances: ReownTokenBalance[] = []
      const ethersProvider = new BrowserProvider(provider)
      const chainName = this.networkNames[chainId] || `Chain ${chainId}`

      // Get native token balance
      const nativeBalance = await this.fetchNativeBalance(ethersProvider, address, chainId)
      if (nativeBalance) {
        balances.push(nativeBalance)
      }

      // Get supported tokens for this chain
      const supportedTokens = SUPPORTED_TOKENS.filter((token: SupportedToken) => 
        token.chainId === chainId
      )

      console.log(`Found ${supportedTokens.length} supported tokens for chain ${chainId}`)

      // Fetch token balances concurrently
      const tokenPromises = supportedTokens.map((token: SupportedToken) => 
        this.fetchTokenBalance(ethersProvider, address, token, chainId, chainName)
      )

      const tokenBalances = await Promise.allSettled(tokenPromises)
      
      tokenBalances.forEach((result: PromiseSettledResult<ReownTokenBalance | null>, index: number) => {
        if (result.status === 'fulfilled' && result.value) {
          balances.push(result.value)
        } else if (result.status === 'rejected') {
          console.warn(`Failed to fetch balance for ${supportedTokens[index].symbol}:`, result.reason)
        }
      })

      // Filter out zero balances and sort by USD value
      const nonZeroBalances = balances.filter(balance => 
        parseFloat(balance.balance) > 0
      )

      console.log(`Found ${nonZeroBalances.length} non-zero balances`)
      return nonZeroBalances.sort((a, b) => b.usdValue - a.usdValue)

    } catch (error) {
      console.error('Error fetching wallet balances:', error)
      return []
    }
  }

  /**
   * Fetch native token balance (ETH, MATIC, BNB, etc.)
   */
  private async fetchNativeBalance(
    provider: BrowserProvider,
    address: string,
    chainId: number
  ): Promise<ReownTokenBalance | null> {
    try {
      const nativeToken = this.nativeTokens[chainId]
      if (!nativeToken) return null

      const balance = await provider.getBalance(address)
      const formattedBalance = formatUnits(balance, nativeToken.decimals)
      const balanceNumber = parseFloat(formattedBalance)

      if (balanceNumber === 0) return null

      const usdPrice = await this.getTokenPrice(nativeToken.symbol)
      const usdValue = balanceNumber * usdPrice

      return {
        symbol: nativeToken.symbol,
        name: nativeToken.name,
        balance: formattedBalance,
        decimals: nativeToken.decimals,
        address: 'native',
        chainId,
        chainName: this.networkNames[chainId] || `Chain ${chainId}`,
        usdValue,
        isNative: true
      }
    } catch (error) {
      console.error(`Error fetching native balance for chain ${chainId}:`, error)
      return null
    }
  }

  /**
   * Fetch ERC-20 token balance
   */
  private async fetchTokenBalance(
    provider: BrowserProvider,
    address: string,
    token: any,
    chainId: number,
    chainName: string
  ): Promise<ReownTokenBalance | null> {
    try {
      const contract = new Contract(token.address, ERC20_ABI, provider)
      
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals()
      ])

      const formattedBalance = formatUnits(balance, decimals)
      const balanceNumber = parseFloat(formattedBalance)

      if (balanceNumber === 0) return null

      const usdPrice = await this.getTokenPrice(token.symbol)
      const usdValue = balanceNumber * usdPrice

      return {
        symbol: token.symbol,
        name: token.name,
        balance: formattedBalance,
        decimals: Number(decimals),
        address: token.address,
        chainId,
        chainName,
        usdValue,
        isNative: false
      }
    } catch (error) {
      console.error(`Error fetching balance for ${token.symbol}:`, error)
      return null
    }
  }

  /**
   * Get token price from CoinGecko API
   */
  private async getTokenPrice(symbol: string): Promise<number> {
    try {
      const coinGeckoId = this.coinGeckoIds[symbol.toUpperCase()]
      if (!coinGeckoId) {
        console.warn(`No CoinGecko ID found for ${symbol}`)
        return 0
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`
      )

      if (!response.ok) {
        console.warn(`CoinGecko API error for ${symbol}:`, response.status)
        return this.getFallbackPrice(symbol)
      }

      const data = await response.json()
      const price = data[coinGeckoId]?.usd || 0
      
      console.log(`Price for ${symbol}: $${price}`)
      return price
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
      return this.getFallbackPrice(symbol)
    }
  }

  /**
   * Fallback prices for common tokens
   */
  private getFallbackPrice(symbol: string): number {
    const fallbackPrices: Record<string, number> = {
      'ETH': 2500,
      'MATIC': 0.85,
      'BNB': 320,
      'AVAX': 28,
      'USDC': 1,
      'USDT': 1,
      'WETH': 2500,
      'WMATIC': 0.85,
      'WBNB': 320
    }

    return fallbackPrices[symbol.toUpperCase()] || 0
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): number[] {
    return Object.keys(this.networkNames).map(Number)
  }

  /**
   * Get network name by chain ID
   */
  getNetworkName(chainId: number): string {
    return this.networkNames[chainId] || `Chain ${chainId}`
  }
}

export const reownBalanceFetcher = new ReownBalanceFetcher()