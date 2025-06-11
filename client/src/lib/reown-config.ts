import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, bsc, arbitrum } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'

// Create query client
export const queryClient = new QueryClient()

// Get project ID from environment variables or use development fallback
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// Create a basic Wagmi config for development when no project ID is available
const createBasicConfig = () => {
  return createConfig({
    chains: [mainnet, polygon, bsc, arbitrum],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [bsc.id]: http(),
      [arbitrum.id]: http(),
    },
    ssr: false,
  })
}

// Conditional configuration based on project ID availability
let wagmiAdapter: WagmiAdapter | null = null
let modal: any = null

if (projectId) {
  // Set up the Wagmi Adapter with project ID
  wagmiAdapter = new WagmiAdapter({
    ssr: false,
    projectId,
    networks: [mainnet, polygon, bsc, arbitrum]
  })

  // Set up metadata
  const metadata = {
    name: 'StablePay',
    description: 'Crypto to INR conversion platform powered by Reown WalletConnect',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://replit.dev',
    icons: ['https://avatars.githubusercontent.com/u/179229932']
  }

  // Create the modal with enhanced features
  modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, polygon, bsc, arbitrum],
    defaultNetwork: mainnet,
    metadata,
    features: {
      analytics: false, // Disable analytics for development
      email: false,
      socials: [],
      emailShowWallets: false,
      onramp: false
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-color-mix': '#3B82F6',
      '--w3m-color-mix-strength': 40,
      '--w3m-border-radius-master': '12px'
    }
  })
}

// Export config - use WagmiAdapter config if available, otherwise basic config
export const config = wagmiAdapter?.wagmiConfig || createBasicConfig()
export { modal }