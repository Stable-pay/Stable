import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, bsc, arbitrum } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// Get project ID from environment variables
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2f05ae7f1116030fde2d36508f472bfb'

// Create query client
export const queryClient = new QueryClient()

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks: [mainnet, polygon, bsc, arbitrum]
})

// Set up metadata
const metadata = {
  name: 'StablePay',
  description: 'Crypto to INR conversion platform powered by Reown WalletConnect',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://stablepay.replit.app',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal with enhanced features
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, polygon, bsc, arbitrum],
  defaultNetwork: mainnet,
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'farcaster'],
    emailShowWallets: true,
    onramp: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#3B82F6',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '12px'
  }
})

export const config = wagmiAdapter.wagmiConfig