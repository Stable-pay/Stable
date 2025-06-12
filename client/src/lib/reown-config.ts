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
  console.warn('VITE_WALLETCONNECT_PROJECT_ID is not set. Using demo mode.');
}

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId: projectId || 'demo',
  networks: [mainnet, polygon, bsc, arbitrum]
})

// Set up metadata
const metadata = {
  name: 'StablePay',
  description: 'Crypto to INR conversion platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stablepay.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal with basic configuration to avoid config errors
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || 'demo',
  networks: [mainnet, polygon, bsc, arbitrum],
  defaultNetwork: mainnet,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
    emailShowWallets: false,
    onramp: false
  },
  themeMode: 'dark'
})

export const config = wagmiAdapter.wagmiConfig