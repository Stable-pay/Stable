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
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Wallet connections may not work properly.');
}

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId: projectId!,
  networks: [mainnet, polygon, bsc, arbitrum]
})

// Set up metadata
const metadata = {
  name: 'StablePay',
  description: 'Crypto to INR conversion platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stablepay.replit.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal with enhanced configuration
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  networks: [mainnet, polygon, bsc, arbitrum],
  defaultNetwork: mainnet,
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github', 'apple', 'discord', 'farcaster'],
    emailShowWallets: true,
    onramp: true,
    send: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
    '--w3m-border-radius-master': '12px'
  }
})

export const config = wagmiAdapter.wagmiConfig