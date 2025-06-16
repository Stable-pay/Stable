import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { 
  mainnet, 
  polygon, 
  bsc, 
  arbitrum, 
  optimism, 
  base, 
  avalanche, 
  fantom, 
  celo, 
  moonbeam, 
  gnosis, 
  zkSync
} from '@reown/appkit/networks'

// Define Solana network configurations
const solanaMainnet = {
  id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  name: 'Solana',
  currency: 'SOL',
  explorerUrl: 'https://explorer.solana.com',
  rpcUrl: 'https://api.mainnet-beta.solana.com'
}

const bitcoinMainnet = {
  id: 'btc:000000000019d6689c085ae165831e93',
  name: 'Bitcoin',
  currency: 'BTC', 
  explorerUrl: 'https://blockstream.info',
  rpcUrl: 'https://blockstream.info/api'
}

const cosmosHub = {
  id: 'cosmos:cosmoshub-4',
  name: 'Cosmos Hub',
  currency: 'ATOM',
  explorerUrl: 'https://www.mintscan.io/cosmos',
  rpcUrl: 'https://cosmos-rpc.quickapi.com'
}

const nearProtocol = {
  id: 'near:mainnet',
  name: 'Near Protocol',
  currency: 'NEAR',
  explorerUrl: 'https://explorer.near.org',
  rpcUrl: 'https://rpc.mainnet.near.org'
}

const polkadotMainnet = {
  id: 'polkadot:91b171bb158e2d3848fa23a9f1c25182',
  name: 'Polkadot',
  currency: 'DOT',
  explorerUrl: 'https://polkadot.subscan.io',
  rpcUrl: 'https://rpc.polkadot.io'
}

const tronMainnet = {
  id: 'tron:0x2b6653dc',
  name: 'Tron',
  currency: 'TRX',
  explorerUrl: 'https://tronscan.org',
  rpcUrl: 'https://api.trongrid.io'
}
import { QueryClient } from '@tanstack/react-query'

// Create query client
export const queryClient = new QueryClient()

// Get project ID from environment variables
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// Validate project ID with fallback
if (!projectId) {
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Using demo mode.');
}

console.log('Reown AppKit initializing with project ID:', projectId ? projectId.substring(0, 8) + '...' : 'Demo mode');
console.log('Current domain:', typeof window !== 'undefined' ? window.location.origin : 'SSR mode');

// Set up the Wagmi Adapter for EVM chains
export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId: projectId || 'demo-project-id',
  networks: [
    mainnet, 
    polygon, 
    bsc, 
    arbitrum, 
    optimism, 
    base, 
    avalanche, 
    fantom, 
    celo, 
    moonbeam, 
    gnosis, 
    zkSync
  ]
})

// Set up metadata with dynamic domain configuration
const metadata = {
  name: 'RemitPay - Web3 Remittance Platform',
  description: 'Send crypto to India instantly with live exchange rates and Web3 off-ramping',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stablepay.replit.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal with enhanced features for compliance
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || 'demo-project-id',
  networks: [
    mainnet, 
    polygon, 
    bsc, 
    arbitrum, 
    optimism, 
    base, 
    avalanche, 
    fantom, 
    celo, 
    moonbeam, 
    gnosis, 
    zkSync
  ],
  defaultNetwork: mainnet,
  metadata,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#10b981',
    '--w3m-border-radius-master': '12px'
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'apple', 'github', 'discord'],
    emailShowWallets: true,
    swaps: true,
    onramp: true,
    history: true
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
})

export const config = wagmiAdapter.wagmiConfig