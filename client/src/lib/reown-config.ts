import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, bsc, arbitrum } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// Create query client
export const queryClient = new QueryClient()

// Get project ID from environment variables
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// Validate project ID
if (!projectId) {
  console.error('VITE_WALLETCONNECT_PROJECT_ID is not set. Wallet connections will not work.');
  throw new Error('Missing VITE_WALLETCONNECT_PROJECT_ID environment variable');
}

console.log('Reown AppKit initializing with project ID:', projectId.substring(0, 8) + '...');
console.log('Current domain:', typeof window !== 'undefined' ? window.location.origin : 'SSR mode');

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId: projectId!,
  networks: [mainnet, polygon, bsc, arbitrum]
})

// Set up metadata with proper domain configuration
const metadata = {
  name: 'RemitPay - Web3 Remittance Platform',
  description: 'Send crypto to India instantly with live exchange rates and Web3 off-ramping',
  url: 'https://stablepay.replit.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal with enhanced configuration for social login and onramp
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  networks: [mainnet, polygon, bsc, arbitrum],
  defaultNetwork: mainnet,
  metadata,
  allowUnsupportedChain: false,
  allWallets: 'SHOW',
  featuredWalletIds: [],
  includeWalletIds: [],
  excludeWalletIds: [],
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#059669',
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#10b981',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-font-size-master': '14px'
  }
})

export const config = wagmiAdapter.wagmiConfig