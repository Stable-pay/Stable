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

// Define additional network configurations (Reown AppKit will handle these via WalletConnect)
// For now, we'll focus on EVM chains that are fully supported
// Non-EVM chains like Solana, Bitcoin will be handled via wallet-specific connections
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

// Create the modal with comprehensive multi-chain support
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
    '--w3m-accent': '#6667AB',
    '--w3m-border-radius-master': '12px',
    '--w3m-color-mix': '#FCFBF4',
    '--w3m-color-mix-strength': 20
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'apple', 'github', 'discord'],
    emailShowWallets: true,
    swaps: true,
    onramp: true,
    history: true,
    allWallets: true
  },
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  // Enable multi-chain connectivity
  allowUnsupportedChain: false,
  // Enable all wallets including Solana wallets through WalletConnect
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger
    '163d2cf19babf05eb8962e9748f9ebe613ed52ebf9c8107c9a0f104bfcf161b3', // Phantom
    'c3ccaf5353b174f4b7e1b4e114885a12bcab0ca6a7e59c5e6b9d7b8b9a1a6b8e'  // Solflare
  ]
})

export const config = wagmiAdapter.wagmiConfig